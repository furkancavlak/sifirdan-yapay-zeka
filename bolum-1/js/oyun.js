// Atölye · 1. tezgâh: "Tarif mi, örnek mi?"
// Tur 1: oyuncu iki kolla kediyi tarif eder, makine 10 hayvanda sınanır.
// Tur 2: oyuncu 12 kartı kedi / köpek diye ayırır, makine bu örneklerden öğrenir (en yakın komşu), aynı 10 hayvanda sınanır.
import * as THREE from 'three';
import { E, tween, git, bekle, adim, karis } from './arac.js';
import * as D from './doku.js';
import { makineKur, tepsiKur, boya } from './makine.js';
import { HAYVANLAR, SINAV, ORNEK, tarifTahmin, komsuTahmin, sinavSkoru, ornekSirasi } from './veri.js';
import { ses, sesAc } from './ses.js';

const YUK = 16, FOV = 20, EN_AZ_GEN = 7.25;
const Z = { duvar: 0.05, kart: 0.4, ahtapot: 0.9, makine: 1.5, tepsi: 1.75, ucan: 2.6 };
const TEZGAH_Y = -5.0, MAKINE_X = 0;
const HIZLI = new URLSearchParams(location.search).has('hizli');

// ---------- düzen: dik ekran (telefon) ya da geniş ekran (bilgisayar) ----------
// Sayfa açılırken bir kez seçilir. Orta sütun (not, kart, makine, tepsiler) iki düzende de aynı yerdedir;
// geniş ekranda sınav ızgarası sol duvara, sayaç, şerit ve Ahtapot sağa taşınır, kamera yaklaşır.
const YATAY = window.innerWidth / window.innerHeight > 1.2;
document.body.classList.toggle('yatay', YATAY);
const L = YATAY
  ? { gor: 11.85, enAz: 20.4, cy: 0.175, tabela: [-8.15, 5.2, 0.75], sayac: [8.6, 4.6], not: [0, 5.3], serit: [6.6, 0.6], ahtapotX: 6.0, izX: -8.2, izAdim: 1.05, izY: [-0.5, -1.77], kucuk: 0.27 }
  : { gor: YUK, enAz: EN_AZ_GEN, cy: 0, tabela: [-0.85, 7.05, 1], sayac: [2.7, 7.0], not: [0, 5.62], serit: [0, -7.3], ahtapotX: 2.85, izX: -2.35, izAdim: 1.1, izY: [4.08, 2.72], kucuk: 0.285 };

