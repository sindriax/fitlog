let context: AudioContext | null = null;
let scheduled: OscillatorNode[] = [];

// Must run inside a tap handler: iOS only allows audio started from a user gesture.
export function scheduleBeep(inSeconds: number) {
	cancelBeep();
	const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	if (!Ctx) return;
	context ??= new Ctx();
	if (context.state === 'suspended') context.resume();

	const start = context.currentTime + Math.max(0, inSeconds);
	scheduled = [0, 0.25, 0.5].map((offset) => {
		const osc = context!.createOscillator();
		const gain = context!.createGain();
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0.2, start + offset);
		gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.18);
		osc.connect(gain).connect(context!.destination);
		osc.start(start + offset);
		osc.stop(start + offset + 0.2);
		return osc;
	});
}

export function cancelBeep() {
	for (const osc of scheduled) {
		try {
			osc.stop();
		} catch {
			// already stopped
		}
	}
	scheduled = [];
}
