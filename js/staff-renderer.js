/**
 * Piano Sheet Studio - Grand Staff SVG Renderer & Music Analysis Engine
 * Features:
 * - Dynamic High-Resolution SVG Grand Staff (Treble & Bass clefs, Brace, Ledger lines)
 * - Real-time Note Rendering & Solfège / Pitch / Accidental analysis
 * - Intelligent Polyphonic Chord Recognition (Major, Minor, 7th, sus4, dim, etc.)
 * - Song Score Mode with Measures, Time Signature, and Follower Cursor
 */

class StaffRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mode = 'live'; // 'live' or 'song'
        this.currentSong = null;
        this.activeMidiNotes = new Set(); // Set of currently active MIDI numbers
        this.activeSongNoteIndex = -1;

        // Music Theory Constants
        this.pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.solfegeNames = ['Do', 'Di', 'Re', 'Ri', 'Mi', 'Fa', 'Fi', 'Sol', 'Si', 'La', 'Li', 'Ti'];
        this.numberedNotation = ['1', '#1', '2', '#2', '3', '4', '#4', '5', '#5', '6', '#6', '7'];

        // Diatonic step offset from Middle C (C4 = 0)
        // Diatonic note letters: C=0, D=1, E=2, F=3, G=4, A=5, B=6
        this.diatonicMap = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

        // Geometry Dimensions
        this.lineSpacing = 12; // Distance between staff lines
        this.stepY = this.lineSpacing / 2; // 6px per diatonic step

        this.init();
    }

    init() {
        this.render();
    }

    setMode(mode, song = null) {
        this.mode = mode;
        this.currentSong = song;
        this.activeSongNoteIndex = -1;
        this.render();
    }

    setActiveSongNote(index) {
        this.activeSongNoteIndex = index;
        if (this.mode === 'song') {
            this.updateSongCursor();
        }
    }

    setNotes(midiNotesSet) {
        this.activeMidiNotes = new Set(midiNotesSet);
        if (this.mode === 'live') {
            this.renderLiveNotes();
        }
        this.updateChordDisplay();
    }

    midiToNoteInfo(midi) {
        if (!midi) {
            return { midi: 0, name: '', baseLetter: 'C', isSharp: false, octave: 4, solfege: '', number: '', diatonicStep: 0 };
        }
        const octave = Math.floor(midi / 12) - 1;
        const noteIndex = midi % 12;
        const nameWithAccidental = this.pitchNames[noteIndex];
        const baseLetter = nameWithAccidental[0];
        const isSharp = nameWithAccidental.includes('#');
        const solfege = this.solfegeNames[noteIndex];
        const number = this.numberedNotation[noteIndex];

        // Calculate diatonic step relative to C4 (midi 60, diatonic step 0)
        // Octave 4 C = 0. Each octave is 7 diatonic steps.
        const diatonicStep = (octave - 4) * 7 + this.diatonicMap[baseLetter];

        return {
            midi,
            name: `${nameWithAccidental}${octave}`,
            baseLetter,
            isSharp,
            octave,
            solfege,
            number,
            diatonicStep
        };
    }

    render() {
        if (this.mode === 'live') {
            this.renderLiveView();
        } else {
            this.renderSongView();
        }
    }

    /**
     * Render Live Interactive Grand Staff
     */
    renderLiveView() {
        const width = this.container.clientWidth || 920;
        const height = 290;

        // Staff vertical centers
        const trebleLine5Y = 46; // F5 (top line of treble staff)
        const bassLine5Y = 166;   // A3 (top line of bass staff)

        let svg = `
        <svg class="grand-staff-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="noteGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4ade80" />
                    <stop offset="100%" stop-color="#16a34a" />
                </linearGradient>
                <linearGradient id="noteGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#60a5fa" />
                    <stop offset="100%" stop-color="#2563eb" />
                </linearGradient>
            </defs>

            <!-- Background & Brace -->
            <path d="M 40 46 C 30 106, 20 106, 12 153 C 20 200, 30 200, 40 214" fill="none" stroke="#e2b714" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="45" y1="46" x2="45" y2="214" stroke="#94a3b8" stroke-width="2.5"/>

            <!-- Treble Staff (5 lines: F5, D5, B4, G4, E4) -->
            <g class="treble-staff-lines">
        `;

        for (let i = 0; i < 5; i++) {
            const y = trebleLine5Y + i * this.lineSpacing;
            svg += `<line x1="45" y1="${y}" x2="${width - 30}" y2="${y}" stroke="#64748b" stroke-width="1.3"/>`;
        }

        // Bass Staff (5 lines: A3, F3, D3, B2, G2)
        svg += `</g><g class="bass-staff-lines">`;
        for (let i = 0; i < 5; i++) {
            const y = bassLine5Y + i * this.lineSpacing;
            svg += `<line x1="45" y1="${y}" x2="${width - 30}" y2="${y}" stroke="#64748b" stroke-width="1.3"/>`;
        }
        svg += `</g>`;

        // Clef Symbols
        // Treble Clef 𝄞
        svg += `<text x="56" y="91" class="clef-symbol" font-size="56" fill="#f8fafc" font-family="'Noto Music', 'Bravura', serif">𝄞</text>`;
        // Bass Clef 𝄢
        svg += `<text x="58" y="187" class="clef-symbol" font-size="44" fill="#f8fafc" font-family="'Noto Music', 'Bravura', serif">𝄢</text>`;

        // Staff Labels
        svg += `<text x="75" y="32" class="staff-tag" font-size="11" fill="#4ade80" font-weight="600">高音譜表 (Treble Staff)</text>`;
        svg += `<text x="75" y="152" class="staff-tag" font-size="11" fill="#60a5fa" font-weight="600">低音譜表 (Bass Staff)</text>`;

        // Middle C Reference line (dashed helper line)
        const middleCY = (trebleLine5Y + 4 * this.lineSpacing) + this.lineSpacing; // E4 - 1 line distance = 106px
        svg += `
            <line x1="45" y1="${middleCY}" x2="${width - 30}" y2="${middleCY}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="3,5" opacity="0.4"/>
            <text x="${width - 120}" y="${middleCY - 4}" font-size="10" fill="#e2b714" opacity="0.8">中央 C (C4) 輔助線</text>
        `;

        // Dynamic Notes Placeholder Group
        svg += `<g id="live-notes-group"></g>`;

        svg += `</svg>`;
        this.container.innerHTML = svg;
        this.renderLiveNotes();
    }

    /**
     * Re-draws only the active notes in Live View for 60fps responsiveness
     */
    renderLiveNotes() {
        const group = document.getElementById('live-notes-group');
        if (!group) return;

        if (this.activeMidiNotes.size === 0) {
            group.innerHTML = `
                <g class="empty-hint" opacity="0.6">
                    <text x="50%" y="104" text-anchor="middle" font-size="14" fill="#94a3b8" letter-spacing="1">
                        🎹 點擊琴鍵或按鍵盤，五線譜將即時顯示對應音符與和弦
                    </text>
                </g>
            `;
            return;
        }

        const sortedNotes = Array.from(this.activeMidiNotes).sort((a, b) => a - b);
        const containerWidth = this.container.clientWidth || 920;
        const startX = 220;
        const availableWidth = containerWidth - 280;
        const noteSpacing = Math.min(80, Math.max(48, availableWidth / (sortedNotes.length + 1)));

        let notesHtml = '';

        sortedNotes.forEach((midi, index) => {
            const noteInfo = this.midiToNoteInfo(midi);
            const x = startX + index * noteSpacing;
            const y = this.getYForDiatonicStep(noteInfo.diatonicStep);
            const isTreble = noteInfo.diatonicStep >= 0; // C4 and above mapped primarily to treble
            const colorClass = isTreble ? 'note-treble' : 'note-bass';
            const color = isTreble ? '#4ade80' : '#60a5fa';

            // Ledger Lines (加線)
            const ledgerLines = this.calculateLedgerLines(noteInfo.diatonicStep, x);
            notesHtml += ledgerLines;

            // Accidental (♯)
            if (noteInfo.isSharp) {
                notesHtml += `
                    <text x="${x - 18}" y="${y + 5}" font-size="18" font-weight="bold" fill="${color}">♯</text>
                `;
            }

            // Note Head (elliptical rotated note head)
            notesHtml += `
                <g class="live-note-item ${colorClass}" filter="url(#glow)">
                    <ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.5" transform="rotate(-22 ${x} ${y})" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
                    <!-- Stem -->
                    ${this.renderStem(noteInfo.diatonicStep, x, y, color)}
                    <!-- Note Tag Pill -->
                    <rect x="${x - 22}" y="${y > 130 ? y + 26 : y - 40}" width="44" height="20" rx="4" fill="#0f172a" stroke="${color}" stroke-width="1" opacity="0.95"/>
                    <text x="${x}" y="${y > 130 ? y + 40 : y - 26}" text-anchor="middle" font-size="11" font-weight="bold" fill="#f8fafc">
                        ${noteInfo.name}
                    </text>
                    <!-- Solfege & Number subtag -->
                    <text x="${x}" y="${y > 130 ? y + 55 : y - 44}" text-anchor="middle" font-size="10" fill="${color}" font-weight="600">
                        ${noteInfo.solfege} (${noteInfo.number})
                    </text>
                </g>
            `;
        });

        group.innerHTML = notesHtml;
    }

    /**
     * Get SVG Y coordinate for a given diatonic step from C4
     * C4 diatonic step = 0
     * Treble Staff lines: E4 (step 2) to F5 (step 10)
     * Treble line 5 (F5) = 46px
     * Bass line 1 (G2) = step -10. Bass line 5 (A3) = step -2 = 166px
     */
    getYForDiatonicStep(step) {
        // Reference point: C4 (step 0)
        // Middle C Y is 106px
        const middleCY = 106;
        return middleCY - (step * this.stepY);
    }

    /**
     * Generate ledger lines if note falls outside 5 standard lines
     */
    calculateLedgerLines(step, noteX) {
        let linesHtml = '';
        const halfWidth = 14;

        // Treble staff lines are steps 2 (E4), 4 (G4), 6 (B4), 8 (D5), 10 (F5)
        // Middle C is step 0: needs ledger line at step 0
        if (step === 0) {
            const y = this.getYForDiatonicStep(0);
            linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
        }

        // Treble upper ledger lines: step >= 12 (A5 and above)
        if (step >= 12) {
            for (let s = 12; s <= step; s += 2) {
                const y = this.getYForDiatonicStep(s);
                linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
            }
        }

        // Bass staff lines are steps -10 (G2), -8 (B2), -6 (D3), -4 (F3), -2 (A3)
        // Bass lower ledger lines: step <= -12 (E2 and below)
        if (step <= -12) {
            for (let s = -12; s >= step; s -= 2) {
                const y = this.getYForDiatonicStep(s);
                linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
            }
        }

        return linesHtml;
    }

    renderStem(step, x, y, color) {
        // Standard rule:
        // In treble (steps >= 0), step >= 6 (B4 line) points down on left; below points up on right
        // In bass (steps < 0), step >= -6 (D3 line) points down on left; below points up on right
        let pointsUp = true;
        if (step >= 0) {
            pointsUp = step < 6;
        } else {
            pointsUp = step < -6;
        }

        const stemHeight = 32;
        if (pointsUp) {
            const stemX = x + 6.5;
            return `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${y - stemHeight}" stroke="${color}" stroke-width="1.6"/>`;
        } else {
            const stemX = x - 6.5;
            return `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${y + stemHeight}" stroke="${color}" stroke-width="1.6"/>`;
        }
    }

    /**
     * Render Full Song Score View with Measures and Playback Tracking
     */
    renderSongView() {
        if (!this.currentSong) return;

        const song = this.currentSong;
        const totalNotes = song.notes.length;
        const noteSpacing = 42;
        const headerWidth = 140;
        const totalWidth = Math.max(this.container.clientWidth || 920, headerWidth + totalNotes * noteSpacing + 80);
        const height = 290;

        const trebleLine5Y = 46;
        const bassLine5Y = 166;
        const middleCY = 106;

        let svg = `
        <div class="score-scroll-wrapper" id="score-scroll-wrapper">
        <svg class="grand-staff-svg song-mode-svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
            <defs>
                <filter id="activeNoteGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0.8  0 0 1 0 0.2  0 0 0 2 0"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Brace -->
            <path d="M 36 46 C 26 106, 16 106, 8 153 C 16 200, 26 200, 36 214" fill="none" stroke="#e2b714" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="42" y1="46" x2="42" y2="214" stroke="#94a3b8" stroke-width="2.5"/>

            <!-- Treble & Bass Lines -->
            <g class="treble-lines">
        `;

        for (let i = 0; i < 5; i++) {
            const y = trebleLine5Y + i * this.lineSpacing;
            svg += `<line x1="42" y1="${y}" x2="${totalWidth - 20}" y2="${y}" stroke="#64748b" stroke-width="1.3"/>`;
        }
        svg += `</g><g class="bass-lines">`;
        for (let i = 0; i < 5; i++) {
            const y = bassLine5Y + i * this.lineSpacing;
            svg += `<line x1="42" y1="${y}" x2="${totalWidth - 20}" y2="${y}" stroke="#64748b" stroke-width="1.3"/>`;
        }
        svg += `</g>`;

        // Clefs & Time Signature
        svg += `
            <text x="50" y="91" class="clef-symbol" font-size="54" fill="#f8fafc" font-family="'Noto Music', 'Bravura', serif">𝄞</text>
            <text x="52" y="187" class="clef-symbol" font-size="42" fill="#f8fafc" font-family="'Noto Music', 'Bravura', serif">𝄢</text>
            
            <!-- Time Signature -->
            <text x="100" y="68" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[0]}</text>
            <text x="100" y="92" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[1]}</text>
            <text x="100" y="188" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[0]}</text>
            <text x="100" y="212" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[1]}</text>
        `;

        // Measure Bars & Notes
        let currentMeasure = 1;
        svg += `<g class="song-notes-group">`;

        song.notes.forEach((note, index) => {
            const x = headerWidth + index * noteSpacing;
            const noteInfo = this.midiToNoteInfo(note.midi);
            const y = this.getYForDiatonicStep(noteInfo.diatonicStep);
            const isRightHand = note.hand === 'right';
            const color = isRightHand ? '#4ade80' : '#60a5fa';

            // Draw Measure Bar
            if (note.measure && note.measure !== currentMeasure) {
                currentMeasure = note.measure;
                const barX = x - noteSpacing * 0.45;
                svg += `
                    <line x1="${barX}" y1="46" x2="${barX}" y2="94" stroke="#475569" stroke-width="1.5"/>
                    <line x1="${barX}" y1="166" x2="${barX}" y2="214" stroke="#475569" stroke-width="1.5"/>
                    <text x="${barX + 6}" y="40" font-size="9" fill="#94a3b8">m.${currentMeasure}</text>
                `;
            }

            // Handle Rest (休止符)
            if (note.isRest || note.pitch === 'rest' || !note.midi) {
                const restY = note.clef === 'treble' ? 72 : 192;
                svg += `
                    <g class="song-note-item song-rest-item" id="song-note-${index}" data-index="${index}">
                        <text x="${x}" y="${restY}" text-anchor="middle" font-size="28" fill="#94a3b8" font-family="'Noto Music', 'Bravura', serif">𝄽</text>
                        <text x="${x}" y="${restY + 28}" text-anchor="middle" font-size="9" fill="#64748b">休止</text>
                    </g>
                `;
                return;
            }

            // Ledger Lines
            svg += this.calculateLedgerLines(noteInfo.diatonicStep, x);

            // Accidental
            if (noteInfo.isSharp) {
                svg += `<text x="${x - 14}" y="${y + 4}" font-size="14" font-weight="bold" fill="${color}">♯</text>`;
            }

            // Note Head
            const isHollow = note.duration >= 2;
            const fill = isHollow ? 'none' : color;
            const stroke = color;

            // Tenuto line (保持音短橫線)
            let tenutoSvg = '';
            if (note.tenuto) {
                const tenutoY = y > 130 ? y + 12 : y - 12;
                tenutoSvg = `<line x1="${x - 7}" y1="${tenutoY}" x2="${x + 7}" y2="${tenutoY}" stroke="${color}" stroke-width="2"/>`;
            }

            svg += `
                <g class="song-note-item" id="song-note-${index}" data-index="${index}" style="cursor: pointer;">
                    <ellipse cx="${x}" cy="${y}" rx="6.5" ry="4.8" transform="rotate(-22 ${x} ${y})" fill="${fill}" stroke="${stroke}" stroke-width="${isHollow ? 2 : 1}"/>
                    ${this.renderStem(noteInfo.diatonicStep, x, y, color)}
                    ${tenutoSvg}
                    <text x="${x}" y="${y > 130 ? y + 26 : y - 22}" text-anchor="middle" font-size="10" fill="#cbd5e1" class="note-name-label">
                        ${noteInfo.name}
                    </text>
                </g>
            `;
        });

        // Playback tracking vertical cursor
        svg += `
            <g id="song-playback-cursor" transform="translate(-100, 0)" opacity="0">
                <line x1="0" y1="20" x2="0" y2="240" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" filter="url(#activeNoteGlow)"/>
                <polygon points="-6,16 6,16 0,26" fill="#f59e0b"/>
            </g>
        `;

        svg += `</g></svg></div>`;
        this.container.innerHTML = svg;
    }

    /**
     * Smoothly moves the playback cursor in Song View
     */
    updateSongCursor() {
        const cursor = document.getElementById('song-playback-cursor');
        const scrollWrapper = document.getElementById('score-scroll-wrapper');
        if (!cursor || this.activeSongNoteIndex < 0) {
            if (cursor) cursor.setAttribute('opacity', '0');
            return;
        }

        const activeElem = document.getElementById(`song-note-${this.activeSongNoteIndex}`);
        if (!activeElem) return;

        // Reset previous highlights
        document.querySelectorAll('.song-note-item.active-playing').forEach(el => el.classList.remove('active-playing'));
        activeElem.classList.add('active-playing');

        const noteSpacing = 42;
        const headerWidth = 140;
        const targetX = headerWidth + this.activeSongNoteIndex * noteSpacing;

        cursor.setAttribute('transform', `translate(${targetX}, 0)`);
        cursor.setAttribute('opacity', '1');

        // Auto-scroll score to keep cursor centered
        if (scrollWrapper) {
            const containerWidth = scrollWrapper.clientWidth;
            const scrollTarget = Math.max(0, targetX - containerWidth / 2);
            scrollWrapper.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }
    }

    /**
     * Intelligent Real-time Chord Detection
     */
    updateChordDisplay() {
        const chordNameEl = document.getElementById('detected-chord-name');
        const chordDetailsEl = document.getElementById('detected-chord-details');
        if (!chordNameEl) return;

        if (this.activeMidiNotes.size === 0) {
            chordNameEl.textContent = '—';
            chordDetailsEl.textContent = '等待彈奏音符...';
            return;
        }

        // Get unique pitch classes (0-11)
        const pitchClasses = Array.from(new Set(Array.from(this.activeMidiNotes).map(m => m % 12))).sort((a, b) => a - b);
        
        if (pitchClasses.length === 1) {
            const rootName = this.pitchNames[pitchClasses[0]];
            chordNameEl.textContent = rootName;
            chordDetailsEl.textContent = `單音 (Single Note: ${rootName})`;
            return;
        }

        const chord = this.detectChord(pitchClasses);
        if (chord) {
            chordNameEl.textContent = chord.name;
            chordDetailsEl.textContent = `${chord.type} [${chord.notes.join(' - ')}]`;
        } else {
            // Display combination notes
            const notes = pitchClasses.map(p => this.pitchNames[p]);
            chordNameEl.textContent = notes.join('+');
            chordDetailsEl.textContent = `複音合奏 (Polyphony)`;
        }
    }

    detectChord(pitchClasses) {
        // Chord intervals pattern matching
        const chordFormulas = [
            { name: 'Major (大三和弦)', type: '', intervals: [4, 7] },
            { name: 'Minor (小三和弦)', type: 'm', intervals: [3, 7] },
            { name: 'Dominant 7th (屬七和弦)', type: '7', intervals: [4, 7, 10] },
            { name: 'Major 7th (大大七和弦)', type: 'maj7', intervals: [4, 7, 11] },
            { name: 'Minor 7th (小七和弦)', type: 'm7', intervals: [3, 7, 10] },
            { name: 'Diminished (減三和弦)', type: 'dim', intervals: [3, 6] },
            { name: 'Augmented (增三和弦)', type: 'aug', intervals: [4, 8] },
            { name: 'Suspended 4th (掛四和弦)', type: 'sus4', intervals: [5, 7] },
            { name: 'Suspended 2nd (掛二和弦)', type: 'sus2', intervals: [2, 7] },
            { name: 'Power Chord (強力和弦 5)', type: '5', intervals: [7] }
        ];

        // Check every note in pitchClasses as potential root
        for (let r = 0; r < pitchClasses.length; r++) {
            const root = pitchClasses[r];
            const rootName = this.pitchNames[root];

            // Normalize intervals relative to root
            const relativeIntervals = pitchClasses.map(p => (p - root + 12) % 12).filter(i => i > 0).sort((a, b) => a - b);

            for (const formula of chordFormulas) {
                if (formula.intervals.length === relativeIntervals.length &&
                    formula.intervals.every((val, idx) => val === relativeIntervals[idx])) {
                    const notes = [rootName, ...relativeIntervals.map(i => this.pitchNames[(root + i) % 12])];
                    return {
                        name: `${rootName}${formula.type}`,
                        type: formula.name,
                        notes
                    };
                }
            }
        }

        return null;
    }
}

window.StaffRenderer = StaffRenderer;