// ---------- sahne ----------
const kap = document.getElementById('sahne');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
kap.prepend(renderer.domElement);
const sahne = new THREE.Scene();
sahne.background = new THREE.Color('#f3e3c2');
const kamera = new THREE.PerspectiveCamera(FOV, 9 / 16, 1, 300);
const UZAK = (L.gor / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
function boyutla() {
  const w = kap.clientWidth, h = kap.clientHeight;
  renderer.setSize(w, h, false);
  kamera.aspect = w / h;
  const gorunen = Math.max(L.gor, L.enAz / kamera.aspect); // çok uzun telefonda ya da dar pencerede biraz geri çekil
  kamera.position.z = (gorunen / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  kamera.position.y = L.cy;
  kamera.updateProjectionMatrix();
}
window.addEventListener('resize', boyutla);
sahne.add(new THREE.AmbientLight(0xffffff, 0.95));
const gunes = new THREE.DirectionalLight(0xfff1d6, 1.9); gunes.position.set(-5, 7, 9); sahne.add(gunes);

// ---------- yükleme ----------
const resimYukle = yol => new Promise((coz, red) => { const i = new Image(); i.onload = () => coz(i); i.onerror = () => red(new Error('yüklenemedi: ' + yol)); i.src = yol; });
const resim = {};
async function yukle() {
  const liste = [['arka', 'varlik/arka.webp'], ...['bos', 'bakar', 'saskin', 'mutlu'].map(a => ['ahtapot_' + a, `varlik/ahtapot_${a}.png`]),
    ...[...SINAV, ...ORNEK].map(h => [h.id, `varlik/hayvan/${h.id}.webp`])];
  let biten = 0; const dolu = document.getElementById('dolu');
  await Promise.all([
    document.fonts.load('20px "Paytone One"'), document.fonts.load('600 20px "Baloo 2"'), document.fonts.load('700 20px "Baloo 2"'),
    ...liste.map(([ad, yol]) => resimYukle(yol).then(i => { resim[ad] = i; biten++; dolu.style.width = (100 * biten / liste.length) + '%'; })),
  ]);
}

// ---------- etkileşim ----------
const isin = new THREE.Raycaster(), fare = new THREE.Vector2();
const hedefler = new Set();
let tutulan = null;
function hedef(mesh, olay) { mesh.userData.olay = olay; mesh.userData.acik = true; hedefler.add(mesh); return mesh; }
function hedefSil(mesh) { hedefler.delete(mesh); }
function isinKur(e) {
  const r = renderer.domElement.getBoundingClientRect();
  fare.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  isin.setFromCamera(fare, kamera);
}
function dunyaNokta(e, z) {
  isinKur(e);
  const t = (z - isin.ray.origin.z) / isin.ray.direction.z;
  return isin.ray.origin.clone().addScaledVector(isin.ray.direction, t);
}
renderer.domElement.addEventListener('pointerdown', e => {
  sesAc(); isinKur(e);
  const acik = [...hedefler].filter(m => m.userData.acik && gorunur(m));
  const v = isin.intersectObjects(acik, false)[0];
  if (!v) return;
  tutulan = v.object; renderer.domElement.setPointerCapture(e.pointerId);
  tutulan.userData.olay.bas?.(e, v.point);
});
renderer.domElement.addEventListener('pointermove', e => { fareX = (e.clientX / window.innerWidth) * 2 - 1; tutulan?.userData.olay.surukle?.(e); });
const birak = e => { tutulan?.userData.olay.birak?.(e); tutulan = null; };
renderer.domElement.addEventListener('pointerup', birak);
renderer.domElement.addEventListener('pointercancel', birak);
function gorunur(m) { for (let o = m; o; o = o.parent) if (!o.visible) return false; return true; }
let fareX = 0;

// ---------- kalıcı öğeler ----------
let makine, ahtapot, sayacL, notL, seritL, tarifL, tarifKart, sol, sag;
const ahtapotDoku = {};
const kartOnbellek = new Map();
const damgaL = {};
const izgara = [];

function kur() {
  // arka plan: boş atölye
  const arka = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), new THREE.MeshBasicMaterial({ map: D.resimDokusu(resim.arka) }));
  arka.position.z = -1; arka.scale.setScalar((UZAK + 1) / UZAK); sahne.add(arka);
  if (YATAY) { // geniş ekran: resmin aynalı kopyaları iki yana eklenir (pencere ve raf tamamlanır, tezgâh kesintisiz sürer)
    const s = (UZAK + 1) / UZAK;
    for (const yon of [-1, 1]) {
      const yan = new THREE.Mesh(arka.geometry, new THREE.MeshBasicMaterial({ map: arka.material.map, side: THREE.DoubleSide }));
      yan.position.set(yon * 9 * s, 0, -1); yan.scale.set(-s, s, 1); sahne.add(yan);
    }
  }
  // çok uzun ekranda üstte duvar, altta dolap sürsün: renkleri resmin kenarından al
  const ornekle = document.createElement('canvas'); ornekle.width = 8; ornekle.height = 64;
  const og = ornekle.getContext('2d', { willReadFrequently: true }); og.drawImage(resim.arka, 0, 0, 8, 64);
  const renkAl = y => { const d = og.getImageData(4, y, 1, 1).data; return new THREE.Color(`rgb(${d[0]},${d[1]},${d[2]})`); };
  sahne.background = renkAl(0);
  const dolgu = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: renkAl(63) }));
  dolgu.position.set(0, -17.9, -1.05); sahne.add(dolgu); // çok uzun ekranda tezgâhın altı

  const tab = D.tabela('1. TEZGÂH'); tab.mesh.position.set(L.tabela[0], L.tabela[1], Z.duvar); tab.mesh.scale.setScalar(L.tabela[2]); tab.mesh.rotation.z = 0.008; sahne.add(tab.mesh);
  sayacL = D.sayac(1.55); sayacL.mesh.position.set(L.sayac[0], L.sayac[1], Z.duvar); sahne.add(sayacL.mesh);
  notL = D.notKagidi(6.7, 1.42); notL.mesh.position.set(L.not[0], L.not[1], Z.duvar + 0.05); notL.mesh.rotation.z = -0.008; sahne.add(notL.mesh);
  seritL = D.serit(7.0, 0.92); seritL.mesh.position.set(L.serit[0], L.serit[1], 0.3); sahne.add(seritL.mesh);

  // makine
  makine = makineKur();
  makine.grup.position.set(MAKINE_X, TEZGAH_Y, Z.makine); makine.grup.rotation.x = 0.17; sahne.add(makine.grup);
  const mg = D.golge(5.8, 1.7, 0.6); mg.position.set(MAKINE_X + 0.15, TEZGAH_Y + 0.05, Z.makine - 0.9); sahne.add(mg);

  // Ahtapot
  for (const a of ['bos', 'bakar', 'saskin', 'mutlu']) ahtapotDoku[a] = D.resimDokusu(resim['ahtapot_' + a]);
  ahtapot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: ahtapotDoku.bos, transparent: true, depthWrite: false }));
  ahtapot.position.set(L.ahtapotX, -3.95, Z.ahtapot); sahne.add(ahtapot);
  const ag = D.golge(1.8, 0.5, 0.35); ag.position.set(L.ahtapotX, -3.92, Z.ahtapot - 0.05); sahne.add(ag);
  ahtapotPoz('bos', false);

  // tepsiler (2. turda gelir)
  sol = tepsiKur('KEDİ'); sag = tepsiKur('KÖPEK');
  for (const [t, yon] of [[sol, -1], [sag, 1]]) { t.grup.position.set(yon * 7, TEZGAH_Y - 0.05, Z.tepsi); t.grup.rotation.x = 0.17; t.grup.visible = false; t.x = yon * 2.62; sahne.add(t.grup); }

  damgaL.dogru = D.damga(true); damgaL.yanlis = D.damga(false);
}

