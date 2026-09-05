/**
 * Piano Sheet Studio - Interactive Virtual Piano Keyboard
 * Supports 37/49/61/88 keys, mouse glissando, multi-touch, QWERTY keyboard shortcuts,
 * and key label toggling (Note names, Solfege, Numbered notation, Keyboard keys).
 */

class PianoView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onNoteOn = options.onNoteOn || (() => {});
        this.onNoteOff = options.onNoteOff || (() => {});

        this.keyRange = options.keyRange || 61; // 37, 49, 61, 88
        this.labelType = options.labelType || 'note'; // 'note', 'solfege', 'number', 'keyboard', 'none'
        this.isMouseDown = false;
        this.activeKeys = new Set(); // Set of currently active MIDI note numbers

        // Keyboard Shortcut Mapping to MIDI Notes (Centered around C4 = 60)
        // Two rich octaves playable via standard QWERTY keyboard
        this.keyMap = {
            // Lower octave (C3 - B3)
            'KeyZ': 48, 'KeyS': 49, 'KeyX': 50, 'KeyD': 51, 'KeyC': 52,
            'KeyV': 53, 'KeyG': 54, 'KeyB': 55, 'KeyH': 56, 'KeyN': 57,
            'KeyJ': 58, 'KeyM': 59,

            // Middle octave (C4 - B4)
            'KeyQ': 60, 'Digit2': 61, 'KeyW': 62, 'Digit3': 63, 'KeyE': 64,
            'KeyR': 65, 'Digit5': 66, 'KeyT': 67, 'Digit6': 68, 'KeyY': 69,
            'Digit7': 70, 'KeyU': 71,

            // Upper octave (C5 - G5)
            'KeyI': 72, 'Digit9': 73, 'KeyO': 74, 'Digit0': 75, 'KeyP': 76,
            'BracketLeft': 77, 'Equal': 78, 'BracketRight': 79
        };

        // Reverse map for displaying shortcut keys on the piano
        this.midiToShortcut = {};
        for (const [code, midi] of Object.entries(this.keyMap)) {
            let label = code.replace('Key', '').replace('Digit', '');
            if (code === 'BracketLeft') label = '[';
            if (code === 'BracketRight') label = ']';
            if (code === 'Equal') label = '=';
            this.midiToShortcut[midi] = label;
        }

        this.pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.solfegeNames = ['Do', 'Di', 'Re', 'Ri', 'Mi', 'Fa', 'Fi', 'Sol', 'Si', 'La', 'Li', 'Ti'];
        this.numberedNotation = ['1', '#1', '2', '#2', '3', '4', '#4', '5', '#5', '6', '#6', '7'];

        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    setKeyRange(range) {
        this.keyRange = parseInt(range, 10);
        this.render();
    }

    setLabelType(type) {
        this.labelType = type;
        this.render();
    }

    getRangeBounds() {
        switch (this.keyRange) {
            case 37:
                return { start: 48, end: 84 }; // C3 - C6
            case 49:
                return { start: 36, end: 84 }; // C2 - C6
            case 61:
            default:
                return { start: 36, end: 96 }; // C2 - C7
            case 88:
                return { start: 21, end: 108 }; // A0 - C8
        }
    }

    render() {
        const { start, end } = this.getRangeBounds();
        this.container.innerHTML = '';

        const pianoWrapper = document.createElement('div');
        pianoWrapper.className = `piano-keyboard-wrapper range-${this.keyRange}`;

        // Create keys
        for (let midi = start; midi <= end; midi++) {
            const noteIndex = midi % 12;
            const octave = Math.floor(midi / 12) - 1;
            const isBlack = [1, 3, 6, 8, 10].includes(noteIndex);
            const pitchName = this.pitchNames[noteIndex];
            const isMiddleC = midi === 60;

            const keyEl = document.createElement('div');
            keyEl.className = `piano-key ${isBlack ? 'black-key' : 'white-key'} ${isMiddleC ? 'middle-c' : ''}`;
            keyEl.dataset.midi = midi;
            keyEl.dataset.pitch = `${pitchName}${octave}`;

            // Label container
            const labelEl = document.createElement('div');
            labelEl.className = 'key-label';
            labelEl.innerHTML = this.getLabelContent(midi, noteIndex, octave);
            keyEl.appendChild(labelEl);

            if (isMiddleC) {
                const middleIndicator = document.createElement('div');
                middleIndicator.className = 'middle-c-indicator';
                middleIndicator.title = '中央 C (Middle C / C4)';
                keyEl.appendChild(middleIndicator);
            }

            pianoWrapper.appendChild(keyEl);
        }

        this.container.appendChild(pianoWrapper);

        // Auto-center keyboard view to Middle C area
        setTimeout(() => {
            const middleCEl = this.container.querySelector('.piano-key.middle-c');
            if (middleCEl && this.container.scrollWidth > this.container.clientWidth) {
                const scrollPos = middleCEl.offsetLeft - this.container.clientWidth / 2 + 20;
                this.container.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
            }
        }, 100);
    }

    getLabelContent(midi, noteIndex, octave) {
        if (this.labelType === 'none') return '';

        const pitchName = this.pitchNames[noteIndex];
        const solfege = this.solfegeNames[noteIndex];
        const number = this.numberedNotation[noteIndex];
        const shortcut = this.midiToShortcut[midi] || '';

        switch (this.labelType) {
            case 'note':
                return `<span class="primary-lbl">${pitchName}</span><span class="sub-lbl">${octave}</span>`;
            case 'solfege':
                return `<span class="primary-lbl">${solfege}</span>`;
            case 'number':
                return `<span class="primary-lbl">${number}</span>`;
            case 'keyboard':
                return shortcut ? `<kbd class="kbd-badge">${shortcut}</kbd>` : '';
            default:
                return `<span class="primary-lbl">${pitchName}</span>`;
        }
    }

    bindEvents() {
        // Global Mouse Up
        window.addEventListener('mouseup', () => {
            if (this.isMouseDown) {
                this.isMouseDown = false;
                this.releaseAllNotes();
            }
        });

        // Mouse Down on Keyboard Area
        this.container.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isMouseDown = true;
            const keyEl = e.target.closest('.piano-key');
            if (keyEl) {
                const midi = parseInt(keyEl.dataset.midi, 10);
                this.pressKey(midi, 0.85);
            }
        });

        // Glissando / Mouse Drag
        this.container.addEventListener('mouseover', (e) => {
            if (!this.isMouseDown) return;
            const keyEl = e.target.closest('.piano-key');
            if (keyEl) {
                const midi = parseInt(keyEl.dataset.midi, 10);
                if (!this.activeKeys.has(midi)) {
                    this.releaseAllNotes();
                    this.pressKey(midi, 0.8);
                }
            }
        });

        this.container.addEventListener('mouseout', (e) => {
            if (!this.isMouseDown) return;
            const keyEl = e.target.closest('.piano-key');
            if (keyEl) {
                const midi = parseInt(keyEl.dataset.midi, 10);
                this.releaseKey(midi);
            }
        });

        // Touch Support
        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const keyEl = el ? el.closest('.piano-key') : null;
                if (keyEl) {
                    const midi = parseInt(keyEl.dataset.midi, 10);
                    this.pressKey(midi, 0.85);
                }
            });
        }, { passive: false });

        this.container.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const keyEl = el ? el.closest('.piano-key') : null;
                if (keyEl) {
                    const midi = parseInt(keyEl.dataset.midi, 10);
                    this.releaseKey(midi);
                }
            });
        }, { passive: false });

        // Physical Keyboard Events (QWERTY)
        window.addEventListener('keydown', (e) => {
            // Avoid capturing input if typing in an input field
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (e.repeat) return; // Ignore autorepeat

            const midi = this.keyMap[e.code];
            if (midi !== undefined) {
                this.pressKey(midi, 0.85);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            const midi = this.keyMap[e.code];
            if (midi !== undefined) {
                this.releaseKey(midi);
            }
        });
    }

    pressKey(midi, velocity = 0.8, isExternal = false, colorMode = null) {
        this.activeKeys.add(midi);
        const keyEl = this.container.querySelector(`.piano-key[data-midi="${midi}"]`);
        if (keyEl) {
            keyEl.classList.add('pressed');
            if (colorMode === 'left') {
                keyEl.classList.add('pressed-left-hand');
            } else if (colorMode === 'right') {
                keyEl.classList.add('pressed-right-hand');
            }
        }

        this.onNoteOn(midi, velocity, isExternal);
    }

    releaseKey(midi) {
        if (!this.activeKeys.has(midi)) return;
        this.activeKeys.delete(midi);

        const keyEl = this.container.querySelector(`.piano-key[data-midi="${midi}"]`);
        if (keyEl) {
            keyEl.classList.remove('pressed', 'pressed-left-hand', 'pressed-right-hand');
        }

        this.onNoteOff(midi);
    }

    releaseAllNotes() {
        for (const midi of Array.from(this.activeKeys)) {
            this.releaseKey(midi);
        }
    }

    highlightKeyHint(midi, active = true) {
        const keyEl = this.container.querySelector(`.piano-key[data-midi="${midi}"]`);
        if (keyEl) {
            if (active) {
                keyEl.classList.add('practice-target');
            } else {
                keyEl.classList.remove('practice-target');
            }
        }
    }

    clearKeyHints() {
        this.container.querySelectorAll('.piano-key.practice-target').forEach(el => {
            el.classList.remove('practice-target');
        });
    }
}

window.PianoView = PianoView;
