// Tuvalde çizilen bütün yüzeyler: tabela, sayaç, not kâğıdı, kart, tarif kartı, fiş, damga, kadran, şerit.
// Ölçü birimi sahne birimidir (sahne 9 x 16); PX bir birimin kaç piksel çizileceğini verir.
import * as THREE from 'three';
import { karis } from './arac.js';

export const PX = 128;
export const RENK = {
  murekkep: '#1F1007', krem: '#F2EBDD', kagit: '#FAF3E2', hardal: '#EDAD1A', hardalKoyu: '#C98A12',
  kiremit: '#AE301D', kiremitKoyu: '#7E2114', yesil: '#3E8E3A', pirinc: '#C9A24B', ahsap: '#B8732F',
};
const BASLIK = '"Paytone One", "Arial Black", sans-serif';
const GOVDE = '"Baloo 2", "Trebuchet MS", sans-serif';

function tuval(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * PX); c.height = Math.round(h * PX);
  return [c, c.getContext('2d')];
}
function dokuYap(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// Tuvalden düzlem: { mesh, g, c, tazele() }
function levha(w, h) {
  const [c, g] = tuval(w, h);
  const tex = dokuYap(c);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  return { mesh, g, c, w, h, tazele: () => { tex.needsUpdate = true; } };
}
function kose(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
let tohum = 7;
function sans() { tohum = (tohum * 16807) % 2147483647; return tohum / 2147483647; }

// Emaye levhanın eskimiş kenarı: köşelerde pas lekeleri
function pas(g, W, H, adet = 14) {
  for (let i = 0; i < adet; i++) {
    const kenar = sans() < 0.5, x = kenar ? sans() * W : (sans() < 0.5 ? sans() * 0.08 * W : W - sans() * 0.08 * W);
    const y = kenar ? (sans() < 0.5 ? sans() * 0.14 * H : H - sans() * 0.14 * H) : sans() * H;
    g.fillStyle = `rgba(${150 + sans() * 40 | 0}, ${70 + sans() * 30 | 0}, 30, ${0.25 + sans() * 0.35})`;
    g.beginPath(); g.ellipse(x, y, 3 + sans() * 9, 2 + sans() * 5, sans() * 3, 0, 7); g.fill();
  }
}
function percin(g, x, y, r) {
  g.fillStyle = '#6B4A2B'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = r * 0.45; g.stroke();
  g.fillStyle = 'rgba(255,240,200,.55)'; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, 7); g.fill();
}
function sigdir(g, metin, yazi, boyut, enCok) {
  let b = boyut;
  do { g.font = yazi.replace('#', b); if (g.measureText(metin).width <= enCok) break; b -= 2; } while (b > 10);
  return b;
}

// ---- Emaye tabela ("1. TEZGÂH") ----
export function tabela(metin, w = 4.3, h = 1.0) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height, p = 6;
  g.fillStyle = '#F6EEDB'; kose(g, p, p, W - 2 * p, H - 2 * p, 16); g.fill();
  g.save(); g.clip(); tohum = 11; pas(g, W, H, 18); g.restore();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 6; kose(g, p, p, W - 2 * p, H - 2 * p, 16); g.stroke();
  g.strokeStyle = RENK.kiremit; g.lineWidth = 3; kose(g, p + 13, p + 13, W - 2 * p - 26, H - 2 * p - 26, 9); g.stroke();
  for (const [x, y] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) percin(g, x, y, 6);
  g.fillStyle = RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
  sigdir(g, metin, `#px ${BASLIK}`, H * 0.52, W - 110);
  g.fillText(metin, W / 2, H / 2 + 3);
  return l;
}

// ---- Yuvarlak sayaç ("4 / 10") ----
export function sayac(cap = 1.55) {
  const l = levha(cap, cap), g = l.g, W = l.c.width, r = W / 2;
  l.yaz = metin => {
    g.clearRect(0, 0, W, W);
    g.fillStyle = '#F6EEDB'; g.beginPath(); g.arc(r, r, r - 6, 0, 7); g.fill();
    g.strokeStyle = RENK.murekkep; g.lineWidth = 6; g.stroke();
    g.strokeStyle = RENK.kiremit; g.lineWidth = 5; g.beginPath(); g.arc(r, r, r - 20, 0, 7); g.stroke();
    percin(g, r, 15, 4.5);
    g.fillStyle = RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
    sigdir(g, metin, `#px ${BASLIK}`, W * 0.3, W - 62);
    g.fillText(metin, r, r + 3);
    l.tazele();
  };
  l.yaz('');
  return l;
}