const AHTAPOT_BOY = 1.95;
function ahtapotPoz(ad, zipla = true) {
  const d = ahtapotDoku[ad];
  ahtapot.material.map = d;
  const en = AHTAPOT_BOY * d.image.width / d.image.height;
  ahtapot.userData.en = en; ahtapot.userData.poz = ad;
  if (!zipla) { ahtapot.scale.set(en, AHTAPOT_BOY, 1); return; }
  tween({ sure: 0.42, ease: E.yay, guncelle: k => { ahtapot.scale.set(en * karis(1.18, 1, k), AHTAPOT_BOY * karis(0.8, 1, k), 1); } });
}

let notSon = '';
function yaz(metin, baslik = '') {
  if (metin + baslik === notSon) return; notSon = metin + baslik;
  notL.yaz(metin, baslik);
  tween({ sure: 0.4, ease: E.yay, guncelle: k => { const s = karis(0.9, 1, k); notL.mesh.scale.set(s, s, 1); } });
}
function sayacYaz(metin) {
  sayacL.yaz(metin);
  tween({ sure: 0.3, ease: E.yay, guncelle: k => { const s = karis(1.22, 1, k); sayacL.mesh.scale.set(s, s, 1); } });
}

// ---------- kart ----------
function igne() {
  const g = new THREE.Group();
  const k = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: 0x1f1007 })); g.add(k);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), boya(0xc23a22)); b.position.z = 0.06; b.scale.z = 0.7; g.add(b);
  const p = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshBasicMaterial({ color: 0xffe9d0, transparent: true, opacity: 0.8 })); p.position.set(-0.04, 0.04, 0.15); g.add(p);
  return g;
}
function kartKur(h) {
  if (!kartOnbellek.has(h.id)) kartOnbellek.set(h.id, D.kartYuzu(resim[h.id]));
  const l = kartOnbellek.get(h.id), g = new THREE.Group();
  const golge = D.golge(D.KART_W * 1.16, D.KART_H * 1.12, 0.3); golge.position.set(0.1, -0.16, -0.03); g.add(golge);
  const yuz = new THREE.Mesh(l.mesh.geometry, l.mesh.material); g.add(yuz);
  const ig = igne(); ig.position.set(0, D.KART_H / 2 - 0.1, 0.02); g.add(ig);
  g.userData = { h, yuz, ig, golge };
  return g;
}
function damgaKoy(kart, dogru) {
  const l = dogru ? damgaL.dogru : damgaL.yanlis;
  const m = new THREE.Mesh(l.mesh.geometry, l.mesh.material);
  if (kart.userData.damga) kart.remove(kart.userData.damga);
  m.position.set(0.85, -1.2, 0.03); kart.add(m); kart.userData.damga = m;
  tween({ sure: 0.2, ease: E.cik3, guncelle: k => { const s = karis(2.2, 0.95, k); m.scale.set(s, s, 1); } });
}
// deneme ve sınama için: oyunun hangi adımda olduğunu dışarıya söyler
function asama(ad) { if (window.__atolye) window.__atolye.asama = ad; }

// ---------- düğmeler ----------
function dugmeSor(secenekler) {
  return new Promise(coz => {
    const acik = [];
    secenekler.forEach((s, i) => {
      const l = D.plaka(s.metin, s.renk || D.RENK.hardal, s.w || 3.9, 0.95);
      l.mesh.position.set(s.x ?? -0.15, s.y, Z.kart + 0.2); l.mesh.scale.set(0.001, 0.001, 1); sahne.add(l.mesh);
      git(l.mesh.scale, { x: 1, y: 1 }, 0.35, E.asim, i * 0.1);
      hedef(l.mesh, {
        bas: async () => {
          acik.forEach(a => { a.userData.acik = false; });
          ses.dugme();
          await git(l.mesh.scale, { x: 0.92, y: 0.92 }, 0.07);
          await git(l.mesh.scale, { x: 1, y: 1 }, 0.12, E.asim);
          await Promise.all(acik.map(a => git(a.scale, { x: 0.001, y: 0.001 }, 0.2, E.gir3)));
          acik.forEach(a => { hedefSil(a); sahne.remove(a); });
          coz(s.deger);
        },
      });
      acik.push(l.mesh);
    });
  });
}

