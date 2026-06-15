let audioContextRef: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContextRef) {
    audioContextRef = new AudioContextCtor();
  }

  return audioContextRef;
}

export async function playMessageSound() {
  const audioContext = getAudioContext();

  if (!audioContext) {
    return;
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }

  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();

  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.085, now + 0.012);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  masterGain.connect(audioContext.destination);

  const lowTone = audioContext.createOscillator();
  const highTone = audioContext.createOscillator();

  lowTone.type = 'sine';
  lowTone.frequency.setValueAtTime(740, now);
  lowTone.frequency.exponentialRampToValueAtTime(620, now + 0.22);

  highTone.type = 'triangle';
  highTone.frequency.setValueAtTime(1110, now);
  highTone.frequency.exponentialRampToValueAtTime(920, now + 0.16);

  const highToneGain = audioContext.createGain();
  highToneGain.gain.setValueAtTime(0.32, now);
  highToneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  lowTone.connect(masterGain);
  highTone.connect(highToneGain);
  highToneGain.connect(masterGain);

  lowTone.start(now);
  highTone.start(now);

  lowTone.stop(now + 0.22);
  highTone.stop(now + 0.16);
}
