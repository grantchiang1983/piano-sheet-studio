/**
 * Piano Sheet Studio - Audio Engine
 * High-Fidelity Web Audio Acoustic Piano Synthesizer & Metronome
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.dryGain = null;
        this.wetGain = null;
        this.activeVoices = new Map(); // midiNote -> Voice object
        this.sustainPedal = false;
        this.sustainedNotes = new Set(); // Notes kept ringing by sustain pedal
        this.volume = 0.8;
        this.soundPreset = 'grand'; // 'grand', 'bright', 'warm', 'musicbox'
        this.isInitialized = false;

        // Frequencies for MIDI notes 0 to 127
        this.noteFrequencies = new Float32Array(128);
        for (let i = 0; i < 128; i++) {
            this.noteFrequencies[i] = 440 * Math.pow(2, (i - 69) / 12);
        }
    }

    /**
     * Initialize or resume AudioContext (browser user-gesture requirement)
     */
    async init() {
        if (this.isInitialized && this.ctx) {
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Master Volume
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        // Convolution Reverb for Concert Hall Ambience
        this.createReverb();

        this.masterGain.connect(this.dryGain);
        this.masterGain.connect(this.reverbNode);
        this.reverbNode.connect(this.wetGain);

        this.dryGain.connect(this.ctx.destination);
        this.wetGain.connect(this.ctx.destination);

        this.isInitialized = true;
    }

    /**
     * Algorithmic Impulse Response Reverb Generator
     */
    createReverb() {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 1.8; // 1.8 seconds decay
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (sampleRate * 0.5));
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }

        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = impulse;

        this.dryGain = this.ctx.createGain();
        this.wetGain = this.ctx.createGain();

        this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.wetGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
        }
    }

    setSoundPreset(preset) {
        this.soundPreset = preset;
    }

    setSustain(enabled) {
        this.sustainPedal = enabled;
        if (!enabled) {
            // Release all notes that were held by sustain pedal
            const now = this.ctx ? this.ctx.currentTime : 0;
            for (const midiNote of this.sustainedNotes) {
                const voice = this.activeVoices.get(midiNote);
                if (voice) {
                    this.stopVoice(voice, now);
                    this.activeVoices.delete(midiNote);
                }
            }
            this.sustainedNotes.clear();
        }
    }

    /**
     * Note On with physical harmonic synthesis
     * @param {number} midiNote 
     * @param {number} velocity 0 - 1
     */
    async noteOn(midiNote, velocity = 0.8) {
        if (!this.isInitialized) {
            await this.init();
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // If note is already playing, gracefully terminate old voice
        if (this.activeVoices.has(midiNote)) {
            const oldVoice = this.activeVoices.get(midiNote);
            this.stopVoice(oldVoice, this.ctx.currentTime);
            this.activeVoices.delete(midiNote);
        }

        const freq = this.noteFrequencies[midiNote];
        if (!freq || freq <= 0) return;

        const now = this.ctx.currentTime;
        const voice = this.createPianoVoice(freq, velocity, now);
        this.activeVoices.set(midiNote, voice);
    }

    /**
     * Synthesizes piano acoustics:
     * - Fundamental + harmonic overtone series (1f, 2f, 3f, 4f, 5f, 6f)
     * - Dynamic low-pass filter tracking velocity (hammer velocity changes brightness)
     * - Inharmonic strike burst (hammer knock transient)
     */
    createPianoVoice(freq, velocity, now) {
        const ctx = this.ctx;
        const voiceGain = ctx.createGain();
        voiceGain.connect(this.masterGain);

        // Filter tracking
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        let filterBase = freq * 4;
        let resonance = 1.0;

        if (this.soundPreset === 'bright') {
            filterBase = freq * 6;
            resonance = 1.5;
        } else if (this.soundPreset === 'warm') {
            filterBase = freq * 2.5;
            resonance = 0.5;
        } else if (this.soundPreset === 'musicbox') {
            filterBase = freq * 8;
            resonance = 3.0;
        }

        const cutoff = Math.min(18000, filterBase * (0.6 + velocity * 0.8));
        filter.frequency.setValueAtTime(cutoff, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.3), now + 1.2);
        filter.Q.setValueAtTime(resonance, now);
        filter.connect(voiceGain);

        // Harmonics configuration
        // Piano strings have strong fundamental and decreasing higher harmonics
        const harmonics = [
            { mult: 1.0, gain: 1.0 },
            { mult: 2.001, gain: 0.55 },
            { mult: 3.003, gain: 0.28 },
            { mult: 4.005, gain: 0.16 },
            { mult: 5.01, gain: 0.08 },
            { mult: 6.015, gain: 0.04 }
        ];

        const oscs = [];

        harmonics.forEach(h => {
            const osc = ctx.createOscillator();
            const hGain = ctx.createGain();

            // Slightly warm up waveform
            osc.type = (this.soundPreset === 'musicbox') ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq * h.mult, now);

            // Natural decay: higher harmonics die out significantly faster
            const harmonicDecay = 1.8 / Math.sqrt(h.mult);
            hGain.gain.setValueAtTime(h.gain * velocity, now);
            hGain.gain.exponentialRampToValueAtTime(0.0001, now + harmonicDecay + (this.soundPreset === 'grand' ? 1.5 : 0.8));

            osc.connect(hGain);
            hGain.connect(filter);
            osc.start(now);
            oscs.push(osc);
        });

        // Hammer Strike Transient (short noise/percussive click)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(freq * 0.5, now);
        clickGain.gain.setValueAtTime(velocity * 0.35, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        clickOsc.connect(clickGain);
        clickGain.connect(voiceGain);
        clickOsc.start(now);
        clickOsc.stop(now + 0.04);

        // Overall voice envelope
        const peakGain = 0.5 * velocity;
        voiceGain.gain.setValueAtTime(0.0001, now);
        voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.004); // Instant hammer attack (4ms)
        // Natural sustain curve
        voiceGain.gain.exponentialRampToValueAtTime(peakGain * 0.35, now + 0.4);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        return {
            oscs,
            voiceGain,
            startTime: now,
            freq
        };
    }

    /**
     * Note Off
     */
    noteOff(midiNote) {
        if (!this.activeVoices.has(midiNote)) return;

        if (this.sustainPedal) {
            // Sustain pedal is pressed; mark note as sustained
            this.sustainedNotes.add(midiNote);
            return;
        }

        const voice = this.activeVoices.get(midiNote);
        const now = this.ctx.currentTime;
        this.stopVoice(voice, now);
        this.activeVoices.delete(midiNote);
    }

    stopVoice(voice, time) {
        if (!voice || !voice.voiceGain) return;
        try {
            // Fast damper release (120ms) simulating piano felt dampers touching strings
            voice.voiceGain.gain.cancelScheduledValues(time);
            voice.voiceGain.gain.setValueAtTime(voice.voiceGain.gain.value, time);
            voice.voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

            setTimeout(() => {
                voice.oscs.forEach(osc => {
                    try { osc.stop(); osc.disconnect(); } catch (e) {}
                });
                try { voice.voiceGain.disconnect(); } catch (e) {}
            }, 150);
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Metronome Tick Generator
     * @param {boolean} isAccent First beat of measure
     */
    playMetronomeClick(isAccent = false) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isAccent ? 1600 : 950, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Play praise chime for correct practice note
     */
    playFeedbackChime(correct = true) {
        if (!this.isInitialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(correct ? 880 : 220, now);
        if (correct) {
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        }

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// Global instance export
window.AudioEngine = AudioEngine;
