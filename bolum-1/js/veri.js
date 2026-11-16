// Tezgâh 1 verisi: 24 hayvan, iki özellik (kulak sivriliği, burun uzunluğu; 0..1, elle verildi).
// "sayfa" çizim sayfasını, "hucre" o sayfadaki 4x3 ızgaranın hücresini (soldan sağa, üstten alta) gösterir.
// takim: "sinav" = iki turda da makinenin sınandığı 10 kart · "ornek" = ikinci turda oyuncunun ayırdığı 12 kart.

export const HAYVANLAR = [
  // kediler
  { id: 'k0', tur: 'kedi', ad: 'tekir', sayfa: 'kedi', hucre: 0, kulak: 0.90, burun: 0.10, takim: 'ornek' },
  { id: 'k1', tur: 'kedi', ad: 'sarman', sayfa: 'kedi', hucre: 1, kulak: 0.85, burun: 0.12, takim: 'ornek' },
  { id: 'k2', tur: 'kedi', ad: 'siyam', sayfa: 'kedi', hucre: 2, kulak: 0.95, burun: 0.28, takim: 'sinav' },
  { id: 'k3', tur: 'kedi', ad: 'oryantal', sayfa: 'kedi', hucre: 3, kulak: 1.00, burun: 0.32, takim: 'sinav' },
  { id: 'k4', tur: 'kedi', ad: 'habeş', sayfa: 'kedi', hucre: 4, kulak: 0.95, burun: 0.26, takim: 'ornek' },
  { id: 'k5', tur: 'kedi', ad: 'sfenks', sayfa: 'kedi', hucre: 5, kulak: 0.95, burun: 0.30, takim: 'sinav' },
  { id: 'k6', tur: 'kedi', ad: 'maine coon', sayfa: 'kedi', hucre: 6, kulak: 0.85, burun: 0.30, takim: 'ornek' },
  { id: 'k7', tur: 'kedi', ad: 'scottish gri', sayfa: 'kedi', hucre: 7, kulak: 0.15, burun: 0.08, takim: 'sinav' },
  { id: 'k8', tur: 'kedi', ad: 'scottish krem', sayfa: 'kedi', hucre: 8, kulak: 0.20, burun: 0.10, takim: 'sinav' },
  { id: 'k9', tur: 'kedi', ad: 'iran', sayfa: 'kedi', hucre: 9, kulak: 0.30, burun: 0.03, takim: 'sinav' },
  { id: 'k10', tur: 'kedi', ad: 'exotic', sayfa: 'kedi', hucre: 10, kulak: 0.45, burun: 0.06, takim: 'ornek' },
  { id: 'k11', tur: 'kedi', ad: 'scottish yavru', sayfa: 'kedi', hucre: 11, kulak: 0.18, burun: 0.10, takim: 'ornek' },
  // köpekler
  { id: 'p0', tur: 'kopek', ad: 'kurt köpeği', sayfa: 'kopek', hucre: 0, kulak: 0.95, burun: 0.80, takim: 'sinav' },
  { id: 'p1', tur: 'kopek', ad: 'husky', sayfa: 'kopek', hucre: 1, kulak: 0.90, burun: 0.60, takim: 'ornek' },
  { id: 'p2', tur: 'kopek', ad: 'corgi', sayfa: 'kopek', hucre: 2, kulak: 0.90, burun: 0.50, takim: 'ornek' },
  { id: 'p3', tur: 'kopek', ad: 'chihuahua', sayfa: 'kopek', hucre: 3, kulak: 0.95, burun: 0.42, takim: 'sinav' },
  { id: 'p4', tur: 'kopek', ad: 'pomeranian', sayfa: 'kopek', hucre: 4, kulak: 0.75, burun: 0.38, takim: 'ornek' },
  { id: 'p5', tur: 'kopek', ad: 'pug', sayfa: 'kopek', hucre: 5, kulak: 0.25, burun: 0.22, takim: 'sinav' },
  { id: 'p6', tur: 'kopek', ad: 'shih tzu', sayfa: 'kopek', hucre: 6, kulak: 0.15, burun: 0.20, takim: 'sinav' },
  { id: 'p7', tur: 'kopek', ad: 'bulldog', sayfa: 'kopek', hucre: 7, kulak: 0.20, burun: 0.26, takim: 'ornek' },
  { id: 'p8', tur: 'kopek', ad: 'boxer', sayfa: 'kopek', hucre: 8, kulak: 0.22, burun: 0.32, takim: 'ornek' },
  { id: 'p9', tur: 'kopek', ad: 'beagle', sayfa: 'kopek', hucre: 9, kulak: 0.05, burun: 0.55, takim: 'ornek' },
  { id: 'p10', tur: 'kopek', ad: 'golden', sayfa: 'kopek', hucre: 10, kulak: 0.10, burun: 0.65, takim: 'yedek' },
  { id: 'p11', tur: 'kopek', ad: 'dachshund', sayfa: 'kopek', hucre: 11, kulak: 0.05, burun: 0.85, takim: 'yedek' },
];

export const SINAV = HAYVANLAR.filter(h => h.takim === 'sinav');
export const ORNEK = HAYVANLAR.filter(h => h.takim === 'ornek');

// Tur 1: tarif. "Kulağı en az şu kadar sivri VE burnu en çok şu kadar uzunsa kedi."
export function tarifTahmin(h, kulakEsik, burunEsik) {
  return (h.kulak >= kulakEsik && h.burun <= burunEsik) ? 'kedi' : 'kopek';
}

// Tur 2: en yakın komşu. etiketler = [{ h, etiket }] (oyuncunun verdiği etiket; yanlış da olabilir).
// Burun farkı biraz ağır sayılır; iki özelliğin ölçeği aynı değil (burun değerleri dar aralıkta).
const BURUN_AGIRLIK = 1.6;
export function komsuTahmin(h, etiketler) {
  if (!etiketler.length) return null;
  let en = null, enD = Infinity;
  for (const e of etiketler) {
    const dk = h.kulak - e.h.kulak, db = (h.burun - e.h.burun) * BURUN_AGIRLIK;
    const d = dk * dk + db * db;
    if (d < enD) { enD = d; en = e; }
  }
  return en.etiket;
}

export function sinavSkoru(tahminFn) {
  let dogru = 0; const sonuc = [];
  for (const h of SINAV) {
    const t = tahminFn(h);
    const ok = t === h.tur;
    if (ok) dogru++;
    sonuc.push({ h, tahmin: t, ok });
  }
  return { dogru, toplam: SINAV.length, sonuc };
}

// İkinci turda kartların sırası: her oyunda karışık, ama ilk dört kartta iki tür de bulunur.
export function ornekSirasi(rastgele = Math.random) {
  const kar = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rastgele() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const k = kar(ORNEK.filter(h => h.tur === 'kedi')), p = kar(ORNEK.filter(h => h.tur === 'kopek'));
  const sira = [];
  while (k.length || p.length) {
    const ikili = [];
    if (k.length) ikili.push(k.pop());
    if (p.length) ikili.push(p.pop());
    sira.push(...kar(ikili));
  }
  return sira;
}