// Kelimeleri satırlara böler
function satirla(g, metin, enCok) {
  const satirlar = [];
  for (const parca of metin.split('\n')) {
    let s = '';
    for (const k of parca.split(' ')) {
      const d = s ? s + ' ' + k : k;
      if (g.measureText(d).width > enCok && s) { satirlar.push(s); s = k; } else s = d;
    }
    satirlar.push(s);
  }
  return satirlar;
}

// ---- Bantla tutturulmuş not kâğıdı (yönlendirme cümlesi) ----
export function notKagidi(w = 6.6, h = 1.3) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  l.yaz = (metin, baslik = '') => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(31,16,7,.16)'; kose(g, 12, 16, W - 20, H - 22, 6); g.fill();
    g.fillStyle = '#FFF9EA'; kose(g, 8, 8, W - 20, H - 22, 6); g.fill();
    g.strokeStyle = RENK.murekkep; g.lineWidth = 4; g.stroke();
    for (const x of [W * 0.16, W * 0.84]) { // bant
      g.save(); g.translate(x, 9); g.rotate(x < W / 2 ? -0.08 : 0.07);
      g.fillStyle = 'rgba(237,173,26,.78)'; g.fillRect(-34, -9, 68, 20);
      g.strokeStyle = 'rgba(31,16,7,.45)'; g.lineWidth = 2; g.strokeRect(-34, -9, 68, 20); g.restore();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const orta = (H - 14) / 2 + 2;
    let y0 = orta, alan = H - 44;
    if (baslik) {
      g.font = `${H * 0.17}px ${BASLIK}`; g.fillStyle = RENK.kiremit;
      g.fillText(baslik, W / 2, 20 + H * 0.1);
      y0 = orta + H * 0.1; alan -= H * 0.2;
    }
    let boyut = H * 0.27, satirlar;
    for (; boyut > 14; boyut -= 2) {
      g.font = `600 ${boyut}px ${GOVDE}`;
      satirlar = satirla(g, metin, W - 86);
      if (satirlar.length * boyut * 1.08 <= alan) break;
    }
    g.fillStyle = RENK.murekkep;
    const ara = boyut * 1.08;
    satirlar.forEach((s, i) => g.fillText(s, W / 2 - 4, y0 + (i - (satirlar.length - 1) / 2) * ara + boyut * 0.06));
    l.tazele();
  };
  l.yaz('');
  return l;
}

// ---- Basılabilir emaye plaka (düğme) ----
export function plaka(metin, renk = RENK.hardal, w = 3.9, h = 0.92) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height, koyu = renk === RENK.kiremit;
  g.fillStyle = 'rgba(31,16,7,.22)'; kose(g, 10, 14, W - 16, H - 18, 18); g.fill();
  g.fillStyle = koyu ? RENK.kiremitKoyu : RENK.hardalKoyu; kose(g, 5, 9, W - 16, H - 16, 18); g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 6; g.stroke();
  g.fillStyle = renk; kose(g, 5, 4, W - 16, H - 22, 18); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, 15); g.lineTo(W - 38, 15); g.stroke();
  g.fillStyle = koyu ? '#FFF6E0' : RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
  sigdir(g, metin, `#px ${BASLIK}`, H * 0.42, W - 70);
  g.fillText(metin, W / 2 - 3, H / 2 - 5);
  return l;
}

// ---- Makine ve tepsi etiketi (pirinç çerçeveli küçük levha) ----
export function etiket(metin, w = 1.05, h = 0.42) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  g.fillStyle = '#8A6A2A'; kose(g, 3, 3, W - 6, H - 6, 9); g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#F6EEDB'; kose(g, 9, 9, W - 18, H - 18, 5); g.fill();
  g.strokeStyle = 'rgba(31,16,7,.5)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
  sigdir(g, metin, `#px ${BASLIK}`, H * 0.5, W - 30);
  g.fillText(metin, W / 2, H / 2 + 2);
  return l;
}

