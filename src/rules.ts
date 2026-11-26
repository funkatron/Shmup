export const maxWeaponLevel = 4;
export const chipOrder = ["cannon", "missile", "double"] as const;
export type ChipKind = (typeof chipOrder)[number];

export type ChipLoadout = {
  cannonLevel: number;
  missileLevel: number;
  drones: number;
};

const wardenTextureWidth = 104;
const arrivalSeconds = 2.6;
const crownGateSeconds = 80;
const simSliceMs = 50;
const maxSimSlices = 3;

export function trackFull(kind: ChipKind, loadout: ChipLoadout): boolean {
  if (kind === "cannon") return loadout.cannonLevel >= maxWeaponLevel;
  if (kind === "missile") return loadout.missileLevel >= maxWeaponLevel;
  return loadout.drones >= maxWeaponLevel;
}

export function loadoutComplete(loadout: ChipLoadout): boolean {
  return trackFull("cannon", loadout) && trackFull("missile", loadout) && trackFull("double", loadout);
}

// Skip a track that is already full. Once every track is full, follow the cycle and bank a reserve.
export function nextChip(index: number, loadout: ChipLoadout): { kind: ChipKind; nextIndex: number } {
  if (loadoutComplete(loadout)) {
    const at = index % chipOrder.length;
    return { kind: chipOrder[at], nextIndex: (at + 1) % chipOrder.length };
  }
  for (let step = 0; step < chipOrder.length; step++) {
    const at = (index + step) % chipOrder.length;
    const kind = chipOrder[at];
    if (!trackFull(kind, loadout)) {
      return { kind, nextIndex: (at + 1) % chipOrder.length };
    }
  }
  const at = index % chipOrder.length;
  return { kind: chipOrder[at], nextIndex: (at + 1) % chipOrder.length };
}

// The volley counter wraps to 0 on the fourth shot. That gap is two steps, and the others are one.
export function cannonRestSteps(volleyAfterShot: number): number {
  if (volleyAfterShot === 0) return 2;
  return 1;
}

const wardenWidths = {
  "super-warden": wardenTextureWidth,
  "patrol-warden": wardenTextureWidth,
} as const;

export function hullHalfWidth(kind: keyof typeof wardenWidths, scale: number): number {
  return wardenWidths[kind] * scale / 2;
}

export function cityRouteTime(state: {
  bossPractice: boolean;
  arriving: boolean;
  introTime: number;
  untilBoss: number;
  routeSeconds: number;
}): number {
  const introOffset = state.introTime - arrivalSeconds;
  if (state.arriving) {
    const backdrop = state.bossPractice ? crownGateSeconds : 0;
    return backdrop + introOffset;
  }
  return state.routeSeconds - state.untilBoss;
}

export function simSlices(deltaMs: number, remainderMs = 0): { slices: number[]; remainderMs: number } {
  let pending = remainderMs + deltaMs;
  const slices: number[] = [];
  while (pending > 0 && slices.length < maxSimSlices) {
    const slice = Math.min(pending, simSliceMs);
    slices.push(slice);
    pending -= slice;
  }
  return { slices, remainderMs: pending };
}
