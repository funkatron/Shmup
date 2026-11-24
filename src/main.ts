import { drawArrival } from "./arrival";
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

const lessons = ["Steer · left stick or drag", "Hold B · four cannon volleys", "Hold Y · homing missiles", "Tap X · cycle drone formations"];
const maxWeaponLevel = 4;
const formations = ["Ahead", "Free", "Defensive", "Roll", "Spread"] as const;
const dropOrder = ["cannon", "missile", "double"] as const;

const missileTrailSeconds = 0.50;

const newFlightStats = () => ({ fired: 0, hits: 0, kills: 0, wardens: 0, chips: 0, hitsTaken: 0 });

class FlightScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private score = 0;
  private demo = new URLSearchParams(location.search).get("mode") === "demo";
  private demoTime = 0;
  private pickupGuide?: Phaser.GameObjects.Graphics;
  private pickupCollectedAt?: number;
  private lesson = -1;
  private introTime = 0;
  private arrival?: Phaser.GameObjects.Graphics;
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
  private actors: Phaser.GameObjects.Image[] = [];
  private droneLocks = new Map<Phaser.GameObjects.Image, Phaser.GameObjects.Image>();
  private drones: (Phaser.GameObjects.Image & { hp: number; contacts: Set<Phaser.GameObjects.Image> })[] = [];
  private reserves = 0;
  private formation = 0;
  private orbit = 0;
  private formationHeld = false;
  private beamCooldown = 0;
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
  private cannonVolley = 0;

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
    this.actors = [this.boss, this.carrier, this.frigate, this.target, ...this.scouts.map(s => s.sprite)];
    this.ship = beam(this, 180, 360, "fighter");
    this.ship.setScale(this.ship.scaleX * 1.3);
    this.missiles.clear();
    this.lockColors.clear();
    this.lockOverlay = this.add.graphics().setDepth(0.5);
    this.missileCooldown = 0;
    this.cannonLevel = 1;
    this.missileLevel = 0;
    this.drones = [];
    this.droneLocks.clear();
    this.reserves = 0;
    this.formation = this.orbit = 0;
    this.formationHeld = false;
    this.dropIndex = 0;
    this.beamCooldown = this.fireCooldown = this.cannonVolley = 0;

    this.pods = [1, -1].map(() => beam(this, 0, 0, "wing-pod"));
    this.positionPods();
    this.score = 0;
    this.addScore(0);
    this.introTime = this.demoTime = 0;
    this.lesson = -1;
    this.ship.setVisible(false);
    this.arrival = this.add.graphics().setDepth(10);
    drawArrival(this.arrival, 0);
    if (this.demo) {
      this.pickupGuide = this.add.graphics().setDepth(2);
      this.pickupCollectedAt = undefined;
      const link = document.querySelector<HTMLAnchorElement>("#mode")!;
      link.textContent = "Play Surrender";
      link.href = location.pathname;
      link.target = "_self";
    }
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
    const xHeld = !!pad?.buttons[3]?.pressed;
    if (xHeld && !this.formationHeld && !this.paused) this.cycleFormation();
    this.formationHeld = xHeld;
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
    if (this.arrival) {
      this.introTime += seconds;
      const fraction = Math.min(1, this.introTime / 2.6);
      drawArrival(this.arrival, fraction);
      if (fraction === 1) {
        this.arrival.destroy();
        this.arrival = undefined;
        this.ship.setVisible(true);
      }
      return;
    }
    if (this.demo) this.updateDemo(seconds);
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
        if (this.pickupGuide) this.pickupCollectedAt = this.demoTime;
        this.stats.chips++;
        this.addScore(50);
        this.combatAudio.cue("pickup");
        if (this.cannonLevel === maxWeaponLevel && this.missileLevel === maxWeaponLevel && this.drones.length === maxWeaponLevel) {
          this.reserves++;
        } else switch (this.chip.texture.key) {
          case "chip-cannon": this.cannonLevel = Math.min(maxWeaponLevel, this.cannonLevel + 1); break;
          case "chip-missile": this.missileLevel = Math.min(maxWeaponLevel, this.missileLevel + 1); break;
          case "chip-double":
            if (this.drones.length < maxWeaponLevel) {
              this.deployDrone();
            }
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
      const hit = this.firstHit(previousX, previousY, shot.x - previousX, shot.y - previousY);
      if (hit) this.damageEnemy(hit.actor, missile ? 3 : 1);
      if (hit || shot.y < -5 || shot.x < -12 || shot.x > 372 || (missile && missile.age > 2)) {
        missile?.trail.destroy();
        this.missiles.delete(shot);
        shot.destroy();
        this.shots.splice(i, 1);
      }
    }
    this.updateDrones(seconds);
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
    const cannonHeld = Boolean(this.demo && (this.lesson === 1 || (!!this.pickupGuide && !this.chip.visible)) || this.pointer || pad?.buttons[0]?.pressed);
    if (cannonHeld) {
      if (this.cannonVolley || this.fireCooldown > 0) this.fireCooldown -= seconds;
    } else {
      this.fireCooldown = this.cannonVolley = 0;
    }
    this.beamCooldown = Math.max(0, this.beamCooldown - seconds);
    if (this.drones.length && this.beamCooldown <= 0) {
      let fired = 0;
      for (const drone of this.drones) {
        const target = this.droneLocks.get(drone);
        if (target?.visible && this.fireBeam(drone, target)) fired++;
      }
      if (fired) {
        this.stats.fired += fired;
        this.combatAudio.projectile("beam");
        this.beamCooldown = 0.32;
      }
    }
    if (!this.demo && !pad && !this.pointer) {
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
    if (this.demo) {
      x = (180 + 105 * Math.sin(this.demoTime * 0.9) - this.ship.x) / 70;
      y = (345 + 36 * Math.cos(this.demoTime) - this.ship.y) / 70;
      if (this.pickupGuide) {
        const chasing = this.chip.visible;
        x = ((chasing ? this.chip.x : 180) - this.ship.x) / 24;
        y = ((chasing ? this.chip.y : 350) - this.ship.y) / 24;
      }
    }
    const length = Math.hypot(x, y);
    if (length) {
      const distance = flightSpeed * seconds * Math.min(1, length);
      this.ship.x = Phaser.Math.Clamp(this.ship.x + distance * x / length, 10, 350);
      this.ship.y = Phaser.Math.Clamp(this.ship.y + distance * y / length, 10, 470);
    }

    if (length) this.positionPods();

    const previousShots = this.shots.length;
    if (cannonHeld && this.fireCooldown <= 0.000001) {
      const barrels = this.cannonLevel === maxWeaponLevel ? [-4, 4] : [0];
      for (const offset of barrels) {
        this.shots.push(beam(this, this.ship.x + offset, this.ship.y - 15, "bolt").setDepth(-1));
      }
      this.combatAudio.projectile("bolt");
      for (const pod of this.pods) {
        if (pod.visible) this.shots.push(beam(this, pod.x, pod.y - 9, "bolt").setDepth(-1));
      }
      const step = this.cannonLevel === maxWeaponLevel ? 0.09 : 0.12;
      this.cannonVolley = (this.cannonVolley + 1) % 4;
      this.fireCooldown += step * (this.cannonVolley === 0 ? 3 : 1);
    }
    if ((this.demo && this.lesson === 2 || this.pointer || pad?.buttons[2]?.pressed) && this.missileLevel && this.missileCooldown <= 0) {
      this.launchMissiles(this.missileLevel);
      this.combatAudio.projectile("missiles");
      this.missileCooldown = 0.84;
    }
    this.stats.fired += this.shots.length - previousShots;
    this.drawLocks();
  }

  private addScore(points: number) {
    this.score += points;
    document.getElementById("score")!.textContent = (this.demo ? "DEMO " : "SCORE ") + String(this.score).padStart(6, "0");
  }

  private updateDemo(seconds: number) {
    this.demoTime += seconds;
    if (this.pickupGuide) {
      const panel = document.getElementById("lesson")!;
      const collected = this.pickupCollectedAt !== undefined;
      const chasing = this.chip.visible;
      const focus = chasing ? this.chip : this.carrier;
      this.pickupGuide.clear();
      if (!collected && focus.visible) {
        const r = (chasing ? 13 : 23) + 2 * Math.sin(this.demoTime * 6);
        this.pickupGuide.lineStyle(1, 0xa8ff80, 0.85);
        this.pickupGuide.strokeCircle(focus.x, focus.y, r);
      }
      const caption = collected ? "Cannon upgraded · two parallel shots" :
        chasing ? "Fly through the pulsing chip" : "Shoot the green carrier";
      panel.hidden = false;
      panel.dataset.step = collected || !chasing ? "1" : "0";
      const label = panel.querySelector(".caption")!;
      if (label.textContent !== caption) label.textContent = caption;
      if (!collected || this.demoTime - this.pickupCollectedAt! < 2) return;
      this.pickupGuide.destroy();
      this.pickupGuide = undefined;
      this.demoTime = 0;
    }
    const next = Math.floor(this.demoTime / 5) % lessons.length;
    if (next !== this.lesson) {
      this.lesson = next;
      const panel = document.getElementById("lesson")!;
      panel.hidden = false;
      panel.dataset.step = String(next);
      panel.querySelector(".caption")!.textContent = lessons[next];
      if (next === 2) this.missileLevel = 2;
      if (next === 3) {
        while (this.drones.length < 3) this.deployDrone();
        this.cycleFormation();
      }
    }
  }

  private cycleFormation() {
    this.formation = (this.formation + 1) % formations.length;
    document.getElementById("formation")!.textContent = formations[this.formation];
  }

  private halfWidth(actor: Phaser.GameObjects.Image) {
    if (actor === this.boss) return 43;
    if (actor === this.carrier || actor === this.frigate) return 16;
    return actor === this.target ? 12.5 : 9;
  }

  private firstHit(x: number, y: number, dx: number, dy: number) {
    let nearest: { actor: Phaser.GameObjects.Image; fraction: number } | undefined;
    for (const actor of this.actors) {
      if (!actor.visible) continue;
      let enter = 0, leave = 1;
      const clip = (offset: number, delta: number, radius: number) => {
        if (!delta) return Math.abs(offset) <= radius;
        const a = (offset - radius) / delta, b = (offset + radius) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
        return enter <= leave;
      };
      if (clip(actor.x - x, dx, this.halfWidth(actor)) && clip(actor.y - y, dy, 12)
          && (!nearest || enter < nearest.fraction)) nearest = { actor, fraction: enter };
    }
    return nearest;
  }

  private damageEnemy(actor: Phaser.GameObjects.Image, damage: number) {
    this.stats.hits++;
    const scout = this.scouts.find(s => s.sprite === actor);
    if (scout) {
      this.addScore(100);
      scout.down = true;
      scout.sprite.setVisible(false);
      this.explode(scout.sprite.x, scout.sprite.y, "scout");
    } else if (actor === this.boss) {
      this.bossHp -= damage;
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
        this.addScore(5000);
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
    } else if (actor === this.carrier) {
      this.addScore(500);
      this.carrier.setVisible(false);
      this.explode(this.carrier.x, this.carrier.y, "carrier");
      this.chip.setTexture("chip-" + dropOrder[this.dropIndex]);
      this.dropIndex = (this.dropIndex + 1) % dropOrder.length;
      this.chip.setPosition(Phaser.Math.Clamp(this.carrier.x, 8, 352), this.carrier.y).setVisible(true);
      this.chipDrift = this.chip.x < 180 ? 20 : -20;
    } else if (actor === this.frigate) {
      this.addScore(400);
      this.frigate.setVisible(false);
      this.explode(this.frigate.x, this.frigate.y, "raider");
    } else if (actor === this.target) {
      this.addScore(200);
      this.target.setVisible(false);
      this.explode(this.target.x, this.target.y, "raider");
    }
  }

  private fireBeam(drone: Phaser.GameObjects.Image, target: Phaser.GameObjects.Image) {
    const dx = target.x - drone.x, dy = target.y - drone.y;
    const defensive = formations[this.formation] === "Defensive";
    const incoming = defensive ? this.enemyShots.findIndex(shot => shot.sprite === target) : -1;
    if (defensive && incoming < 0) return false;
    const hit = defensive ? undefined : this.firstHit(drone.x, drone.y, dx, dy);
    const end = hit?.fraction ?? 1;
    const trace = this.add.graphics();
    for (const [width, color, alpha] of [[3, 0xbd75ff, 0.25], [1, 0xefceff, 1]]) {
      trace.lineStyle(width, color, alpha);
      trace.lineBetween(drone.x, drone.y, drone.x + dx * end, drone.y + dy * end);
    }
    this.tweens.add({ targets: trace, alpha: 0, duration: 110, onComplete: () => trace.destroy() });
    if (incoming >= 0) {
      this.enemyShots.splice(incoming, 1);
      target.destroy();
      this.stats.hits++;
    } else if (hit) this.damageEnemy(hit.actor, 1);
    return true;
  }

  private deployDrone() {
    const sprite = beam(this, this.ship.x, this.ship.y - 12, "double");
    this.drones.push(Object.assign(sprite, { hp: 3, contacts: new Set<Phaser.GameObjects.Image>() }));
  }

  private damageDrone(index: number) {
    const drone = this.drones[index];
    this.burst(drone.x, drone.y);
    if (--drone.hp > 0) {
      drone.setTint(drone.hp === 2 ? 0xffccaa : 0xff8877);
      return;
    }
    this.drones.splice(index, 1);
    this.droneLocks.delete(drone);
    drone.destroy();
    if (this.reserves > 0) {
      this.reserves--;
      this.deployDrone();
    }
  }

  private updateDrones(seconds: number) {
    if (!this.drones.length) return;
    this.orbit += seconds * 2.25;
    const enemies = this.actors.filter(a => a.visible && a.x >= 0 && a.x <= 360 && a.y >= 0 && a.y <= 480);
    const mode = formations[this.formation], count = this.drones.length;
    const available = new Set(mode === "Defensive"
      ? this.enemyShots.map(shot => shot.sprite).filter(a => a.visible && a.x >= 0 && a.x <= 360 && a.y >= 0 && a.y <= 480)
      : enemies);
    for (const [drone, target] of this.droneLocks) {
      if (!available.delete(target)) this.droneLocks.delete(drone);
    }
    for (const drone of this.drones) {
      if (this.droneLocks.has(drone)) continue;
      let best: Phaser.GameObjects.Image | undefined;
      let range = Infinity;
      for (const target of available) {
        const from = mode === "Defensive" ? this.ship : drone;
        const distance = Math.hypot(target.x - from.x, target.y - from.y);
        if (distance < range) { best = target; range = distance; }
      }
      if (best) {
        this.droneLocks.set(drone, best);
        available.delete(best);
      }
    }
    for (let i = count - 1; i >= 0; i--) {
      const drone = this.drones[i];
      const lane = i - (count - 1) / 2;
      let x = this.ship.x + lane * 18, y = this.ship.y - 30, angle = 0;
      const target = this.droneLocks.get(drone);
      if (mode === "Free" && target) {
        x = target.x + lane * 16;
        y = target.y + 44;
        angle = Math.atan2(target.x - drone.x, drone.y - target.y);
      } else if (mode === "Defensive") {
        x = this.ship.x + lane * 20;
        y = this.ship.y - 17;
      } else if (mode === "Roll") {
        angle = this.orbit + i * 2 * Math.PI / count;
        x = this.ship.x + Math.sin(angle) * 32;
        y = this.ship.y - Math.cos(angle) * 32;
      } else if (mode === "Spread") {
        angle = [-1,1,-3,3][i] * Math.PI / 4;
        x = this.ship.x + 27 * Math.sin(angle);
        y = this.ship.y - 27 * Math.cos(angle);
      }
      const dx = Phaser.Math.Clamp(x, 5, 355) - drone.x, dy = Phaser.Math.Clamp(y, 5, 475) - drone.y;
      const step = Math.min(1, seconds * 232.5 / (Math.hypot(dx, dy) || 1));
      drone.setPosition(drone.x + dx * step, drone.y + dy * step).setRotation(angle);
      if (target) drone.setRotation(Math.atan2(target.x - drone.x, drone.y - target.y));
      for (const actor of drone.contacts) {
        if (!enemies.includes(actor) || Math.abs(drone.x - actor.x) > this.halfWidth(actor) + 3
            || Math.abs(drone.y - actor.y) > 13) drone.contacts.delete(actor);
      }
      for (const actor of enemies) {
        if (drone.contacts.has(actor) || Math.abs(drone.x - actor.x) > this.halfWidth(actor) + 3
            || Math.abs(drone.y - actor.y) > 13) continue;
        drone.contacts.add(actor);
        this.damageDrone(i);
        if (drone.hp === 0) break;
      }
    }
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
    const selector = document.getElementById("formation")!;
    selector.textContent = formations[0];
    selector.addEventListener("click", () => { if (!this.paused) this.cycleFormation(); }, options);
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
      `Score        ${this.score}`,
      `Accuracy     ${accuracy} (${hits}/${fired})`,
      `Destroyed    ${kills}`,
      `Wardens      ${wardens}`,
      `Chips        ${chips}`,
      `Cannon ${this.cannonLevel}/4  Missiles ${this.missileLevel}/4  Drones ${this.drones.length}/4`,
      `Reserve drones  ${this.reserves}`,
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
    this.lockOverlay.lineStyle(1, 0xdf9eff, 0.95);
    for (const target of this.droneLocks.values()) {
      if (!target.visible || target.active === false) continue;
      const radius = formations[this.formation] === "Defensive" ? 6 : this.halfWidth(target) + 3;
      this.lockOverlay.strokeEllipse(target.x, target.y, radius * 2, Math.min(28, radius * 2));
    }
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
      const radius = formations[this.formation] === "Defensive" ? 15 : 7;
      const intercept = this.drones.findIndex(d => Math.hypot(d.x-sprite.x, d.y-sprite.y) <= radius);
      if (intercept >= 0) {
        this.damageDrone(intercept);
        sprite.destroy();
        this.enemyShots.splice(i, 1);
        continue;
      }
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