// ---- Yuvarlak düğme yüzü ("DENE") ----
export function dugmeYuzu(metin, cap = 0.78) {
  const l = levha(cap, cap), g = l.g, W = l.c.width, r = W / 2;
  g.fillStyle = RENK.kiremit; g.beginPath(); g.arc(r, r, r - 3, 0, 7); g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 4; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(r, r, r - 12, 3.6, 5.3); g.stroke();
  g.fillStyle = '#FFF6E0'; g.textAlign = 'center'; g.textBaseline = 'middle';
  sigdir(g, metin, `#px ${BASLIK}`, W * 0.3, W - 22);
  g.fillText(metin, r, r + 2);
  return l;
}

// ---- Hayvan kartı ----
export const KART_W = 3.6, KART_H = 4.4;
function kartZemin(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = RENK.kagit; kose(g, 5, 5, W - 10, H - 10, 26); g.fill();
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, 'rgba(190,150,90,0)'); gr.addColorStop(1, 'rgba(190,150,90,.22)');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 7; g.stroke();
  g.strokeStyle = 'rgba(31,16,7,.16)'; g.lineWidth = 2; kose(g, 20, 20, W - 40, H - 40, 15); g.stroke();
}
export function kartYuzu(resim) {
  const l = levha(KART_W, KART_H), g = l.g, W = l.c.width, H = l.c.height;
  kartZemin(g, W, H);
  const kutuW = W - 84, kutuH = H - 134;
  const o = Math.min(kutuW / resim.width, kutuH / resim.height);
  const w = resim.width * o, h = resim.height * o, x = (W - w) / 2, y = H - 52 - h;
  g.fillStyle = 'rgba(31,16,7,.13)'; g.beginPath(); g.ellipse(W / 2, H - 56, w * 0.42, 13, 0, 0, 7); g.fill();
  g.imageSmoothingQuality = 'high';
  g.drawImage(resim, x, y, w, h);
  return l;
}

