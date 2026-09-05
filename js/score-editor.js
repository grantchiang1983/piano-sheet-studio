/**
 * Piano Sheet Studio - Score Editor Engine
 * Interactive WYSIWYG score modifying, chord building, note operations, and persistence.
 */

class ScoreEditor {
    constructor(audioEngine, pianoView, staffRenderer, scorePlayer) {
        this.audio = audioEngine;
        this.piano = pianoView;
        this.staff = staffRenderer;
        this.player = scorePlayer;

        this.currentSong = null;
        this.selectedIndex = -1;
        this.isChordMode = false;
        this.isActive = false;

        // Custom scores storage key
        this.STORAGE_KEY = 'piano_sheet_custom_scores_v1';

        this.onSongUpdated = () => {};

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Staff note click listener
        this.staff.onNoteClick = (index) => {
            if (this.isActive) {
                this.selectNote(index);
            }
        };

        // Duration Buttons
        document.querySelectorAll('.editor-duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isActive || this.selectedIndex < 0) return;
                const dur = parseFloat(btn.dataset.duration);
                if (!isNaN(dur)) {
                    this.setDuration(dur);
                }
            });
        });

        // Toggle Rest
        const restBtn = document.getElementById('editor-toggle-rest-btn');
        if (restBtn) {
            restBtn.addEventListener('click', () => {
                if (!this.isActive || this.selectedIndex < 0) return;
                this.toggleRest();
            });
        }

        // Clef Buttons
        const trebleBtn = document.getElementById('editor-clef-treble-btn');
        const bassBtn = document.getElementById('editor-clef-bass-btn');
        const bothBtn = document.getElementById('editor-clef-both-btn');

        if (trebleBtn) trebleBtn.addEventListener('click', () => this.setClef('treble'));
        if (bassBtn) bassBtn.addEventListener('click', () => this.setClef('bass'));
        if (bothBtn) bothBtn.addEventListener('click', () => this.setClef('both'));

        // Pitch & Tuning Buttons
        const upBtn = document.getElementById('editor-semitone-up-btn');
        const downBtn = document.getElementById('editor-semitone-down-btn');
        const sharpBtn = document.getElementById('editor-acc-sharp-btn');
        const flatBtn = document.getElementById('editor-acc-flat-btn');
        const natBtn = document.getElementById('editor-acc-nat-btn');

        if (upBtn) upBtn.addEventListener('click', () => this.transposeSelected(1));
        if (downBtn) downBtn.addEventListener('click', () => this.transposeSelected(-1));
        if (sharpBtn) sharpBtn.addEventListener('click', () => this.toggleAccidental('♯'));
        if (flatBtn) flatBtn.addEventListener('click', () => this.toggleAccidental('♭'));
        if (natBtn) natBtn.addEventListener('click', () => this.toggleAccidental('♮'));

        // Articulations
        const tenutoBtn = document.getElementById('editor-tenuto-btn');
        const accentBtn = document.getElementById('editor-accent-btn');
        const tieBtn = document.getElementById('editor-tie-btn');

        if (tenutoBtn) tenutoBtn.addEventListener('click', () => this.toggleArtic('tenuto'));
        if (accentBtn) accentBtn.addEventListener('click', () => this.toggleArtic('accent'));
        if (tieBtn) tieBtn.addEventListener('click', () => this.toggleArtic('tied'));

        // Chord Mode Toggle
        const chordModeBtn = document.getElementById('editor-chord-mode-btn');
        if (chordModeBtn) {
            chordModeBtn.addEventListener('click', () => {
                this.isChordMode = !this.isChordMode;
                chordModeBtn.classList.toggle('active-gold', this.isChordMode);
                chordModeBtn.textContent = this.isChordMode ? '🎹 和弦堆疊: ON' : '🎹 和弦堆疊: OFF';
                this.updateNoteInfoBadge();
            });
        }

        // Navigation
        const prevBtn = document.getElementById('editor-prev-note-btn');
        const nextBtn = document.getElementById('editor-next-note-btn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateNote(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateNote(1));

        // Structure
        const insertBeforeBtn = document.getElementById('editor-insert-before-btn');
        const insertAfterBtn = document.getElementById('editor-insert-after-btn');
        const deleteBtn = document.getElementById('editor-delete-note-btn');

        if (insertBeforeBtn) insertBeforeBtn.addEventListener('click', () => this.insertNote('before'));
        if (insertAfterBtn) insertAfterBtn.addEventListener('click', () => this.insertNote('after'));
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteNote());

        // Global Operations
        const metaBtn = document.getElementById('editor-meta-btn');
        const newScoreBtn = document.getElementById('editor-new-score-btn');
        const saveBtn = document.getElementById('editor-save-btn');
        const exportBtn = document.getElementById('editor-export-btn');
        const importBtn = document.getElementById('editor-import-btn');
        const resetBtn = document.getElementById('editor-reset-btn');
        const importInput = document.getElementById('score-import-input');

        if (metaBtn) metaBtn.addEventListener('click', () => this.openMetaModal());
        if (newScoreBtn) newScoreBtn.addEventListener('click', () => this.openNewScoreModal());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveToStorage());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportSongJson());
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.importSongJson(e.target.files[0]);
                    importInput.value = '';
                }
            });
        }
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetCurrentSong());

        // Modals Event Binding
        this.bindModalEvents();

        // Keyboard navigation & shortcuts in editor mode
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigateNote(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateNote(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.transposeSelected(e.shiftKey ? 12 : 1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.transposeSelected(e.shiftKey ? -12 : -1);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.deleteNote();
            } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
                this.toggleRest();
            }
        });
    }

    bindModalEvents() {
        // Meta Modal
        const metaModal = document.getElementById('song-meta-modal');
        const closeMetaBtn = document.getElementById('close-meta-modal-btn');
        const cancelMetaBtn = document.getElementById('cancel-meta-btn');
        const saveMetaBtn = document.getElementById('save-meta-btn');

        const closeMeta = () => metaModal && metaModal.classList.add('hidden');
        if (closeMetaBtn) closeMetaBtn.addEventListener('click', closeMeta);
        if (cancelMetaBtn) cancelMetaBtn.addEventListener('click', closeMeta);

        if (saveMetaBtn) {
            saveMetaBtn.addEventListener('click', () => {
                if (!this.currentSong) return;
                const title = document.getElementById('meta-title').value.trim();
                if (!title) {
                    alert('請輸入樂曲名稱！');
                    return;
                }
                this.currentSong.title = title;
                this.currentSong.composer = document.getElementById('meta-composer').value.trim() || '自訂編曲';
                this.currentSong.key = document.getElementById('meta-key').value;
                this.currentSong.timeSignature = document.getElementById('meta-time-sig').value;
                this.currentSong.bpm = parseInt(document.getElementById('meta-bpm').value, 10) || 100;
                this.currentSong.description = document.getElementById('meta-desc').value.trim();

                this.recalculateMeasures();
                this.staff.setMode('editor', this.currentSong);
                this.selectNote(this.selectedIndex);
                this.saveToStorage(false); // auto-save
                this.onSongUpdated(this.currentSong);
                closeMeta();
                alert(`✅ 已成功更新「${title}」的調號、拍號與樂譜屬性！`);
            });
        }

        // New Score Modal
        const newModal = document.getElementById('new-score-modal');
        const closeNewBtn = document.getElementById('close-new-score-btn');
        const cancelNewBtn = document.getElementById('cancel-new-score-btn');
        const confirmNewBtn = document.getElementById('confirm-new-score-btn');

        const closeNew = () => newModal && newModal.classList.add('hidden');
        if (closeNewBtn) closeNewBtn.addEventListener('click', closeNew);
        if (cancelNewBtn) cancelNewBtn.addEventListener('click', closeNew);

        if (confirmNewBtn) {
            confirmNewBtn.addEventListener('click', () => {
                const title = document.getElementById('new-score-title').value.trim() || '我的全新鋼琴自創曲';
                const key = document.getElementById('new-score-key').value;
                const timeSig = document.getElementById('new-score-time-sig').value;
                const measures = parseInt(document.getElementById('new-score-measures').value, 10) || 4;

                this.createNewBlankScore(title, key, timeSig, measures);
                closeNew();
            });
        }
    }

    /**
     * Activates the Score Editor for the given song
     */
    activate(song) {
        this.isActive = true;
        this.currentSong = song;

        const toolbar = document.getElementById('editor-toolbar-section');
        if (toolbar) toolbar.classList.remove('hidden');

        // Render in editor mode
        this.staff.setMode('editor', this.currentSong);

        // Select first note by default
        this.selectNote(0);
    }

    /**
     * Deactivates the Score Editor
     */
    deactivate() {
        this.isActive = false;
        const toolbar = document.getElementById('editor-toolbar-section');
        if (toolbar) toolbar.classList.add('hidden');
        this.staff.setEditorSelectedNote(-1);
    }

    /**
     * Selects a note by index and updates UI
     */
    selectNote(index) {
        if (!this.currentSong || !this.currentSong.notes || this.currentSong.notes.length === 0) {
            this.selectedIndex = -1;
            this.updateNoteInfoBadge();
            return;
        }

        this.selectedIndex = Math.max(0, Math.min(this.currentSong.notes.length - 1, index));
        const note = this.currentSong.notes[this.selectedIndex];

        // Notify staff renderer to highlight
        this.staff.setEditorSelectedNote(this.selectedIndex);

        // Auditory preview & highlight keys on virtual piano
        this.previewNote(note);

        // Update toolbar controls
        this.updateToolbarForNote(note);
    }

    navigateNote(direction) {
        if (!this.currentSong) return;
        const newIdx = this.selectedIndex + direction;
        if (newIdx >= 0 && newIdx < this.currentSong.notes.length) {
            this.selectNote(newIdx);
        }
    }

    /**
     * Plays brief auditory sound & lights keys on piano view
     */
    previewNote(note) {
        if (!note || note.isRest || !note.midi) {
            this.piano.clearKeyHints();
            return;
        }

        this.piano.releaseAllNotes();
        const midis = Array.isArray(note.midi) ? note.midi : [note.midi];
        midis.forEach(m => {
            const handColor = m < 60 ? 'left' : (note.hand === 'left' ? 'left' : 'right');
            this.piano.pressKey(m, 0.85, true, handColor);
            this.audio.noteOn(m, 0.85);
        });

        setTimeout(() => {
            midis.forEach(m => {
                this.piano.releaseKey(m);
                this.audio.noteOff(m);
            });
        }, 280);
    }

    /**
     * Updates toolbar button states according to selected note
     */
    updateToolbarForNote(note) {
        // Duration buttons
        document.querySelectorAll('.editor-duration-btn').forEach(btn => {
            const dur = parseFloat(btn.dataset.duration);
            btn.classList.toggle('active', !note.isRest && dur === note.duration);
        });

        // Rest button
        const restBtn = document.getElementById('editor-toggle-rest-btn');
        if (restBtn) {
            restBtn.classList.toggle('active', !!note.isRest);
        }

        // Clef buttons
        const trebleBtn = document.getElementById('editor-clef-treble-btn');
        const bassBtn = document.getElementById('editor-clef-bass-btn');
        const bothBtn = document.getElementById('editor-clef-both-btn');
        if (trebleBtn) trebleBtn.classList.toggle('active', note.clef === 'treble');
        if (bassBtn) bassBtn.classList.toggle('active', note.clef === 'bass');
        if (bothBtn) bothBtn.classList.toggle('active', note.hand === 'both' || note.clef === 'both');

        // Articulations
        const tenutoBtn = document.getElementById('editor-tenuto-btn');
        const accentBtn = document.getElementById('editor-accent-btn');
        const tieBtn = document.getElementById('editor-tie-btn');
        if (tenutoBtn) tenutoBtn.classList.toggle('active', !!note.tenuto);
        if (accentBtn) accentBtn.classList.toggle('active', !!note.accent);
        if (tieBtn) tieBtn.classList.toggle('active', !!note.tied);

        this.updateNoteInfoBadge();
    }

    updateNoteInfoBadge() {
        const badge = document.getElementById('editor-note-info-text');
        if (!badge) return;

        if (!this.currentSong || this.selectedIndex < 0 || !this.currentSong.notes[this.selectedIndex]) {
            badge.textContent = '未選取音符 (請點擊五線譜上的任一音符)';
            return;
        }

        const note = this.currentSong.notes[this.selectedIndex];
        const total = this.currentSong.notes.length;
        const durMap = { 4: '全音符 (4拍)', 2: '二分音符 (2拍)', 1: '四分音符 (1拍)', 0.5: '八分音符 (半拍)', 0.25: '十六分音符 (1/4拍)' };
        const durText = durMap[note.duration] || `${note.duration} 拍`;
        const clefText = note.clef === 'bass' ? '𝄢 低音譜' : '𝄞 高音譜';

        let pitchText = '';
        if (note.isRest || !note.midi) {
            pitchText = '𝄽 休止符';
        } else if (Array.isArray(note.midi) && note.midi.length > 1) {
            pitchText = `和弦 [${note.chord ? note.chord.join(', ') : note.midi.join(', ')}] (${note.pitch || 'Chord'})`;
        } else {
            const m = Array.isArray(note.midi) ? note.midi[0] : note.midi;
            const info = this.staff.midiToNoteInfo(m);
            pitchText = `${info.name} (${info.solfege})`;
        }

        const modeHint = this.isChordMode ? ' [⚡和弦堆疊模式 ON]' : '';
        badge.innerHTML = `第 <strong>${this.selectedIndex + 1}/${total}</strong> 音 | 小節 <strong>m.${note.measure || 1}</strong> | <strong>${pitchText}</strong> | ${durText} | ${clefText}${modeHint}`;
    }

    /**
     * User pressed a key on virtual piano, QWERTY, or USB MIDI
     */
    handlePianoKeyPress(midi) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note) return;

        const info = this.staff.midiToNoteInfo(midi);

        if (this.isChordMode) {
            // Chord mode: stack or remove note from chord
            let currentMidis = [];
            if (Array.isArray(note.midi)) {
                currentMidis = [...note.midi];
            } else if (note.midi) {
                currentMidis = [note.midi];
            }

            if (currentMidis.includes(midi)) {
                // If note already present in chord and more than 1 note exists, toggle it off
                if (currentMidis.length > 1) {
                    currentMidis = currentMidis.filter(m => m !== midi);
                }
            } else {
                currentMidis.push(midi);
            }

            currentMidis.sort((a, b) => a - b);
            note.midi = currentMidis;
            note.chord = currentMidis.map(m => this.staff.midiToNoteInfo(m).name);
            note.isRest = false;

            // Determine pitch label
            if (currentMidis.length === 1) {
                note.pitch = this.staff.midiToNoteInfo(currentMidis[0]).name;
            } else {
                note.pitch = this.analyzeChordName(currentMidis);
            }

            // If chord spans both treble & bass, set hand to both
            const hasBass = currentMidis.some(m => m < 60);
            const hasTreble = currentMidis.some(m => m >= 60);
            if (hasBass && hasTreble) {
                note.hand = 'both';
            }
        } else {
            // Single note replacement mode
            note.midi = midi;
            note.pitch = info.name;
            note.chord = null;
            note.isRest = false;
            note.clef = midi >= 60 ? 'treble' : 'bass';
            note.hand = midi >= 60 ? 'right' : 'left';
        }

        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Transpose selected note by semitones
     */
    transposeSelected(semitones) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note || note.isRest || !note.midi) return;

        if (Array.isArray(note.midi)) {
            note.midi = note.midi.map(m => Math.max(21, Math.min(108, m + semitones))).sort((a, b) => a - b);
            note.chord = note.midi.map(m => this.staff.midiToNoteInfo(m).name);
            note.pitch = this.analyzeChordName(note.midi);
        } else {
            const newMidi = Math.max(21, Math.min(108, note.midi + semitones));
            note.midi = newMidi;
            const info = this.staff.midiToNoteInfo(newMidi);
            note.pitch = info.name;
            note.clef = newMidi >= 60 ? 'treble' : 'bass';
        }

        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Sets duration of selected note
     */
    setDuration(duration) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note) return;

        note.duration = duration;
        this.recalculateMeasures();
        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Toggles rest on selected note
     */
    toggleRest() {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note) return;

        if (note.isRest) {
            // Convert back to note
            note.isRest = false;
            note.midi = 60; // Middle C
            note.pitch = 'C4';
            note.chord = null;
        } else {
            // Convert to rest
            note.isRest = true;
            note.pitch = 'rest';
            note.midi = null;
            note.chord = null;
        }

        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Sets clef for selected note
     */
    setClef(clef) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note) return;

        if (clef === 'both') {
            note.hand = 'both';
        } else {
            note.clef = clef;
            note.hand = clef === 'treble' ? 'right' : 'left';
        }

        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Toggles accidentals on selected note
     */
    toggleAccidental(accChar) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note || note.isRest || !note.midi) return;

        if (!note.accidentals) note.accidentals = {};
        const midis = Array.isArray(note.midi) ? note.midi : [note.midi];
        const targetMidi = midis[0];

        if (note.accidentals[targetMidi] === accChar) {
            delete note.accidentals[targetMidi];
        } else {
            note.accidentals[targetMidi] = accChar;
        }

        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Toggles articulation (tenuto, accent, tied)
     */
    toggleArtic(type) {
        if (!this.isActive || this.selectedIndex < 0 || !this.currentSong) return;
        const note = this.currentSong.notes[this.selectedIndex];
        if (!note) return;

        note[type] = !note[type];
        this.staff.render();
        this.selectNote(this.selectedIndex);
        this.notifyChange();
    }

    /**
     * Inserts a new note before or after current selection
     */
    insertNote(position = 'after') {
        if (!this.isActive || !this.currentSong) return;
        const baseNote = this.currentSong.notes[this.selectedIndex] || { duration: 1, clef: 'treble', hand: 'right' };
        
        const newNote = {
            pitch: baseNote.isRest ? 'C4' : (baseNote.pitch || 'C4'),
            midi: baseNote.isRest ? 60 : (baseNote.midi ? (Array.isArray(baseNote.midi) ? baseNote.midi[0] : baseNote.midi) : 60),
            duration: baseNote.duration || 1,
            clef: baseNote.clef || 'treble',
            hand: baseNote.hand || 'right'
        };

        const targetIndex = position === 'before' ? this.selectedIndex : this.selectedIndex + 1;
        this.currentSong.notes.splice(targetIndex, 0, newNote);

        this.recalculateMeasures();
        this.staff.render();
        this.selectNote(targetIndex);
        this.notifyChange();
    }

    /**
     * Deletes the currently selected note
     */
    deleteNote() {
        if (!this.isActive || !this.currentSong) return;
        if (this.currentSong.notes.length <= 1) {
            alert('樂譜中至少需要保留一個音符！');
            return;
        }

        this.currentSong.notes.splice(this.selectedIndex, 1);
        const nextIndex = Math.min(this.selectedIndex, this.currentSong.notes.length - 1);

        this.recalculateMeasures();
        this.staff.render();
        this.selectNote(nextIndex);
        this.notifyChange();
    }

    /**
     * Automatically recalculates measure numbers and beats based on time signature
     */
    recalculateMeasures() {
        if (!this.currentSong || !this.currentSong.notes) return;
        const [numBeats] = (this.currentSong.timeSignature || '4/4').split('/').map(Number);
        const beatsPerMeasure = numBeats || 4;

        let curMeasure = 1;
        let curBeat = 1;

        this.currentSong.notes.forEach(note => {
            note.measure = curMeasure;
            note.beat = Math.round(curBeat * 10) / 10;

            curBeat += (note.duration || 1);
            while (curBeat > beatsPerMeasure + 0.01) {
                curMeasure++;
                curBeat -= beatsPerMeasure;
            }
        });
    }

    /**
     * Analyzes chord names from an array of midi notes
     */
    analyzeChordName(midis) {
        if (!midis || midis.length === 0) return '';
        if (midis.length === 1) return this.staff.midiToNoteInfo(midis[0]).name;

        const bassInfo = this.staff.midiToNoteInfo(midis[0]);
        const highestInfo = this.staff.midiToNoteInfo(midis[midis.length - 1]);

        return `${highestInfo.baseLetter}和弦/${bassInfo.name}`;
    }

    /**
     * Saves changes to LocalStorage
     */
    saveToStorage(showAlert = true) {
        if (!this.currentSong) return;
        try {
            const savedScores = this.loadCustomScores();
            // Check if existing song with same ID
            const existingIdx = savedScores.findIndex(s => s.id === this.currentSong.id);
            if (existingIdx >= 0) {
                savedScores[existingIdx] = JSON.parse(JSON.stringify(this.currentSong));
            } else {
                savedScores.unshift(JSON.parse(JSON.stringify(this.currentSong)));
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedScores));
            if (showAlert) {
                alert(`💾 已成功儲存樂譜「${this.currentSong.title}」至本機瀏覽器！`);
            }
            this.onSongUpdated(this.currentSong);
        } catch (err) {
            console.error('Save to localStorage failed:', err);
            if (showAlert) alert('儲存失敗：' + err.message);
        }
    }

    /**
     * Loads custom scores from LocalStorage
     */
    loadCustomScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse custom scores:', e);
            return [];
        }
    }

    /**
     * Exports current score to a downloaded .json file
     */
    exportSongJson() {
        if (!this.currentSong) return;
        const jsonStr = JSON.stringify(this.currentSong, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `${this.currentSong.title.replace(/[\s\\/:*?"<>|]+/g, '_')}_樂譜.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Imports score from an uploaded .json file
     */
    importSongJson(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const song = JSON.parse(e.target.result);
                if (!song.title || !Array.isArray(song.notes)) {
                    throw new Error('無效的樂譜格式（缺少 title 或 notes 陣列）');
                }

                // Ensure unique ID
                song.id = song.id || ('imported_' + Date.now());
                if (!song.key) song.key = 'C';
                if (!song.timeSignature) song.timeSignature = '4/4';
                if (!song.bpm) song.bpm = 100;

                this.recalculateMeasures.call({ currentSong: song });

                // Save to storage
                const saved = this.loadCustomScores();
                saved.unshift(song);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));

                alert(`🎉 成功匯入樂譜「${song.title}」！（共 ${song.notes.length} 個音符）`);
                this.onSongUpdated(song, true);
                this.activate(song);
            } catch (err) {
                alert('匯入失敗：' + err.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Resets built-in song to its initial factory version
     */
    resetCurrentSong() {
        if (!this.currentSong) return;
        if (!confirm(`確定要將「${this.currentSong.title}」還原回原始原廠設定嗎？所有此曲的本地修改將被清除。`)) {
            return;
        }

        const saved = this.loadCustomScores();
        const filtered = saved.filter(s => s.id !== this.currentSong.id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

        // Find initial built-in version
        const factorySong = window.DEFAULT_SONGS_DATABASE?.find(s => s.id === this.currentSong.id);
        if (factorySong) {
            this.currentSong = JSON.parse(JSON.stringify(factorySong));
            this.staff.setMode('editor', this.currentSong);
            this.selectNote(0);
            this.onSongUpdated(this.currentSong);
            alert(`↺ 已成功將「${this.currentSong.title}」還原為原廠版本！`);
        } else {
            alert('此曲為自創曲，無原廠備份。');
        }
    }

    /**
     * Creates a new blank score
     */
    createNewBlankScore(title, key, timeSig, measures) {
        const [numBeats] = timeSig.split('/').map(Number);
        const beats = numBeats || 4;
        const notes = [];

        for (let m = 1; m <= measures; m++) {
            for (let b = 1; b <= beats; b++) {
                notes.push({
                    pitch: 'rest',
                    isRest: true,
                    duration: 1,
                    clef: 'treble',
                    hand: 'right',
                    measure: m,
                    beat: b
                });
            }
        }

        const newSong = {
            id: 'user_score_' + Date.now(),
            title: title,
            composer: '自創音樂',
            key: key,
            timeSignature: timeSig,
            bpm: 100,
            difficulty: '自創樂譜',
            description: `於 ${new Date().toLocaleDateString()} 建立的自創五線譜作品。`,
            notes: notes
        };

        this.currentSong = newSong;
        this.saveToStorage(false);
        this.onSongUpdated(newSong, true);
        this.activate(newSong);
        alert(`🎉 已成功建立「${title}」（共 ${measures} 個小節）！請點擊五線譜上的休止符，並彈奏琴鍵開始譜寫您的音樂！`);
    }

    openMetaModal() {
        if (!this.currentSong) return;
        const modal = document.getElementById('song-meta-modal');
        if (!modal) return;

        document.getElementById('meta-title').value = this.currentSong.title || '';
        document.getElementById('meta-composer').value = this.currentSong.composer || '';
        document.getElementById('meta-key').value = this.currentSong.key || 'C';
        document.getElementById('meta-time-sig').value = this.currentSong.timeSignature || '4/4';
        document.getElementById('meta-bpm').value = this.currentSong.bpm || 100;
        document.getElementById('meta-desc').value = this.currentSong.description || '';

        modal.classList.remove('hidden');
    }

    openNewScoreModal() {
        const modal = document.getElementById('new-score-modal');
        if (modal) modal.classList.remove('hidden');
    }

    notifyChange() {
        this.onSongUpdated(this.currentSong);
    }
}

window.ScoreEditor = ScoreEditor;
