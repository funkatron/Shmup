import Phaser from "phaser";

import { prepareTraces, beam } from "./beam";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const flightSpeed = 210; // Logical pixels per second.

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private status = document.getElementById("controller")!;

  private marks: Phaser.GameObjects.Image[] = [];
  private farBanks: Phaser.GameObjects.Image[] = [];
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
  private passTime = 0;
  private enemyShots: { sprite: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private fireCooldown = 0;

  create() {
    prepareTraces(this);
    const parallax = new URLSearchParams(location.search).get("parallax") !== "off";
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
    this.passTime = 0;
    this.target = beam(this, -12, 125, "raider");
    this.carrierTime = 0;
    this.carrier = beam(this, 370, 180, "carrier");
    this.chip = beam(this, 0, 0, "chip").setVisible(false);
    this.ship = beam(this, 180, 360, "fighter");
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
    this.farScroll = (this.farScroll + 24 * seconds) % 192;
    this.farBanks.forEach((bank, i) => { bank.y = i * 192 - 96 + this.farScroll; });
    for (const mark of this.marks) {
      mark.y += 70 * seconds;
      if (mark.y >= 544) mark.y -= 640;
    }
    this.bridge.y = this.marks[1].y;
    const previousTime = this.passTime;
    this.passTime += seconds;
    if (this.passTime >= 5) {
      this.passTime %= 5;
      this.target.setVisible(true);
    }
    this.target.x = -12 + 96 * this.passTime;

    this.carrierTime += seconds;
    if (this.carrierTime >= 10) {
      this.carrierTime %= 10;
      this.carrier.setVisible(true);
      for (const scout of this.scouts) scout.down = false;
    }
    this.carrier.x = 370 - 76 * this.carrierTime;
    this.scouts.forEach(({ sprite, down, entry, fromRight }) => {
      const age = this.carrierTime - entry;
      const progress = -16 + (fromRight ? 148 : 102) * age;
      sprite.setVisible(!down && age >= 0 && progress <= 376);
      if (!sprite.visible) return;
      const arc = Math.sin(Math.PI * progress / 360);
      if (fromRight) sprite.setPosition(360 - progress, 300 - 24 * arc);
      else sprite.setPosition(progress, 211 + 42 * arc);
    });
    if (this.chip.visible) {
      this.chip.x += this.chipDrift * seconds;
      this.chip.y += 68 * seconds;
      if (Math.hypot(this.chip.x - this.ship.x, this.chip.y - this.ship.y) <= 13) {
        this.burst(this.chip.x, this.chip.y);
        this.chip.setVisible(false);
      } else if (this.chip.y > 490) {
        this.chip.setVisible(false);
      }
    }

    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      const previousY = shot.y;
      shot.y -= 420 * seconds;
      const crosses = (actor: Phaser.GameObjects.Image, halfWidth: number) =>
        actor.visible && Math.abs(shot.x - actor.x) <= halfWidth
        && previousY + 5 >= actor.y - 7 && shot.y - 5 <= actor.y + 7;
      const hitCarrier = crosses(this.carrier, 16);
      const hitRaider = crosses(this.target, 12.5);
      const scout = this.scouts.find(({ sprite }) => crosses(sprite, 9));
      if (scout) {
        scout.down = true;
        scout.sprite.setVisible(false);
        this.burst(scout.sprite.x, scout.sprite.y);
      } else if (hitCarrier) {
        this.carrier.setVisible(false);
        this.chip.setPosition(Phaser.Math.Clamp(this.carrier.x, 8, 352), this.carrier.y).setVisible(true);
        this.chipDrift = this.chip.x < 180 ? 20 : -20;
      } else if (hitRaider) {
        this.target.setVisible(false);
        this.burst(this.target.x, this.target.y);
      }
      if (scout || hitCarrier || hitRaider || shot.y < -5) {
        shot.destroy();
        this.shots.splice(i, 1);
      }
    }
    this.updateEnemyShots(seconds);
    if (this.target.visible && previousTime < 1.0 && this.passTime >= 1.0) {
      const angle = Math.atan2(this.ship.y - this.target.y, this.ship.x - this.target.x);
      this.enemyShots.push({
        sprite: beam(this, this.target.x, this.target.y, "incoming"),
        vx: 105 * Math.cos(angle), vy: 105 * Math.sin(angle),
      });
    }
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

    if (pad.buttons[0]?.pressed && this.fireCooldown <= 0) {
      const shot = beam(this, this.ship.x, this.ship.y - 15, "bolt");
      this.shots.push(shot.setDepth(-1));
      this.fireCooldown = 0.12;
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
