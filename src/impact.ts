// Generate one impact per hull and cache it for successive hits.
export type Hull = "scout" | "raider" | "carrier";
const profiles = {
  scout: { start: 91, end: 63, seconds: 0.32, decay: 0.40, lowMidDb: 3, fragments: 3 },
  raider: { start: 88, end: 66, seconds: 0.65, decay: 0.62, lowMidDb: 6, fragments: 5 },
  carrier: { start: 70, end: 52, seconds: 0.85, decay: 1.05, lowMidDb: 8, fragments: 7 },
};
// Start time, strength, and damping time of successive hull fractures (seconds).
const fractures: Record<Hull, [number, number, number][]> = {
  scout: [[0, 0.88, 0.088], [0.034, 0.61, 0.096], [0.091, 0.32, 0.085]],
  raider: [[0, 1, 0.09], [0.071, 0.86, 0.11], [0.19, 0.72, 0.10], [0.34, 0.46, 0.11]],
  carrier: [[0, 1, 0.12], [0.095, 0.94, 0.15], [0.23, 0.82, 0.14], [0.39, 0.59, 0.14], [0.56, 0.40, 0.13]],
};
export function fragments(hull: Hull) { return profiles[hull].fragments; }

function synth(context: AudioContext, hull: Hull) {
  const { start, end, seconds, decay } = profiles[hull];
  const rate = context.sampleRate;
  const dryLength = Math.ceil(rate * seconds);
  const buffer = context.createBuffer(1, dryLength + Math.ceil(rate * decay), rate);
  const samples = buffer.getChannelData(0);
  let phase = 0;
  let rubble = 0;
  let held = 0;
  let nextLatch = 0;
  for (let i = 0; i < dryLength; i++) {
    const t = i / rate;
    const progress = t / seconds;
    phase += 2 * Math.PI * (end + (start - end) * Math.exp(-8 * progress)) / rate;

    const body = Math.tanh(2 * Math.sin(phase) + 0.4 * Math.sin(2 * phase));
    const attack = Math.min(1, t / 0.002);
    const envelope = attack * (1 - progress) ** 2;
    // Hold at 8 kHz without an anti-alias filter, quantize to 32 levels,
    // then apply the envelope so the last step decays cleanly to silence.
    if (i >= nextLatch) {
      const noise = Math.random() * 2 - 1;
      const brightness = (hull === "scout" ? 0.43 : 0.50) * Math.exp(-3.6 * progress);
      rubble += (0.085 + brightness) * (noise - rubble);
      const raw = Math.tanh(2.8 * rubble + brightness * noise);
      held = Math.round((raw + 1) * 15.5) / 15.5 - 1;
      let gain = 0;
      for (const [onset, strength, damping] of fractures[hull]) {
        const age = t - onset;
        if (age < 0) break;
        gain += strength * Math.min(1, age / 0.005) * Math.exp(-age / damping);
      }
      held *= gain;
      nextLatch += rate / 8000;
    }
    samples[i] = envelope * body * (hull === "scout" ? 0.14 : 0.19);
    samples[i] += held * 0.43 * attack * Math.min(1, (seconds - t) / 0.035);

  }
  boostLowMids(samples.subarray(0, dryLength), rate, profiles[hull].lowMidDb);
  reverberate(samples, dryLength, rate, decay);
  return buffer;
}

// A broad 300 Hz bell adds body to the fractures and their reflections.
function boostLowMids(samples: Float32Array, rate: number, gainDb: number) {
  const omega = 2 * Math.PI * 300 / rate;
  const gain = 10 ** (gainDb / 40);
  const alpha = Math.sin(omega) / (2 * 0.85);
  const a0 = 1 + alpha / gain;
  const b0 = (1 + alpha * gain) / a0;
  const b1 = -2 * Math.cos(omega) / a0;
  const b2 = (1 - alpha * gain) / a0;
  const a2 = (1 - alpha / gain) / a0;
  let z1 = 0, z2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const input = samples[i];
    const output = b0 * input + z1;
    z1 = b1 * (input - output) + z2;
    z2 = b2 * input - a2 * output;
    samples[i] = output;
  }
}

// Approximate a dense late field with filtered noise driven by the hull's
// smoothed energy. No short delay line recirculates a pitched resonance.
function reverberate(samples: Float32Array, dryLength: number, rate: number, decay: number) {
  const attack = 1 - Math.exp(-1 / (0.024 * rate));
  const release = Math.exp(-Math.log(1e6) / (decay * rate));
  const damping = 1 - Math.exp(-2 * Math.PI * 780 / rate);
  const highPass = 1 - Math.exp(-2 * Math.PI * 95 / rate);
  const noiseGain = Math.sqrt(3 * (2 - damping) / damping);
  const preDelay = Math.round(0.018 * rate);
  const dry = samples.slice(0, dryLength);
  let energy = 0;
  let diffuse = 0;
  let bass = 0;
  for (let i = 0; i < samples.length; i++) {
    const input = dry[i - preDelay] ?? 0;
    const power = input * input;
    energy = power > energy ? energy + attack * (power - energy) : energy * release;
    diffuse += damping * (Math.random() * 2 - 1 - diffuse);
    bass += highPass * (diffuse - bass);
    const fade = Math.min(1, (samples.length - 1 - i) / (rate * 0.015));
    const wet = 0.45 * Math.sqrt(energy) * noiseGain * (diffuse - bass) * fade;
    samples[i] = 0.76 * Math.tanh(samples[i] + wet);
  }
}

