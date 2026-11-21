// Generate one impact per hull and cache it for successive hits.
export type Hull = "scout" | "raider" | "carrier";
const profiles = {
  scout: { start: 108, end: 82, seconds: 0.17, decay: 0.48, fragments: 3 },
  raider: { start: 88, end: 66, seconds: 0.25, decay: 0.78, fragments: 5 },
  carrier: { start: 70, end: 52, seconds: 0.39, decay: 1.25, fragments: 7 },
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
    // A second, rougher knock lands as the first fracture subsides.
    const knockTime = t - seconds * 0.24;
    const knock = knockTime < 0 ? 0 :
      Math.min(1, knockTime / 0.006) * Math.exp(-knockTime / (seconds * 0.17));
    const envelope = Math.min(1, t / 0.002) * (1 - progress) ** 2;
    // Hold at 8 kHz without an anti-alias filter, quantize to 32 levels,
    // then apply the envelope so the last step decays cleanly to silence.
    if (i >= nextLatch) {
      const noise = Math.random() * 2 - 1;
      rubble += 0.18 * (noise - rubble);
      const raw = Math.tanh(2.8 * rubble + 0.55 * noise * Math.exp(-9 * progress));
      held = Math.round((raw + 1) * 15.5) / 15.5 - 1;
      nextLatch += rate / 8000;
    }
    const aftershock = Math.sin(2 * Math.PI * end * 0.86 * knockTime);
    samples[i] = envelope * (0.21 * body + 0.31 * held + knock * (0.19 * aftershock + 0.16 * held));
  }
  reverberate(samples, dryLength, rate, decay);
  return buffer;
}

// Four unequal reflection paths scatter the hit back into the canyon.
// Bake the return once per hull. The earliest reflection arrives after the attack.
function reverberate(samples: Float32Array, dryLength: number, rate: number, decay: number) {
  const paths = [0.0297, 0.0371, 0.0437, 0.0531].map(seconds => ({
    line: new Float32Array(Math.round(rate * seconds)),
    feedback: 10 ** (-3 * seconds / decay),
    index: 0, damped: 0,
  }));
  const damping = 1 - Math.exp(-2 * Math.PI * 2600 / rate);
  for (let i = 0; i < samples.length; i++) {
    const dry = i < dryLength ? samples[i] : 0;
    let sum = 0;
    for (const path of paths) {
      path.damped += damping * (path.line[path.index] - path.damped);
      sum += path.damped;
    }
    // Householder reflection mixes the four returns without adding energy.
    for (const path of paths) {
      path.line[path.index] = dry + path.feedback * (path.damped - 0.5 * sum);
      if (++path.index === path.line.length) path.index = 0;
    }
    const fade = Math.min(1, (samples.length - 1 - i) / (rate * 0.015));
    samples[i] += 0.34 * (paths[0].damped + paths[1].damped - paths[2].damped + paths[3].damped) * fade;
  }
}

export class ImpactAudio {
  private context?: AudioContext;
  private buffers = new Map<Hull, AudioBuffer>();
  private enabled = false;

  async toggle() {
    const button = document.querySelector<HTMLButtonElement>("#sound")!;
    button.disabled = true;
    try {
      this.context ??= new AudioContext();
      if (this.enabled && this.context.state === "running") {
        await this.context.suspend();
        this.enabled = false;
      } else {
        await this.context.resume();
        this.enabled = true;
      }
      button.textContent = this.enabled ? "Sound on" : "Sound off";
      button.setAttribute("aria-pressed", String(this.enabled));
    } catch {
      button.textContent = "Retry sound";
    } finally {
      button.disabled = false;
    }
  }

  play(hull: Hull) {
    const context = this.context;
    if (!this.enabled || context?.state !== "running") return;
    const buffer = this.buffers.get(hull) ?? synth(context, hull);
    this.buffers.set(hull, buffer);
    const hit = context.createBufferSource();
    hit.buffer = buffer;
    hit.connect(context.destination);
    hit.onended = () => hit.disconnect();
    hit.start();
  }
}
