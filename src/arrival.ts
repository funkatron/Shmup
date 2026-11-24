import type Phaser from "phaser";

// Coordinates across the wings, along the fuselage, and above the wing plane.
const vertices = [
  [0,11,0], [-4,1,0], [-10,-7,0], [-4,-5,0], [-1,-2,0],
  [1,-2,0], [4,-5,0], [10,-7,0], [4,1,0], [0,6,1],
  [-2,0,1], [2,0,1], [0,1,4], [-3,-5,0], [0,-10,0], [3,-5,0], [0,-6,3],
];
const outlines = [[0,1,2,3,4,5,6,7,8,0], [9,10,11,9], [9,12,10], [12,11],
  [1,3], [8,6], [13,14,15], [13,16,15], [16,14]];

export function drawArrival(g: Phaser.GameObjects.Graphics, fraction: number) {
  const t = fraction * fraction * (3 - 2 * fraction);
  const yaw = (1 - t) * Math.PI / 2, pitch = 0.08 + t * (Math.PI / 2 - 0.08);
  const scale = 1 + 12 * (1 - t) ** 2;
  const points = vertices.map(([x, y, z]) => {
    const across = x * Math.cos(yaw) + y * Math.sin(yaw);
    const along = y * Math.cos(yaw) - x * Math.sin(yaw);
    return [180 + across * scale, 150 + 210 * t - (along * Math.sin(pitch) + z * Math.cos(pitch)) * scale];
  });
  g.clear();
  g.fillStyle(0x020812, 1 - t).fillRect(0, 0, 360, 480);
  for (const [width, opacity] of [[4, 0.16], [1.2, 1]]) {
    g.lineStyle(width, 0x62fff4, opacity);
    for (const path of outlines) {
      g.beginPath();
      path.forEach((v, i) => i ? g.lineTo(points[v][0], points[v][1]) : g.moveTo(points[v][0], points[v][1]));
      g.strokePath();
    }
  }
}