// Delay times are in playback seconds, so both octave settings get the same echo.
function addEcho(context: AudioContext, source: AudioBuffer, speed: number) {
  const dry = source.getChannelData(0);
  const rate = context.sampleRate * speed;
  const first = Math.round(0.145 * rate);
  const second = Math.round(0.325 * rate);
  const result = context.createBuffer(1, dry.length + second, context.sampleRate);
  const out = result.getChannelData(0);
  out.set(dry);
  const damping = 1 - Math.exp(-2 * Math.PI * 850 / rate);
  let dark = 0;
  for (let i = 0; i < dry.length; i++) {
    dark += damping * (dry[i] - dark);
    out[i + first] += 0.24 * dark;
    out[i + second] += 0.10 * dark;
  }
  return result;
}

type Projectile = "beam" | "bolt" | "missiles" | "incoming";

function synthPlayerWeapon(context: AudioContext, kind: "bolt" | "missiles") {
  const cannon = kind === "bolt";
  const duration = cannon ? 0.105 : 0.54;
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(duration * rate), rate);
  const samples = buffer.getChannelData(0);
  let phase = 0, exhaust = 0, held = 0, nextLatch = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    const u = t / duration;
    if (i >= nextLatch) {
      held = Math.round((2 * Math.random() - 1) * 15) / 15;
      nextLatch += rate / 8000;
    }
    if (cannon) {
      phase += 2 * Math.PI * (105 + 180 * Math.exp(-100 * t)) / rate;
      const report = 0.23 * Math.sin(phase) * Math.exp(-38 * t);
      const crack = 0.28 * held * Math.exp(-90 * t);
      samples[i] = (report + crack) * Math.min(1, t / 0.0015, (duration - t) / 0.009);
    } else {
      // The exhaust brightens and the turbine rises under the rushing noise.
      exhaust += (1 - Math.exp(-2 * Math.PI * (450 + 2200 * u) / rate)) * (held - exhaust);
      phase += 2 * Math.PI * (145 + 680 * u) / rate;
      const turbine = 0.055 * (Math.sin(phase) + 0.3 * Math.sin(2 * phase));
      const envelope = Math.min(1, t / 0.035) * (1 - u * u) ** 2;
      samples[i] = envelope * (0.28 * exhaust + turbine);
    }
  }
  return buffer;
}

function synthProjectile(context: AudioContext, kind: Projectile) {
  if (kind === "bolt" || kind === "missiles") return synthPlayerWeapon(context, kind);
  const start = kind === "beam" ? 1650 : 390, end = kind === "beam" ? 520 : 1180;
  const seconds = kind === "beam" ? 0.14 : 0.21, gain = 0.14;
  const buffer = context.createBuffer(1, Math.ceil(seconds * context.sampleRate), context.sampleRate);
  const samples = buffer.getChannelData(0);
  let phase = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / context.sampleRate;
    const progress = i / (samples.length - 1);
    const frequency = start * (end / start) ** progress;
    phase += 2 * Math.PI * frequency / context.sampleRate;
    const tone = Math.sin(phase) + 0.22 * Math.sin(3 * phase);
    const crushed = Math.round(tone * 20) / 20;
    samples[i] = gain * Math.min(t / 0.003, 1) * (1 - progress) ** 2 * crushed;
  }
  return buffer;
}

// Contours adapted from the numbered sound test. One buffer per cue and
// sample rate, generated on first use through the existing sound switch.
const cueProfiles = {
  pickup: { start: 480, end: 960, seconds: 0.34, gain: 0.14, steps: 4, grit: 0 },
  charge: { start: 190, end: 820, seconds: 0.61, gain: 0.15, steps: 0, grit: 0.13 },
  wingCrack: { start: 740, end: 210, seconds: 0.19, gain: 0.28, steps: 0, grit: 0.73 },
  wingBreach: { start: 460, end: 145, seconds: 0.32, gain: 0.29, steps: 3, grit: 0.54 },
  coreRupture: { start: 330, end: 85, seconds: 0.49, gain: 0.30, steps: 0, grit: 0.38 },
  playerHit: { start: 240, end: 95, seconds: 0.17, gain: 0.24, steps: 0, grit: 0.58 },
} as const;

type Cue = keyof typeof cueProfiles;

