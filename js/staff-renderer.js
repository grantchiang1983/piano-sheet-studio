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
        // Bass Clef (High-precision SVG Vector anchored to Line 4)
        svg += this.renderBassClef(58);

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
            const isTreble = noteInfo.diatonicStep >= 0; // C4 and above mapped primarily to treble
            const clef = isTreble ? 'treble' : 'bass';
            const y = this.getYForDiatonicStep(noteInfo.diatonicStep, clef);
            const colorClass = isTreble ? 'note-treble' : 'note-bass';
            const color = isTreble ? '#4ade80' : '#60a5fa';

            // Ledger Lines (加線)
            const ledgerLines = this.calculateLedgerLines(noteInfo.diatonicStep, x, clef);
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
     * Treble Staff lines (y = 46 to 94):
     *   Line 5 (F5, step 10) = 46px
     *   Line 1 (E4, step 2) = 94px
     *   Middle C (C4, step 0, ledger line below treble) = 106px
     *
     * Bass Staff lines (y = 166 to 214):
     *   Line 5 (A3, step -2) = 166px
     *   Line 4 (F3, step -4) = 178px
     *   Line 3 (D3, step -6) = 190px
     *   Line 2 (B2, step -8) = 202px (Exact position of B2 on 2nd line!)
     *   Line 1 (G2, step -10) = 214px
     *   Middle C (C4, step 0, ledger line above bass) = 154px
     */
    getYForDiatonicStep(step, clef = null) {
        const isBass = (clef === 'bass') || (clef === null && step < 0);
        if (isBass) {
            // Bass line 5 (A3, step -2) = 166px
            return 166 - ((step - (-2)) * this.stepY);
        } else {
            // Treble line 1 (E4, step 2) = 94px
            return 94 - ((step - 2) * this.stepY);
        }
    }

    /**
     * Generate ledger lines if note falls outside standard 5 staff lines
     */
    calculateLedgerLines(step, noteX, clef = null) {
        let linesHtml = '';
        const halfWidth = 14;
        const isBass = (clef === 'bass') || (clef === null && step < 0);

        if (!isBass) {
            // Treble staff lines are steps 2 (E4) to 10 (F5)
            // Middle C is step 0: needs ledger line at step 0 (106px)
            if (step <= 0) {
                for (let s = 0; s >= step; s -= 2) {
                    const y = this.getYForDiatonicStep(s, 'treble');
                    linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
                }
            }
            // Treble upper ledger lines: step >= 12 (A5 and above)
            if (step >= 12) {
                for (let s = 12; s <= step; s += 2) {
                    const y = this.getYForDiatonicStep(s, 'treble');
                    linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
                }
            }
        } else {
            // Bass staff lines are steps -10 (G2) to -2 (A3)
            // Note: B2 is step -8 (Line 2), which is completely inside the 5 lines!
            // Middle C on bass staff is step 0: needs ledger line at step 0 (154px)
            if (step >= 0) {
                for (let s = 0; s <= step; s += 2) {
                    const y = this.getYForDiatonicStep(s, 'bass');
                    linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
                }
            }
            // Bass lower ledger lines: step <= -12 (E2 and below)
            if (step <= -12) {
                for (let s = -12; s >= step; s -= 2) {
                    const y = this.getYForDiatonicStep(s, 'bass');
                    linesHtml += `<line x1="${noteX - halfWidth}" y1="${y}" x2="${noteX + halfWidth}" y2="${y}" stroke="#f8fafc" stroke-width="1.6"/>`;
                }
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
     * High-precision authentic SVG F-Clef (Bass Clef) vector anchored to staff lines:
     * Staff lines: Line 5 (166px), Line 4 (178px), Line 3 (190px), Line 2 (202px), Line 1 (214px)
     * Standard F-Clef geometry:
     * - Main dot centered squarely on Line 4 (F3, y=178)
     * - Upper arch rises to Line 5 (A3, y=166)
     * - Tail descends to Line 2 (B2, y=202)
     * - Two dots placed symmetrically in Space 4 (y=172) and Space 3 (y=184), flanking Line 4!
     */
    renderBassClef(startX = 52) {
        const scale = 0.02032176;
        const offsetX = startX - 25.18;
        const offsetY = 36.40;
        const pathData = "M 1239,8245 C 1397,8138 1515,8057 1591,8001 C 1667,7946 1747,7877 1829,7795 C 1911,7713 1980,7620 2036,7517 C 2080,7441 2118,7353 2149,7253 C 2180,7154 2196,7058 2199,6967 C 2199,6882 2188,6801 2165,6725 C 2143,6648 2105,6585 2051,6534 C 1997,6484 1927,6459 1840,6459 C 1756,6459 1677,6476 1603,6509 C 1530,6543 1478,6597 1449,6673 C 1449,6680 1445,6689 1439,6702 C 1441,6718 1449,6730 1464,6739 C 1479,6748 1492,6752 1504,6752 C 1510,6752 1527,6749 1553,6743 C 1580,6737 1602,6733 1620,6733 C 1673,6733 1720,6752 1763,6789 C 1805,6826 1826,6871 1826,6924 C 1826,6962 1815,6998 1794,7031 C 1773,7064 1744,7091 1707,7110 C 1670,7130 1629,7139 1585,7139 C 1505,7139 1437,7115 1381,7066 C 1326,7016 1298,6953 1298,6874 C 1298,6773 1329,6686 1390,6612 C 1452,6538 1530,6483 1626,6446 C 1721,6408 1817,6390 1915,6390 C 2022,6390 2124,6417 2219,6472 C 2315,6526 2390,6601 2446,6694 C 2502,6788 2531,6888 2531,6996 C 2531,7188 2467,7366 2339,7531 C 2211,7696 2053,7839 1864,7961 C 1738,8044 1534,8156 1253,8297 L 1239,8245 z M 2628,6698 C 2628,6662 2641,6632 2667,6608 C 2692,6583 2723,6571 2760,6571 C 2792,6571 2822,6585 2849,6612 C 2876,6638 2889,6669 2889,6703 C 2889,6739 2875,6770 2849,6795 C 2821,6819 2790,6831 2755,6831 C 2718,6831 2688,6819 2664,6792 C 2640,6766 2628,6735 2628,6698 z M 2628,7222 C 2628,7186 2641,7155 2665,7131 C 2690,7106 2721,7094 2760,7094 C 2792,7094 2821,7107 2849,7134 C 2875,7161 2889,7190 2889,7222 C 2889,7261 2876,7292 2851,7317 C 2825,7342 2795,7355 2760,7355 C 2721,7355 2690,7342 2665,7318 C 2641,7294 2628,7262 2628,7222 z";
        return `
            <g class="clef-symbol clef-bass" transform="translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}) scale(${scale})">
                <path d="${pathData}" fill="#f8fafc" />
            </g>
        `;
    }

    /**
     * Map Key Signature to standard accidentals and count
     */
    getKeySignatureInfo(key) {
        if (!key) return { count: 0, type: 'sharp' };
        const cleanKey = key.trim();
        const keyMap = {
            'C': { count: 0, type: 'sharp' },
            'Am': { count: 0, type: 'sharp' },
            'G': { count: 1, type: 'sharp' },
            'Em': { count: 1, type: 'sharp' },
            'D': { count: 2, type: 'sharp' },
            'Bm': { count: 2, type: 'sharp' },
            'A': { count: 3, type: 'sharp' },
            'F#m': { count: 3, type: 'sharp' },
            'E': { count: 4, type: 'sharp' },
            'C#m': { count: 4, type: 'sharp' },
            'B': { count: 5, type: 'sharp' },
            'G#m': { count: 5, type: 'sharp' },
            'F': { count: 1, type: 'flat' },
            'Dm': { count: 1, type: 'flat' },
            'Bb': { count: 2, type: 'flat' },
            'Gm': { count: 2, type: 'flat' },
            'Eb': { count: 3, type: 'flat' },
            'Cm': { count: 3, type: 'flat' },
            'Ab': { count: 4, type: 'flat' },
            'Fm': { count: 4, type: 'flat' }
        };
        return keyMap[cleanKey] || { count: 0, type: 'sharp' };
    }

    /**
     * Render Standard Grand Staff Key Signature (Sharps ♯ or Flats ♭)
     * Treble Staff: F5 (46), C5 (64), G5 (40), D5 (58), A4 (76), E5 (52), B4 (70)
     * Bass Staff: F3 (178), C3 (196), G3 (172), D3 (190), A2 (208), E3 (184), B2 (202)
     */
    renderKeySignature(key, startX = 88) {
        const info = this.getKeySignatureInfo(key);
        if (!info || info.count === 0) return { svg: '', width: 0, nextX: startX };

        const sharpPositions = {
            treble: [46, 64, 40, 58, 76, 52, 70], // F5, C5, G5, D5, A4, E5, B4
            bass: [178, 196, 172, 190, 208, 184, 202] // F3, C3, G3, D3, A2, E3, B2
        };

        const flatPositions = {
            treble: [70, 52, 76, 58, 82, 64, 88], // Bb4, Eb5, Ab4, Db5, Gb4, Cb5, Fb4
            bass: [202, 184, 208, 190, 214, 196, 220] // Bb2, Eb3, Ab2, Db3, Gb2, Cb3, Fb2
        };

        const char = info.type === 'sharp' ? '♯' : '♭';
        const positions = info.type === 'sharp' ? sharpPositions : flatPositions;
        const spacing = 12;
        let svg = `<g class="key-signature-group" data-key="${key}">`;

        for (let i = 0; i < info.count; i++) {
            const curX = startX + i * spacing;
            const trebleY = positions.treble[i];
            const bassY = positions.bass[i];

            // Treble & Bass accidentals with optical vertical centering on line/space
            svg += `<text x="${curX}" y="${trebleY}" font-size="19" font-weight="bold" fill="#f8fafc" text-anchor="middle" dominant-baseline="central" class="key-sig-symbol">${char}</text>`;
            svg += `<text x="${curX}" y="${bassY}" font-size="19" font-weight="bold" fill="#f8fafc" text-anchor="middle" dominant-baseline="central" class="key-sig-symbol">${char}</text>`;
        }

        svg += `</g>`;
        const totalWidth = info.count * spacing;
        return {
            svg,
            width: totalWidth,
            nextX: startX + totalWidth + 12
        };
    }

    /**
     * Render Full Song Score View with Measures and Playback Tracking
     */
    renderSongView() {
        if (!this.currentSong) return;

        const song = this.currentSong;
        const totalNotes = song.notes.length;
        const noteSpacing = 42;

        // Dynamic Key Signature (調號) & Header Geometry
        const keySig = this.renderKeySignature(song.key, 86);
        const timeSigX = keySig.width > 0 ? keySig.nextX : 98;
        const headerWidth = Math.max(140, timeSigX + 32);
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

        // Clefs, Key Signature & Time Signature
        svg += `
            <text x="50" y="91" class="clef-symbol" font-size="54" fill="#f8fafc" font-family="'Noto Music', 'Bravura', serif">𝄞</text>
            ${this.renderBassClef(50)}
            
            <!-- Key Signature (調號) -->
            ${keySig.svg}

            <!-- Time Signature -->
            <text x="${timeSigX}" y="68" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[0]}</text>
            <text x="${timeSigX}" y="92" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[1]}</text>
            <text x="${timeSigX}" y="188" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[0]}</text>
            <text x="${timeSigX}" y="212" font-size="22" font-weight="bold" fill="#e2b714" text-anchor="middle">${song.timeSignature.split('/')[1]}</text>
        `;

        // Measure Bars & Notes
        let currentMeasure = 1;
        svg += `<g class="song-notes-group">`;

        song.notes.forEach((note, index) => {
            const x = headerWidth + index * noteSpacing;
            const noteInfo = this.midiToNoteInfo(note.midi);
            const clef = note.clef || (noteInfo.diatonicStep >= 0 ? 'treble' : 'bass');
            const y = this.getYForDiatonicStep(noteInfo.diatonicStep, clef);
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
            svg += this.calculateLedgerLines(noteInfo.diatonicStep, x, clef);

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
                // In bass staff, Line 1 is y=214; place tenuto clearly below Line 1 (y=222) if note is near bottom of staff
                const tenutoY = y > 130 ? Math.max(y + 12, 222) : Math.min(y - 12, 38);
                tenutoSvg = `<line x1="${x - 7}" y1="${tenutoY}" x2="${x + 7}" y2="${tenutoY}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
            }

            const labelY = y > 130 ? (note.tenuto ? 237 : y + 26) : (note.tenuto ? 24 : y - 22);

            svg += `
                <g class="song-note-item" id="song-note-${index}" data-index="${index}" style="cursor: pointer;">
                    <ellipse cx="${x}" cy="${y}" rx="6.5" ry="4.8" transform="rotate(-22 ${x} ${y})" fill="${fill}" stroke="${stroke}" stroke-width="${isHollow ? 2 : 1}"/>
                    ${this.renderStem(noteInfo.diatonicStep, x, y, color)}
                    ${tenutoSvg}
                    <text x="${x}" y="${labelY}" text-anchor="middle" font-size="10" fill="#cbd5e1" class="note-name-label">
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
