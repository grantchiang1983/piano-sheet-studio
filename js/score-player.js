/**
 * Piano Sheet Studio - Score Player & Practice Guide Engine
 * Controls song playback, BPM tempo timing, metronome, and interactive wait-for-you practice.
 */

class ScorePlayer {
    constructor(audioEngine, pianoView, staffRenderer) {
        this.audio = audioEngine;
        this.piano = pianoView;
        this.staff = staffRenderer;

        this.currentSong = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.isPracticeMode = false;
        this.metronomeEnabled = true;

        this.currentNoteIndex = 0;
        this.bpm = 100;
        this.playbackTimer = null;
        this.metronomeTimer = null;
        this.currentBeatInMeasure = 1;
        this.beatsPerMeasure = 4;

        // Practice stats
        this.practiceStats = {
            totalAttempts: 0,
            correctAttempts: 0,
            streak: 0
        };

        // Event callbacks for UI update
        this.onStateChange = () => {};
        this.onProgress = () => {};
        this.onPracticeFeedback = () => {};
    }

    loadSong(song) {
        this.stop();
        this.currentSong = song;
        this.bpm = song.bpm || 100;
        this.currentNoteIndex = 0;

        const [numBeats] = song.timeSignature.split('/').map(Number);
        this.beatsPerMeasure = numBeats || 4;
        this.currentBeatInMeasure = 1;

        this.staff.setMode('song', song);
        this.staff.setActiveSongNote(0);

        if (this.isPracticeMode) {
            this.setupPracticeNote();
        }

        this.onStateChange({
            isPlaying: false,
            isPaused: false,
            isPracticeMode: this.isPracticeMode,
            currentNoteIndex: 0,
            totalNotes: song.notes.length,
            song
        });
    }

    setBpm(bpm) {
        this.bpm = Math.max(30, Math.min(240, parseInt(bpm, 10)));
    }

    setPracticeMode(enabled) {
        this.isPracticeMode = enabled;
        if (this.isPlaying) {
            this.pause();
        }

        if (this.isPracticeMode) {
            this.setupPracticeNote();
        } else {
            this.piano.clearKeyHints();
        }

        this.onStateChange({
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            isPracticeMode: this.isPracticeMode
        });
    }

    setMetronome(enabled) {
        this.metronomeEnabled = enabled;
    }