function synthCue(context: AudioContext, kind: Cue) {
  const { start, end, seconds, gain, steps, grit } = cueProfiles[kind];
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(seconds * rate), rate);
  const samples = buffer.getChannelData(0);
  let phase = 0, noise = 0, nextLatch = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    const u = i / (samples.length - 1);
    const bend = steps ? Math.min(steps - 1, Math.floor(u * steps)) / (steps - 1) : u;
    phase += 2 * Math.PI * start * (end / start) ** bend / rate;
    if (i >= nextLatch) {
      noise = Math.random() * 2 - 1;
      nextLatch += rate / 5500;
    }
    const tone = Math.sin(phase) + 0.2 * Math.sin(phase * 3);
    const body = kind === "charge" ? 0.35 + 0.65 * u : (1 - u) ** 0.75;
    const edge = Math.min(1, t / 0.005, (seconds - t) / 0.022);
    samples[i] = gain * edge * body * (Math.round(22 * tone) / 22 * (1 - grit) + grit * noise);
  }
  return buffer;
}

export class CombatAudio {
  private options = new URLSearchParams(location.search);
  private projectileBuffers = new Map<Projectile, AudioBuffer>();
  private cues = new Map<Cue, AudioBuffer>();
  private context?: AudioContext;
  private buffers = new Map<Hull, AudioBuffer>();
  private enabled = true;
  private output?: GainNode;

  attach(button: HTMLButtonElement) {
    try {
      this.enabled = localStorage.getItem("shmup.muted") !== "true";
    } catch { /* Storage is optional in embedded browsers. */ }

    const sync = () => {
      const playing = this.enabled && this.context?.state === "running";
      button.textContent = !this.enabled ? "Sound off" : playing ? "Sound on" : "Enable sound";
      button.setAttribute("aria-pressed", String(playing));
      if (this.output) this.output.gain.value = Number(this.enabled);
    };
    let primed = false;
    const stateChanged = () => {
      if (this.context?.state !== "running") primed = false;
      sync();
    };
    const unlock = (fromGesture: boolean) => {
      if (!this.enabled) return;
      try {
        if (!this.context) {
          this.context = new AudioContext();
          this.output = this.context.createGain();
          this.output.connect(this.context.destination);
        }
        const context = this.context;
        context.onstatechange = stateChanged;
        if (context.state !== "running") void context.resume().then(sync, sync);
        if (fromGesture && (!primed || context.state !== "running")) {
          // Start a silent source inside the input handler, before the first game tick.
          const source = context.createBufferSource();
          source.buffer = context.createBuffer(1, 1, context.sampleRate);
          source.connect(this.output!);
          source.onended = () => source.disconnect();
          source.start();
          primed = true;
        }
      } catch { /* Retry on the next interaction. */ }
      sync();
    };
    const gesture = (event: Event) => {
      if (event.target !== button && (!primed || this.context?.state !== "running")) unlock(true);
    };
    button.onclick = () => {
      if (this.enabled && this.context?.state !== "running") {
        unlock(true);
        return;
      }
      this.enabled = !this.enabled;
      try { localStorage.setItem("shmup.muted", String(!this.enabled)); } catch {}
      sync();
      unlock(true);
    };
    sync();
    unlock(false);
    const inputs = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
    for (const input of inputs) window.addEventListener(input, gesture, true);
    return () => {
      button.onclick = null;
      if (this.context) this.context.onstatechange = null;
      for (const input of inputs) window.removeEventListener(input, gesture, true);
    };
  }

  projectile(kind: Projectile) {
    const context = this.context;
    if (!this.enabled || context?.state !== "running") return;
    let buffer = this.projectileBuffers.get(kind);
    if (!buffer) {
      buffer = synthProjectile(context, kind);
      this.projectileBuffers.set(kind, buffer);
    }
    this.playBuffer(context, buffer, 1);
  }

  cue(kind: Cue) {
    const context = this.context;
    if (!this.enabled || context?.state !== "running") return;
    let buffer = this.cues.get(kind);
    if (!buffer) {
      buffer = synthCue(context, kind);
      this.cues.set(kind, buffer);
    }
    this.playBuffer(context, buffer, 1);
  }

  explosion(hull: Hull) {
    const context = this.context;
    if (!this.enabled || context?.state !== "running") return;
    const pitch = this.options.get("pitch");
    const rates: Record<string, number> = { "0": 1, "-12": 0.5, "-24": 0.25 };
    const speed = pitch !== null && Object.hasOwn(rates, pitch)
      ? rates[pitch] : hull === "carrier" ? 0.25 : 0.5;
    let buffer = this.buffers.get(hull);
    if (!buffer) {
      buffer = synth(context, hull);
      if (this.options.get("echo") !== "off") buffer = addEcho(context, buffer, speed);
      this.buffers.set(hull, buffer);
    }
    this.playBuffer(context, buffer, speed * (hull === "scout" ? 0.94 + Math.random() * 0.12 : 1));
  }

  private playBuffer(context: AudioContext, buffer: AudioBuffer, speed: number) {
    const hit = context.createBufferSource();
    hit.buffer = buffer;
    hit.playbackRate.value = speed;
    hit.connect(this.output!);
    hit.onended = () => hit.disconnect();
    hit.start();
  }
}
