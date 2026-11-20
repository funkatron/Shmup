// Generate once per ship class. The quick pitch drop gives the impact weight,
// while the saturated body and short noise transient carry on smaller speakers.
export type Hull = "scout" | "raider" | "carrier";
const profiles = {
  scout: { start: 260, end: 82, seconds: 0.15, fragments: 3 },
  raider: { start: 215, end: 66, seconds: 0.22, fragments: 5 },
  carrier: { start: 180, end: 52, seconds: 0.32, fragments: 7 },
};
export function fragments(hull: Hull) { return profiles[hull].fragments; }

function synth(context: AudioContext, hull: Hull) {
  const { start, end, seconds } = profiles[hull];
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(rate * seconds), rate);
  const samples = buffer.getChannelData(0);
  let phase = 0;
  let grit = 0;
  let held = 0;
  let nextLatch = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    const progress = t / seconds;
    phase += 2 * Math.PI * (end + (start - end) * Math.exp(-8 * progress)) / rate;
    grit += (Math.random() * 2 - 1 - grit) * (1 - Math.exp(-14000 / rate));
    const body = Math.tanh(2 * Math.sin(phase) + 0.4 * Math.sin(2 * phase));
    const envelope = Math.min(1, t / 0.002) * (1 - progress) ** 2;
    // Hold at 8 kHz without an anti-alias filter, quantize to 32 levels,
    // then apply the envelope so the last step decays cleanly to silence.
    if (i >= nextLatch) {
      const raw = 0.5 * body + 0.5 * grit * Math.exp(-6 * progress);
      held = Math.round((raw + 1) * 15.5) / 15.5 - 1;
      nextLatch += rate / 8000;
    }
    samples[i] = envelope * (0.16 * body + 0.32 * held);
  }
  return buffer;
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
