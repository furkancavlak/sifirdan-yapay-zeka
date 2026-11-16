// Küçük yardımcılar: zamanlı hareket (tween), yumuşatma eğrileri, bekleme.

export const E = {
  dogrusal: t => t,
  cik3: t => 1 - Math.pow(1 - t, 3),
  gir3: t => t * t * t,
  girCik: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // hedefi biraz aşıp geri gelir (düğme, damga, zıplama)
  asim: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  yay: t => 1 - Math.cos(t * Math.PI * 3.2) * Math.exp(-t * 5.5),
};

const aktif = new Set();

// tween({ sure, gecikme, ease, guncelle(k), bitir }) -> Promise. sure ve gecikme saniyedir.
export function tween({ sure = 0.3, gecikme = 0, ease = E.cik3, guncelle, bitir }) {
  return new Promise(coz => {
    aktif.add({ t: -gecikme, sure: Math.max(sure, 0.0001), ease, guncelle, bitir, coz });
  });
}
export const bekle = sn => tween({ sure: sn });

// Bir nesnenin sayısal alanlarını hedefe götürür: git(mesh.position, { x: 1, y: 2 }, 0.4)
export function git(nesne, hedef, sure = 0.3, ease = E.cik3, gecikme = 0) {
  let bas = null;
  return tween({
    sure, gecikme, ease,
    guncelle: k => {
      if (!bas) { bas = {}; for (const a in hedef) bas[a] = nesne[a]; }
      for (const a in hedef) nesne[a] = bas[a] + (hedef[a] - bas[a]) * k;
    },
  });
}

export function adim(dt) {
  for (const w of aktif) {
    w.t += dt;
    if (w.t < 0) continue;
    const k = Math.min(w.t / w.sure, 1);
    if (w.guncelle) w.guncelle(w.ease(k), k);
    if (k >= 1) { aktif.delete(w); if (w.bitir) w.bitir(); w.coz(); }
  }
}

export const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
export const karis = (a, b, k) => a + (b - a) * k;
