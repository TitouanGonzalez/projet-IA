// Musique d'ambiance rétro-futuriste, générée par Web Audio : aucun fichier audio,
// donc aucun droit d'auteur à gérer. Elle ne démarre qu'après un geste de l'utilisateur.
export interface Soundtrack {
  readonly on: boolean;
  setOn(on: boolean): void;
  stop(): void;
}

const SCALE = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63];
const STEP = 60 / 78 / 2; // croches à 78 battements par minute

export function createSoundtrack(): Soundtrack | null {
  const Ctx: typeof AudioContext | undefined =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  master.connect(limiter).connect(ctx.destination);

  // Réverbération : un bruit qui s'éteint, utilisé comme réponse impulsionnelle.
  const length = Math.floor(ctx.sampleRate * 2.6);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse;
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.55;
  reverb.connect(reverbGain).connect(master);

  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  delay.connect(feedback).connect(delay);
  delay.connect(reverb);
  delay.connect(master);

  // Nappe grave : trois dents de scie légèrement désaccordées, filtre qui respire.
  const drone = ctx.createGain();
  drone.gain.value = 0.16;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  filter.Q.value = 4;
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfo.frequency.value = 0.06;
  lfoDepth.gain.value = 170;
  lfo.connect(lfoDepth).connect(filter.frequency);
  for (const f of [55, 55.35, 82.4]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(filter);
    o.start();
  }
  filter.connect(drone).connect(master);
  drone.connect(reverb);
  lfo.start();

  // Arpège clairsemé, qui rebondit dans le delay.
  let next = ctx.currentTime + 0.2;
  let n = 0;
  const pattern = [0, 4, 2, 5, 3, 6, 2, 7, 4, 8, 3, 5];
  const note = (time: number, freq: number, vol: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
    o.connect(g);
    g.connect(master);
    g.connect(delay);
    o.start(time);
    o.stop(time + 0.6);
  };
  const timer = window.setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      if (n % 2 === 0 || Math.random() < 0.35)
        note(next, SCALE[pattern[n % pattern.length]] * 2, 0.07);
      if (n % 24 === 0) note(next, SCALE[0], 0.12);
      next += STEP;
      n++;
    }
  }, 60);

  let on = false;
  return {
    get on() {
      return on;
    },
    setOn(value: boolean) {
      on = value;
      if (value && ctx.state === 'suspended') void ctx.resume();
      master.gain.setTargetAtTime(value ? 0.5 : 0, ctx.currentTime, 0.4);
    },
    stop() {
      window.clearInterval(timer);
      void ctx.close();
    },
  };
}
