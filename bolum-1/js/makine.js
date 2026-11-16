// Pirinç makine ve ahşap tepsiler: üç boyutlu, çizgi film gölgeli (tek kademe), mürekkep konturlu.
import * as THREE from 'three';
import { E, tween, git, karis, sinirla } from './arac.js';
import * as D from './doku.js';

const MUREKKEP = 0x1f1007;
let kademe = null;
function kademeDokusu() {
  if (kademe) return kademe;
  kademe = new THREE.DataTexture(new Uint8Array([105, 175, 255]), 3, 1, THREE.RedFormat);
  kademe.minFilter = kademe.magFilter = THREE.NearestFilter; kademe.needsUpdate = true;
  return kademe;
}
export const boya = renk => new THREE.MeshToonMaterial({ color: renk, gradientMap: kademeDokusu() });

// Köşeleri yuvarlak kutu (ortası merkezde)
export function kutuGeo(w, h, d, r = 0.1, pah = 0.04) {
  const x = w / 2 - pah, y = h / 2 - pah, s = new THREE.Shape();
  r = Math.min(r, x, y);
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0);
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * pah, 0.01), bevelEnabled: true, bevelThickness: pah, bevelSize: pah, bevelSegments: 2, curveSegments: 5 });
  g.center();
  return g;
}
// Kutu + kontur (ters yüzlü, biraz büyük kopya)
export function parca(w, h, d, renk, { r = 0.1, kontur = 0.045, pah = 0.04 } = {}) {
  const geo = kutuGeo(w, h, d, r, pah), m = new THREE.Mesh(geo, typeof renk === 'number' ? boya(renk) : renk);
  if (kontur) {
    const k = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: MUREKKEP, side: THREE.BackSide }));
    k.scale.set((w + 2 * kontur) / w, (h + 2 * kontur) / h, (d + 2 * kontur) / d);
    m.add(k);
  }
  return m;
}

