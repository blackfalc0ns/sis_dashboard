import type { NedaaGate } from "@/features/nedaa/types/nedaa";

export function getNedaaOrderedGates(gates: NedaaGate[]): NedaaGate[] {
  return [...gates].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
  );
}

export function getNedaaActivePickupGates(gates: NedaaGate[]): NedaaGate[] {
  return getNedaaOrderedGates(gates).filter(
    (gate) => gate.isActive && ["open", "busy"].includes(gate.status),
  );
}

export function getNedaaDefaultGateOptions(gates: NedaaGate[]): NedaaGate[] {
  return getNedaaOrderedGates(gates).filter(
    (gate) => gate.isActive && ["open", "busy"].includes(gate.status),
  );
}

export function createNedaaGateIdFromName(nameEn: string): string {
  return nameEn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}
