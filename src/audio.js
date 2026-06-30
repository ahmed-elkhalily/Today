// Ambient focus sounds + clock tick, synthesized with Tone.js.
//
// Drop-in replacement for the previous hand-rolled WebAudio engine: same 12
// ambient types, same tick-tock, same volume mapping and lifecycle. The
// component owns timer state/persistence and just calls start/stop/setVolume/
// startTick/stopTick — all Tone nodes live here so this stays easy to rip out.
import * as Tone from 'tone'

const MASTER = v => (v / 100) * 0.5

export class AmbientEngine {
  constructor() {
    this.nodes = []      // ambient graph nodes (torn down on stop)
    this.timers = []     // scheduled-event timeouts (fire/cafe/forest/train)
    this.master = null
    this.tickTimer = null
  }

  // Resume the audio context (must be reached from a user gesture once).
  async ensure() {
    if (Tone.getContext().state !== 'running') {
      try { await Tone.start() } catch (e) {}
    }
  }

  _reg(n) { this.nodes.push(n); return n }
  _noise(type) { return this._reg(new Tone.Noise(type).start()) }

  async start(type, volume) {
    await this.ensure()
    this.stop()
    this.master = new Tone.Gain(MASTER(volume)).toDestination()
    this.nodes.push(this.master)
    this._build(type, this.master)
  }

  _build(type, out) {
    const R = n => this._reg(n)
    switch (type) {
      case 'none': break
      case 'white': case 'pink': case 'brown':
        this._noise(type).connect(out); break
      case 'rain': {
        const hp = R(new Tone.Filter(420, 'highpass')), lp = R(new Tone.Filter(7200, 'lowpass')), g = R(new Tone.Gain(0.9))
        this._noise('white').chain(hp, lp, g, out)
        const blp = R(new Tone.Filter(480, 'lowpass')), bg = R(new Tone.Gain(0.3))
        this._noise('brown').chain(blp, bg, out)
        break
      }
      case 'ocean': {
        const lp = R(new Tone.Filter(550, 'lowpass')), g = R(new Tone.Gain(0.5))
        this._noise('brown').chain(lp, g, out)
        R(new Tone.LFO(0.09, 170, 930).start()).connect(lp.frequency)
        R(new Tone.LFO(0.09, 0.2, 0.7).start()).connect(g.gain)
        break
      }
      case 'wind': {
        const lp = R(new Tone.Filter(500, 'lowpass')); lp.Q.value = 4
        const g = R(new Tone.Gain(0.7))
        this._noise('brown').chain(lp, g, out)
        R(new Tone.LFO(0.12, 180, 820).start()).connect(lp.frequency)
        R(new Tone.LFO(0.07, 0.4, 1.0).start()).connect(g.gain)
        break
      }
      case 'fire': {
        const blp = R(new Tone.Filter(420, 'lowpass')), bg = R(new Tone.Gain(0.42))
        this._noise('brown').chain(blp, bg, out)
        this._schedule(() => this._pop(out, { f: 1400 + Math.random() * 2600, dur: 0.03 + Math.random() * 0.06, gain: 0.25 + Math.random() * 0.4, kind: 'band', q: 2 }), () => 40 + Math.random() * 180)
        break
      }
      case 'train': {
        const blp = R(new Tone.Filter(240, 'lowpass')), bg = R(new Tone.Gain(0.5))
        this._noise('brown').chain(blp, bg, out)
        this._schedule(() => {
          this._pop(out, { f: 180, dur: 0.05, gain: 0.5, kind: 'low' })
          this.timers.push(setTimeout(() => this._pop(out, { f: 180, dur: 0.05, gain: 0.42, kind: 'low' }), 150))
        }, () => 900)
        break
      }
      case 'cafe': {
        const bp = R(new Tone.Filter(900, 'bandpass')); bp.Q.value = 0.7
        const g = R(new Tone.Gain(0.5))
        this._noise('brown').chain(bp, g, out)
        R(new Tone.LFO(0.5, 0.32, 0.68).start()).connect(g.gain)
        this._schedule(() => this._pop(out, { f: 2600 + Math.random() * 2400, dur: 0.09, gain: 0.1, kind: 'ring', q: 9 }), () => 2200 + Math.random() * 5200)
        break
      }
      case 'forest': {
        const lp = R(new Tone.Filter(900, 'lowpass')), g = R(new Tone.Gain(0.28))
        this._noise('pink').chain(lp, g, out)
        this._schedule(() => this._chirp(out), () => 1400 + Math.random() * 4200)
        break
      }
      case 'stream': {
        const bp = R(new Tone.Filter(1800, 'bandpass')); bp.Q.value = 0.6
        const g = R(new Tone.Gain(0.5))
        this._noise('white').chain(bp, g, out)
        R(new Tone.LFO(3.5, 1150, 2450).start()).connect(bp.frequency)
        break
      }
      default: this._noise('brown').connect(out)
    }
  }