export function makineKur() {
  const grup = new THREE.Group();
  const PIRINC = 0xd9a836, PIRINC_KOYU = 0xb08226, DEMIR = 0x3a2c24, KIRMIZI = 0xb8361f;

  for (const x of [-1.38, 1.38]) { const a = parca(0.7, 0.3, 1.5, DEMIR, { r: 0.08 }); a.position.set(x, 0.15, 0); grup.add(a); }
  const taban = parca(3.7, 0.55, 1.45, PIRINC_KOYU, { r: 0.14 }); taban.position.set(0, 0.55, 0); grup.add(taban);
  const govde = parca(3.5, 2.5, 1.2, PIRINC, { r: 0.3, pah: 0.07 }); govde.position.set(0, 2.05, -0.05); grup.add(govde);
  const kapak = parca(2.3, 0.3, 0.85, PIRINC_KOYU, { r: 0.1 }); kapak.position.set(0, 3.43, -0.05); grup.add(kapak);
  const ON = 0.56; // gövdenin ön yüzü (z)
  // perçinler
  const pg = new THREE.SphereGeometry(0.055, 10, 8), pm = boya(0x7a5a22);
  for (const [x, y] of [[-1.5, 3.05], [1.5, 3.05], [-1.5, 1.05], [1.5, 1.05], [-1.6, 0.55], [1.6, 0.55], [0, 0.55]]) {
    const p = new THREE.Mesh(pg, pm); p.position.set(x, y, y < 0.8 ? 0.74 : ON); p.scale.z = 0.5; grup.add(p);
  }
  // parlama çizgisi (çizgi film pirinç hissi)
  const parlama = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.07), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.55 }));
  parlama.position.set(-0.2, 3.235, ON + 0.012); parlama.scale.set(0.9, 0.6, 1); grup.add(parlama);

  const panel = D.onPanel(3.12, 2.3).mesh; panel.position.set(0, 2.02, ON + 0.006); grup.add(panel);

  // ---- 1. tur ön yüzü: iki kol ----
  const kolGrubu = new THREE.Group(); grup.add(kolGrubu);
  const kollar = {};
  const KOL_X = 0.62, KOL_YOL = 1.5;
  [['kulak', 'KULAK', 2.84], ['burun', 'BURUN', 2.16]].forEach(([ad, yazi, y]) => {
    const et = D.etiket(yazi, 1.1, 0.44).mesh; et.position.set(-1.12, y, ON + 0.02); kolGrubu.add(et);
    const yuva = parca(KOL_YOL + 0.5, 0.17, 0.08, 0x2a1c14, { r: 0.08, kontur: 0.03, pah: 0.02 }); yuva.position.set(KOL_X, y, ON); kolGrubu.add(yuva);
    for (let i = 0; i <= 4; i++) { // kademe çentikleri
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.1), new THREE.MeshBasicMaterial({ color: MUREKKEP }));
      c.position.set(KOL_X - KOL_YOL / 2 + (i / 4) * KOL_YOL, y + 0.2, ON + 0.012); kolGrubu.add(c);
    }
    const topuz = parca(0.38, 0.5, 0.34, KIRMIZI, { r: 0.07, kontur: 0.035 }); topuz.position.set(KOL_X, y, ON + 0.2); kolGrubu.add(topuz);
    for (const dx of [-0.08, 0, 0.08]) { // tutamak olukları
      const o = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.26), new THREE.MeshBasicMaterial({ color: 0x7e2114 }));
      o.position.set(dx, 0, 0.172); topuz.add(o);
    }
    const alan = new THREE.Mesh(new THREE.PlaneGeometry(KOL_YOL + 1.0, 0.66), new THREE.MeshBasicMaterial({ visible: false }));
    alan.position.set(KOL_X, y, ON + 0.4); kolGrubu.add(alan);
    kollar[ad] = { topuz, alan, deger: 0.5 };
  });
  function kolAyarla(ad, v) {
    const k = kollar[ad]; k.deger = sinirla(v, 0, 1);
    k.topuz.position.x = KOL_X + (k.deger - 0.5) * KOL_YOL;
  }
  // yerel x konumundan kol değeri
  const kolDegeri = yerelX => sinirla((yerelX - KOL_X) / KOL_YOL + 0.5, 0, 1);

  // ---- düğme ("DENE") ----
  const dugme = new THREE.Group(); dugme.position.set(1.22, 1.2, ON); grup.add(dugme);
  const bilezik = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 28), boya(0x7a5a22)); bilezik.rotation.x = Math.PI / 2; bilezik.position.z = 0.03; dugme.add(bilezik);
  const bk = new THREE.Mesh(new THREE.CircleGeometry(0.545, 28), new THREE.MeshBasicMaterial({ color: MUREKKEP })); bk.position.z = -0.01; dugme.add(bk);
  const bas = new THREE.Group(); dugme.add(bas);
  const govdeD = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 28), boya(KIRMIZI)); govdeD.rotation.x = Math.PI / 2; govdeD.position.z = 0.15; bas.add(govdeD);
  const yuz = D.dugmeYuzu('DENE', 0.8).mesh; yuz.position.z = 0.262; bas.add(yuz);
  const dugmeAlani = new THREE.Mesh(new THREE.CircleGeometry(0.68, 20), new THREE.MeshBasicMaterial({ visible: false })); dugmeAlani.position.z = 0.4; dugme.add(dugmeAlani);
  async function dugmeBas() { await git(bas.position, { z: -0.1 }, 0.07, E.cik3); await git(bas.position, { z: 0 }, 0.22, E.asim); }

  // ---- fiş yuvası ve fiş ----
  const FIS_X = -0.5, FIS_Y = 1.12;
  const yuva = parca(2.3, 0.2, 0.08, 0x2a1c14, { r: 0.08, kontur: 0.03, pah: 0.02 }); yuva.position.set(FIS_X, FIS_Y, ON); grup.add(yuva);
  const fisL = D.fis(1.9, 1.2);
  fisL.mesh.geometry.translate(0, -0.6, 0); // üst kenar yuvada kalsın
  fisL.mesh.position.set(FIS_X, FIS_Y, 0.8); fisL.mesh.scale.y = 0.001; fisL.mesh.visible = false; grup.add(fisL.mesh);
  async function fisBas(metin, sure = 0.22) {
    fisL.yaz(metin); fisL.mesh.visible = true;
    await tween({ sure, ease: E.cik3, guncelle: k => { fisL.mesh.scale.y = Math.max(k, 0.001); } });
  }
  async function fisCek(sure = 0.14) {
    await tween({ sure, ease: E.gir3, guncelle: k => { fisL.mesh.scale.y = Math.max(1 - k, 0.001); } });
    fisL.mesh.visible = false;
  }

  // ---- 2. tur ön yüzü: gösterge ----
  const gosterge = new THREE.Group(); gosterge.position.set(0, 2.5, ON); gosterge.visible = false; grup.add(gosterge);
  const cerceve = new THREE.Mesh(new THREE.TorusGeometry(0.89, 0.08, 10, 40), boya(0x8f6c26)); cerceve.position.z = 0.03; gosterge.add(cerceve);
  const ck = new THREE.Mesh(new THREE.CircleGeometry(1.01, 40), new THREE.MeshBasicMaterial({ color: MUREKKEP })); ck.position.z = -0.005; gosterge.add(ck);
  const kad = D.kadran(1.75); kad.mesh.position.z = 0.02; gosterge.add(kad.mesh);
  const ibre = new THREE.Group(); ibre.position.set(kad.mil.x, kad.mil.y, 0.06); gosterge.add(ibre);
  const cubuk = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.74), new THREE.MeshBasicMaterial({ color: 0xae301d })); cubuk.position.y = 0.3; ibre.add(cubuk);
  const cubukK = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.8), new THREE.MeshBasicMaterial({ color: MUREKKEP })); cubukK.position.set(0, 0.3, -0.004); ibre.add(cubukK);
  const mil = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color: MUREKKEP })); mil.position.z = 0.004; ibre.add(mil);
  let ibreDeger = 0; ibre.rotation.z = kad.mil.aci(0);
  function ibreAyarla(v, sure = 0.5) {
    const bas0 = ibreDeger; ibreDeger = v;
    return tween({ sure, ease: E.yay, guncelle: k => { ibre.rotation.z = kad.mil.aci(karis(bas0, v, k)); } });
  }

  async function mod(yeni) {
    if (yeni === 'ornek') {
      await Promise.all([git(kolGrubu.scale, { x: 0.001, y: 0.001 }, 0.25, E.gir3), git(dugme.scale, { x: 0.001, y: 0.001 }, 0.25, E.gir3)]);
      kolGrubu.visible = false; dugme.visible = false;
      gosterge.visible = true; gosterge.scale.set(0.001, 0.001, 1);
      await git(gosterge.scale, { x: 1, y: 1 }, 0.4, E.asim);
    } else {
      gosterge.visible = false; kolGrubu.visible = true; dugme.visible = true;
      kolGrubu.scale.set(1, 1, 1); dugme.scale.set(1, 1, 1);
    }
  }
  // kol grubu ve düğme kendi merkezlerinden küçülsün
  kolGrubu.position.set(0, 2.43, 0); kolGrubu.children.forEach(c => { c.position.y -= 2.43; });

  // çalışırken küçük sarsıntı
  function sars(guc = 0.03, sure = 0.25) {
    return tween({ sure, guncelle: (_, k) => { grup.rotation.z = Math.sin(k * 30) * guc * (1 - k); }, bitir: () => { grup.rotation.z = 0; } });
  }

  return { grup, kollar, kolAyarla, kolDegeri, dugmeAlani, dugmeBas, dugme, fisBas, fisCek, mod, ibreAyarla, sars };
}