// ---- Tarif kartı: kolların anlamını çizen şema (yandan kafa) ----
export function tarifKarti() {
  const l = levha(KART_W, KART_H), g = l.g, W = l.c.width, H = l.c.height;
  l.ciz = (kulak, burun) => {
    kartZemin(g, W, H);
    g.save(); kose(g, 9, 9, W - 18, H - 18, 22); g.clip();
    g.strokeStyle = 'rgba(31,16,7,.07)'; g.lineWidth = 1.5;
    for (let x = 0; x < W; x += 26) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.restore();
    g.fillStyle = RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${H * 0.066}px ${BASLIK}`; g.fillText('KEDİ TARİFİ', W / 2, H * 0.125);
    g.strokeStyle = RENK.kiremit; g.lineWidth = 4; g.beginPath(); g.moveTo(W * 0.24, H * 0.17); g.lineTo(W * 0.76, H * 0.17); g.stroke();

    const R = W * 0.2, cx = W * 0.4, cy = H * 0.6;
    const nokta = (aci, k = 1) => [cx + Math.cos(aci) * R * k, cy - Math.sin(aci) * R * k];
    // kulak
    const [b1x, b1y] = nokta(2.72, 0.96), [b2x, b2y] = nokta(1.52, 0.96);
    const yuk = karis(0.2, 1.3, kulak) * R, yon = 2.05;
    const tx = (b1x + b2x) / 2 + Math.cos(yon) * yuk, ty = (b1y + b2y) / 2 - Math.sin(yon) * yuk;
    const kulakYol = () => { g.beginPath(); g.moveTo(b1x, b1y); g.arcTo(tx, ty, b2x, b2y, karis(R * 0.42, R * 0.02, Math.pow(kulak, 0.7))); g.lineTo(b2x, b2y); g.closePath(); };
    // burun
    const L = karis(0.1, 1.5, burun) * R, bx0 = cx + R * 0.5, by0 = cy + R * 0.02, bh = R * 0.64, bx1 = cx + R * 0.95 + L;
    const burunYol = () => kose(g, bx0, by0, bx1 - bx0, bh, R * 0.3);
    const govdeYol = () => { g.beginPath(); g.ellipse(cx - R * 0.55, cy + R * 2.25, R * 1.35, R * 1.5, 0, 0, 7); };
    const kafaYol = () => { g.beginPath(); g.arc(cx, cy, R, 0, 7); };
    g.save(); kose(g, 9, 9, W - 18, H - 18, 22); g.clip();
    g.lineJoin = 'round'; g.strokeStyle = RENK.murekkep; g.lineWidth = 13;
    for (const yol of [govdeYol, kulakYol, burunYol, kafaYol]) { yol(); g.stroke(); }
    g.fillStyle = '#E8DCC2';
    for (const yol of [govdeYol, kulakYol, burunYol, kafaYol]) { yol(); g.fill(); }
    g.restore();
    // kulak içi
    g.fillStyle = 'rgba(174,48,29,.28)';
    const ix = (b1x + b2x + tx) / 3, iy = (b1y + b2y + ty) / 3;
    g.beginPath(); g.moveTo(karis(b1x, ix, 0.45), karis(b1y, iy, 0.45)); g.lineTo(karis(tx, ix, 0.4), karis(ty, iy, 0.4)); g.lineTo(karis(b2x, ix, 0.45), karis(b2y, iy, 0.45)); g.closePath(); g.fill();
    // göz, burun ucu, ağız, bıyık
    g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(cx + R * 0.36, cy - R * 0.2, R * 0.21, 0, 7); g.fill();
    g.strokeStyle = RENK.murekkep; g.lineWidth = 5; g.stroke();
    g.fillStyle = RENK.murekkep; g.beginPath(); g.arc(cx + R * 0.42, cy - R * 0.18, R * 0.09, 0, 7); g.fill();
    g.beginPath(); g.ellipse(bx1 - R * 0.13, by0 + R * 0.17, R * 0.15, R * 0.12, 0, 0, 7); g.fill();
    g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx1 - R * 0.2, by0 + bh * 0.68); g.quadraticCurveTo((bx0 + bx1) / 2, by0 + bh * 0.86, bx0 + R * 0.15, by0 + bh * 0.62); g.stroke();
    g.lineWidth = 3;
    for (const e of [-0.25, 0, 0.25]) { g.beginPath(); g.moveTo(bx1 - R * 0.3, by0 + bh * 0.45); g.lineTo(bx1 + R * 0.45, by0 + bh * (0.45 + e)); g.stroke(); }
    // ölçü okları
    const ok = (x0, y0, x1, y1) => {
      g.strokeStyle = RENK.kiremit; g.fillStyle = RENK.kiremit; g.lineWidth = 4; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0);
      for (const [x, y, d] of [[x0, y0, a + Math.PI], [x1, y1, a]]) {
        g.beginPath(); g.moveTo(x + Math.cos(d) * 2, y + Math.sin(d) * 2);
        g.lineTo(x - Math.cos(d - 0.5) * 15, y - Math.sin(d - 0.5) * 15); g.lineTo(x - Math.cos(d + 0.5) * 15, y - Math.sin(d + 0.5) * 15); g.closePath(); g.fill();
      }
    };
    const kx = Math.min(b1x, tx) - R * 0.32;
    ok(kx, (b1y + b2y) / 2, kx, ty);
    ok(bx0 + R * 0.45, by0 + bh + R * 0.3, bx1, by0 + bh + R * 0.3);
    g.fillStyle = RENK.kiremit; g.font = `700 ${H * 0.044}px ${GOVDE}`;
    g.textAlign = 'left'; g.fillText('kulak: en az', W * 0.06, H * 0.235); g.fillText('bu kadar sivri', W * 0.06, H * 0.28);
    g.textAlign = 'right'; g.fillText('burun: en çok', W * 0.95, H * 0.855); g.fillText('bu kadar uzun', W * 0.95, H * 0.9);
    l.tazele();
  };
  l.ciz(0.5, 0.5);
  return l;
}

// ---- Makinenin bastığı fiş ----
export function fis(w = 1.9, h = 1.2) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  l.yaz = metin => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#FFF9EA'; g.beginPath(); g.moveTo(4, 0); g.lineTo(W - 4, 0); g.lineTo(W - 4, H - 14);
    for (let x = W - 4, i = 0; x > 4; x -= 12, i++) g.lineTo(x - 6, H - (i % 2 ? 14 : 3));
    g.lineTo(4, H - 14); g.closePath(); g.fill();
    g.strokeStyle = RENK.murekkep; g.lineWidth = 4; g.stroke();
    g.strokeStyle = RENK.kiremit; g.lineWidth = 2.5; kose(g, 16, 14, W - 32, H - 44, 8); g.stroke();
    g.fillStyle = RENK.murekkep; g.textAlign = 'center'; g.textBaseline = 'middle';
    sigdir(g, metin, `#px ${BASLIK}`, H * 0.38, W - 56);
    g.fillText(metin, W / 2, H / 2 - 6);
    l.tazele();
  };
  l.yaz('');
  return l;
}