  // Recurring randomized one-shots; stops cleanly when the graph is torn down.
  _schedule(fn, delayFn) {
    const run = () => {
      if (!this.master) return
      try { fn() } catch (e) {}
      this.timers.push(setTimeout(run, delayFn()))
    }
    this.timers.push(setTimeout(run, delayFn()))
  }

  // Filtered noise click — fire crackle, train chug, cafe clink.
  _pop(out, o) {
    try {
      const filt = new Tone.Filter(o.f, o.kind === 'low' ? 'lowpass' : 'bandpass')
      if (o.kind === 'low') filt.frequency.value = o.f * 2.2
      else filt.Q.value = o.q || 2
      const ns = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.004, decay: o.dur, sustain: 0, release: 0.02 }, volume: Tone.gainToDb(o.gain) })
      ns.chain(filt, out)
      ns.triggerAttackRelease(o.dur)
      this.timers.push(setTimeout(() => { try { ns.dispose(); filt.dispose() } catch (e) {} }, (o.dur + 0.3) * 1000))
    } catch (e) {}
  }

  // Bird chirp — short rising sine, sometimes doubled.
  _chirp(out) {
    try {
      const reps = Math.random() < 0.4 ? 2 : 1
      for (let r = 0; r < reps; r++) {
        const base = 2100 + Math.random() * 1400
        const o = new Tone.Oscillator(base, 'sine')
        const env = new Tone.AmplitudeEnvelope({ attack: 0.02, decay: 0.14, sustain: 0, release: 0.02 })
        o.chain(env, out)
        const t0 = Tone.now() + r * 0.18
        o.frequency.setValueAtTime(base, t0)
        o.frequency.linearRampToValueAtTime(base + (Math.random() * 700 - 150), t0 + 0.11)
        env.gain.value = 0.07
        o.start(t0); env.triggerAttackRelease(0.16, t0); o.stop(t0 + 0.3)
        this.timers.push(setTimeout(() => { try { o.dispose(); env.dispose() } catch (e) {} }, (r * 0.18 + 0.6) * 1000))
      }
    } catch (e) {}
  }

  setVolume(volume) { if (this.master) this.master.gain.rampTo(MASTER(volume), 0.05) }

  stop() {
    this.timers.forEach(id => clearTimeout(id)); this.timers = []
    this.nodes.forEach(n => { try { if (n.stop) n.stop() } catch (e) {} try { n.dispose() } catch (e) {} })
    this.nodes = []; this.master = null
  }

  // ---- clock tick ----
  // getVolume / isRunning are functions so the tick tracks live timer state.
  async startTick(getVolume, isRunning) {
    this.stopTick()
    await this.ensure()
    let n = 0
    const fire = (high) => {
      try {
        const filt = new Tone.Filter(high ? 2700 : 2050, 'bandpass'); filt.Q.value = 7
        const vol = (getVolume() / 100) * 0.22 + 0.06
        const ns = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.045, sustain: 0 }, volume: Tone.gainToDb(vol) })
        ns.chain(filt, Tone.getDestination())
        ns.triggerAttackRelease(0.05)
        setTimeout(() => { try { ns.dispose(); filt.dispose() } catch (e) {} }, 300)
      } catch (e) {}
    }
    fire(true); n++
    this.tickTimer = setInterval(() => { if (isRunning && !isRunning()) return; fire(n % 2 === 0); n++ }, 1000)
  }
  stopTick() { if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null } }

  dispose() { this.stop(); this.stopTick() }
}
