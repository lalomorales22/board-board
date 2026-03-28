let audioCtx: AudioContext | null = null;
let flipBuffer: AudioBuffer | null = null;
let lastPlayTime = 0;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();

  const duration = 0.018;
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  flipBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  const data = flipBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const envelope = Math.pow(1 - t, 6);
    const noise = (Math.random() * 2 - 1) * 0.4;
    const thump = Math.sin(2 * Math.PI * 120 * t) * 0.6;
    data[i] = (noise + thump) * envelope;
  }
}

export function playFlipSound(volume: number = 0.3) {
  if (!audioCtx || !flipBuffer) {
    initAudio();
    if (!audioCtx || !flipBuffer) return;
  }

  // Throttle + random skip to avoid audio overload with many tiles
  if (Math.random() > 0.35) return;
  const now = performance.now() / 1000;
  if (now - lastPlayTime < 0.03) return;
  lastPlayTime = now;

  const source = audioCtx.createBufferSource();
  source.buffer = flipBuffer;
  source.playbackRate.value = 0.85 + Math.random() * 0.3;

  const gain = audioCtx.createGain();
  gain.gain.value = volume * (0.7 + Math.random() * 0.3);

  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

export function resumeAudio() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
}
