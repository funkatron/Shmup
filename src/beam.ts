import Phaser from "phaser";

type Trace = number[];

// Paths describe the beam while lit. Starting a new path blanks the connecting move.
function traceTexture(scene: Phaser.Scene, key: string, w: number, h: number,
  color: string, intensity: number, traces: Trace[]) {
  const density = 3;
  const texture = scene.textures.createCanvas(key, w * density, h * density);
  if (!texture) return;
  const ctx = texture.context;
  ctx.scale(density, density);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.globalCompositeOperation = "lighter";
  for (const path of traces) {
    ctx.beginPath();
    ctx.moveTo(path[0], path[1]);
    for (let i = 2; i < path.length; i += 2) ctx.lineTo(path[i], path[i + 1]);
    // Bake the soft phosphor footprint once. Brighter traces get a wider halo.
    ctx.globalAlpha = intensity * 0.28;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 2.6 * density * intensity;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = intensity;
    ctx.lineWidth = 0.95;
    ctx.stroke();
  }
  texture.refresh();
}

export function prepareTraces(scene: Phaser.Scene) {
  traceTexture(scene, "fighter", 32, 32, "#62fff4", 1, [
    [16,5,20,15,26,23,20,21,17,18,15,18,12,21,6,23,12,15,16,5],
    [12,15,11,20], [20,15,21,20], [16,10,18,16,14,16,16,10],
    [13,21,16,26,19,21],
  ]);
  traceTexture(scene, "raider", 34, 24, "#ff4b78", 1, [
    [6,6,12,9,17,6,22,9,28,6,25,15,20,13,17,19,14,13,9,15,6,6],
    [12,9,17,14,22,9], [15,10,19,10],
  ]);
  traceTexture(scene, "scout", 24, 18, "#ff9961", 0.85, [
    [3,3,20,9,3,15,8,9,3,3], [8,9,15,9],
  ]);
  traceTexture(scene, "carrier", 40, 24, "#92ff60", 1, [
    [3,12,9,5,30,5,37,12,30,19,9,19,3,12],
    [10,8,10,16], [30,8,30,16], [16,8,24,8,24,16,16,16,16,8],
  ]);
  traceTexture(scene, "chip", 20, 20, "#92ff60", 1, [
    [5,4,15,4,15,16,5,16,5,4], [2,7,5,7], [15,7,18,7],
    [2,13,5,13], [15,13,18,13],
  ]);
  traceTexture(scene, "wing-pod", 10, 16, "#62fff4", 0.9, [
    [5,2,8,7,7,13,3,13,2,7,5,2],
  ]);
  traceTexture(scene, "bolt", 12, 20, "#fff458", 1, [[6,5,6,15]]);
  traceTexture(scene, "incoming", 18, 18, "#ff50ff", 1, [
    [9,4,14,9,9,14,4,9,9,4], [9,8,9,10],
  ]);
  traceTexture(scene, "burst", 32, 32, "#ffe970", 1, [
    [16,5,16,10], [25,8,21,12], [27,20,22,18],
    [19,27,18,22], [7,24,11,20], [5,11,10,13],
  ]);
  // Taper the spacing at the folds. Endpoints match one tile below.
  const folds: Trace[] = [];
  for (let rib = 0; rib < 6; rib++) {
    const x = 5 + rib * 12;
    folds.push([x,0, 46 + rib * 6,54, 18 + rib * 15,103, x - 16,151, x,192]);
    folds.push([360-x,0, 376-x,41, 342-rib*15,89, 314-rib*6,138, 360-x,192]);
  }
  traceTexture(scene, "folds", 360, 192, "#8269ce", 0.32, folds);
  // Offset two broken traces to suggest momentary phosphor misconvergence.
  const fringe = [[4,12,7,6,13,4], [20,7,23,13,20,19], [15,23,9,21]];
  traceTexture(scene, "fringe-red", 28, 28, "#ff703d", 0.75, fringe);
  traceTexture(scene, "fringe-blue", 28, 28, "#689eff", 0.75, fringe);
  traceTexture(scene, "shard", 14, 10, "#ffae50", 0.9, [[2,7,7,3,11,4]]);
  // Sparse projecting shelves pass closest to the viewer along the outer banks.
  traceTexture(scene, "ledges", 360, 192, "#7293f0", 0.63, [
    [0,26,26,38,49,65,22,57,0,38], [0,38,22,66,49,73,49,65], [22,57,22,66],
    [360,112,335,120,319,143,344,136,360,124],
    [319,143,319,150,344,143,360,130], [344,136,344,143],
  ]);
  // Broken rails leave dark space between the two banks and behind incoming fire.
  traceTexture(scene, "bridge", 360, 20, "#638aca", 0.38, [
    [40,5,75,5,90,14,108,5,143,5], [40,14,75,14,90,5,108,14,143,14],
    [157,5,174,5], [186,5,203,5], [157,14,174,14], [186,14,203,14],
    [217,5,252,5,270,14,285,5,317,5], [217,14,252,14,270,5,285,14,317,14],
  ]);
  // One repeating strip of faceted canyon walls. Endpoints match at the seam.
  traceTexture(scene, "canyon", 360, 128, "#5674ff", 0.55, [
    [10,0,26,30,17,58,38,91,10,128], [39,0,50,22,36,56,56,94,39,128],
    [10,0,50,22,26,30,36,56,17,58,56,94,38,91,39,128],
    [350,0,336,25,347,66,323,103,350,128],
    [321,0,301,32,320,68,310,95,321,128],
    [350,0,301,32,336,25,320,68,347,66,310,95,323,103,321,128],
    [82,42,76,51,90,48,82,42], [263,105,269,96,279,102,263,105],
  ]);
}

export function beam(scene: Phaser.Scene, x: number, y: number, key: string) {
  return scene.add.image(x, y, key).setScale(1 / 3).setBlendMode(Phaser.BlendModes.ADD);
}
