import { City } from "./city";
import Phaser from "phaser";

import { prepareTraces, beam } from "./beam";

import { CombatAudio, fragments, type Hull } from "./impact";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const flightSpeed = 210; // Logical pixels per second.

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private pods: Phaser.GameObjects.Image[] = [];
  private missileCooldown = 0;
  private missiles = new Map<Phaser.GameObjects.Image, {
    age: number; target?: Phaser.GameObjects.Image; trail: Phaser.GameObjects.Graphics;
    points: { x: number; y: number; time: number }[];
  }>();
  private weaponLevel = 0;
  private status = document.getElementById("controller")!;

  private marks: Phaser.GameObjects.Image[] = [];
  private farBanks: Phaser.GameObjects.Image[] = [];
  private city?: City;
  private farScroll = 0;
  private scouts: { entry: number; fromRight: boolean; sprite: Phaser.GameObjects.Image; down: boolean }[] = [];
  private bridge!: Phaser.GameObjects.Image;
  private shots: Phaser.GameObjects.Image[] = [];
  private target!: Phaser.GameObjects.Image;
  private carrier!: Phaser.GameObjects.Image;
  private chip!: Phaser.GameObjects.Image;
  private carrierTime = 0;
  private chipDrift = 0;
  private paused = false;
  private startWasHeld = false;
  private mirrored = false;
  private ledges: Phaser.GameObjects.Image[] = [];
  private ledgeScroll = 0;
  private combatAudio = new CombatAudio();
  private enemyShots: { sprite: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private fireCooldown = 0;

  create() {
    prepareTraces(this);
    const parallax = new URLSearchParams(location.search).get("parallax") !== "off";
    this.city = parallax ? new City(this) : undefined;
    this.farScroll = 0;
    this.farBanks = parallax ? Array.from({ length: 4 }, (_, i) =>
      beam(this, 180, i * 192 - 96, "folds").setDepth(-3)) : [];
    const flight = (count: number, fromRight: boolean, start: number, spacing: number) =>
      Array.from({ length: count }, (_, i) => ({
        entry: start + spacing * i, fromRight, down: false,
        sprite: beam(this, 0, 0, "scout").setFlipX(fromRight).setVisible(false),
      }));
    this.scouts = [...flight(4, true, 2.55, 0.29), ...flight(5, false, 0.85, 0.38)];
    this.marks = Array.from({ length: 5 }, (_, i) =>
      beam(this, 180, i * 128 - 64, "canyon").setDepth(-2));
    this.bridge = beam(this, 180, this.marks[1].y, "bridge").setDepth(-2);
    this.bridge.setVisible(new URLSearchParams(location.search).get("bridge") !== "off");
    this.shots = [];
    this.enemyShots = [];
    this.mirrored = false;
    this.ledgeScroll = 0;
    this.ledges = parallax ? Array.from({ length: 4 }, (_, i) =>
      beam(this, 180, i * 192 - 96, "ledges").setDepth(-1.5)) : [];
    document.getElementById("sound")!.onclick = () => this.combatAudio.toggle();
    this.target = beam(this, -12, 125, "raider");
    this.carrierTime = 0;
    this.carrier = beam(this, 370, 180, "carrier");
    this.chip = beam(this, 0, 0, "chip").setVisible(false);
    this.ship = beam(this, 180, 360, "fighter");
    this.missiles.clear();
    this.missileCooldown = 0;
    this.weaponLevel = 0;
    this.pods = [1, -1].map(() => beam(this, 0, 0, "wing-pod").setVisible(false));
    const { version, commit, builtAt } = __FLIGHT_BUILD__;
    document.getElementById("build")!.textContent = [
      `v${version}  ·  ${commit}  ·  ${flightSpeed} px/s`,
      builtAt,
    ].join("\n");
  }

  update(_time: number, delta: number) {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find(controller => controller?.connected);
    const startHeld = pad?.buttons[9]?.pressed ?? false;
    if (startHeld && !this.startWasHeld) {
      this.paused = !this.paused;
      if (this.paused) this.tweens.pauseAll();
      else this.tweens.resumeAll();
    }
    this.startWasHeld = startHeld;
    let message = "Press a controller button";
    if (!navigator.getGamepads) message = "Gamepad API unavailable";
    if (pad) message = this.paused ? "Paused · Press Start to resume" : "Controller detected";
    if (message !== this.status.textContent) this.status.textContent = message;
    if (this.paused) return;

    const seconds = Math.min(delta, 50) / 1000;
    this.city?.draw(seconds, this.ship.x);
    this.farScroll = (this.farScroll + 18 * seconds) % 192;
    this.farBanks.forEach((bank, i) => { bank.y = i * 192 - 96 + this.farScroll; });
    this.ledgeScroll = (this.ledgeScroll + 148 * seconds) % 192;
    this.ledges.forEach((ledge, i) => { ledge.y = i * 192 - 96 + this.ledgeScroll; });
    for (const mark of this.marks) {
      mark.y += 70 * seconds;
      if (mark.y >= 544) mark.y -= 640;
    }
    this.bridge.y = this.marks[1].y;
    const previousTime = this.carrierTime % 5;
    this.carrierTime += seconds;
    if (this.carrierTime >= 10) {
      this.carrierTime %= 10;
      this.mirrored = !this.mirrored;
      this.carrier.setVisible(true);
      for (const scout of this.scouts) scout.down = false;
    }
    const passTime = this.carrierTime % 5;
    if (passTime < previousTime) this.target.setVisible(true);
    const fieldX = (x: number) => this.mirrored ? 360 - x : x;
    this.target.x = fieldX(-12 + 96 * passTime);
    this.carrier.x = fieldX(370 - 76 * this.carrierTime);
    this.scouts.forEach(({ sprite, down, entry, fromRight }) => {
      const age = this.carrierTime - entry;
      const progress = -16 + (fromRight ? 148 : 102) * age;
      sprite.setVisible(!down && age >= 0 && progress <= 376);
      if (!sprite.visible) return;
      const arc = Math.sin(Math.PI * progress / 360);
      sprite.setFlipX(fromRight !== this.mirrored);
      sprite.setPosition(fieldX(fromRight ? 360 - progress : progress),
        fromRight ? 300 - 24 * arc : 211 + 42 * arc);
    });
    if (this.chip.visible) {
      this.chip.x += this.chipDrift * seconds;
      this.chip.y += 68 * seconds;
      if (Math.hypot(this.chip.x - this.ship.x, this.chip.y - this.ship.y) <= 13) {
        this.weaponLevel = Math.min(4, this.weaponLevel + 1);
        this.positionPods();
        this.burst(this.chip.x, this.chip.y);
        this.chip.setVisible(false);
      } else if (this.chip.y > 490) {
        this.chip.setVisible(false);
      }
    }

    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      const previousY = shot.y;
      const previousX = shot.x;
      const missile = this.missiles.get(shot);
      if (missile) {
        missile.age += seconds;
        if (missile.age >= 0.14) {
          if (!missile.target?.visible || missile.target.y >= shot.y || missile.target.x < 0 || missile.target.x > 360) {
            missile.target = this.frontTarget(shot.x, shot.y);
          }
          const target = missile.target;
          const heading = target ? Math.atan2(target.x - shot.x, shot.y - target.y) : 0;
          shot.rotation += Phaser.Math.Clamp(heading - shot.rotation, -4.5 * seconds, 4.5 * seconds);
        }
      }
      const travel = (missile ? 300 : 420) * seconds;
      shot.x += Math.sin(shot.rotation) * travel;
      shot.y -= Math.cos(shot.rotation) * travel;
      if (missile) {
        missile.points.push({ x: shot.x, y: shot.y, time: missile.age });
        while (missile.points.length && missile.points[0].time < missile.age - 0.24) missile.points.shift();
        missile.trail.clear();
        for (let j = 1; j < missile.points.length; j++) {
          const a = missile.points[j - 1], b = missile.points[j];
          missile.trail.lineStyle(1, 0x80ffca, 0.65 * (1 - (missile.age - a.time) / 0.24));
          missile.trail.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
      const crosses = (actor: Phaser.GameObjects.Image, halfWidth: number) => {
        if (!actor.visible || previousY + 5 < actor.y - 7 || shot.y - 5 > actor.y + 7) return false;
        const fraction = previousY === shot.y ? 0 : Phaser.Math.Clamp((previousY - actor.y) / (previousY - shot.y), 0, 1);
        return Math.abs(previousX + (shot.x - previousX) * fraction - actor.x) <= halfWidth;
      };
      const hitCarrier = crosses(this.carrier, 16);
      const hitRaider = crosses(this.target, 12.5);
      const scout = this.scouts.find(({ sprite }) => crosses(sprite, 9));
      if (scout) {
        scout.down = true;
        scout.sprite.setVisible(false);
        this.explode(scout.sprite.x, scout.sprite.y, "scout");
      } else if (hitCarrier) {
        this.carrier.setVisible(false);
        this.explode(this.carrier.x, this.carrier.y, "carrier");
        this.chip.setPosition(Phaser.Math.Clamp(this.carrier.x, 8, 352), this.carrier.y).setVisible(true);
        this.chipDrift = this.chip.x < 180 ? 20 : -20;
      } else if (hitRaider) {
        this.target.setVisible(false);
        this.explode(this.target.x, this.target.y, "raider");
      }
      if (scout || hitCarrier || hitRaider || shot.y < -5 || shot.x < -12 || shot.x > 372 || (missile && missile.age > 2)) {
        missile?.trail.destroy();
        this.missiles.delete(shot);
        shot.destroy();
        this.shots.splice(i, 1);
      }
    }
    this.updateEnemyShots(seconds);
    if (this.target.visible && previousTime < 1.0 && passTime >= 1.0) {
      const angle = Math.atan2(this.ship.y - this.target.y, this.ship.x - this.target.x);
      this.combatAudio.projectile("incoming");
      this.enemyShots.push({
        sprite: beam(this, this.target.x, this.target.y, "incoming"),
        vx: 105 * Math.cos(angle), vy: 105 * Math.sin(angle),
      });
    }
    this.missileCooldown = Math.max(0, this.missileCooldown - seconds);
    this.fireCooldown = Math.max(0, this.fireCooldown - seconds);
    if (!pad) return;

    const held = (index: number) => Number(pad.buttons[index]?.pressed ?? false);
    let x = held(15) - held(14);
    let y = held(13) - held(12);
    if (!x && !y) {
      const stickX = pad.axes[0] ?? 0;
      const stickY = pad.axes[1] ?? 0;
      if (Math.hypot(stickX, stickY) >= 0.30) {
        const eighthTurn = Math.PI / 4;
        const angle = Math.round(Math.atan2(stickY, stickX) / eighthTurn) * eighthTurn;
        x = Math.round(Math.cos(angle));
        y = Math.round(Math.sin(angle));
      }
    }
    const length = Math.hypot(x, y);
    if (length) {
      const distance = flightSpeed * seconds;
      this.ship.x = Phaser.Math.Clamp(this.ship.x + distance * x / length, 10, 350);
      this.ship.y = Phaser.Math.Clamp(this.ship.y + distance * y / length, 10, 470);
    }

    if (length) this.positionPods();

    if (pad.buttons[0]?.pressed && this.fireCooldown <= 0) {
      const shot = beam(this, this.ship.x, this.ship.y - 15, "bolt");
      this.combatAudio.projectile("bolt");
      this.shots.push(shot.setDepth(-1));
      for (const pod of this.pods) {
        if (pod.visible) this.shots.push(beam(this, pod.x, pod.y - 9, "bolt").setRotation(pod.rotation).setDepth(-1));
      }
      if (this.weaponLevel === 4 && this.missileCooldown <= 0) {
        const target = this.frontTarget(this.ship.x, this.ship.y);
        this.pods.forEach((pod, index) => {
          const shot = beam(this, pod.x, pod.y - 6, "missile").setRotation(index === 0 ? Math.PI / 4 : -Math.PI / 4);
          this.shots.push(shot);
          this.missiles.set(shot, { age: 0, target, trail: this.add.graphics().setDepth(-1),
            points: [{ x: shot.x, y: shot.y, time: 0 }] });
        });
        this.missileCooldown = 0.84;
      }
      this.fireCooldown = 0.12;
    }
  }

  private frontTarget(x: number, y: number) {
    let closest: Phaser.GameObjects.Image | undefined;
    let distance = Infinity;
    for (const actor of [this.carrier, this.target, ...this.scouts.map(s => s.sprite)]) {
      if (!actor.visible || actor.y >= y || actor.x < 0 || actor.x > 360) continue;
      const range = Math.hypot(actor.x - x, actor.y - y);
      if (range < distance) {
        closest = actor;
        distance = range;
      }
    }
    return closest;
  }

  private positionPods() {
    this.pods.forEach((pod, index) => {
      const side = index === 0 ? 1 : -1;
      pod.setVisible(this.weaponLevel > index);
      pod.setPosition(Phaser.Math.Clamp(this.ship.x + side * 15, 4, 356), this.ship.y + 3);
      pod.setRotation(this.weaponLevel >= 3 ? side * Math.PI / 15 : 0);
    });
  }

  private explode(x: number, y: number, hull: Hull) {
    this.combatAudio.explosion(hull);
    this.burst(x, y);
    const count = fragments(hull);
    for (const side of [-1, 1]) {
      const fringe = beam(this, x, y, side < 0 ? "fringe-red" : "fringe-blue").setDepth(-0.6);
      this.tweens.add({
        targets: fringe, x: x + side * count * 0.7, scale: 0.34 + count * 0.06,
        alpha: 0, duration: 75 + count * 11, onComplete: () => fringe.destroy(),
      });
    }
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = offset + i * 2 * Math.PI / count;
      const reach = (3 + count * 4) * (0.75 + Math.random() * 0.4);
      const shard = beam(this, x, y, "shard").setRotation(angle).setDepth(-0.5);
      this.tweens.add({
        targets: shard, x: x + Math.cos(angle) * reach, y: y + Math.sin(angle) * reach,
        rotation: angle + 1.5, alpha: 0, ease: "Quad.easeOut", duration: 130 + count * 35,
        onComplete: () => shard.destroy(),
      });
    }
  }

  private burst(x: number, y: number) {
    const flash = beam(this, x, y, "burst");
    this.tweens.add({
      targets: flash, scale: 0.85, alpha: 0, duration: 220,
      onComplete: () => flash.destroy(),
    });
  }

  private updateEnemyShots(seconds: number) {
    for (let i = this.enemyShots.length - 1; i >= 0; i--) {
      const { sprite, vx, vy } = this.enemyShots[i];
      sprite.x += vx * seconds;
      sprite.y += vy * seconds;
      const hit = Math.hypot(sprite.x - this.ship.x, sprite.y - this.ship.y) <= 8;
      if (hit) this.burst(this.ship.x, this.ship.y);
      if (hit || sprite.x < -9 || sprite.x > 369 || sprite.y < -9 || sprite.y > 489) {
        sprite.destroy();
        this.enemyShots.splice(i, 1);
      }
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "flight",
  width: 360,
  height: 480,
  backgroundColor: "#000000",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: FlightScene
});