// ---------- sınav: makine 10 hayvana bakar ----------
const IZGARA_X = L.izX, IZGARA_Y = L.izY, KUCUK = L.kucuk;
async function sinavKos(tahminFn, hiz = 1) {
  if (HIZLI) hiz = 0.15;
  const sonuc = []; let dogru = 0;
  sayacYaz('0 / 10');
  for (let i = 0; i < SINAV.length; i++) {
    const h = SINAV[i], k = kartKur(h);
    k.position.set(7, 1.6, Z.ucan); k.rotation.z = -0.45; k.scale.setScalar(0.78); sahne.add(k);
    ses.kart();
    await Promise.all([git(k.position, { x: -0.15, y: 0.42, z: Z.kart + 0.5 }, 0.34 * hiz), git(k.rotation, { z: (i % 2 ? 1 : -1) * 0.025 }, 0.34 * hiz)]);
    ahtapotPoz('bakar', false);
    await bekle(0.14 * hiz);
    const t = tahminFn(h), ok = t === h.tur;
    makine.sars(0.012, 0.22); ses.kagit();
    await makine.fisBas(t === 'kedi' ? 'KEDİ' : 'KÖPEK', 0.2 * hiz);
    await bekle(0.16 * hiz);
    damgaKoy(k, ok); ses.damga(); (ok ? ses.dogru : ses.yanlis)();
    if (ok) dogru++;
    sayacYaz(`${dogru} / 10`);
    ahtapotPoz(ok ? 'mutlu' : 'saskin');
    await bekle(0.5 * hiz);
    makine.fisCek(0.12);
    const hx = IZGARA_X + (i % 5) * L.izAdim, hy = IZGARA_Y[Math.floor(i / 5)];
    git(k.position, { x: hx, y: hy, z: Z.kart + i * 0.006 }, 0.36 * hiz, E.girCik);
    git(k.scale, { x: KUCUK, y: KUCUK, z: KUCUK }, 0.36 * hiz, E.girCik);
    git(k.rotation, { z: ((i * 37) % 7 - 3) * 0.012 }, 0.36 * hiz);
    izgara.push(k); sonuc.push({ h, tahmin: t, ok });
    await bekle(0.2 * hiz);
  }
  await bekle(0.35);
  return { dogru, sonuc };
}
async function izgaraTemizle() {
  const hepsi = izgara.splice(0);
  await Promise.all(hepsi.map((k, i) => git(k.position, { y: 12 }, 0.3, E.gir3, i * 0.02)));
  hepsi.forEach(k => sahne.remove(k));
}

// ---------- 1. tur: tarif ----------
let kolAcik = false, tarifKirli = false;
function kollariKur() {
  for (const ad of ['kulak', 'burun']) {
    const k = makine.kollar[ad];
    const oyna = e => {
      if (!kolAcik) return;
      const p = dunyaNokta(e, makine.grup.position.z + 0.56);
      const v = makine.kolDegeri(p.x - makine.grup.position.x);
      if (Math.round(v * 20) !== Math.round(k.deger * 20)) ses.kol();
      makine.kolAyarla(ad, v); tarifKirli = true;
    };
    hedef(k.alan, { bas: oyna, surukle: oyna });
  }
}
let dugmeCoz = null;
function dugmeKur() {
  hedef(makine.dugmeAlani, { bas: () => { if (dugmeCoz) { const c = dugmeCoz; dugmeCoz = null; ses.dugme(); makine.dugmeBas(); c(); } } });
}
async function tur1(deneme) {
  if (!tarifKart) {
    tarifL = D.tarifKarti();
    tarifKart = new THREE.Group();
    const golge = D.golge(D.KART_W * 1.16, D.KART_H * 1.12, 0.3); golge.position.set(0.1, -0.16, -0.03);
    const ig = igne(); ig.position.set(0, D.KART_H / 2 - 0.1, 0.02);
    tarifKart.add(golge, tarifL.mesh, ig); sahne.add(tarifKart);
  }
  tarifL.ciz(makine.kollar.kulak.deger, makine.kollar.burun.deger);
  tarifKart.position.set(-0.15, 12, Z.kart + 0.3); tarifKart.rotation.z = 0.02; tarifKart.visible = true;
  yaz(deneme === 1 ? 'Kediyi tarif et. İki kolu kaydır, sonra DENE düğmesine bas.' : 'Tarifi değiştir. Sonra yine DENE düğmesine bas.', `1. TUR · TARİF${deneme > 1 ? ' · ' + deneme + '. DENEME' : ''}`);
  sayacYaz('– / 10');
  ses.kart();
  await git(tarifKart.position, { y: 2.05 }, 0.5, E.asim);
  kolAcik = true;
  await new Promise(c => { dugmeCoz = c; });
  kolAcik = false;
  const kulak = makine.kollar.kulak.deger, burun = makine.kollar.burun.deger;
  await bekle(0.25);
  await git(tarifKart.position, { y: 12 }, 0.35, E.gir3); tarifKart.visible = false;
  yaz(deneme === 1 ? 'Makine senin tarifinle 10 hayvana bakıyor.' : 'Makine aynı 10 hayvana yeniden bakıyor.', '1. TUR · TARİF');
  const r = await sinavKos(h => tarifTahmin(h, kulak, burun), deneme === 1 ? 1 : 0.6);
  return { kulak, burun, skor: r.dogru, sonuc: r.sonuc };
}
// Tarifin yanıldığı hayvanı öne getirir, nedenini yazar (her türden en çok bir hayvan).
function tarifNeden(h, kulak, burun) {
  if (h.tur === 'kopek') return 'Bu bir köpek. Ama tarifine uyuyor, makine kedi dedi.';
  const kulakTutmadi = h.kulak < kulak, burunTutmadi = h.burun > burun;
  if (kulakTutmadi && burunTutmadi) return 'Bu bir kedi. Ama kulağı da burnu da tarifine uymuyor, makine köpek dedi.';
  if (kulakTutmadi) return 'Bu bir kedi. Ama kulağı tarifindeki kadar sivri değil, makine köpek dedi.';
  return 'Bu bir kedi. Ama burnu tarifindekinden uzun, makine köpek dedi.';
}
async function oneGetir(kart, sure) {
  const p = kart.position.clone(), s = kart.scale.x, d = kart.rotation.z;
  ses.kart();
  await Promise.all([git(kart.position, { x: -0.15, y: 0.42, z: Z.kart + 0.7 }, 0.34, E.girCik), git(kart.scale, { x: 0.78, y: 0.78, z: 0.78 }, 0.34, E.girCik), git(kart.rotation, { z: 0.02 }, 0.34)]);
  await bekle(sure);
  await Promise.all([git(kart.position, { x: p.x, y: p.y, z: p.z }, 0.3, E.girCik), git(kart.scale, { x: s, y: s, z: s }, 0.3, E.girCik), git(kart.rotation, { z: d }, 0.3)]);
}
async function tur1Sonuc(r, deneme) {
  ahtapotPoz(r.skor >= 8 ? 'mutlu' : 'saskin');
  (r.skor >= 8 ? ses.dogru : ses.olmadi)();
  asama('tarif-neden');
  const yanlis = r.sonuc.map((s, i) => ({ s, kart: izgara[i] })).filter(x => !x.s.ok);
  const goster = [yanlis.find(x => x.s.h.tur === 'kopek'), yanlis.find(x => x.s.h.tur === 'kedi')].filter(Boolean);
  for (const x of goster) {
    yaz(tarifNeden(x.s.h, r.kulak, r.burun), '1. TUR · TARİF');
    await oneGetir(x.kart, HIZLI ? 0.2 : 2.6);
  }
  const tavan = r.skor >= 8 ? 'Bu iki kolla daha iyisi yok.' : deneme >= 2 ? 'Bu iki kolla en çok 8 oluyor.' : 'Tarifi düzeltip yeniden deneyebilirsin.';
  yaz(`Tarifin 10 hayvanın ${r.skor} tanesini tanıdı. ${tavan}`, '1. TUR · TARİF');
  asama('tarif-sonuc');
  const secenek = deneme < 3
    ? [{ metin: 'TARİFİ DÜZELT', deger: 'yine', y: 0.75 }, { metin: 'BAŞKA YOL DENE', deger: 'gec', y: -0.4, renk: D.RENK.kiremit }]
    : [{ metin: 'BAŞKA YOL DENE', deger: 'gec', y: 0.4, renk: D.RENK.kiremit }];
  const sec = await dugmeSor(secenek);
  await izgaraTemizle();
  ahtapotPoz('bos');
  return sec;
}