// ---- Lastik damga: doğru (yeşil tik) ya da yanlış (kırmızı çarpı) ----
export function damga(dogru, cap = 1.7) {
  const l = levha(cap, cap), g = l.g, W = l.c.width, r = W / 2;
  g.translate(r, r); g.rotate(dogru ? -0.16 : 0.12);
  g.strokeStyle = dogru ? RENK.yesil : RENK.kiremit; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = W * 0.07; g.beginPath(); g.arc(0, 0, r * 0.8, 0, 7); g.stroke();
  g.lineWidth = W * 0.12; g.beginPath();
  if (dogru) { g.moveTo(-r * 0.4, 0); g.lineTo(-r * 0.1, r * 0.32); g.lineTo(r * 0.44, -r * 0.34); }
  else { g.moveTo(-r * 0.36, -r * 0.36); g.lineTo(r * 0.36, r * 0.36); g.moveTo(r * 0.36, -r * 0.36); g.lineTo(-r * 0.36, r * 0.36); }
  g.stroke();
  g.globalCompositeOperation = 'destination-out'; tohum = dogru ? 5 : 9; // mürekkebin tutmadığı yerler
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + sans() * 0.6})`; g.beginPath(); g.arc((sans() - 0.5) * W, (sans() - 0.5) * W, 1 + sans() * 3.2, 0, 7); g.fill(); }
  return l;
}

// ---- İbreli gösterge kadranı (0..10) ----
export function kadran(cap = 2.0) {
  const l = levha(cap, cap), g = l.g, W = l.c.width, r = W / 2;
  g.fillStyle = '#FFF6DC'; g.beginPath(); g.arc(r, r, r - 5, 0, 7); g.fill();
  const gr = g.createRadialGradient(r, r * 1.2, r * 0.1, r, r, r); gr.addColorStop(0, 'rgba(255,220,120,.5)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 6; g.stroke();
  const my = r * 1.22, ac = v => Math.PI * (1.5 + karis(-0.36, 0.36, v)); // ibre mili ve açı
  g.strokeStyle = 'rgba(62,142,58,.75)'; g.lineWidth = r * 0.13; g.beginPath(); g.arc(r, my, r * 0.86, ac(0.8), ac(1)); g.stroke();
  g.strokeStyle = RENK.murekkep; g.lineCap = 'round';
  for (let i = 0; i <= 10; i++) {
    const a = ac(i / 10), u = i % 5 === 0 ? 0.74 : 0.8;
    g.lineWidth = i % 5 === 0 ? 6 : 3.5;
    g.beginPath(); g.moveTo(r + Math.cos(a) * r * u, my + Math.sin(a) * r * u); g.lineTo(r + Math.cos(a) * r * 0.92, my + Math.sin(a) * r * 0.92); g.stroke();
  }
  g.fillStyle = RENK.murekkep; g.font = `${r * 0.17}px ${BASLIK}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('0', r + Math.cos(ac(0)) * r * 0.55, my + Math.sin(ac(0)) * r * 0.55);
  g.fillText('10', r + Math.cos(ac(1)) * r * 0.52, my + Math.sin(ac(1)) * r * 0.52);
  l.mil = { x: 0, y: -(my - r) / PX, aci: v => karis(0.36, -0.36, v) * Math.PI };
  return l;
}

