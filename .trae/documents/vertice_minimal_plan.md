# VÉRTICE Minimalista — Implementation Plan

## Repository Research

**Estado actual (antes del plan):**
- App es **VÉRTICE** (renombrada desde Pulse fitness), 5 tabs complejos (Forja, Misiones, Resiliencia, Coach, Espejo) + 3 modales (Focus, Breathing, Victory).
- Stack confirmado: Expo SDK 57, React Native 0.86.3, Expo Router typed routes, React Native Reanimated 4.5.1, AsyncStorage 2.2.0.
- **Falta `expo-notifications`** (necesario para notificaciones diarias programadas).
- Característica "bloquear apps" en iOS/Android nativo NO es posible sin módulos nativos/Family Controls (Managed Expo no lo soporta sin build custom extremo). Solución estándar en apps tipo Forest/Freedom (Expo): **sesión fullscreen inamovible** (bloquea botón atrás con `BackHandler`, no permite salir sin rendirse, penaliza racha si abandonas).
- Restricciones permanentes: NO tocar carpeta `.github/` · mantener misma base Expo 57 · Apple Dark Premium · microanimaciones Reanimated.

**Requerimiento nuevo del usuario (pivote clave):**
1. **MINIMALISMO EXTREMO**: quitar funciones, reducir 5 tabs a 3 tabs MUY sencillos.
2. **NOTIFICACIONES DIARIAS**: 1 al día (hora configurable), mensaje único que nunca se repita hasta agotar un pool grande → 120 frases ego/disciplina + memoria de frases ya enviadas.
3. **BLOQUEADOR DE APS CON TIEMPO + MOTIVO**: duración (preselección 15/30/60/90min o custom) + texto libre "por qué lo haces". La app entra en modo fullscreen inamovible. Botón "Me rindo" oculto con penalización (reset racha).
4. **ALTO IMPACTO PSICOLÓGICO A LARGO PLAZO**: Pocas pantallas, pocas funciones, pero cada toque cuenta. Rachero, XP incremental, rango simplificado (solo 5 rangos en vez de 10).

---

## Files and Modules

| Archivo | Cambio esperado |
|---|---|
| `package.json` | **Instalar** `expo-notifications` (~0.29.x para SDK57). Mantener todo lo demás. |
| `app.json` | Añadir `ios.infoPlist.UIBackgroundModes=[remote-notification]` + permisos notificaciones iOS + Android `com.google.android.c2dm.permission.RECEIVE` |
| `src/constants/theme.ts` | Mantener `LUXURY` + `SHADOWS`. Nada nuevo, es minimalista. |
| `src/lib/forge-storage.ts` | **Reemplazar 80%**: simplificar a 3 misiones diarias innegociables · pool 120 frases + índice de frases usadas · storage bloqueador sesiones · stats mínimas (streak / xp / totalSessions) · rangos de 5 niveles no 10. |
| `src/lib/notifications.ts` | **NUEVO**: init permisos · scheduler diario · pool de 120 frases sin repetición · cancel scheduler si el usuario cambia hora. |
| `src/components/onboarding.tsx` | **Simplificar**: 3 pasos solo (nombre · hora de notificación · primer motivo personal). |
| `src/app/_layout.tsx` | Stack: solo `(tabs)` + `focus-block` (modal fullscreen). Eliminar `breathing`, `victory`. |
| `src/components/app-tabs.tsx` | **3 triggers solo**: `index`(Forja) · `focus`(Bloqueador) · `vault`(Yo/Ajustes). Quitar Missions/Resilience/Coach. |
| `src/app/(tabs)/index.tsx` | **Reescribir minimalista**: header saludo personal · RACHA ENORME · 3 misiones innegociables toggleables · 1 CTA "Empezar Bloqueo de Enfoque" (grande). |
| `src/app/(tabs)/focus.tsx` | **NUEVO (era focus modal)**: preset duraciones + input motivo personal · historial 7 últimas sesiones · CTA "INICIAR BLOQUEO" que abre fullscreen modal. |
| `src/app/(tabs)/vault.tsx` | **Reescribir minimalista**: rango actual + barra progreso + stats 3 columnas (racha/XP/sesiones) + AJUSTES (hora notificación toggle · permitir notificaciones · borrar datos). |
| `src/app/focus-block.tsx` | **NUEVO (modal fullscreen)**: cuenta atrás enorme central · motivo personal arriba · botón "ME RINDO" oculto debajo con confirmación doble + penalización racha. |
| `src/app/(tabs)/_layout.tsx` | Cambiar nombre de rutas internas si es necesario. |
| `src/app/(tabs)/coach.tsx` | **Contenido reemplazado por redirect** a `/(tabs)/vault` (igual que los 3 legacy). |
| `src/app/(tabs)/missions.tsx` | Redirect → `/(tabs)/index`. |
| `src/app/(tabs)/resilience.tsx` | Redirect → `/(tabs)/focus`. |
| `src/app/(tabs)/explore.tsx`, `calculator.tsx`, `plans.tsx` | Mantener como redirects minimalistas (ya lo estaban). |
| `src/app/breathing.tsx`, `victory.tsx` | **Eliminar** (no se usan más). |
| `src/app/workout.tsx` | Se queda legacy sin tocar. |