// Ahşap tepsi: içine küçük kartlar dizilir
export function tepsiKur(yazi) {
  const grup = new THREE.Group(), AHSAP = 0xb9772f, AHSAP_KOYU = 0x8f5722;
  const arka = parca(1.5, 1.2, 0.1, AHSAP_KOYU, { r: 0.06 }); arka.position.set(0, 0.6, -0.42); grup.add(arka);
  const taban = parca(1.5, 0.1, 0.94, AHSAP_KOYU, { r: 0.04 }); taban.position.set(0, 0.05, 0); grup.add(taban);
  for (const x of [-0.7, 0.7]) { const y = parca(0.1, 0.9, 0.94, AHSAP, { r: 0.04 }); y.position.set(x, 0.45, 0); grup.add(y); }
  const on = parca(1.5, 0.78, 0.1, AHSAP, { r: 0.06 }); on.position.set(0, 0.39, 0.42); grup.add(on);
  const et = D.etiket(yazi, 1.14, 0.46).mesh; et.position.set(0, 0.38, 0.49); grup.add(et);
  const alan = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.3), new THREE.MeshBasicMaterial({ visible: false })); alan.position.set(0, 0.9, 0.6); grup.add(alan);
  const yuva = new THREE.Group(); yuva.position.set(0, 0.12, 0); grup.add(yuva); // kartların oturduğu yer
  return { grup, alan, yuva, adet: 0 };
}
