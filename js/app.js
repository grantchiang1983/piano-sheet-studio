/**
 * Piano Sheet Studio - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Audio Engine
    const audio = new AudioEngine();

    // 2. Initialize Grand Staff Renderer
    const staff = new StaffRenderer('staff-container');

    // 3. Initialize Piano View
    const piano = new PianoView('piano-container', {
        keyRange: 61,
        labelType: 'note',
        onNoteOn: (midi, velocity, isExternal) => {
            if (!isExternal) {
                audio.noteOn(midi, velocity);
            }
            activeNotesSet.add(midi);
            staff.setNotes(activeNotesSet);

            // If in practice mode and note was hit by user, forward to score player
            if (player.isPracticeMode && !isExternal) {
                player.handleUserPlayNote(midi);
            }

            // If recording, log note
            if (isRecording) {
                recordNoteOn(midi);
            }
        },
        onNoteOff: (midi) => {
            audio.noteOff(midi);
            activeNotesSet.delete(midi);
            staff.setNotes(activeNotesSet);

            if (isRecording) {
                recordNoteOff(midi);
            }
        }
    });

    const activeNotesSet = new Set();

    // 4. Initialize Score Player
    const player = new ScorePlayer(audio, piano, staff);

    // 5. Initialize Web MIDI Controller
    const midi = new MidiController({
        onNoteOn: (midiNote, velocity) => {
            piano.pressKey(midiNote, velocity, false);
        },
        onNoteOff: (midiNote) => {
            piano.releaseKey(midiNote);
        },
        onSustain: (isDown) => {
            setSustain(isDown);
        },
        onStatusChange: (status) => {
            updateMidiUI(status);
        }
    });

    // Recording State
    let isRecording = false;
    let recordingStartTime = 0;
    let recordedNotes = [];
    const activeRecordedNotes = new Map();

    // UI Elements
    const songSelect = document.getElementById('song-select');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const practiceToggleBtn = document.getElementById('practice-toggle-btn');
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmDisplay = document.getElementById('bpm-val');
    const metronomeToggle = document.getElementById('metronome-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const soundPresetSelect = document.getElementById('sound-preset');
    const keyRangeSelect = document.getElementById('key-range-select');
    const keyLabelSelect = document.getElementById('key-label-select');
    const sustainBtn = document.getElementById('sustain-pedal-btn');
    const recordBtn = document.getElementById('record-btn');
    const modeFreeBtn = document.getElementById('mode-free-btn');
    const modeScoreBtn = document.getElementById('mode-score-btn');
    const modePracticeBtn = document.getElementById('mode-practice-btn');
    const practiceStatsBanner = document.getElementById('practice-stats-banner');

    // Populate Repertoire Select
    SONGS_DATABASE.forEach((song, idx) => {
        const opt = document.createElement('option');
        opt.value = song.id;
        opt.textContent = `${song.title} (${song.difficulty})`;
        if (idx === 0) opt.selected = true;
        songSelect.appendChild(opt);
    });

    // Load initial song
    player.loadSong(SONGS_DATABASE[0]);

    // Mode Switch Handler
    function switchMode(newMode) {
        modeFreeBtn.classList.remove('active');
        modeScoreBtn.classList.remove('active');
        modePracticeBtn.classList.remove('active');

        if (newMode === 'free') {
            modeFreeBtn.classList.add('active');
            player.stop();
            player.setPracticeMode(false);
            staff.setMode('live');
            practiceStatsBanner.classList.add('hidden');
            document.getElementById('song-controls-bar').classList.add('mode-live-dimmed');
        } else if (newMode === 'score') {
            modeScoreBtn.classList.add('active');
            player.setPracticeMode(false);
            const currentSongId = songSelect.value;
            const song = SONGS_DATABASE.find(s => s.id === currentSongId) || SONGS_DATABASE[0];
            player.loadSong(song);
            practiceStatsBanner.classList.add('hidden');
            document.getElementById('song-controls-bar').classList.remove('mode-live-dimmed');
        } else if (newMode === 'practice') {
            modePracticeBtn.classList.add('active');
            const currentSongId = songSelect.value;
            const song = SONGS_DATABASE.find(s => s.id === currentSongId) || SONGS_DATABASE[0];
            player.loadSong(song);
            player.setPracticeMode(true);
            practiceStatsBanner.classList.remove('hidden');
            document.getElementById('song-controls-bar').classList.remove('mode-live-dimmed');
        }
    }

    modeFreeBtn.addEventListener('click', () => switchMode('free'));
    modeScoreBtn.addEventListener('click', () => switchMode('score'));
    modePracticeBtn.addEventListener('click', () => switchMode('practice'));

    // Song Selection Change
    songSelect.addEventListener('change', () => {
        const songId = songSelect.value;
        const song = SONGS_DATABASE.find(s => s.id === songId);
        if (song) {
            player.loadSong(song);
            bpmSlider.value = song.bpm;
            bpmDisplay.textContent = `${song.bpm} BPM`;
            document.getElementById('song-desc').textContent = song.description;
        }
    });

    // Playback Controls
    playBtn.addEventListener('click', () => {
        audio.init();
        player.play();
    });

    pauseBtn.addEventListener('click', () => {
        player.pause();
    });

    stopBtn.addEventListener('click', () => {
        player.stop();
    });

    // BPM Slider
    bpmSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        bpmDisplay.textContent = `${val} BPM`;
        player.setBpm(val);
    });

    // Tempo multiplier buttons (0.75x, 1x, 1.25x)
    document.querySelectorAll('.tempo-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mult = parseFloat(btn.dataset.mult);
            if (player.currentSong) {
                const newBpm = Math.round(player.currentSong.bpm * mult);
                bpmSlider.value = newBpm;
                bpmDisplay.textContent = `${newBpm} BPM`;
                player.setBpm(newBpm);
            }
        });
    });

    // Metronome Toggle
    metronomeToggle.addEventListener('change', (e) => {
        player.setMetronome(e.target.checked);
    });

    // Volume Slider
    volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        audio.setVolume(val);
        document.getElementById('vol-display').textContent = `${Math.round(val * 100)}%`;
    });

    // Sound Preset
    soundPresetSelect.addEventListener('change', (e) => {
        audio.setSoundPreset(e.target.value);
    });

    // Key Range & Label Select
    keyRangeSelect.addEventListener('change', (e) => {
        piano.setKeyRange(e.target.value);
    });

    keyLabelSelect.addEventListener('change', (e) => {
        piano.setLabelType(e.target.value);
    });

    // Sustain Pedal Toggle
    function setSustain(enabled) {
        audio.setSustain(enabled);
        if (enabled) {
            sustainBtn.classList.add('pedal-active');
            sustainBtn.innerHTML = '<span>踏板 [ON]</span>';
        } else {
            sustainBtn.classList.remove('pedal-active');
            sustainBtn.innerHTML = '<span>踏板 [空白鍵]</span>';
        }
    }

    sustainBtn.addEventListener('click', () => {
        setSustain(!audio.sustainPedal);
    });

    // Spacebar to hold sustain pedal
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            if (!audio.sustainPedal) setSustain(true);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            if (audio.sustainPedal) setSustain(false);
        }
    });

    // Recording Controls
    recordBtn.addEventListener('click', () => {
        if (!isRecording) {
            // Start Recording
            isRecording = true;
            recordedNotes = [];
            activeRecordedNotes.clear();
            recordingStartTime = performance.now();
            recordBtn.classList.add('recording-active');
            recordBtn.innerHTML = '<span>⏹ 停止錄音</span>';
        } else {
            // Stop Recording and Generate Score
            isRecording = false;
            recordBtn.classList.remove('recording-active');
            recordBtn.innerHTML = '<span>● 錄製彈奏</span>';

            if (recordedNotes.length === 0) {
                alert('錄音中未偵測到彈奏音符！');
                return;
            }

            // Format recorded notes into a custom song
            const customSong = {
                id: 'recorded_' + Date.now(),
                title: '我的自創即興曲 (Recorded Session)',
                composer: '即興演奏者',
                key: 'C',
                timeSignature: '4/4',
                bpm: 100,
                difficulty: '自創曲',
                description: `於 ${new Date().toLocaleTimeString()} 錄製的鋼琴五線譜自創曲目。`,
                notes: recordedNotes
            };

            SONGS_DATABASE.unshift(customSong);
            const opt = document.createElement('option');
            opt.value = customSong.id;
            opt.textContent = `⭐ ${customSong.title}`;
            songSelect.insertBefore(opt, songSelect.firstChild);
            songSelect.value = customSong.id;
            switchMode('score');
            alert(`🎉 錄音完成！已自動將您的彈奏轉化為五線譜（共 ${recordedNotes.length} 個音符），可直接播放！`);
        }
    });

    function recordNoteOn(midiNote) {
        const timeFromStart = (performance.now() - recordingStartTime) / 1000;
        activeRecordedNotes.set(midiNote, {
            midi: midiNote,
            startTime: timeFromStart
        });
    }

    function recordNoteOff(midiNote) {
        if (!activeRecordedNotes.has(midiNote)) return;
        const noteData = activeRecordedNotes.get(midiNote);
        activeRecordedNotes.delete(midiNote);

        const timeFromStart = (performance.now() - recordingStartTime) / 1000;
        const durationSec = Math.max(0.2, timeFromStart - noteData.startTime);
        const beats = Math.max(0.5, Math.round((durationSec / (60 / 100)) * 2) / 2); // Quantize to half beats

        const noteInfo = staff.midiToNoteInfo(midiNote);
        recordedNotes.push({
            pitch: noteInfo.name,
            midi: midiNote,
            duration: beats,
            clef: midiNote >= 60 ? 'treble' : 'bass',
            hand: midiNote >= 60 ? 'right' : 'left'
        });
    }

    // Player State Change Callback
    player.onStateChange = (state) => {
        if (state.isPlaying) {
            playBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        } else {
            playBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
        }
    };

    // Practice Feedback Callback
    player.onPracticeFeedback = (feedback) => {
        const streakEl = document.getElementById('practice-streak-val');
        const hintEl = document.getElementById('practice-hint-text');
        if (feedback.correct) {
            streakEl.textContent = `${feedback.streak} 連擊 🔥`;
            hintEl.textContent = `太棒了！正確彈下 ${feedback.pitch}`;
            hintEl.className = 'hint-correct';
        } else {
            streakEl.textContent = `0 連擊`;
            hintEl.textContent = `哎呀！請彈奏黃色發光的目標音符`;
            hintEl.className = 'hint-wrong';
        }
    };

    // MIDI Connection UI update
    function updateMidiUI(status) {
        const badge = document.getElementById('midi-status-badge');
        if (!badge) return;
        if (!status.supported) {
            badge.className = 'status-badge badge-unsupported';
            badge.innerHTML = '<span>⚠️ 不支援 MIDI</span>';
            badge.title = '此瀏覽器不支援 Web MIDI API（推薦使用 Chrome 或 Edge）';
        } else if (status.connected) {
            badge.className = 'status-badge badge-connected';
            badge.innerHTML = `<span>🎹 MIDI 已連接: ${status.deviceNames[0]}</span>`;
            badge.title = `已連接裝置: ${status.deviceNames.join(', ')}`;
        } else {
            badge.className = 'status-badge badge-disconnected';
            badge.innerHTML = '<span>🔌 未連接 MIDI 琴</span>';
            badge.title = '將電子琴/電鋼琴透過 USB 連接電腦即可自動識別彈奏！';
        }
    }

    // Modal Guide Toggle
    const guideModal = document.getElementById('guide-modal');
    const openGuideBtn = document.getElementById('open-guide-btn');
    const closeGuideBtn = document.getElementById('close-guide-btn');

    if (openGuideBtn && guideModal) {
        openGuideBtn.addEventListener('click', () => {
            guideModal.classList.remove('hidden');
        });
    }

    if (closeGuideBtn && guideModal) {
        closeGuideBtn.addEventListener('click', () => {
            guideModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === guideModal) {
            guideModal.classList.add('hidden');
        }
    });

    // Window Resize Handling for SVG redraw
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            staff.render();
        }, 150);
    });

    // Default mode: Score View
    switchMode('score');
});
