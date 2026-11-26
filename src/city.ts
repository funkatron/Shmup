import Phaser from "phaser";

const facades = [0xd169bf, 0xc89a58, 0x46b8ce, 0x77aaf6];
const crossings = [2, 5, 8];

function mixColor(from: number, to: number, amount: number) {
  const channel = (shift: number) => {
    const a = (from >> shift) & 255;
    return Math.round(a + (((to >> shift) & 255) - a) * amount);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

// World y grows toward the viewer. Pitch the camera slightly toward the next block.
export class City {
  private ink: Phaser.GameObjects.Graphics;
  private spans: Phaser.GameObjects.Graphics;
  private originTime?: number;
  private distance = 0;

  constructor(scene: Phaser.Scene) {
    this.spans = scene.add.graphics().setDepth(0.25);
    this.ink = scene.add.graphics().setDepth(-4).setBlendMode(Phaser.BlendModes.ADD);
  }

  draw(seconds: number, shipX: number, routeTime: number) {
    this.originTime ??= routeTime;
    this.distance += seconds * 62;
    const block = Math.floor(this.distance / 96);
    const scroll = this.distance % 96;
    this.spans.clear();
    const g = this.ink.clear();
    const project = (x: number, y: number, height: number) => {
      const scale = 345 / (430 - height - y * 0.30);
      return [180 + (x - (shipX - 180) * 0.12) * scale, 210 + (y - height * 0.32) * scale];
    };
    const path = (points: number[][], pen = g) => {
      pen.beginPath();
      pen.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) pen.lineTo(x, y);
      pen.strokePath();
    };
    for (let row = -5; row <= 3; row++) {
      const y = row * 96 + scroll;
      const id = block - row;
      // A block keeps its architecture from first sight to the bottom edge.
      const district = (this.originTime + id * 96 / 62) / 10;
      const border = crossings.findIndex(at => Math.abs(district - at) < 0.55);
      let facade = facades[crossings.filter(at => district >= at).length];
      let passage = 0;
      if (border >= 0) {
        const fraction = (district - crossings[border] + 0.55) / 1.1;
        facade = mixColor(facades[border], facades[border+1], fraction);
        passage = Math.sin(Math.PI * fraction) ** 2;
      }
      const avenue = 28 * Math.sin(id * 0.42);
      const next = 28 * Math.sin((id - 1) * 0.42);
      // Landmarks occupy alternating blocks. Project every vertex with the streets
      // so a passing roof or crane stays anchored as the pilot banks.
      let intensity = 1;
      const stroke = (color: number, vertices: number[][], glow = false, overhead = false) => {
        const screen = vertices.map(([x, offset, h]) => project(x, y + offset, h));
        const pen = overhead ? this.spans : g;
        if (overhead) {
          // A narrow opaque girder interrupts the fighter trace at the crossing.
          pen.lineStyle(3.5, 0x080c19, 0.96 * intensity);
          path(screen, pen);
        }
        if (glow) {
          pen.lineStyle(3, color, 0.16 * intensity);
          path(screen, pen);
        }
        pen.lineStyle(1, color, 0.86 * intensity);
        path(screen, pen);
      };
      if (passage > 0) {
        intensity = passage;
        for (const bank of [-1,1]) {
          for (const offset of [80,88]) {
            stroke(facade, [[avenue+bank*offset,0,6],[next+bank*offset,96,6]], true);
          }
          stroke(facade, [[avenue+bank*109,0,0],[avenue+bank*109,0,31],[avenue+bank*84,0,6]]);
        }
        intensity = 1 - passage * .94;
      }
      const phase = this.distance / 62 + id * 1.7;
      const side = (id & 2) ? -1 : 1;
      if (id % 2 === 0 && district < 2) {
        // Quayside gantry, suspended container and a pointed ferry hull.
        const crane = (points: number[][]) => points.map(([x,v,h]) => [x*side,v,h]);
        stroke(0xf078e1, crane([[108,18,0],[108,18,70],[44,18,70],[108,18,51]]), true);
        const trolley = 71 + 22 * Math.sin(phase * 0.73);
        const hook = 37 + 9 * Math.cos(phase);
        stroke(0xf078e1, crane([[trolley,18,70],[trolley,18,hook+6],[trolley-12,18,hook],[trolley+12,18,hook],[trolley+12,18,hook-10],[trolley-12,18,hook-10],[trolley-12,18,hook]]));
        stroke(0xa075bc, crane([[-93,30,8],[-80,30,8],[-80,58,8],[-93,58,8],[-93,30,8]]));
        stroke(0x48c7d5, crane([[-87,4,2],[-74,24,2],[-74,75,2],[-95,75,2],[-99,24,2],[-87,4,2]]), true);
      } else if (district >= 2 && district < 5) {
        const travel = .5 + .39 * Math.sin(phase * .8);
        const cart = (t: number, offset: number) => [side*96*(1-2*t)+offset,96*t,9];
        stroke(0xebbd81, [cart(travel-.05,-4),cart(travel+.05,-4),cart(travel+.05,4),cart(travel-.05,4),cart(travel-.05,-4)]);
        for (const sign of [-1,1]) {
          for (const offset of [-4,4]) stroke(0xe7ac6e, [[sign*96+offset,0,5],[-sign*96+offset,96,5]]);
          for (const t of [.15,.35,.65,.85]) {
            const x = sign*96*(1-2*t);
            stroke(0x95816d, [[x-8,t*96-2,4],[x+8,t*96+2,4]]);
          }
        }
      } else if (id % 2 === 0 && district >= 5 && district < 8) {
        for (const radius of [41,55,76]) {
          const ring = Array.from({length: 25}, (_, k) => {
            const a = k*Math.PI/12;
            return [avenue+radius*Math.cos(a),48+radius*.78*Math.sin(a),12];
          });
          stroke(0x42cfee, ring, radius === 55);
        }
        for (let spoke = 0; spoke < 8; spoke++) {
          const angle = spoke * Math.PI / 4 + side * phase * .48;
          stroke(0x4286ac, [55,76].map(r => [avenue+r*Math.cos(angle),48+r*.78*Math.sin(angle),12]));
        }
        for (const x of [-74,74]) stroke(0xb56ae4, [[x,0,0],[x,27,12],[x*.7,41,12]]);
      } else if (id % 2 === 0 && district >= 8) {
        for (const x of [-104,104]) {
          stroke(0x62bbf3, [[x,16,0],[x,16,65]], true);
          stroke(0x62bbf3, [[x,16,65],[x*.73,16,86],[0,16,86]], true, true);
          stroke(0x5789be, [[x,16,8],[x*.89,16,32],[x,16,58]]);
          stroke(0x5789be, [[x,16,58],[x*.73,16,74],[x*.52,16,86],[x*.3,16,74],[0,16,86]], false, true);
          stroke(0x7296d3, [[x*.89,16,0],[x*.89,16,59]]);
          stroke(0x7296d3, [[x*.89,16,59],[x*.72,16,74],[0,16,74]], false, true);
        }
        stroke(0xffb459, [[-20,16,87],[-25,16,107],[-9,16,96],[0,16,116],[9,16,96],[25,16,107],[20,16,87],[-20,16,87]], true, true);
      }
      intensity = 1;
      // Pairs walk along the outer pavement. Their arms and legs alternate
      // against the scrolling ground, with a separate gait for each walker.
      if (id % 3 !== 0) {
        for (const step of [0, 1]) {
          const walk = phase * .43 + step * .17;
          const v = 46 + 32 * Math.sin(walk);
          const x = avenue + (next - avenue) * v / 96 + side * (99 + step * 7);
          const stride = 2.5 * Math.sin(phase * 6 + step * 2);
          const direction = Math.tanh(5 * Math.cos(walk));
          const person = 0xc0ae9c;
          stroke(person, [[x-1,v,7],[x,v-1,10],[x+1,v,7],[x,v,5],[x,v+direction,3]]);
          stroke(person, [[x-2,v+stride,0],[x,v,4],[x+2,v-stride,0]]);
          stroke(person, [[x-2,v-stride,5],[x,v,6],[x+2,v+stride,5]]);
        }
      }
      for (const side of [-1, 1]) {
        g.lineStyle(1, 0x52648b, 0.42);
        path([project(avenue + side * 31, y, 0), project(next + side * 31, y + 96, 0)]);
        path([project(avenue + side * 31, y, 0), project(side * 320, y, 0)]);
        for (let lot = 1; lot < 3; lot++) {
          const seed = Math.imul(id + 1009, 2654435761) ^ Math.imul(lot + 4 * side, 1597334677);
          const x = avenue + side * (49 + lot * 72);
          const w = side * (38 + (seed >>> 12) % 24);
          const d = 43 + (seed >>> 6) % 27;
          const h = 12 + (seed >>> 16) % 47;
          const roof = (u: number, v: number) => project(x + u*w, y + 11 + v*d, h);
          g.lineStyle(1, facade, lot === 1 ? 0.52 : 0.29);
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
    // Separate world distances let cars travel across block boundaries.
    for (const direction of [-1, 1]) {
      const distance = this.distance * (1 + direction * .58) + direction * 69;
      const trafficBlock = Math.floor(distance / 240);
      for (let row = -3; row <= 2; row++) {
        const y = row * 240 + distance - trafficBlock * 240;
        const road = (this.distance - y) / 96;
        const cell = Math.ceil(road);
        const along = cell - road;
        const start = 28 * Math.sin(cell * .42);
        const end = 28 * Math.sin((cell-1) * .42);
        const x = start + (end-start)*along + direction*19;
        const truck = (trafficBlock-row) % 3 === 0;
        const rear = truck ? -17 : -10;
        const corner = (u: number, v: number, h = 2) => project(x+u, y+direction*v, h);
        g.lineStyle(1, truck ? 0x91a8bd : 0x79b5b0, .72);
        path([corner(-4,rear),corner(4,rear),corner(4,6),corner(2,9),corner(-3,9),corner(-4,6),corner(-4,rear)]);
        path([corner(-3,2,5),corner(3,2,5),corner(2,5,4),corner(-2,5,4),corner(-3,2,5)]);
        g.lineStyle(1, 0xe1cf99, .85);
        for (const lamp of [-3,2]) path([corner(lamp,7),corner(lamp+1,7)]);
      }
    }
  }
}
