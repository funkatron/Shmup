import Phaser from "phaser";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const flightSpeed = 210; // Logical pixels per second.

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Triangle;
  private status!: Phaser.GameObjects.Text;

  create() {
    this.ship = this.add.triangle(180, 360, 0, 20, 10, 0, 20, 20, 0x7deaff);
    const { version, commit, builtAt } = __FLIGHT_BUILD__;
    this.add.text(8, 26, [
      `v${version}  ·  ${commit}  ·  ${flightSpeed} px/s`,
      builtAt,
    ], { fontSize: "12px", color: "#b9d6de" });
    this.status = this.add.text(8, 8, "", { fontSize: "12px", color: "#b9d6de" });
  }

  update(_time: number, delta: number) {
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
    if (!length) return;

    const distance = flightSpeed * Math.min(delta, 50) / 1000;
    this.ship.x = Phaser.Math.Clamp(this.ship.x + distance * x / length, 10, 350);
    this.ship.y = Phaser.Math.Clamp(this.ship.y + distance * y / length, 10, 470);
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
