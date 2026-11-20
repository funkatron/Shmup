import Phaser from "phaser";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const flightSpeed = 210; // Logical pixels per second.

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Triangle;
  private status!: Phaser.GameObjects.Text;

  private marks: Phaser.GameObjects.Rectangle[] = [];
  private shots: Phaser.GameObjects.Rectangle[] = [];
  private target!: Phaser.GameObjects.Rectangle;
  private passTime = 0;
  private fireCooldown = 0;

  create() {
    this.marks = Array.from({ length: 24 }, (_, i) => {
      const x = 24 + (i % 4) * 92 + (Math.floor(i / 4) % 2) * 18;
      const y = Math.floor(i / 4) * 80 + (i % 4) * 13;
      return this.add.rectangle(x, y, 3, 9, 0x30465a).setDepth(-2);
    });
    this.shots = [];
    this.passTime = 0;
    this.target = this.add.rectangle(-12, 125, 22, 14, 0xe67060)
      .setStrokeStyle(2, 0xffc9aa);
    this.ship = this.add.triangle(180, 360, 0, 20, 10, 0, 20, 20, 0x7deaff);
    const { version, commit, builtAt } = __FLIGHT_BUILD__;
    this.add.text(8, 26, [
      `v${version}  ·  ${commit}  ·  ${flightSpeed} px/s`,
      builtAt,
    ], { fontSize: "12px", color: "#b9d6de" });
    this.status = this.add.text(8, 8, "", { fontSize: "12px", color: "#b9d6de" });
  }

  update(_time: number, delta: number) {
    const seconds = Math.min(delta, 50) / 1000;
    for (const mark of this.marks) {
      mark.y += 70 * seconds;
      if (mark.y >= 485) mark.y -= 490;
    }
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
        && Math.abs(shot.x - this.target.x) <= (shot.width + this.target.width) / 2
        && previousY + shot.height / 2 >= this.target.y - this.target.height / 2
        && shot.y - shot.height / 2 <= this.target.y + this.target.height / 2;
      if (hit) {
        this.target.setVisible(false);
        const flash = this.add.circle(this.target.x, this.target.y, 7)
          .setStrokeStyle(2, 0xffe891);
        this.tweens.add({
          targets: flash, scale: 2.4, alpha: 0, duration: 180,
          onComplete: () => flash.destroy(),
        });
      }
      if (hit || shot.y < -5) {
        shot.destroy();
        this.shots.splice(i, 1);
      }
    }
    this.fireCooldown = Math.max(0, this.fireCooldown - seconds);
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find(controller => controller?.connected);
    let message = "Press a controller button";
    if (!navigator.getGamepads) message = "Gamepad API unavailable";
    if (pad) message = "Controller detected";
    if (message !== this.status.text) this.status.setText(message);
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
      const shot = this.add.rectangle(this.ship.x, this.ship.y - 15, 3, 10, 0xffe891);
      this.shots.push(shot.setDepth(-1));
      this.fireCooldown = 0.12;
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 360,
  height: 480,
  backgroundColor: "#101827",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: FlightScene
});