// ---------- 2. tur: örnek ----------
// izin: yalnız bu tepsi kabul edilir ('kedi' ya da 'kopek'); boşsa ikisi de.
function etiketBekle(kart, izin = null) {
  return new Promise(coz => {
    const x0 = kart.position.x, y0 = kart.position.y; let basX = null, dx = 0, bitti = false, dokunuldu = false;
    const bitir = etiket => {
      if (bitti) return; bitti = true;
      hedefSil(kart.userData.yuz); sol.alan.userData.acik = false; sag.alan.userData.acik = false;
      coz(etiket);
    };
    hedef(kart.userData.yuz, {
      bas: e => { basX = dunyaNokta(e, kart.position.z).x; dokunuldu = true; },
      surukle: e => {
        if (basX === null || bitti) return;
        dx = dunyaNokta(e, kart.position.z).x - basX;
        kart.position.x = x0 + dx; kart.position.y = y0 - Math.abs(dx) * 0.1; kart.rotation.z = -dx * 0.07;
        sol.grup.scale.setScalar(dx < -0.5 ? 1.08 : 1); sag.grup.scale.setScalar(dx > 0.5 ? 1.08 : 1);
      },
      birak: () => {
        if (basX === null || bitti) return; basX = null;
        sol.grup.scale.setScalar(1); sag.grup.scale.setScalar(1);
        if (dx < -0.8 && izin !== 'kopek') bitir('kedi'); else if (dx > 0.8 && izin !== 'kedi') bitir('kopek');
        else { git(kart.position, { x: x0, y: y0 }, 0.3, E.asim); git(kart.rotation, { z: 0 }, 0.3, E.asim); }
        dx = 0;
      },
    });
    sol.alan.userData.acik = izin !== 'kopek'; sag.alan.userData.acik = izin !== 'kedi';
    sol.alan.userData.olay = { bas: () => bitir('kedi') }; sag.alan.userData.olay = { bas: () => bitir('kopek') };
    // ipucu: dokunulmazsa kart sağa sola kıpırdar
    (async () => {
      await bekle(2.2);
      while (!bitti && !dokunuldu) {
        await git(kart.position, { x: x0 - 0.35 }, 0.25, E.girCik); if (bitti || dokunuldu) break;
        await git(kart.position, { x: x0 + 0.35 }, 0.4, E.girCik); if (bitti || dokunuldu) break;
        await git(kart.position, { x: x0 }, 0.25, E.girCik);
        await bekle(2.4);
      }
    })();
  });
}
async function tepsiyeAt(kart, etiket) {
  const t = etiket === 'kedi' ? sol : sag, n = t.adet++;
  kart.userData.ig.visible = false; kart.userData.golge.visible = false;
  const hx = t.grup.position.x + ((n % 4) - 1.5) * 0.14, hy = t.grup.position.y + 0.82 + (n % 3) * 0.05;
  ses.kart();
  await Promise.all([
    tween({ sure: 0.34, ease: E.girCik, guncelle: k => { kart.position.z = karis(kart.position.z, Z.tepsi + 0.6, k); } }),
    git(kart.position, { x: hx, y: hy + 1.3 }, 0.34, E.girCik), git(kart.scale, { x: 0.28, y: 0.28, z: 0.28 }, 0.34, E.girCik),
    git(kart.rotation, { z: ((n * 5) % 5 - 2) * 0.04 }, 0.34),
  ]);
  kart.position.z = Z.tepsi - 0.1 + n * 0.012;
  await git(kart.position, { y: hy }, 0.16, E.gir3);
  ses.tepsi();
  tween({ sure: 0.3, ease: E.yay, guncelle: k => { t.grup.scale.setScalar(karis(1.07, 1, k)); } });
}
async function tur2() {
  yaz('Bu kez tarif yok. Kartı kaydır: kedi sola, köpek sağa.', '2. TUR · ÖRNEK');
  sayacYaz('0 / 12');
  await makine.mod('ornek');
  hedef(sol.alan, {}); hedef(sag.alan, {}); sol.alan.userData.acik = false; sag.alan.userData.acik = false;
  for (const t of [sol, sag]) { t.grup.visible = true; git(t.grup.position, { x: t.x }, 0.5, E.asim); }
  ses.tepsi();
  if (!YATAY) git(ahtapot.position, { y: -3.3 }, 0.4, E.asim); // dik ekranda sağ tepsinin arkasında kalmasın
  await bekle(0.5);
  const sira = ornekSirasi(), etiketler = [], kartlar = new Map();
  for (let i = 0; i < sira.length; i++) {
    const h = sira[i], k = kartKur(h);
    kartlar.set(h.id, k);
    k.position.set(-0.15, 12, Z.kart + 0.5); k.scale.setScalar(0.95); sahne.add(k);
    ses.kart();
    await git(k.position, { y: 1.72 }, HIZLI ? 0.05 : 0.32, E.asim);
    if (window.__atolye) window.__atolye.kart = h;
    asama('kart-' + i);
    const etiket = await etiketBekle(k);
    etiketler.push({ h, etiket });
    await tepsiyeAt(k, etiket);
    sayacYaz(`${i + 1} / 12`);
    const skor = sinavSkoru(x => komsuTahmin(x, etiketler)).dogru;
    makine.ibreAyarla(skor / 10); ses.ibre(skor / 10); makine.sars(0.008, 0.2);
    if (i === 0) yaz('İbreye bak: makine her kartla biraz daha öğreniyor.', '2. TUR · ÖRNEK');
    if (i === 5) yaz('Yarısı bitti. Kedi sola, köpek sağa.', '2. TUR · ÖRNEK');
  }
  await bekle(0.5);
  yaz('Makine senin 12 örneğinden öğrendi. Şimdi aynı 10 hayvana bakıyor.', '2. TUR · ÖRNEK');
  const r = await sinavKos(h => komsuTahmin(h, etiketler), 0.8);
  const yanlisEtiket = etiketler.filter(e => e.etiket !== e.h.tur).length;
  await deney(etiketler, kartlar);
  return { skor: r.dogru, etiketler, yanlisEtiket };
}

