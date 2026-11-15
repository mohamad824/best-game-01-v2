// Tiny WebAudio sound effects, made from oscillators — no audio files.
export function createSfx() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }
  function blip(freq, dur, type, gain) {
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.06, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch {
      // Sound is garnish; a blocked AudioContext must never break the game.
    }
  }
  return {
    play(name) {
      if (muted) return;
      if (name === 'shoot') blip(720, 0.07, 'triangle', 0.03);
      else if (name === 'thump') blip(160, 0.16, 'sine', 0.09);
      else if (name === 'build') { blip(320, 0.1, 'square', 0.05); blip(480, 0.12, 'square', 0.04); }
      else if (name === 'coin') blip(990, 0.08, 'sine', 0.04);
      else if (name === 'wave') { blip(392, 0.14, 'triangle', 0.06); blip(523, 0.2, 'triangle', 0.06); }
      else if (name === 'win') { blip(523, 0.2, 'triangle', 0.07); blip(659, 0.2, 'triangle', 0.07); blip(784, 0.35, 'triangle', 0.07); }
      else if (name === 'lose') { blip(220, 0.3, 'sawtooth', 0.05); blip(165, 0.45, 'sawtooth', 0.05); }
      else if (name === 'wind') blip(880, 0.18, 'sine', 0.05);
      else if (name === 'error') blip(140, 0.15, 'square', 0.05);
    },
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
  };
}
