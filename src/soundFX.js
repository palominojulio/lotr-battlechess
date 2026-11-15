const MIDI_NOTES = {
  G2: 98.00, Bb2: 116.54, C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00,
  D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, C6: 1046.50
};

// Iconic Star Wars MIDI Sequences: [noteName, beats, bassNote]
const STAR_WARS_TRACKS = [
  {
    name: 'Marcha Imperial (MIDI)',
    bpm: 108,
    notes: [
      ['G4', 1, 'G2'], ['G4', 1, 'G2'], ['G4', 1, 'G2'], ['Eb4', 0.75, 'Eb3'], ['Bb4', 0.25, null],
      ['G4', 1, 'G2'], ['Eb4', 0.75, 'Eb3'], ['Bb4', 0.25, null], ['G4', 2, 'G2'],
      ['D5', 1, 'G2'], ['D5', 1, 'G2'], ['D5', 1, 'G2'], ['Eb5', 0.75, 'Eb3'], ['Bb4', 0.25, null],
      ['Fs4', 1, 'D3'], ['Eb4', 0.75, 'Eb3'], ['Bb4', 0.25, null], ['G4', 2, 'G2'],
      ['G5', 1, 'G3'], ['G4', 0.75, 'G2'], ['G4', 0.25, null], ['G5', 1, 'G3'], ['Fs5', 0.75, 'D3'], ['F5', 0.25, null],
      ['E5', 0.25, 'C3'], ['Eb5', 0.25, null], ['E5', 0.5, null], [null, 0.5, null], ['Ab4', 0.5, 'Eb3'], ['Cs5', 1, 'C3'], ['C5', 0.75, null], ['B4', 0.25, null],
      ['Bb4', 0.25, 'G2'], ['A4', 0.25, null], ['Bb4', 0.5, null], [null, 0.5, null], ['Eb4', 0.5, 'Eb3'], ['Fs4', 1, 'D3'], ['Eb4', 0.75, 'Eb3'], ['Fs4', 0.25, null],
      ['Bb4', 1, 'G2'], ['G4', 0.75, 'Eb3'], ['Bb4', 0.25, null], ['D5', 2, 'G2']
    ]
  },
  {
    name: 'Tema Principal Star Wars (MIDI)',
    bpm: 120,
    notes: [
      ['G4', 0.33, 'C3'], ['G4', 0.33, null], ['G4', 0.34, null],
      ['C5', 2, 'C3'], ['G5', 2, 'G3'],
      ['F5', 0.33, 'F3'], ['E5', 0.33, null], ['D5', 0.34, null], ['C6', 2, 'C3'], ['G5', 1, 'G3'],
      ['F5', 0.33, 'F3'], ['E5', 0.33, null], ['D5', 0.34, null], ['C6', 2, 'C3'], ['G5', 1, 'G3'],
      ['F5', 0.33, 'F3'], ['E5', 0.33, null], ['F5', 0.34, null], ['D5', 2, 'G2'], [null, 1, null]
    ]
  },
  {
    name: 'Duel of the Fates (MIDI)',
    bpm: 144,
    notes: [
      ['E4', 0.5, 'E3'], ['Fs4', 0.5, null], ['G4', 0.5, 'E3'], ['Fs4', 0.5, null], ['D4', 1, 'D3'], [null, 1, 'E3'],
      ['E4', 0.5, 'E3'], ['Fs4', 0.5, null], ['G4', 0.5, 'E3'], ['Fs4', 0.5, null], ['D4', 0.5, 'D3'], ['E4', 0.5, null], ['B4', 1, 'G2'],
      ['E4', 0.5, 'E3'], ['Fs4', 0.5, null], ['G4', 0.5, 'E3'], ['Fs4', 0.5, null], ['D4', 1, 'D3'], [null, 1, 'E3'],
      ['G5', 1.5, 'C3'], ['D5', 1.5, 'D3'], ['E5', 2, 'E3']
    ]
  }
];

