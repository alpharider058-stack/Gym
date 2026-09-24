import http from "node:http";
import net from "node:net";

const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}
const apiKey = process.env.OPENROUTER_API_KEY;
const maxBodyBytes = 16 * 1024;
const rateWindowMs = 60_000;
const rateLimit = 20;
const requestsByAddress = new Map();
const allowedOrigins = new Set(
  (process.env.APP_ORIGINS || process.env.APP_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function isPrivateIpv4(host) {
  if (net.isIP(host) !== 4) return false;
  const parts = host.split(".").map(Number);
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function getListenHost() {
  const host = process.env.HOST?.trim() || "127.0.0.1";
  if (host === "127.0.0.1" || host === "::1" || host === "localhost") return host;
  if (host === "0.0.0.0") {
    if (process.env.ALLOW_LAN !== "true" || process.env.ALLOW_ALL_INTERFACES !== "true") {
      throw new Error("Binding to all interfaces requires ALLOW_LAN=true and ALLOW_ALL_INTERFACES=true");
    }
    return host;
  }
  if (process.env.ALLOW_LAN !== "true" || !isPrivateIpv4(host)) {
    throw new Error("A private IPv4 HOST and ALLOW_LAN=true are required for LAN access");
  }
  return host;
}

function send(response, status, body, requestOrigin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "600";
  }
  response.writeHead(status, headers);
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin);
}

function checkRateLimit(address) {
  const now = Date.now();
  const record = requestsByAddress.get(address);
  if (!record || now - record.startedAt >= rateWindowMs) {
    requestsByAddress.set(address, { startedAt: now, count: 1 });
    return true;
  }
  record.count += 1;
  return record.count <= rateLimit;
}

async function readJson(request) {
  const contentType = request.headers["content-type"] || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw Object.assign(new Error("Unsupported content type"), { status: 415 });
  }
  const contentLength = Number(request.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    throw Object.assign(new Error("Request too large"), { status: 413 });
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBodyBytes) {
      throw Object.assign(new Error("Request too large"), { status: 413 });
    }
    chunks.push(chunk);
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw Object.assign(new Error("Expected a JSON object"), { status: 400 });
  }
  return parsed;
}

function validateInput(input) {
  const stringFields = ["kind", "intensity", "weakness"];
  for (const field of stringFields) {
    if (input[field] !== undefined && (typeof input[field] !== "string" || input[field].length > 1000)) {
      throw Object.assign(new Error("Invalid request"), { status: 400 });
    }
  }
  for (const field of ["areas", "missionCategories"]) {
    if (input[field] !== undefined &&
      (!Array.isArray(input[field]) || input[field].length > 12 ||
        input[field].some((item) => typeof item !== "string" || item.length > 120))) {
      throw Object.assign(new Error("Invalid request"), { status: 400 });
    }
  }
  for (const field of ["exerciseCount", "missionCount"]) {
    if (input[field] !== undefined) {
      const number = Number(input[field]);
      const max = field === "exerciseCount" ? 8 : 9;
      if (!Number.isInteger(number) || number < 1 || number > max) {
        throw Object.assign(new Error("Invalid request"), { status: 400 });
      }
    }
  }
  if (input.profile !== undefined &&
    (!input.profile || typeof input.profile !== "object" || Array.isArray(input.profile) ||
      JSON.stringify(input.profile).length > 3000)) {
    throw Object.assign(new Error("Invalid request"), { status: 400 });
  }
  return Math.min(Math.max(Number(input.exerciseCount || input.missionCount) || 5, 1), 8);
}

function planAsText(value) {
  if (typeof value === "string") return value.slice(0, 12_000);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([day, content]) => `${day}: ${typeof content === "string" ? content : JSON.stringify(content)}`)
      .join("\n")
      .slice(0, 12_000);
  }
  return "";
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return send(response, 403, { error: "Origin not allowed" });
  }
  if (request.method === "OPTIONS") return send(response, 204, {}, origin);
  if (request.method !== "POST" || request.url !== "/api/coach") {
    return send(response, 404, { error: "Not found" }, origin);
  }
  const address = request.socket.remoteAddress || "unknown";
  if (!checkRateLimit(address)) {
    return send(response, 429, { error: "Too many requests; try again shortly" }, origin);
  }
  if (!apiKey || apiKey.startsWith("replace-with")) {
    return send(response, 503, { error: "Coach proxy is not configured" }, origin);
  }

  let timeout;
  try {
    const input = await readJson(request);
    const exerciseCount = validateInput(input);
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 25_000);
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:8081",
        "X-Title": "Focus Coach",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres un entrenador responsable. Devuelve solo JSON válido con las claves routine y plan. plan debe ser una cadena de texto breve y legible con un plan de siete días. routine, si se incluye, contiene name y exercises; devuelve como máximo ${exerciseCount} ejercicios, cada uno con name, muscle, equipment, sets, reps, weight y rest. No diagnostiques ni prometas resultados. Si hay dolor o lesión, recomienda consultar a un profesional.`,
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    if (!upstream.ok) {
      return send(response, 502, { error: "Coach provider request failed" }, origin);
    }
    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length > 20_000) {
      return send(response, 502, { error: "Coach provider returned an invalid response" }, origin);
    }
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return send(response, 502, { error: "Coach provider returned an invalid response" }, origin);
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      return send(response, 502, { error: "Coach provider returned an invalid response" }, origin);
    }
    const plan = planAsText(result.plan);
    const routine = result.routine && typeof result.routine === "object" && !Array.isArray(result.routine)
      ? result.routine
      : undefined;
    return send(response, 200, { plan, ...(routine ? { routine } : {}) }, origin);
  } catch (error) {
    const status = error?.status || (error?.name === "AbortError" ? 504 : 502);
    const message = status === 413
      ? "Request too large"
      : status === 415
        ? "Content-Type must be application/json"
        : status === 504
          ? "Coach provider timed out"
          : status === 502
            ? "Coach provider unavailable"
            : "Invalid coach request";
    return send(response, status, { error: message }, origin);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

const host = getListenHost();
server.listen(port, host, () => {
  console.log(`Focus AI proxy listening on ${host}:${port}`);
});

setInterval(() => {
  const now = Date.now();
  for (const [address, record] of requestsByAddress) {
    if (now - record.startedAt >= rateWindowMs) requestsByAddress.delete(address);
  }
}, rateWindowMs).unref();
