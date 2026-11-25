import Phaser from "phaser";

// World y grows toward the viewer. Pitch the camera slightly toward the next block.
export class City {
  private ink: Phaser.GameObjects.Graphics;
  private block = 0;
  private scroll = 0;

  constructor(scene: Phaser.Scene) {
    this.ink = scene.add.graphics().setDepth(-4).setBlendMode(Phaser.BlendModes.ADD);
  }

  draw(seconds: number, shipX: number, district: number) {
    this.scroll += seconds * 62;
    if (this.scroll >= 96) {
      this.scroll -= 96;
      this.block++;
    }
    const g = this.ink.clear();
    const project = (x: number, y: number, height: number) => {
      const scale = 345 / (430 - height - y * 0.30);
      return [180 + (x - (shipX - 180) * 0.12) * scale, 210 + (y - height * 0.32) * scale];
    };
    const path = (points: number[][]) => {
      g.beginPath();
      g.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x, y);
      g.strokePath();
    };
    for (let row = -5; row <= 3; row++) {
      const y = row * 96 + this.scroll;
      const id = this.block - row;
      const avenue = 28 * Math.sin(id * 0.42);
      const next = 28 * Math.sin((id - 1) * 0.42);
      if (district >= 2) {
        g.lineStyle(1, district >= 8 ? 0xcb8562 : 0x658aac, 0.58);
        if (district < 5) {
          for (const offset of [-9, 9]) path([project(-85+offset,y,3), project(85+offset,y+96,3)]);
        } else if (district < 8) {
          const coil = Array.from({length: 13}, (_, i) => {
            const a = i * Math.PI / 6;
            return project(avenue + 33*Math.cos(a), y + 46 + 32*Math.sin(a), 7);
          });
          path(coil);
        } else {
          path([project(-90,y,0), project(-90,y,40), project(-58,y+12,56),
            project(58,y+12,56), project(90,y,40), project(90,y,0)]);
        }
      }
      for (const side of [-1, 1]) {
        g.lineStyle(1, 0x52648b, 0.42);
        path([project(avenue + side * 31, y, 0), project(next + side * 31, y + 96, 0)]);
        path([project(avenue + side * 31, y, 0), project(side * 320, y, 0)]);
        for (let lot = 0; lot < 3; lot++) {
          const seed = Math.imul(id + 1009, 2654435761) ^ Math.imul(lot + 4 * side, 1597334677);
          const x = avenue + side * (49 + lot * 72);
          const w = side * (38 + (seed >>> 12) % 24);
          const d = 43 + (seed >>> 6) % 27;
          const h = 12 + (seed >>> 16) % 47;
          const roof = (u: number, v: number) => project(x + u*w, y + 11 + v*d, h);
          g.lineStyle(1, lot === 0 ? 0x8e70ac : 0x6479ab, 0.48);
          path([roof(0,0), roof(0.8,0), roof(1,0.18), roof(1,1), roof(0,1), roof(0,0)]);
          for (const u of [0,1]) path([roof(u,1), project(x+u*w,y+11+d,0)]);
          path([project(x,y+11+d,0),project(x+w,y+11+d,0)]);
          g.lineStyle(1, seed & 2 ? 0xb16c9e : 0x558f9e, 0.55);
          if (seed & 1) {
            path([roof(.18,.24),roof(.69,.24),roof(.69,.65),roof(.18,.65),roof(.18,.24)]);
            path([roof(.28,.36),roof(.58,.36),roof(.36,.53),roof(.57,.53)]);
          } else {
            for (const v of [.28,.44,.60]) path([roof(.24,v),roof(.61,v)]);
          }
        }
      }
    }
  }
}
