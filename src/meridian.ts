// Each ten-second carrier pass is one authored measure of Glass Meridian.
export const route = [
  { sector: "Neon Port", bend: 1, depth: 0, gate: -1 },
  { sector: "Neon Port", bend: 1.4, depth: -28, gate: -1 },
  { sector: "Switchyard", bend: -1.2, depth: -8, gate: 2 },
  { sector: "Switchyard", bend: 1.7, depth: -42, gate: 5 },
  { sector: "Switchyard", bend: -1.7, depth: -28, gate: 3 },
  { sector: "Arc Reactor", bend: 1.2, depth: -32, gate: 1 },
  { sector: "Arc Reactor", bend: -1.5, depth: -16, gate: 4 },
  { sector: "Arc Reactor", bend: 1.8, depth: -44, gate: 6 },
  { sector: "Crown Gate", bend: -1.9, depth: -30, gate: 3 },
  { sector: "Crown Gate", bend: 1.6, depth: -46, gate: 5 },
] as const;