// ---------- deney: bir kartı bilerek yanlış öğret, sonra düzelt ----------
// Kart sabit (Habeş): öbür 11 kart doğruyken tek başına yanlış atılınca skor 10'dan 7'ye iner (arac/veri_kontrol.mjs).
const DENEY_KART = 'k4';
async function tepsidenAl(kart, y, olcek) {
  ses.kart();
  await git(kart.position, { y: kart.position.y + 1.3, z: Z.tepsi + 0.6 }, 0.2, E.girCik);
  kart.userData.ig.visible = true; kart.userData.golge.visible = true;
  await Promise.all([git(kart.position, { x: -0.15, y, z: Z.kart + 0.7 }, 0.36, E.girCik), git(kart.scale, { x: olcek, y: olcek, z: olcek }, 0.36, E.girCik), git(kart.rotation, { z: 0 }, 0.36)]);
}
async function deney(etiketler, kartlar) {
  const kart = kartlar.get(DENEY_KART);
  const temiz = etiketler.map(e => ({ h: e.h, etiket: e.h.tur })), hedefEtiket = temiz.find(e => e.h.id === DENEY_KART);
  if (!kart || !hedefEtiket) return;
  const ibre = () => { const s = sinavSkoru(x => komsuTahmin(x, temiz)).dogru; makine.ibreAyarla(s / 10); ses.ibre(s / 10); return s; };
  await bekle(HIZLI ? 0.2 : 1.4);
  await izgaraTemizle();
  // oyuncu ilk ayırmada yanlış attıysa önce onlar yerine konur (sonuç skorunda oyuncunun kendi skoru kalır)
  const yanlislar = etiketler.filter(e => e.etiket !== e.h.tur);
  if (yanlislar.length) {
    yaz(`${yanlislar.length} kartı yanlış tepsiye atmıştın. Önce onları yerine koyalım.`, 'DENEY');
    for (const e of yanlislar) await tepsiyeAt(kartlar.get(e.h.id), e.h.tur);
    ibre();
    await bekle(HIZLI ? 0.2 : 1.6);
  }
  // 1) bilerek yanlış at
  ahtapotPoz('bakar');
  yaz('Şimdi bir deney. Bu kedi kartını bilerek KÖPEK tepsisine at.', 'DENEY');
  await tepsidenAl(kart, 1.72, 0.95);
  asama('deney-yanlis-at');
  await etiketBekle(kart, 'kopek');
  await tepsiyeAt(kart, 'kopek');
  hedefEtiket.etiket = 'kopek';
  ibre(); makine.sars(0.012, 0.25);
  asama('deney-sinav');
  yaz('Makine aynı 10 hayvana yeniden bakıyor.', 'DENEY');
  const r = await sinavKos(h => komsuTahmin(h, temiz), 0.45);
  const bozulan = r.sonuc.map((s, i) => ({ s, kart: izgara[i] })).filter(x => !x.s.ok);
  if (window.__atolye) window.__atolye.deneySkor = r.dogru;
  ahtapotPoz('saskin'); ses.olmadi();
  yaz(`Skor ${r.dogru} oldu. Bu ${bozulan.length} hayvan en çok yanlış attığın karta benziyor. Makine onlara da köpek dedi.`, 'DENEY');
  for (const x of bozulan) { git(x.kart.position, { y: x.kart.position.y + 0.16, z: x.kart.position.z + 0.2 }, 0.3, E.asim); const b = KUCUK * 1.09; git(x.kart.scale, { x: b, y: b, z: b }, 0.3, E.asim); }
  asama('deney-sonuc');
  await dugmeSor([{ metin: 'DÜZELT', deger: 1, y: 0.6, w: 3.2 }]);
  // 2) düzelt
  yaz('Kartı KEDİ tepsisine geri at.', 'DENEY');
  await tepsidenAl(kart, 0.42, 0.78);
  asama('deney-duzelt');
  await etiketBekle(kart, 'kedi');
  await tepsiyeAt(kart, 'kedi');
  hedefEtiket.etiket = 'kedi';
  const son = ibre();
  for (const x of bozulan) { damgaKoy(x.kart, true); ses.damga(); await bekle(0.18); }
  ses.dogru(); sayacYaz(`${son} / 10`);
  ahtapotPoz('mutlu');
  yaz('Skor geri geldi. Makine senin gösterdiğin kadar biliyor.', 'DENEY');
  asama('deney-bitti');
  await bekle(HIZLI ? 0.3 : 2.4);
}

