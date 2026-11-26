import { describe, expect, it } from "vitest";
import {
  cannonRestSteps,
  cityRouteTime,
  collectChip,
  frameStep,
  hullHalfWidth,
  loadoutComplete,
  nextChip,
  simSlices,
  strikePatrol,
  type ChipKind,
  type ChipLoadout,
} from "./rules";

const fresh = (): ChipLoadout => ({ cannonLevel: 1, missileLevel: 0, drones: 0 });

function apply(loadout: ChipLoadout, kind: ChipKind) {
  if (loadoutComplete(loadout)) return;
  if (kind === "cannon") loadout.cannonLevel += 1;
  else if (kind === "missile") loadout.missileLevel += 1;
  else loadout.drones += 1;
}

describe("nextChip", () => {
  it("skips a full cannon track and still offers a missile", () => {
    let index = 0;
    const loadout = fresh();
    const kinds: ChipKind[] = [];
    for (let drop = 0; drop < 12; drop++) {
      const chip = nextChip(index, loadout);
      kinds.push(chip.kind);
      index = chip.nextIndex;
      apply(loadout, chip.kind);
    }
    expect(kinds).toEqual([
      "cannon", "missile", "double",
      "cannon", "missile", "double",
      "cannon", "missile", "double",
      "missile", "double", "cannon",
    ]);
    expect(loadout).toEqual({ cannonLevel: 4, missileLevel: 4, drones: 4 });
    expect(loadoutComplete(loadout)).toBe(true);
  });

  it("banks a reserve only when cannon, missiles, and four drones are full", () => {
    const full = { cannonLevel: 4, missileLevel: 4, drones: 4 };
    expect(collectChip("chip-cannon", full).effect).toBe("reserve");
    expect(collectChip("chip-missile", full).effect).toBe("reserve");
    expect(collectChip("chip-double", full).effect).toBe("reserve");
    expect(collectChip("chip-double", { cannonLevel: 4, missileLevel: 4, drones: 3 }).effect).toBe("drone");
    expect(collectChip("chip-cannon", { cannonLevel: 2, missileLevel: 4, drones: 4 })).toEqual({ effect: "cannon", level: 3 });
    expect(collectChip("chip-missile", { cannonLevel: 4, missileLevel: 1, drones: 4 })).toEqual({ effect: "missile", level: 2 });
    expect(collectChip("chip-double", { cannonLevel: 1, missileLevel: 0, drones: 4 }).effect).toBe("none");
  });

  it("keeps cycling once every track is full so the pickup can bank a reserve", () => {
    const loadout = { cannonLevel: 4, missileLevel: 4, drones: 4 };
    expect(nextChip(0, loadout)).toEqual({ kind: "cannon", nextIndex: 1 });
    expect(nextChip(1, loadout)).toEqual({ kind: "missile", nextIndex: 2 });
    expect(nextChip(2, loadout)).toEqual({ kind: "double", nextIndex: 0 });
  });
});

describe("strikePatrol", () => {
  it("counts a Warden only when the patrol hull reaches zero", () => {
    expect(strikePatrol(10, 3)).toEqual({ hp: 7, countWarden: false });
    expect(strikePatrol(2, 3)).toEqual({ hp: 0, countWarden: true });
    expect(strikePatrol(0, 1)).toEqual({ hp: 0, countWarden: false });
  });
});

describe("cannonRestSteps", () => {
  it("rests two steps after the fourth shot and one step between the others", () => {
    expect(cannonRestSteps(1)).toBe(1);
    expect(cannonRestSteps(2)).toBe(1);
    expect(cannonRestSteps(3)).toBe(1);
    expect(cannonRestSteps(0)).toBe(2);
  });
});

describe("hullHalfWidth", () => {
  it("uses the drawn Warden width", () => {
    expect(hullHalfWidth("super-warden", 0.45 * 1.3)).toBeCloseTo(30.42);
    expect(hullHalfWidth("patrol-warden", 0.2)).toBeCloseTo(10.4);
  });
});

describe("cityRouteTime", () => {
  it("opens a normal arrival on Neon Port and boss practice on Crown Gate", () => {
    expect(cityRouteTime({
      bossPractice: false, arriving: true, introTime: 0, untilBoss: 100, routeSeconds: 100,
    })).toBeCloseTo(-2.6);
    expect(cityRouteTime({
      bossPractice: false, arriving: true, introTime: 2.6, untilBoss: 100, routeSeconds: 100,
    })).toBeCloseTo(0);
    expect(cityRouteTime({
      bossPractice: true, arriving: true, introTime: 0, untilBoss: 0, routeSeconds: 100,
    })).toBeCloseTo(77.4);
    expect(cityRouteTime({
      bossPractice: true, arriving: true, introTime: 2.6, untilBoss: 0, routeSeconds: 100,
    })).toBeCloseTo(80);
  });

  it("follows encounter time after the arrival", () => {
    expect(cityRouteTime({
      bossPractice: false, arriving: false, introTime: 2.6, untilBoss: 90, routeSeconds: 100,
    })).toBe(10);
    expect(cityRouteTime({
      bossPractice: true, arriving: false, introTime: 2.6, untilBoss: 0, routeSeconds: 100,
    })).toBe(100);
  });
});

describe("simSlices", () => {
  it("keeps the remainder of a frame instead of dropping it at 50ms", () => {
    expect(simSlices(67)).toEqual({ slices: [50, 17], remainderMs: 0 });
    expect(simSlices(16)).toEqual({ slices: [16], remainderMs: 0 });
  });

  it("caps a hitch at three slices and carries the rest", () => {
    const hitch = simSlices(200);
    expect(hitch).toEqual({ slices: [50, 50, 50], remainderMs: 50 });
    expect(simSlices(10, hitch.remainderMs)).toEqual({ slices: [50, 10], remainderMs: 0 });
  });
});

describe("frameStep", () => {
  it("advances a 100ms hitch in slices and draws the city once for that time", () => {
    const step = frameStep(100);
    expect(step.slices).toEqual([50, 50]);
    expect(step.remainderMs).toBe(0);
    expect(step.cityMs).toBe(100);
  });

  it("draws only the simulated time when a hitch is capped at three slices", () => {
    const step = frameStep(200);
    expect(step.slices).toHaveLength(3);
    expect(step.cityMs).toBe(150);
    expect(step.remainderMs).toBe(50);
  });
});