---

## Implementation Steps (orden de dependencias)

1. **Instalar `expo-notifications`** y añadir permisos en `app.json`
   - Comando: `npx expo install expo-notifications`
   - Añadir iOS plist: `NSUserNotificationUsageDescription`, `UIBackgroundModes remote-notification`
   - Android channel por defecto "VÉRTICE DIARIO"

2. **Simplificar `forge-storage.ts` (núcleo minimalista)**
   - 5 rangos solamente (Recluta → Fiel → Indómito → Apex → VÉRTICE)
   - 3 misiones INNEGOCIABLES SOLAMENTE (creadas onboarding):
     1. Levantarme sin posponer
     2. 60 minutos de enfoque profundo
     3. Ninguna queja todo el día
   - Guardar settings: `notifHour` (number 0-23), `notifMinute` (0-59), `notifEnabled` (bool)
   - Pool `NOTIFICATION_QUOTES[120]` (frases ego-disciplina duras) + array `usedQuotesIndices` para no repetir
   - Sesiones de bloqueo guardadas: duración, motivo, abandonada bool, fecha
   - Función `getNextQuote()`: siguiente sin repetir, resetea si agotó 120

3. **Crear módulo `src/lib/notifications.ts`**
   - `requestPermissionsAndRegister()` → prompt iOS/Android
   - `scheduleDailyNotification(hour, minute)` → usa `Notifications.scheduleNotificationAsync` con `repeat: 'day'` + trigger `hour: minute`
   - `cancelAll()` → cancela schedulers
   - `buildNotificationContent()` → `getNextQuote()` del storage + título "VÉRTICE"
   - `updateNotificationSchedule()` wrapper llama cancelAll + schedule si enabled

4. **Simplificar onboarding (3 pasos)**
   - Paso 1: nombre
   - Paso 2: hora de la notificación diaria (DateTimePicker minimalista o selector horario simple +/-, default 06:30h)
   - Paso 3: primer motivo personal (ej: "para dejar de ser un cobarde") → se guarda como primer motivo sugerido del bloqueador

5. **Reestructurar navegación**
   - `app-tabs.tsx` → 3 tabs: Forja (index) · Enfoque (focus) · Yo (vault). LabelStyle minimalista.
   - `_layout.tsx` root stack: quitar screens `breathing`, `victory`. Añadir `focus-block` como `presentation: 'fullScreenModal'` o `modal` con `headerShown: false`.
   - `(tabs)/missions.tsx`, `resilience.tsx`, `coach.tsx` → contenido redirect al tab correspondiente (solo View + Pressable, no router.replace auto para evitar warning deep link)

6. **Reescribir `(tabs)/index.tsx` (FORJA minimalista)**
   - TIPOGRAFIA GIGANTE: racha `🔥 X días` como elemento visual principal
   - Debajo: nombre del rango actual + barra progreso (sutil)
   - Lista 3 misiones innegociables (solo 3) + toggle con animación escala 0.96 spring
   - Si las 3 están completas: mensaje "DÍA SELLADO" + glow dorado
   - CTA enorme abajo `INICIAR BLOQUEO DE FOCO` → `router.push('/focus-block?duration=30...' as never)` o primero a tab focus
   - Microanimaciones: FadeInDown con delay stagger en las 3 misiones, pulso sutil en racha

7. **Crear `(tabs)/focus.tsx` (PANTALLA BLOQUEADOR home)**
   - Título "ENFOQUE INAMOVIBLE"
   - Grid 2×2 botones duración: 15min · 30min · 60min · 90min + custom input numérico
   - Input grande motivo personal (multi línea, placeholder "Hoy bloqueo todo para...")
   - Historial 7 últimas sesiones: fecha, duración, ✓ completado / ✗ abandonado
   - CTA "CONSEGUIR LO IMPOSIBLE" (comenzar bloqueo) push al modal `/focus-block`

