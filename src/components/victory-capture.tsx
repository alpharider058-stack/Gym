import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { LUXURY } from "@/constants/theme";
import { addJournalVictory } from "@/lib/forge-storage";

type VictoryCaptureProps = {
  initialAction: string;
  onDismiss: () => void;
};

export function VictoryCapture({ initialAction, onDismiss }: VictoryCaptureProps) {
  const [action, setAction] = useState(initialAction);
  const [obstacle, setObstacle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const save = async () => {
    if (!action.trim() || saving) return;
    setSaving(true);
    try {
      await addJournalVictory({ action, obstacle });
      onDismiss();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>PRUEBA DE TU PROGRESO</Text>
      <Text style={styles.title}>¿Qué has demostrado hoy?</Text>
      <TextInput
        value={action}
        onChangeText={setAction}
        placeholder="La acción concreta que completaste…"
        placeholderTextColor={LUXURY.ash}
        selectionColor={LUXURY.gold}
        style={styles.input}
        maxLength={500}
        accessibilityLabel="Acción concreta que completaste"
      />
      <TextInput
        value={obstacle}
        onChangeText={setObstacle}
        placeholder="¿Qué obstáculo superaste? (opcional)"
        placeholderTextColor={LUXURY.ash}
        selectionColor={LUXURY.gold}
        style={styles.input}
        maxLength={500}
        accessibilityLabel="Obstáculo superado, opcional"
      />
      {saveError && <Text style={styles.error}>No se pudo guardar. Inténtalo de nuevo.</Text>}
      <View style={styles.actions}>
        <Pressable onPress={onDismiss} style={styles.skipButton}>
          <Text style={styles.skipText}>AHORA NO</Text>
        </Pressable>
        <Pressable
          disabled={!action.trim() || saving}
          onPress={() => void save()}
          style={[styles.saveButton, (!action.trim() || saving) && styles.disabled]}
        >
          <Text style={styles.saveText}>{saving ? "GUARDANDO…" : "GUARDAR PRUEBA"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${LUXURY.emerald}44`,
    padding: 16,
    gap: 10,
  },
  eyebrow: { color: LUXURY.emerald, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: LUXURY.snow, fontSize: 15, fontWeight: "800" },
  input: {
    minHeight: 42,
    color: LUXURY.snow,
    backgroundColor: LUXURY.obsidian,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    fontSize: 12,
  },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  skipButton: { paddingHorizontal: 12, paddingVertical: 10 },
  skipText: { color: LUXURY.ash, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  saveButton: { backgroundColor: LUXURY.emerald, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 },
  saveText: { color: LUXURY.ink, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  disabled: { opacity: 0.45 },
  error: { color: LUXURY.amber, fontSize: 11, fontWeight: "600" },
});