    play() {
        if (!this.currentSong) return;
        if (this.isPracticeMode) {
            // In practice mode, "Play" puts focus on waiting for notes
            this.isPlaying = true;
            this.isPaused = false;
            this.setupPracticeNote();
            this.onStateChange({ isPlaying: true, isPaused: false, isPracticeMode: true });
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;

        this.onStateChange({ isPlaying: true, isPaused: false, isPracticeMode: false });
        this.scheduleNextNote();
        this.startMetronome();
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        if (this.playbackTimer) clearTimeout(this.playbackTimer);
        this.stopMetronome();
        this.piano.releaseAllNotes();
        this.onStateChange({ isPlaying: false, isPaused: true });
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentNoteIndex = 0;
        if (this.playbackTimer) clearTimeout(this.playbackTimer);
        this.stopMetronome();
        this.piano.releaseAllNotes();
        this.piano.clearKeyHints();
        this.staff.setActiveSongNote(0);

        this.onStateChange({ isPlaying: false, isPaused: false });
    }

    /**
     * Schedules playback of notes sequentially according to rhythmic duration
     */
    scheduleNextNote() {
        if (!this.isPlaying || !this.currentSong) return;

        if (this.currentNoteIndex >= this.currentSong.notes.length) {
            // Song finished
            this.stop();
            return;
        }

        const note = this.currentSong.notes[this.currentNoteIndex];
        const msPerBeat = 60000 / this.bpm;
        const durationMs = note.duration * msPerBeat;

        // If rest (休止符), do not play audio or press key
        if (note.isRest || note.pitch === 'rest' || !note.midi) {
            this.staff.setActiveSongNote(this.currentNoteIndex);
            this.onProgress(this.currentNoteIndex, this.currentSong.notes.length);
            this.currentNoteIndex++;
            this.playbackTimer = setTimeout(() => {
                this.scheduleNextNote();
            }, durationMs);
            return;
        }

        // Highlight and sound
        const midis = Array.isArray(note.midi) ? note.midi : [note.midi];
        midis.forEach(m => {
            const handColor = m < 60 ? 'left' : (note.hand === 'left' ? 'left' : 'right');
            this.piano.pressKey(m, 0.85, true, handColor);
            this.audio.noteOn(m, 0.85);
        });
        this.staff.setActiveSongNote(this.currentNoteIndex);

        this.onProgress(this.currentNoteIndex, this.currentSong.notes.length);

        // Schedule note release slightly before next note for articulation
        const holdTimeMs = Math.max(100, durationMs * 0.88);
        setTimeout(() => {
            midis.forEach(m => {
                this.piano.releaseKey(m);
                this.audio.noteOff(m);
            });
        }, holdTimeMs);

        // Schedule next note
        this.currentNoteIndex++;
        this.playbackTimer = setTimeout(() => {
            this.scheduleNextNote();
        }, durationMs);
    }

    /**
     * Practice Mode: highlights target note and waits for user action
     */
    setupPracticeNote() {
        if (!this.currentSong) return;

        // Skip rests in practice mode
        while (this.currentNoteIndex < this.currentSong.notes.length && 
               (this.currentSong.notes[this.currentNoteIndex].isRest || !this.currentSong.notes[this.currentNoteIndex].midi)) {
            this.currentNoteIndex++;
        }

        if (this.currentNoteIndex >= this.currentSong.notes.length) {
            this.currentNoteIndex = 0;
            while (this.currentNoteIndex < this.currentSong.notes.length && 
                   (this.currentSong.notes[this.currentNoteIndex].isRest || !this.currentSong.notes[this.currentNoteIndex].midi)) {
                this.currentNoteIndex++;
            }
        }

        const targetNote = this.currentSong.notes[this.currentNoteIndex];
        if (!targetNote) return;

        this.staff.setActiveSongNote(this.currentNoteIndex);
        this.piano.clearKeyHints();
        const midis = Array.isArray(targetNote.midi) ? targetNote.midi : [targetNote.midi];
        midis.forEach(m => {
            this.piano.highlightKeyHint(m, true);
        });

        this.onProgress(this.currentNoteIndex, this.currentSong.notes.length);
    }

    /**
     * Check user played note during Practice Mode
     * @param {number} playedMidi 
     */
    handleUserPlayNote(playedMidi) {
        if (!this.isPracticeMode || !this.currentSong) return;

        const targetNote = this.currentSong.notes[this.currentNoteIndex];
        if (!targetNote) return;

        this.practiceStats.totalAttempts++;

        const isMatch = Array.isArray(targetNote.midi)
            ? targetNote.midi.includes(playedMidi)
            : playedMidi === targetNote.midi;

        if (isMatch) {
            // Correct note hit!
            this.practiceStats.correctAttempts++;
            this.practiceStats.streak++;
            this.audio.playFeedbackChime(true);

            this.onPracticeFeedback({
                correct: true,
                targetMidi: targetNote.midi,
                pitch: targetNote.pitch,
                streak: this.practiceStats.streak
            });

            // Advance to next note
            this.currentNoteIndex++;
            if (this.currentNoteIndex >= this.currentSong.notes.length) {
                // Completed!
                setTimeout(() => {
                    alert(`🎉 恭喜完成練習！\n正確率: ${Math.round((this.practiceStats.correctAttempts / this.practiceStats.totalAttempts) * 100)}%\n最高連擊: ${this.practiceStats.streak}`);
                    this.currentNoteIndex = 0;
                    this.setupPracticeNote();
                }, 400);
            } else {
                setTimeout(() => {
                    this.setupPracticeNote();
                }, 180);
            }
        } else {
            // Incorrect note
            this.practiceStats.streak = 0;
            this.audio.playFeedbackChime(false);
            this.onPracticeFeedback({
                correct: false,
                targetMidi: targetNote.midi,
                playedMidi,
                streak: 0
            });
        }
    }

    /**
     * Metronome Tick Loop
     */
    startMetronome() {
        if (!this.metronomeEnabled) return;
        this.stopMetronome();

        const msPerBeat = 60000 / this.bpm;
        this.currentBeatInMeasure = 1;

        const tick = () => {
            if (!this.isPlaying) return;
            const isAccent = this.currentBeatInMeasure === 1;
            if (this.metronomeEnabled) {
                this.audio.playMetronomeClick(isAccent);
            }

            // Visual pulse on beat indicator
            const beatLed = document.getElementById('metronome-led');
            if (beatLed) {
                beatLed.classList.add(isAccent ? 'accent-pulse' : 'beat-pulse');
                setTimeout(() => {
                    beatLed.classList.remove('accent-pulse', 'beat-pulse');
                }, 120);
            }

            this.currentBeatInMeasure = (this.currentBeatInMeasure % this.beatsPerMeasure) + 1;
            this.metronomeTimer = setTimeout(tick, msPerBeat);
        };

        tick();
    }

    stopMetronome() {
        if (this.metronomeTimer) {
            clearTimeout(this.metronomeTimer);
            this.metronomeTimer = null;
        }
    }
}

window.ScorePlayer = ScorePlayer;