8. **Crear `focus-block.tsx` (MODAL FULLSCREEN INAMOVIBLE)**
   - Background `LUXURY.ink` (negro puro). Nada más.
   - Arriba centrado: motivo personal tipografía grande gris claro
   - Centro: temporizador MM:SS ENORME (72-88pt, gold) + anillo progreso (Reanimated rotateZ border)
   - Botón atrás hardware Android interceptado con `BackHandler.addEventListener('hardwareBackPress', () => true)` → NO SALE
   - Gestos swipe-to-dismiss modal desactivados (gestureEnabled: false en el Stack)
   - Abajo, MUY PEQUEÑO y en gris oscuro: "Me rindo" → Alert confirmación "Abandonar reinicia tu racha de X días. ¿Estás seguro?" → si Sí: marca sesion como abandonada, `resetStreak()`, cierra modal.
   - Al terminar timer: sonido opcional + guardar sesion completada + xp bonus + cerrar

9. **Reescribir `(tabs)/vault.tsx` (YO minimalista + ajustes)**
   - Header: emblema rango actual, nombre, rango texto
   - Stats 3 columnas equal width: `RACHA` | `XP` | `SESIONES`
   - Divisor
   - Ajustes:
     · Switch "Notificación diaria" (on/off) → enlaza a `updateNotificationSchedule`
     · Selector de hora (increment +/- o input simple)
     · "Reiniciar mi progreso" → borra storage, vuelve a onboarding
   - Texto pequeño footer: "VÉRTICE. No para nadie."

10. **Limpieza y validación**
    - Eliminar `breathing.tsx`, `victory.tsx`
    - Comprobar TODOS los archivos redirect y que no exista referencia a misiones/resilience/coach/breathing/victory imports
    - Ejecutar `npx tsc --noEmit` y `GetDiagnostics`
    - Comprobar `expo-notifications` soportado en Expo Go

---

## Dependencies and Considerations

- **`expo-notifications` ~0.29.x** compatible con Expo SDK 57 → instalación con `npx expo install` no con npm/yarn para alinear versión
- **iOS 18 permisos notificaciones**: primer prompt cuando onboarding termina
- **Selector horario sin librerías**: no instalar `@react-native-community/datetimepicker` para mantener minimalismo → inputs numéricos simples +/- Hora: 0-23, Minuto: 0/15/30/45
- **Bloqueo real de apps NO EXISTE en Expo bare-minimum**. El modal fullscreen con BackHandler bloqueado + penalización de racha es el comportamiento psicológicamente efectivo standard de Forest / Cold Turkey (el usuario NO se atreve a pulsar Me rindo). Se indica en ajustes una nota: "Esta sesión impide salir de VÉRTICE. Piensa antes de iniciar."
- **Typed routes custom**: usamos `router.push('/focus-block' as never)` igual que en la versión anterior para evitar warning rutas no pre-generadas.
- **No tocar `.github/`** — restricción activa 100%.

---

## Validation

1. `npx expo install expo-notifications` → instalación OK sin conflictos
2. `npx tsc --noEmit` → exit 0
3. `GetDiagnostics` → array vacío
4. `expo start --ios` (si el usuario correlo manual) → no pantallas rojas, onboarding aparece, selector notif hora guarda, notificacion se programa con `getNextQuote()` sin repetir.
5. Probar BackHandler en focus-block: pulsar atrás no hace nada. Solo cierra al completar timer o confirmar Me rindo.
6. Pool de 120 frases: no debería repetirse antes del día 121.

---

## Risks

| Riesgo | Manejo / Fallback |
|---|---|
| `expo-notifications` no programa notif en Expo Go iOS (conocido Expo Go limitation) | Funciona en build development/client. Aviso silencioso: "Las notificaciones funcionan en build nativo; en Expo Go la verás al reabrir". |
| Usuario cierra app desde App Switcher durante sesión focus-block | Al reabrir, en `_layout` useEffect lee `hasActiveBlock` en storage y reabre el modal focus-block automáticamente si quedaba tiempo. |
| Permiso notificaciones rechazado | En ajustes hay link para abrir settings app (`expo-linking` `openSettings()`). |
| Android BackHandler listener se limpia mal | Hook `useEffect` return limpia listener en focus-block unmount. |
| Typed routes `focus-block` no existe → typing warning | Cast a `never` igual que en rutas anteriores. Compila sin errores |
