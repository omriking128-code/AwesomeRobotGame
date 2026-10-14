let ctx: AudioContext | null = null

export function unlockAudio() {
  const AudioCtx = window.AudioContext
  if (!AudioCtx) return
  if (!ctx) ctx = new AudioCtx()
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, duration: number, type: OscillatorType, gain: number) {
  if (!ctx) return
  const start = ctx.currentTime
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration)
}

export function playHit() {
  tone(96, 0.12, 'square', 0.045)
  tone(180, 0.08, 'sawtooth', 0.02)
}

export function playDodge() {
  tone(540, 0.08, 'square', 0.03)
}

export function playDown() {
  tone(150, 0.28, 'sawtooth', 0.05)
  tone(70, 0.34, 'square', 0.04)
}

export function playWin() {
  ;[523, 659, 784].forEach((freq, index) => {
    window.setTimeout(() => tone(freq, 0.14, 'square', 0.04), index * 90)
  })
}

export function playLose() {
  tone(220, 0.18, 'sawtooth', 0.04)
  window.setTimeout(() => tone(140, 0.28, 'square', 0.04), 140)
}

export function playBuy() {
  tone(680, 0.07, 'square', 0.03)
}
