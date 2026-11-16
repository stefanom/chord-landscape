/* Chord Landscape. A sampled grand piano, with a small synth as the fallback. */
'use strict';

/* ===== sound: sampled grand piano (Salamander), with a small synth as the fallback until the samples are decoded ===== */
const Snd = (() => {
  let ac, out, bufs = null, loading = false, loaded = null;
  const SMP = { C2: 36, Ds2: 39, Fs2: 42, A2: 45, C3: 48, Ds3: 51, Fs3: 54, A3: 57, C4: 60, Ds4: 63, Fs4: 66, A4: 69, C5: 72, Ds5: 75, Fs5: 78, A5: 81 };
  function ctx() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      out = ac.createGain(); out.gain.value = 0.9; out.connect(comp); comp.connect(ac.destination);
      load();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  /* Where the recordings come from. The single-file build carries them inside the page; served over http(s) they are
     fetched from assets/piano/. Opened straight from disk without a build there are none, and the synth plays instead. */
  let raw = null;
  function fetchRaw() {
    if (raw) return raw;
    const names = Object.keys(SMP), el = document.getElementById('piano-samples');
    if (el) {
      let data = {}; try { data = JSON.parse(el.textContent); } catch (e) { /* unreadable: the synth plays */ }
      raw = names.map(n => {
        if (!data[n]) return Promise.resolve(null);
        const bin = atob(data[n]), u8 = new Uint8Array(bin.length);
        for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
        return Promise.resolve(u8.buffer);
      });
    } else if (/^https?:$/.test(location.protocol)) raw = names.map(n => fetch(`assets/piano/${n}.mp3`).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
    else raw = names.map(() => Promise.resolve(null));
    return raw;
  }
  function load() {
    if (loading) return; loading = true;
    const got = {}, names = Object.keys(SMP);
    loaded = Promise.all(fetchRaw().map((p, i) => p.then(buf => buf && new Promise(res => {
      try {
        ac.decodeAudioData(buf, b => {
          const ch = b.getChannelData(0); let k = 0;
          while (k < ch.length && Math.abs(ch[k]) < 0.003) k++;          // skip the encoder's lead-in so the attack is immediate
          got[SMP[names[i]]] = { b, lead: Math.max(0, k / b.sampleRate - 0.002) }; res();
        }, () => res());
      } catch (e) { res(); }
    })))).then(() => { if (Object.keys(got).length >= 8) bufs = got; });
  }
  function sample(m, t, dur, vel) {
    let s = null;
    Object.keys(bufs).forEach(k => { if (s == null || Math.abs(k - m) < Math.abs(s - m)) s = Number(k); });
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = bufs[s].b; src.playbackRate.value = Math.pow(2, (m - s) / 12);
    g.gain.setValueAtTime(vel, t); g.gain.setValueAtTime(vel, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4); // damper
    src.connect(g); g.connect(out); src.start(t, bufs[s].lead); src.stop(t + dur + 0.45);
  }
  function synth(m, t, dur, vel) {
    const a = ac, f = 440 * Math.pow(2, (m - 69) / 12), g = a.createGain(), lp = a.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(6000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(vel * 0.35, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    [['triangle', 1, 1], ['sine', 2, 0.25], ['sine', 1.003, 0.5]].forEach(([type, mult, amp]) => {
      const o = a.createOscillator(), og = a.createGain(); o.type = type; o.frequency.value = f * mult; og.gain.value = amp; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.3);
    });
    lp.connect(g); g.connect(out);
  }
  /* loud = 1 is a firm single note; chords pass less per note */
  const tone = (m, t, dur, loud) => (bufs ? sample(m, t, dur, 0.75 * loud) : synth(m, t, dur, 0.2 * loud));
  /* the very first sound waits a moment for the samples, so it is already a piano */
  function soon(fn) {
    try { ctx(); } catch (e) { return; }
    if (bufs || !loaded) return fn();
    Promise.race([loaded, new Promise(r => setTimeout(r, 700))]).then(fn);
  }
  function chord(v, dur) { soon(() => { const t = ac.currentTime + 0.02; tone(v.bass, t, dur, 0.9); v.rh.forEach((m, i) => tone(m, t + 0.014 * i, dur, 0.62)); }); }
  function note(m, dur) { soon(() => tone(m, ac.currentTime + 0.005, dur, 1)); }
  function warm() { try { ctx(); } catch (e) { /* no audio */ } }
  return { chord, note, warm, prefetch: fetchRaw, ready: () => !!bufs, leads: () => (bufs ? Object.keys(bufs).map(k => Math.round(bufs[k].lead * 1000)) : null) };
})();
