// Sesler dosyasız: hepsi tarayıcıda üretilir. İlk dokunuşta açılır.
let ac = null, ana = null;

export function sesAc() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  ana = ac.createGain(); ana.gain.value = 0.5; ana.connect(ac.destination);
}

function nota(frekans, sure, { tur = 'sine', ses = 0.3, gecikme = 0, bitis = null, atak = 0.005 } = {}) {
  if (!ac) return;
  const t = ac.currentTime + gecikme;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = tur; o.frequency.setValueAtTime(frekans, t);
  if (bitis) o.frequency.exponentialRampToValueAtTime(bitis, t + sure);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(ses, t + atak);
  g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  o.connect(g); g.connect(ana); o.start(t); o.stop(t + sure + 0.02);
}

function gurultu(sure, { ses = 0.2, gecikme = 0, frekans = 1200, q = 0.8, tur = 'bandpass' } = {}) {
  if (!ac) return;
  const t = ac.currentTime + gecikme, n = Math.floor(ac.sampleRate * sure);
  const tampon = ac.createBuffer(1, n, ac.sampleRate), d = tampon.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const k = ac.createBufferSource(); k.buffer = tampon;
  const f = ac.createBiquadFilter(); f.type = tur; f.frequency.value = frekans; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = ses;
  k.connect(f); f.connect(g); g.connect(ana); k.start(t);
}

export const ses = {
  tik: () => nota(880, 0.05, { tur: 'triangle', ses: 0.12 }),
  kol: () => gurultu(0.03, { ses: 0.1, frekans: 2400, q: 2 }),
  dugme: () => { nota(170, 0.12, { tur: 'square', ses: 0.14, bitis: 90 }); gurultu(0.05, { ses: 0.15, frekans: 700 }); },
  kagit: () => gurultu(0.22, { ses: 0.16, frekans: 3200, q: 0.6 }),
  kart: () => gurultu(0.12, { ses: 0.12, frekans: 1800, q: 0.5 }),
  damga: () => { nota(120, 0.14, { tur: 'sine', ses: 0.5, bitis: 55 }); gurultu(0.06, { ses: 0.22, frekans: 400, tur: 'lowpass' }); },
  dogru: () => { nota(660, 0.12, { tur: 'triangle', ses: 0.2 }); nota(990, 0.2, { tur: 'triangle', ses: 0.2, gecikme: 0.08 }); },
  yanlis: () => { nota(220, 0.16, { tur: 'sawtooth', ses: 0.1, bitis: 150 }); },
  tepsi: () => { nota(240, 0.09, { tur: 'sine', ses: 0.3, bitis: 140 }); gurultu(0.05, { ses: 0.1, frekans: 900 }); },
  ibre: v => nota(300 + v * 500, 0.09, { tur: 'triangle', ses: 0.1 }),
  zafer: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, 0.28, { tur: 'triangle', ses: 0.2, gecikme: i * 0.11 })),
  olmadi: () => [392, 330, 262].forEach((f, i) => nota(f, 0.25, { tur: 'triangle', ses: 0.16, gecikme: i * 0.13 })),
};
