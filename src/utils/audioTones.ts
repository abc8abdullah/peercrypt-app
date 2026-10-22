/**
 * Web Audio API synthesizer for call ringtones & alert chimes.
 * Requires 0 external MP3 files and works 100% offline.
 */

let audioCtx: AudioContext | null = null;
let activeRingInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMessageSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.debug('Audio playback blocked or unavailable:', e);
  }
}

export function startIncomingRingtone(): () => void {
  stopRingtone();
  try {
    const ctx = getAudioContext();

    const ring = () => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz
      osc2.frequency.setValueAtTime(480, ctx.currentTime); // 480Hz

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    };

    ring();
    activeRingInterval = window.setInterval(ring, 2500);
  } catch (e) {
    console.debug('Ringtone blocked:', e);
  }

  return stopRingtone;
}

export function startOutgoingRing(): () => void {
  stopRingtone();
  try {
    const ctx = getAudioContext();

    const ring = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(425, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    };

    ring();
    activeRingInterval = window.setInterval(ring, 3000);
  } catch (e) {
    console.debug('Outgoing ring blocked:', e);
  }

  return stopRingtone;
}

export function stopRingtone() {
  if (activeRingInterval) {
    clearInterval(activeRingInterval);
    activeRingInterval = null;
  }
}
