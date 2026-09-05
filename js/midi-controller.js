/**
 * Piano Sheet Studio - Web MIDI Controller
 * Listens for hardware USB electronic pianos and MIDI input devices.
 */

class MidiController {
    constructor(options = {}) {
        this.onNoteOn = options.onNoteOn || (() => {});
        this.onNoteOff = options.onNoteOff || (() => {});
        this.onSustain = options.onSustain || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});

        this.midiAccess = null;
        this.connectedDevices = [];
        this.isSupported = !!(navigator.requestMIDIAccess);

        this.init();
    }

    async init() {
        if (!this.isSupported) {
            this.onStatusChange({
                supported: false,
                connected: false,
                deviceNames: []
            });
            return;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.updateDevices();

            this.midiAccess.onstatechange = () => {
                this.updateDevices();
            };
        } catch (err) {
            console.warn('MIDI Access request was denied or not available:', err);
            this.onStatusChange({
                supported: true,
                connected: false,
                deviceNames: [],
                error: err.message
            });
        }
    }

    updateDevices() {
        if (!this.midiAccess) return;

        this.connectedDevices = [];
        const inputs = this.midiAccess.inputs.values();

        for (const input of inputs) {
            input.onmidimessage = (msg) => this.handleMidiMessage(msg);
            this.connectedDevices.push(input.name || 'MIDI 裝置');
        }

        const isConnected = this.connectedDevices.length > 0;
        this.onStatusChange({
            supported: true,
            connected: isConnected,
            deviceNames: this.connectedDevices
        });
    }

    handleMidiMessage(event) {
        const [statusByte, noteNumber, velocityByte] = event.data;
        const command = statusByte >> 4;
        const velocity = velocityByte / 127;

        // Note On (command 9 = 0x9)
        if (command === 9) {
            if (velocityByte > 0) {
                this.onNoteOn(noteNumber, velocity);
            } else {
                // Some MIDI controllers send Note On with 0 velocity as Note Off
                this.onNoteOff(noteNumber);
            }
        }
        // Note Off (command 8 = 0x8)
        else if (command === 8) {
            this.onNoteOff(noteNumber);
        }
        // Control Change (command 11 = 0xB)
        else if (command === 11) {
            const controllerNumber = noteNumber;
            const controllerValue = velocityByte;
            // CC 64 = Sustain / Damper Pedal
            if (controllerNumber === 64) {
                const isPedalDown = controllerValue >= 64;
                this.onSustain(isPedalDown);
            }
        }
    }
}

window.MidiController = MidiController;