// ---------- sonuç ----------
async function sonuc(tarif, ornek) {
  await bekle(0.9);
  await izgaraTemizle();
  sayacYaz(`${ornek.skor} / 10`); // deneyden sonra sayaçta oyuncunun kendi skoru dursun
  const kazandi = ornek.skor > tarif.skor;
  const a = D.sonucFisi('TARİF', `${tarif.skor} / 10`, !kazandi && tarif.skor > ornek.skor), b = D.sonucFisi('ÖRNEK', `${ornek.skor} / 10`, kazandi);
  const yer = [[a, -1.82, -0.035], [b, 1.52, 0.03]];
  for (const [l, x, d] of yer) {
    l.mesh.position.set(x, 3.25, Z.kart + 0.3); l.mesh.rotation.z = d; l.mesh.scale.set(0.001, 0.001, 1); sahne.add(l.mesh);
    ses.damga(); await git(l.mesh.scale, { x: 1, y: 1 }, 0.35, E.asim); await bekle(0.25);
  }
  if (kazandi || tarif.skor > ornek.skor) {
    const kaz = kazandi ? b : a, m = new THREE.Mesh(damgaL.dogru.mesh.geometry, damgaL.dogru.mesh.material);
    m.position.set(1.12, 0.92, 0.02); kaz.mesh.add(m);
    ses.damga(); await tween({ sure: 0.2, guncelle: k => { const s = karis(2, 0.5, k); m.scale.set(s, s, 1); } });
  }
  try { localStorage.setItem('atolye.t1', JSON.stringify({ tarif: { kulak: tarif.kulak, burun: tarif.burun, skor: tarif.skor }, ornekSkor: ornek.skor, etiketler: ornek.etiketler.map(e => ({ id: e.h.id, etiket: e.etiket })), bitti: kazandi, zaman: Date.now() })); } catch (_) { /* kayıt kapalı olabilir */ }
  const alet = D.notKagidi(6.3, 1.5);
  alet.mesh.position.set(-0.05, 0.75, Z.kart + 0.25); alet.mesh.rotation.z = 0.012; alet.mesh.scale.set(0.001, 0.001, 1); sahne.add(alet.mesh);
  if (kazandi) {
    ahtapotPoz('mutlu'); ses.zafer();
    yaz(ornek.yanlisEtiket
      ? `Örnek kazandı. Ama ilk ayırmada ${ornek.yanlisEtiket} kartı yanlış tepsiye attın, makine de onları yanlış öğrendi.`
      : 'Örnek kazandı. Tarif yazmadın, yalnız örnek gösterdin.', 'SONUÇ');
    alet.yaz('Tarif vermiyorsun, örnek gösteriyorsun.', 'İLK ALETİN ÇANTADA');
    await git(alet.mesh.scale, { x: 1, y: 1 }, 0.4, E.asim, 0.3);
    seritL.ciz(1, 1);
    tween({ sure: 0.5, ease: E.yay, guncelle: k => { const s = karis(1.08, 1, k); seritL.mesh.scale.set(s, s, 1); } });
  } else {
    ahtapotPoz('saskin'); ses.olmadi();
    yaz(ornek.yanlisEtiket
      ? `Makine senin gösterdiğin kadar biliyor. İlk ayırmada ${ornek.yanlisEtiket} kartı yanlış tepsiye attın, o da yanlış öğrendi.`
      : 'Bu kez tarif geri kalmadı. Bir daha oynayıp başka bir tarif dene.', 'SONUÇ');
  }
  asama('sonuc');
  await dugmeSor([{ metin: 'DEVAM', deger: 1, y: kazandi ? -0.75 : 0.9, w: 3.2 }]);
  // son kart: iki kelime + dürüst not + sıradaki bölümün sorusu (her sonuçta çıkar)
  yaz('Örnek göstererek öğrettin: buna eğitmek deniyor. Makinede kalan şeye de model deniyor.', 'İKİ KELİME');
  alet.yaz('Makine resme bakmadı. Kulağı ve burnu sayı olarak biz verdik. Peki resim nasıl sayıya dönüşür? Sıradaki tezgâhta.', 'DÜRÜST NOT');
  alet.mesh.scale.set(0.001, 0.001, 1);
  await git(alet.mesh.scale, { x: 1, y: 1 }, 0.4, E.asim, 0.15);
  asama('son-kart');
  await dugmeSor([{ metin: 'BAŞTAN OYNA', deger: 1, y: -0.75, w: 3.6 }]);
  location.reload();
}

