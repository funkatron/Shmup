import Phaser from "phaser";

import { prepareTraces, beam } from "./beam";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const flightSpeed = 210; // Logical pixels per second.

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private status = document.getElementById("controller")!;

  private marks: Phaser.GameObjects.Image[] = [];
  private bridge!: Phaser.GameObjects.Image;
  private shots: Phaser.GameObjects.Image[] = [];
  private target!: Phaser.GameObjects.Image;
  private passTime = 0;
  private enemyShots: { sprite: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private fireCooldown = 0;

  create() {
    prepareTraces(this);
    this.marks = Array.from({ length: 5 }, (_, i) =>
      beam(this, 180, i * 128 - 64, "canyon").setDepth(-2));
    this.bridge = beam(this, 180, this.marks[1].y, "bridge").setDepth(-2);
    this.bridge.setVisible(new URLSearchParams(location.search).get("bridge") !== "off");
    this.shots = [];
    this.enemyShots = [];
    this.passTime = 0;
    this.target = beam(this, -12, 125, "raider");
    this.ship = beam(this, 180, 360, "fighter");
    const { version, commit, builtAt } = __FLIGHT_BUILD__;
    document.getElementById("build")!.textContent = [
      `v${version}  ·  ${commit}  ·  ${flightSpeed} px/s`,
      builtAt,
    ].join("\n");
  }

  update(_time: number, delta: number) {
    const seconds = Math.min(delta, 50) / 1000;
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

    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      const previousY = shot.y;
      shot.y -= 420 * seconds;
      const hit = this.target.visible
        && Math.abs(shot.x - this.target.x) <= 12.5
        && previousY + 5 >= this.target.y - 7
        && shot.y - 5 <= this.target.y + 7;
      if (hit) {
        this.target.setVisible(false);
        this.burst(this.target.x, this.target.y);
      }
      if (hit || shot.y < -5) {
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
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find(controller => controller?.connected);
    let message = "Press a controller button";
    if (!navigator.getGamepads) message = "Gamepad API unavailable";
    if (pad) message = "Controller detected";
    if (message !== this.status.textContent) this.status.textContent = message;
    if (!pad) return;

    const held = (index: number) => Number(pad.buttons[index]?.pressed ?? false);
    const x = held(15) - held(14);
    const y = held(13) - held(12);
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
