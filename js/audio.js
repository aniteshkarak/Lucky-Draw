/**
 * Web Audio API Synthesizer for Lucky Draw
 * 100% Procedural Audio - No external audio assets needed!
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.7;
        this.initialized = false;
    }

    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // Wheel tick / ratchet click
    playTick(pitch = 1.0) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(120 * pitch, now + 0.04);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, now);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
    }

    // Mechanical lever pull
    playLever() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Heavy click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        gain.gain.setValueAtTime(0.4 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }

    // Reel stop mechanical thud
    playReelStop(reelIndex = 0) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 220 + (reelIndex * 60);
        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

        gain.gain.setValueAtTime(0.4 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    // Mystery box chime / shimmer
    playBoxOpen() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.06);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.5);
        });
    }

    // Victory Fanfare & Chords
    playFanfare() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Arpeggiated grand major fanfare: C4, G4, C5, E5, G5, C6
        const sequence = [
            { freq: 261.63, time: 0.00, dur: 0.15 }, // C4
            { freq: 329.63, time: 0.12, dur: 0.15 }, // E4
            { freq: 392.00, time: 0.24, dur: 0.18 }, // G4
            { freq: 523.25, time: 0.38, dur: 0.22 }, // C5
            { freq: 659.25, time: 0.52, dur: 0.25 }, // E5
            { freq: 783.99, time: 0.68, dur: 0.30 }, // G5
            { freq: 1046.50, time: 0.90, dur: 1.20 } // C6 (sustained climax)
        ];

        sequence.forEach(item => {
            const now = this.ctx.currentTime + item.time;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'triangle';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(item.freq, now);
            osc2.frequency.setValueAtTime(item.freq * 1.003, now); // slight detune for richness

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + item.dur);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + item.dur + 0.05);
            osc2.stop(now + item.dur + 0.05);
        });

        // Add sparkling bells on final note
        for (let i = 0; i < 5; i++) {
            const bellNow = this.ctx.currentTime + 1.0 + (i * 0.12);
            const bellOsc = this.ctx.createOscillator();
            const bellGain = this.ctx.createGain();
            bellOsc.type = 'sine';
            bellOsc.frequency.setValueAtTime(1567.98 + (i * 200), bellNow);

            bellGain.gain.setValueAtTime(0.2 * this.volume, bellNow);
            bellGain.gain.exponentialRampToValueAtTime(0.001, bellNow + 0.3);

            bellOsc.connect(bellGain);
            bellGain.connect(this.ctx.destination);
            bellOsc.start(bellNow);
            bellOsc.stop(bellNow + 0.32);
        }
    }

    // Jackpot Bell Cascade
    playJackpot() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const baseFrequencies = [587.33, 739.99, 880.00, 1174.66, 1479.98];
        for (let i = 0; i < 12; i++) {
            const noteIdx = i % baseFrequencies.length;
            const now = this.ctx.currentTime + (i * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFrequencies[noteIdx], now);

            gain.gain.setValueAtTime(0.25 * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        }
    }

    // Tactile UI click
    playClick() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
    }

    // Rapid draw beep
    playBeep(freq = 440) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }
}

window.soundEngine = new SoundEngine();