class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.musicPlaying = false;
    this.trackIndex = 0;
    this.noteIndex = 0;
    this.musicTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }

  startMusic() {
    if (!this.enabled) return false;
    this.init();
    if (!this.ctx) return false;
    if (this.musicPlaying) return true;
    this.musicPlaying = true;
    this.noteIndex = 0;
    this.scheduleNextMidiNote();
    return true;
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic() {
    if (this.musicPlaying) {
      this.stopMusic();
      return { playing: false, trackName: STAR_WARS_TRACKS[this.trackIndex].name };
    } else {
      this.enabled = true;
      this.startMusic();
      return { playing: true, trackName: STAR_WARS_TRACKS[this.trackIndex].name };
    }
  }

  nextTrack() {
    this.trackIndex = (this.trackIndex + 1) % STAR_WARS_TRACKS.length;
    this.noteIndex = 0;
    if (!this.musicPlaying) {
      this.startMusic();
    }
    return STAR_WARS_TRACKS[this.trackIndex].name;
  }

  scheduleNextMidiNote() {
    if (!this.musicPlaying || !this.enabled || !this.ctx) return;

    const track = STAR_WARS_TRACKS[this.trackIndex];
    const [noteName, beats, bassName] = track.notes[this.noteIndex];
    const beatSec = 60 / track.bpm;
    const durSec = beats * beatSec;
    const now = this.ctx.currentTime;

    // 1. Lead MIDI Brass / Chiptune Voice (Square + Sawtooth detuned)
    if (noteName && MIDI_NOTES[noteName]) {
      const freq = MIDI_NOTES[noteName];
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.004, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2100, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.032, now + durSec * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durSec * 0.94);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durSec * 0.95);
      osc2.stop(now + durSec * 0.95);
    }

    // 2. MIDI Bass Accompaniment Voice
    if (bassName && MIDI_NOTES[bassName]) {
      const bFreq = MIDI_NOTES[bassName];
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, now);

      bGain.gain.setValueAtTime(0.065, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(durSec, 0.38));

      bOsc.connect(bGain);
      bGain.connect(this.ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + Math.min(durSec, 0.4));
    }

    this.noteIndex = (this.noteIndex + 1) % track.notes.length;
    this.musicTimer = setTimeout(() => this.scheduleNextMidiNote(), durSec * 1000);
  }

  playSelect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Lightsaber quick ignition hum ("Kshhh-vwoom")
    this.playSaberIgnite();
  }

  playSaberIgnite() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const hum1 = this.ctx.createOscillator();
    const hum2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    hum1.type = 'sawtooth';
    hum2.type = 'triangle';
    hum1.frequency.setValueAtTime(95, now);
    hum1.frequency.exponentialRampToValueAtTime(148, now + 0.12);
    hum1.frequency.exponentialRampToValueAtTime(118, now + 0.32);

    hum2.frequency.setValueAtTime(190, now);
    hum2.frequency.exponentialRampToValueAtTime(295, now + 0.12);
    hum2.frequency.exponentialRampToValueAtTime(236, now + 0.32);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    hum1.connect(gain);
    hum2.connect(gain);
    gain.connect(this.ctx.destination);
    hum1.start(now);
    hum2.start(now);
    hum1.stop(now + 0.35);
    hum2.stop(now + 0.35);
  }

  playSaberSwing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    oscSub.type = 'sine';
    // Classic Doppler lightsaber whoosh ("Vwooooom")
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(88, now + 0.26);

    oscSub.frequency.setValueAtTime(58, now);
    oscSub.frequency.exponentialRampToValueAtTime(120, now + 0.11);
    oscSub.frequency.exponentialRampToValueAtTime(44, now + 0.26);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

    osc.connect(gain);
    oscSub.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    oscSub.start(now);
    osc.stop(now + 0.28);
    oscSub.stop(now + 0.28);
  }

  playStep(isMecha = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isMecha) {
      // Robotic servo + heavy metallic stomp
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.11);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSwordClash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Lightsaber plasma crackle + metallic clash ("KZZZ-CLANG!")
    const freqs = [920, 1480, 2240, 180];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 0.26);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  playLaserShot() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1250, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMagicBlast() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);

    osc2.frequency.setValueAtTime(520, now);
    osc2.frequency.exponentialRampToValueAtTime(1520, now + 0.24);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.46);
    osc2.stop(now + 0.46);
  }

  playHeavySmash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.45);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  playDefeatShatter() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Plasma cauterize + armor shatter noise burst
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.14));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    this.playHeavySmash();
  }

  playHornFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}

export const soundFX = new SoundFX();