// ---------- akış ----------
async function oyun() {
  yaz('Bu makine kediyi tanımıyor. Ona iki ayrı yoldan öğretmeyi deneyeceğiz.', 'ATÖLYE');
  sayacYaz('– / 10');
  if (!HIZLI) await dugmeSor([{ metin: 'BAŞLA', deger: 1, y: 1.6, w: 3.2 }]);
  let enIyi = null;
  for (let deneme = 1; ; deneme++) {
    const r = await tur1(deneme);
    if (!enIyi || r.skor > enIyi.skor) enIyi = r;
    if ((await tur1Sonuc(r, deneme)) === 'gec') break;
  }
  const ornek = await tur2();
  await sonuc(enIyi, ornek);
}

// ---------- döngü ----------
const saat = new THREE.Clock();
function dongu() {
  const dt = Math.min(saat.getDelta(), 0.05), t = saat.elapsedTime;
  adim(dt);
  if (tarifKirli) { tarifKirli = false; tarifL.ciz(makine.kollar.kulak.deger, makine.kollar.burun.deger); }
  if (ahtapot) ahtapot.rotation.z = Math.sin(t * 1.7) * 0.025;
  if (makine && dugmeCoz) { const s = 1 + Math.sin(t * 5) * 0.045; makine.dugme.scale.set(s, s, 1); }
  kamera.position.x += (fareX * 0.22 - kamera.position.x) * 0.06;
  kamera.lookAt(kamera.position.x * 0.5, L.cy, 0);
  renderer.render(sahne, kamera);
  requestAnimationFrame(dongu);
}

(async () => {
  boyutla();
  try { await yukle(); } catch (e) { document.querySelector('#acilis div').textContent = 'Açılamadı: ' + e.message; throw e; }
  kur(); kollariKur(); dugmeKur();
  boyutla();
  document.getElementById('acilis').classList.add('git');
  // deneme ve sınama için küçük kapı
  window.__atolye = { sahne, kamera, makine, Z, yatay: YATAY, ekran: (x, y, z = 0) => { const v = new THREE.Vector3(x, y, z).project(kamera), r = renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; } };
  dongu();
  oyun();
})();
