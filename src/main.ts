import { City } from "./city";
import Phaser from "phaser";

import { prepareTraces, beam } from "./beam";

import { CombatAudio, fragments, type Hull } from "./impact";

declare const __FLIGHT_BUILD__: { version: string; commit: string; builtAt: string };
const wardenMaxHp = 96;
const wardenStages = [
  { texture: "warden", cue: null },
  { texture: "warden-cracked", cue: "wingCrack" },
  { texture: "warden-breached", cue: "wingBreach" },
  { texture: "warden-critical", cue: "coreRupture" },
] as const;
const flightSpeed = 210; // Logical pixels per second.

const maxWeaponLevel = 4;
const dropOrder = ["cannon", "missile", "double"] as const;

const missileTrailSeconds = 0.50;

const newFlightStats = () => ({ fired: 0, hits: 0, kills: 0, wardens: 0, chips: 0, hitsTaken: 0 });

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private pods: Phaser.GameObjects.Image[] = [];
  private missileCooldown = 0;
  private missiles = new Map<Phaser.GameObjects.Image, {
    age: number; target?: Phaser.GameObjects.Image; trail: Phaser.GameObjects.Graphics;
    points: { x: number; y: number; time: number }[];
  }>();
  private lockOverlay!: Phaser.GameObjects.Graphics;
  private lockColors = new Map<Phaser.GameObjects.Image, number>();
  private nextHue = 0.44;
  private cannonLevel = 1;
  private missileLevel = 0;
  private doubleLevel = 0;
  private double!: Phaser.GameObjects.Image;
  private doubleCooldown = 0;
  private dropIndex = 0;
  private status = document.getElementById("controller")!;

  private marks: Phaser.GameObjects.Image[] = [];
  private farBanks: Phaser.GameObjects.Image[] = [];
  private city?: City;
  private farScroll = 0;
  private scouts: { entry: number; fromRight: boolean; leader: boolean; altitude: number; sprite: Phaser.GameObjects.Image; down: boolean }[] = [];
  private bridge!: Phaser.GameObjects.Image;
  private shots: Phaser.GameObjects.Image[] = [];
  private target!: Phaser.GameObjects.Image;
  private frigate!: Phaser.GameObjects.Image;
  private carrier!: Phaser.GameObjects.Image;
  private chip!: Phaser.GameObjects.Image;
  private boss!: Phaser.GameObjects.Image;
  private bossMeter!: Phaser.GameObjects.Graphics;
  private bossHp = 0;
  private bossAge = 0;
  private nextFan = 0;
  private aim = 0;
  private warned = false;
  private untilBoss = 40;
  private carrierTime = 0;
  private chipDrift = 0;
  private stats = newFlightStats();
  private pointer?: { id: number; originX: number; originY: number; x: number; y: number };
  private paused = false;
  private startWasHeld = false;
  private mirrored = false;
  private ledges: Phaser.GameObjects.Image[] = [];
  private ledgeScroll = 0;
  private combatAudio = new CombatAudio();
  private enemyShots: { sprite: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private fireCooldown = 0;

  create() {
    this.bindPointer();
    prepareTraces(this);
    const parallax = new URLSearchParams(location.search).get("parallax") !== "off";
    this.city = parallax ? new City(this) : undefined;
    this.farScroll = 0;
    this.farBanks = parallax ? Array.from({ length: 4 }, (_, i) =>
      beam(this, 180, i * 192 - 96, "folds").setDepth(-3)) : [];
    const flight = (count: number, fromRight: boolean, start: number, spacing: number, altitude = 0) =>
      Array.from({ length: count }, (_, i) => ({
        entry: start + spacing * i, fromRight, altitude, leader: i === 0, down: false,
        sprite: beam(this, 0, 0, "scout").setFlipX(fromRight).setVisible(false),
      }));
    this.scouts = [
      ...flight(5, false, 0.60, 0.30), ...flight(4, true, 2.05, 0.24),
      ...flight(6, false, 5.10, 0.20, -58), ...flight(5, true, 6.45, 0.22, -52),
    ];
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
    const detachAudio = this.combatAudio.attach(document.querySelector<HTMLButtonElement>("#sound")!);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, detachAudio);
    this.stats = newFlightStats();
    this.paused = false;
    this.startWasHeld = false;
    this.showStats();
    this.frigate = beam(this, -20, 94, "frigate").setVisible(false);
    this.target = beam(this, -12, 125, "raider");
    this.boss = beam(this, 180, -30, "warden").setVisible(false);
    this.bossMeter = this.add.graphics().setDepth(1);
    this.untilBoss = new URLSearchParams(location.search).get("encounter") === "boss" ? 0 : 40;
    this.carrierTime = 0;
    this.carrier = beam(this, 370, 180, "carrier");
    this.chip = beam(this, 0, 0, "chip-cannon").setVisible(false);
    this.chip.setAlpha(0.76);
    this.tweens.add({
      targets: this.chip, scale: this.chip.scaleX * 1.25, alpha: 1,
      duration: 450, ease: "Sine.easeInOut", yoyo: true, repeat: -1,
    });
    this.ship = beam(this, 180, 360, "fighter");
    this.missiles.clear();
    this.lockColors.clear();
    this.lockOverlay = this.add.graphics().setDepth(0.5);
    this.missileCooldown = 0;
    this.cannonLevel = 1;
    this.missileLevel = this.doubleLevel = 0;
    this.dropIndex = 0;
    this.doubleCooldown = this.fireCooldown = 0;
    this.double = beam(this, this.ship.x, this.ship.y + 18, "double").setVisible(false);
    this.pods = [1, -1].map(() => beam(this, 0, 0, "wing-pod"));
    this.positionPods();
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
    if (startHeld && !this.startWasHeld) this.togglePause();
    this.startWasHeld = startHeld;
    const message = this.paused ? "Paused" : pad ? "Controller detected" : "Hold to fire · Drag to steer";
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
    let passTime = previousTime;
    this.untilBoss -= seconds;
    if (this.untilBoss <= 0) {
      this.updateBoss(seconds);
    } else {
      const lastWaveTime = this.carrierTime;
      this.carrierTime += seconds;
      if (this.carrierTime >= 10) {
        this.carrierTime %= 10;
        this.mirrored = !this.mirrored;
        this.carrier.setVisible(true);
        for (const scout of this.scouts) scout.down = false;
      }
      passTime = this.carrierTime % 5;
      if (passTime < previousTime) this.target.setVisible(true);
      const fieldX = (x: number) => this.mirrored ? 360 - x : x;
      if (lastWaveTime < 4 && this.carrierTime >= 4) this.frigate.setVisible(true);
      this.frigate.x = fieldX(-20 + (this.carrierTime - 4) * 88);
      if (this.carrierTime >= 8.6) this.frigate.setVisible(false);
      if (this.frigate.visible && lastWaveTime < 6 && this.carrierTime >= 6) this.fireFrigateMissiles();
      this.target.x = fieldX(-12 + 96 * passTime);
      this.carrier.x = fieldX(370 - 76 * this.carrierTime);
      this.scouts.forEach(({ sprite, down, entry, fromRight, altitude, leader }) => {
        const age = this.carrierTime - entry;
        const progress = -16 + (fromRight ? 148 : 102) * age;
        sprite.setVisible(!down && age >= 0 && progress <= 376);
        if (!sprite.visible) return;
        const arc = Math.sin(Math.PI * progress / 360);
        sprite.setFlipX(fromRight !== this.mirrored);
        sprite.setPosition(fieldX(fromRight ? 360 - progress : progress),
          altitude + (fromRight ? 300 - 24 * arc : 211 + 42 * arc));
        // One fan per formation. A close pass gives the fighter room to escape.
        if (leader && age >= 1.20 && lastWaveTime < entry + 1.20 &&
            Math.hypot(sprite.x - this.ship.x, sprite.y - this.ship.y) >= 90) {
          const aim = Math.atan2(this.ship.y - sprite.y, this.ship.x - sprite.x);
          this.combatAudio.projectile("incoming");
          for (const offset of [-0.34, 0, 0.34]) {
            this.enemyShots.push({
              sprite: beam(this, sprite.x, sprite.y, "incoming"),
              vx: 120 * Math.cos(aim + offset), vy: 120 * Math.sin(aim + offset),
            });
          }
        }
      });
    }
    if (this.chip.visible) {
      this.chip.x += this.chipDrift * seconds;
      this.chip.y += 68 * seconds;
      if (Math.hypot(this.chip.x - this.ship.x, this.chip.y - this.ship.y) <= 13) {
        this.stats.chips++;
        this.combatAudio.cue("pickup");
        switch (this.chip.texture.key) {
          case "chip-cannon": this.cannonLevel = Math.min(maxWeaponLevel, this.cannonLevel + 1); break;
          case "chip-missile": this.missileLevel = Math.min(maxWeaponLevel, this.missileLevel + 1); break;
          case "chip-double":
            if (!this.doubleLevel) this.double.setPosition(this.ship.x, this.ship.y + 18).setVisible(true);
            this.doubleLevel = Math.min(maxWeaponLevel, this.doubleLevel + 1);
            break;
        }
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
        if (missile.age >= 0.28) {
          if (!missile.target?.visible || missile.target.y >= shot.y || missile.target.x < 0 || missile.target.x > 360) {
            missile.target = this.frontTarget(shot.x, shot.y);
          }
          const target = missile.target;
          const heading = target ? Math.atan2(target.x - shot.x, shot.y - target.y) : 0;
          shot.rotation += Phaser.Math.Clamp(heading - shot.rotation, -4.5 * seconds, 4.5 * seconds);
        }
      }
      const speed = missile ? Math.min(480, 145 + 440 * missile.age) : 420;
      const travel = speed * seconds;
      shot.x += Math.sin(shot.rotation) * travel;
      shot.y -= Math.cos(shot.rotation) * travel;
      if (missile) {
        missile.points.push({ x: shot.x, y: shot.y, time: missile.age });
        while (missile.points.length && missile.points[0].time < missile.age - missileTrailSeconds) missile.points.shift();
        missile.trail.clear();
        for (let j = 1; j < missile.points.length; j++) {
          const a = missile.points[j - 1], b = missile.points[j];
          missile.trail.lineStyle(1, this.lockColor(missile.target), 0.65 * (1 - (missile.age - a.time) / missileTrailSeconds));
          missile.trail.lineBetween(a.x, a.y, b.x, b.y);
        }
      }
      const crosses = (actor: Phaser.GameObjects.Image, halfWidth: number) => {
        if (!actor.visible) return false;
        // Intersect the entire frame of travel with the hit box, including sideways flight.
        let enter = 0, leave = 1;
        const clip = (start: number, end: number, center: number, radius: number) => {
          if (start === end) return Math.abs(start - center) <= radius;
          const a = (center - radius - start) / (end - start);
          const b = (center + radius - start) / (end - start);
          enter = Math.max(enter, Math.min(a, b));
          leave = Math.min(leave, Math.max(a, b));
          return enter <= leave;
        };
        return clip(previousX, shot.x, actor.x, halfWidth) && clip(previousY, shot.y, actor.y, 12);
      };
      const hitBoss = crosses(this.boss, 43);
      const hitCarrier = crosses(this.carrier, 16);
      const hitFrigate = crosses(this.frigate, 15);
      const hitRaider = crosses(this.target, 12.5);
      const scout = this.scouts.find(({ sprite }) => crosses(sprite, 9));
      const hit = Boolean(scout || hitBoss || hitCarrier || hitRaider || hitFrigate);
      if (hit) this.stats.hits++;
      if (scout) {
        scout.down = true;
        scout.sprite.setVisible(false);
        this.explode(scout.sprite.x, scout.sprite.y, "scout");
      } else if (hitBoss) {
        this.bossHp -= missile ? 3 : 1;
        if (this.bossHp > 0) {
          const stage = Math.floor(4 * (1 - this.bossHp / wardenMaxHp));
          const { texture, cue } = wardenStages[stage];
          if (this.boss.texture.key !== texture) {
            this.boss.setTexture(texture);
            if (cue) this.combatAudio.cue(cue);
          }
          this.boss.setTint(0xffdddd);
        }
        if (this.bossHp <= 0) {
          this.stats.wardens++;
          this.boss.setVisible(false);
          this.bossMeter.clear();
          this.explode(this.boss.x, this.boss.y, "carrier");
          this.burst(this.boss.x - 31, this.boss.y);
          this.burst(this.boss.x + 31, this.boss.y);
          for (const shot of this.enemyShots) shot.sprite.destroy();
          this.enemyShots = [];
          this.carrierTime = 0;
          this.carrier.setVisible(true);
          this.target.setVisible(true);
          for (const scout of this.scouts) scout.down = false;
          this.untilBoss = 40;
        }
      } else if (hitCarrier) {
        this.carrier.setVisible(false);
        this.explode(this.carrier.x, this.carrier.y, "carrier");
        this.chip.setTexture("chip-" + dropOrder[this.dropIndex]);
        this.dropIndex = (this.dropIndex + 1) % dropOrder.length;
        this.chip.setPosition(Phaser.Math.Clamp(this.carrier.x, 8, 352), this.carrier.y).setVisible(true);
        this.chipDrift = this.chip.x < 180 ? 20 : -20;
      } else if (hitFrigate) {
        this.frigate.setVisible(false);
        this.explode(this.frigate.x, this.frigate.y, "raider");
      } else if (hitRaider) {
        this.target.setVisible(false);
        this.explode(this.target.x, this.target.y, "raider");
      }
      if (hit || shot.y < -5 || shot.x < -12 || shot.x > 372 || (missile && missile.age > 2)) {
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
    this.doubleCooldown = Math.max(0, this.doubleCooldown - seconds);
    if (this.double.visible) {
      const follow = 1 - Math.exp(-6 * seconds);
      this.double.x += (this.ship.x - this.double.x) * follow;
      this.double.y += (Math.min(474, this.ship.y + 18) - this.double.y) * follow;
    }
    if (!pad && !this.pointer) {
      this.drawLocks();
      return;
    }

    const held = (index: number) => Number(pad?.buttons[index]?.pressed ?? false);
    let x = held(15) - held(14);
    let y = held(13) - held(12);
    if (!x && !y) {
      const stickX = pad?.axes[0] ?? 0;
      const stickY = pad?.axes[1] ?? 0;
      if (Math.hypot(stickX, stickY) >= 0.30) {
        const eighthTurn = Math.PI / 4;
        const angle = Math.round(Math.atan2(stickY, stickX) / eighthTurn) * eighthTurn;
        x = Math.round(Math.cos(angle));
        y = Math.round(Math.sin(angle));
      }
    }
    if (this.pointer) {
      x = this.pointer.x;
      y = this.pointer.y;
    }
    const length = Math.hypot(x, y);
    if (length) {
      const distance = flightSpeed * seconds * Math.min(1, length);
      this.ship.x = Phaser.Math.Clamp(this.ship.x + distance * x / length, 10, 350);
      this.ship.y = Phaser.Math.Clamp(this.ship.y + distance * y / length, 10, 470);
    }

    if (length) this.positionPods();

    const previousShots = this.shots.length;
    if ((this.pointer || pad?.buttons[0]?.pressed) && this.fireCooldown <= 0) {
      const shot = beam(this, this.ship.x, this.ship.y - 15, "bolt");
      this.combatAudio.projectile("bolt");
      this.shots.push(shot.setDepth(-1));
      for (const pod of this.pods) {
        if (pod.visible) this.shots.push(beam(this, pod.x, pod.y - 9, "bolt").setDepth(-1));
      }
      this.fireCooldown = this.cannonLevel === maxWeaponLevel ? 0.09 : 0.12;
    }
    if ((this.pointer || pad?.buttons[2]?.pressed) && this.missileLevel && this.missileCooldown <= 0) {
      this.launchMissiles(this.missileLevel);
      this.combatAudio.projectile("missiles");
      this.missileCooldown = 0.84;
    }
    if ((this.pointer || pad?.buttons[1]?.pressed) && this.doubleLevel && this.doubleCooldown <= 0) {
      this.shots.push(beam(this, this.double.x, this.double.y - 8, "double-bolt"));
      this.combatAudio.projectile("bolt");
      this.doubleCooldown = 0.32 - 0.06 * (this.doubleLevel - 1);
    }
    this.stats.fired += this.shots.length - previousShots;
    this.drawLocks();
  }

  private fireFrigateMissiles() {
    const y = this.frigate.y + 8;
    this.combatAudio.projectile("incoming");
    for (const side of [-1, 1]) {
      const x = this.frigate.x + side * 11;
      const heading = Math.atan2(this.ship.y - y, this.ship.x - x);
      const sprite = beam(this, x, y, "enemy-missile").setRotation(heading + Math.PI / 2);
      this.enemyShots.push({ sprite, vx: 155 * Math.cos(heading), vy: 155 * Math.sin(heading) });
    }
  }

  private launchMissiles(pairs: number) {
    const outerDegrees = Math.min(75, 45 + 7 * (pairs - 1));
    const laneSpacing = (outerDegrees - 45) / Math.max(1, pairs - 1);
    this.pods.forEach((pod, index) => {
      const side = index === 0 ? 1 : -1;
      for (let lane = 1; lane <= pairs; lane++) {
        const angle = side * (45 + laneSpacing * (lane - 1)) * Math.PI / 180;
        const shot = beam(this, pod.x, pod.y - 6, "missile").setRotation(angle);
        this.shots.push(shot);
        this.missiles.set(shot, {
          age: 0, target: this.frontTarget(shot.x, shot.y), trail: this.add.graphics().setDepth(-1),
          points: [{ x: shot.x, y: shot.y, time: 0 }],
        });
      }
    });
  }

  private bindPointer() {
    const canvas = this.game.canvas;
    const pause = document.getElementById("pause")!;
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const release = (event: PointerEvent) => {
      if (this.pointer?.id === event.pointerId) this.pointer = undefined;
    };
    canvas.addEventListener("pointerdown", event => {
      if (this.paused || this.pointer || event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      this.pointer = { id: event.pointerId, originX: event.clientX, originY: event.clientY, x: 0, y: 0 };
    }, options);
    canvas.addEventListener("pointermove", event => {
      const stick = this.pointer;
      if (!stick || stick.id !== event.pointerId) return;
      const radius = canvas.getBoundingClientRect().width / 10;
      if (radius <= 0) return;
      stick.x = (event.clientX - stick.originX) / radius;
      stick.y = (event.clientY - stick.originY) / radius;
    }, options);
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
      canvas.addEventListener(name, release, options);
    }
    window.addEventListener("blur", () => { this.pointer = undefined; }, options);
    pause.addEventListener("click", () => this.togglePause(), options);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      listeners.abort();
      this.pointer = undefined;
    });
  }

  private togglePause() {
    this.paused = !this.paused;
    this.pointer = undefined;
    this.showStats();
    if (this.paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }

  private showStats() {
    const panel = document.getElementById("stats")!;
    document.getElementById("pause")!.textContent = this.paused ? "Resume" : "Pause";
    panel.hidden = !this.paused;
    if (!this.paused) return;
    const { fired, hits, kills, wardens, chips, hitsTaken } = this.stats;
    const accuracy = fired ? Math.round(100 * hits / fired) + "%" : "—";
    panel.textContent = [
      "FLIGHT STATS", "",
      `Accuracy     ${accuracy} (${hits}/${fired})`,
      `Destroyed    ${kills}`,
      `Wardens      ${wardens}`,
      `Chips        ${chips}`,
      `Cannon ${this.cannonLevel}/4  Missiles ${this.missileLevel}/4  Double ${this.doubleLevel}/4`,
      `Hits taken   ${hitsTaken}`,
    ].join("\n");
  }

  private updateBoss(seconds: number) {
    if (!this.boss.visible) {
      this.boss.setTexture("warden").setPosition(180, -30).setVisible(true);
      this.frigate.setVisible(false);
      this.bossHp = wardenMaxHp;
      this.bossAge = 0;
      this.nextFan = 2.5;
      this.warned = false;
      this.carrier.setVisible(false);
      this.target.setVisible(false);
      for (const scout of this.scouts) scout.sprite.setVisible(false);
    }
    this.bossAge += seconds;
    this.boss.clearTint();
    this.boss.y = Math.min(85, -30 + this.bossAge * 75);
    this.boss.x = 180 + 99 * Math.sin(this.bossAge * 0.82);
    const g = this.bossMeter.clear();
    for (let i = 0; i < Math.ceil(12 * this.bossHp / wardenMaxHp); i++) {
      g.lineStyle(2, 0xff996e, 0.9).lineBetween(this.boss.x - 29 + i*5, this.boss.y - 28,
        this.boss.x - 26 + i*5, this.boss.y - 28);
    }
    if (this.bossAge < this.nextFan - 0.65) return;
    if (!this.warned) {
      this.aim = Math.atan2(this.ship.y - this.boss.y - 16, this.ship.x - this.boss.x);
      this.combatAudio.cue("charge");
      this.warned = true;
    }
    const count = this.bossHp <= wardenMaxHp / 2 ? 7 : 5;
    for (let i = 0; i < count; i++) {
      const angle = this.aim + (i - (count - 1) / 2) * 0.24;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const x = this.boss.x, y = this.boss.y + 16;
      g.lineStyle(1, 0xff528c, 0.85).lineBetween(x + 12*dx, y + 12*dy, x + 30*dx, y + 30*dy);
      if (this.bossAge >= this.nextFan) {
        this.enemyShots.push({sprite: beam(this, x, y, "incoming"), vx: 145*dx, vy: 145*dy});
      }
    }
    if (this.bossAge >= this.nextFan) {
      this.combatAudio.projectile("incoming");
      this.nextFan += this.bossHp <= wardenMaxHp / 2 ? 1.40 : 1.85;
      this.warned = false;
    }
  }

  private frontTarget(x: number, y: number) {
    const locks = new Map<Phaser.GameObjects.Image, number>();
    for (const { target } of this.missiles.values()) {
      if (target) locks.set(target, (locks.get(target) ?? 0) + 1);
    }
    let fewestLocks = Infinity;
    let closest: Phaser.GameObjects.Image | undefined;
    let distance = Infinity;
    for (const actor of [this.boss, this.frigate, this.carrier, this.target, ...this.scouts.map(s => s.sprite)]) {
      if (!actor.visible || actor.y >= y || actor.x < 0 || actor.x > 360) continue;
      const range = Math.hypot(actor.x - x, actor.y - y);
      const count = locks.get(actor) ?? 0;
      if (count < fewestLocks || (count === fewestLocks && range < distance)) {
        fewestLocks = count;
        closest = actor;
        distance = range;
      }
    }
    return closest;
  }

  private lockColor(target?: Phaser.GameObjects.Image) {
    if (!target?.visible) return 0xbaffda;
    let color = this.lockColors.get(target);
    if (color === undefined) {
      color = Phaser.Display.Color.HSVToRGB(this.nextHue, 0.65, 1).color;
      this.nextHue = (this.nextHue + 0.381966) % 1;
      this.lockColors.set(target, color);
    }
    return color;
  }

  private drawLocks() {
    this.lockOverlay.clear();
    const active = new Set<Phaser.GameObjects.Image>();
    for (const [shot, { target }] of this.missiles) {
      shot.setTint(this.lockColor(target));
      if (target?.visible) active.add(target);
    }
    for (const [target, color] of this.lockColors) {
      if (!active.has(target)) {
        this.lockColors.delete(target);
        continue;
      }
      const radius = target === this.boss ? 46 : target === this.carrier || target === this.frigate ? 20 : 14;
      this.lockOverlay.lineStyle(1, color, 0.9);
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          const x = target.x + side * radius, y = target.y + end * (target === this.boss ? 24 : 11);
          this.lockOverlay.lineBetween(x, y, x - side * 4, y);
          this.lockOverlay.lineBetween(x, y, x, y - end * 4);
        }
      }
    }
  }

  private positionPods() {
    this.pods.forEach((pod, index) => {
      const side = index === 0 ? 1 : -1;
      pod.setVisible(this.cannonLevel >= index + 2);
      pod.setPosition(Phaser.Math.Clamp(this.ship.x + side * 15, 4, 356), this.ship.y + 3);
    });
  }

  private explode(x: number, y: number, hull: Hull) {
    this.stats.kills++;
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
    let playerHit = false;
    for (let i = this.enemyShots.length - 1; i >= 0; i--) {
      const { sprite, vx, vy } = this.enemyShots[i];
      sprite.x += vx * seconds;
      sprite.y += vy * seconds;
      const hit = Math.hypot(sprite.x - this.ship.x, sprite.y - this.ship.y) <= 8;
      if (hit) {
        this.stats.hitsTaken++;
        playerHit = true;
        this.burst(this.ship.x, this.ship.y);
      }
      if (hit || sprite.x < -9 || sprite.x > 369 || sprite.y < -9 || sprite.y > 489) {
        sprite.destroy();
        this.enemyShots.splice(i, 1);
      }
    }
    if (playerHit) this.combatAudio.cue("playerHit");
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