// ---- Alt şerit: 12 tezgâh ----
export function serit(w = 7.0, h = 0.92) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  l.ciz = (acik = 1, biten = 0) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(31,16,7,.2)'; kose(g, 8, 12, W - 12, H - 16, 20); g.fill();
    g.fillStyle = '#F6EEDB'; kose(g, 4, 4, W - 12, H - 16, 20); g.fill();
    g.strokeStyle = RENK.murekkep; g.lineWidth = 5; g.stroke();
    const n = 12, ara = (W - 44) / n, b = Math.min(ara - 12, H - 46), y = (H - 12) / 2 - b / 2 + 1;
    for (let i = 0; i < n; i++) {
      const x = 16 + i * ara + (ara - b) / 2, no = i + 1, a = no <= acik;
      g.fillStyle = a ? RENK.hardal : '#5B4636'; kose(g, x, y, b, b, 9); g.fill();
      g.strokeStyle = RENK.murekkep; g.lineWidth = 4; g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (a) {
        g.fillStyle = RENK.murekkep; g.font = `${b * 0.56}px ${BASLIK}`; g.fillText(String(no), x + b / 2, y + b / 2 + 2);
        if (no <= biten) {
          g.strokeStyle = '#FFF6E0'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
          const tik = () => { g.beginPath(); g.moveTo(x + b * 0.52, y + b * 0.02); g.lineTo(x + b * 0.72, y + b * 0.22); g.lineTo(x + b * 1.06, y - b * 0.2); g.stroke(); };
          tik(); g.strokeStyle = RENK.yesil; g.lineWidth = 5.5; tik();
        }
      } else { // kilit
        g.strokeStyle = '#CDBB9E'; g.lineWidth = 3.5; g.beginPath(); g.arc(x + b / 2, y + b * 0.42, b * 0.15, Math.PI, 0); g.stroke();
        g.fillStyle = '#CDBB9E'; kose(g, x + b * 0.29, y + b * 0.42, b * 0.42, b * 0.32, 3); g.fill();
      }
    }
    l.tazele();
  };
  l.ciz(1, 0);
  return l;
}

// ---- Sonuç fişi: "TARİF 6 / 10" ----
export function sonucFisi(baslik, skor, kazandi, w = 3.1, h = 2.5) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  g.fillStyle = 'rgba(31,16,7,.18)'; kose(g, 12, 14, W - 18, H - 20, 14); g.fill();
  g.fillStyle = '#FFF9EA'; kose(g, 6, 6, W - 18, H - 20, 14); g.fill();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 6; g.stroke();
  g.strokeStyle = kazandi ? RENK.yesil : RENK.kiremit; g.lineWidth = 3.5; kose(g, 22, 22, W - 50, H - 52, 8); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = RENK.kiremit; g.font = `${H * 0.15}px ${BASLIK}`; g.fillText(baslik, W / 2 - 3, H * 0.24);
  g.fillStyle = RENK.murekkep; sigdir(g, skor, `#px ${BASLIK}`, H * 0.36, W - 90); g.fillText(skor, W / 2 - 3, H * 0.57);
  g.font = `600 ${H * 0.085}px ${GOVDE}`; g.fillStyle = 'rgba(31,16,7,.7)'; g.fillText('hayvanı tanıdı', W / 2 - 3, H * 0.83);
  return l;
}

// ---- Makinenin ön paneli (koyu pirinç, fırçalanmış) ----
export function onPanel(w, h) {
  const l = levha(w, h), g = l.g, W = l.c.width, H = l.c.height;
  g.fillStyle = '#B98A26'; kose(g, 4, 4, W - 8, H - 8, 26); g.fill();
  g.save(); g.clip(); tohum = 3;
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${sans() < 0.5 ? '255,236,170' : '70,45,10'},${0.05 + sans() * 0.07})`; g.lineWidth = 1 + sans() * 2; const y = sans() * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (sans() - 0.5) * 6); g.stroke(); }
  g.restore();
  g.strokeStyle = RENK.murekkep; g.lineWidth = 5; kose(g, 4, 4, W - 8, H - 8, 26); g.stroke();
  g.strokeStyle = 'rgba(255,236,170,.5)'; g.lineWidth = 2.5; kose(g, 12, 12, W - 24, H - 24, 20); g.stroke();
  return l;
}

// ---- Yumuşak gölge lekesi ----
export function golge(w, h, koyuluk = 0.3) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  gr.addColorStop(0, `rgba(31,16,7,${koyuluk})`); gr.addColorStop(1, 'rgba(31,16,7,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: dokuYap(c), transparent: true, depthWrite: false }));
}

// ---- Hazır resimden düzlem (arka plan, Ahtapot) ----
export function resimDokusu(resim) {
  const t = new THREE.Texture(resim); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
