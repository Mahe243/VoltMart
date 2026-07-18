// Native Web Audio API Synthesizer for VoltMart Storefront
// This operates without any external assets, ensuring 100% load reliability.

let audioCtx: AudioContext | null = null;
let musicInterval: any = null;
let musicNodes: AudioNode[] = [];
let isMusicPlaying = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (required by browsers for user interaction)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play clean click sound (soft bubble pop / electronic chirp)
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Short click chirp
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

// 2. Play beautiful success sound (register chime + cheerful bell)
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Sound 1: High chime
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
  osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
  osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6

  gain1.gain.setValueAtTime(0.1, ctx.currentTime);
  gain1.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.24);
  gain1.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.6);

  // Sound 2: Cash register metallic ring
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
  
  gain2.gain.setValueAtTime(0.0, ctx.currentTime);
  gain2.gain.setValueAtTime(0.03, ctx.currentTime + 0.1);
  gain2.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc2.start(ctx.currentTime + 0.1);
  osc2.stop(ctx.currentTime + 0.35);
}

// 3. Play error / out of stock alert sound
export function playErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

// 4. Cozy Ambient Lofi Shop Music Synthesizer Loop
// Synthesizes soft, gentle chord progressions that repeat in the background.
export function startAmbientMusic() {
  const ctx = getAudioContext();
  if (!ctx || isMusicPlaying) return;

  isMusicPlaying = true;
  
  // Custom synth channel
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.32, ctx.currentTime); // Louder, clearly audible master background gain
  masterGain.connect(ctx.destination);
  musicNodes.push(masterGain);

  // Lowpass filter for cozy warm lofi atmosphere
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(750, ctx.currentTime); // Slightly higher cutoff to make frequencies clearer
  filter.connect(masterGain);
  musicNodes.push(filter);

  // Simple feedback delay node for spacious sound
  const delay = ctx.createDelay();
  delay.delayTime.setValueAtTime(0.4, ctx.currentTime);
  const delayGain = ctx.createGain();
  delayGain.gain.setValueAtTime(0.35, ctx.currentTime);
  
  filter.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(filter); // feedback loop
  musicNodes.push(delay);
  musicNodes.push(delayGain);

  // Soft Chord Progression (Lofi vibe: Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
  const progressions = [
    [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
    [164.81, 196.00, 246.94, 293.66], // Em7 (E3, G3, B3, D4)
    [146.83, 174.61, 220.00, 261.63], // Dm7 (D3, F3, A3, C4)
    [130.81, 164.81, 196.00, 246.94]  // Cmaj7 (C3, E3, G3, B3)
  ];

  let chordIndex = 0;

  const playNextChord = () => {
    if (!isMusicPlaying || !ctx) return;
    
    // Resume context to guard against late browser suspends
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const notes = progressions[chordIndex];
    const chordDuration = 3.5; // seconds per chord
    const time = ctx.currentTime;

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.type = 'sine'; // Sine waves are pure and soft
      osc.frequency.setValueAtTime(freq, time);

      // Slow attack & slow release for warm pad feel
      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(0.18, time + 0.8); // Higher note gain (0.18 instead of 0.04)
      oscGain.gain.setValueAtTime(0.18, time + chordDuration - 0.8);
      oscGain.gain.linearRampToValueAtTime(0.001, time + chordDuration); // fade out

      osc.start(time);
      osc.stop(time + chordDuration);
    });

    chordIndex = (chordIndex + 1) % progressions.length;
  };

  // Play immediately
  playNextChord();
  
  // Set interval to play every 4 seconds
  musicInterval = setInterval(playNextChord, 4000);
}

export function stopAmbientMusic() {
  isMusicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  musicNodes.forEach((node) => {
    try {
      // @ts-ignore
      node.disconnect();
    } catch (e) {}
  });
  musicNodes = [];
}

export function toggleAmbientMusic(): boolean {
  if (isMusicPlaying) {
    stopAmbientMusic();
    return false;
  } else {
    startAmbientMusic();
    return true;
  }
}
