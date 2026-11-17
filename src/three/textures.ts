import * as THREE from 'three';

export interface ProceduralTextureSet {
  sponge: THREE.CanvasTexture;
  pineapple: THREE.CanvasTexture;
  sand: THREE.CanvasTexture;
  woodFloor: THREE.CanvasTexture;
  kitchenTile: THREE.CanvasTexture;
  stone: THREE.CanvasTexture;
  flowerCloud: THREE.CanvasTexture;
  bubble: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  galleySign: THREE.CanvasTexture;
  bumpNoise: THREE.CanvasTexture;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  // 1. SpongeBob porous texture
  const [spC, spCtx] = makeCanvas(256, 256);
  spCtx.fillStyle = '#f8e136';
  spCtx.fillRect(0, 0, 256, 256);
  const pores = [
    [35, 42, 16], [110, 30, 11], [190, 50, 19], [65, 120, 13],
    [155, 115, 22], [220, 145, 12], [45, 200, 18], [130, 210, 14], [210, 215, 16],
  ];
  for (const [px, py, pr] of pores) {
    spCtx.fillStyle = '#b9ad18';
    spCtx.beginPath();
    spCtx.ellipse(px, py, pr, pr * 0.85, 0.3, 0, Math.PI * 2);
    spCtx.fill();
    spCtx.fillStyle = '#cfbf1f';
    spCtx.beginPath();
    spCtx.ellipse(px + 2, py + 2, pr * 0.7, pr * 0.6, 0.3, 0, Math.PI * 2);
    spCtx.fill();
  }
  const sponge = finalizeColorTex(spC, maxAniso);

  // 2. Pineapple skin diamond lattice
  const [piC, piCtx] = makeCanvas(256, 256);
  piCtx.fillStyle = '#d97718';
  piCtx.fillRect(0, 0, 256, 256);
  piCtx.strokeStyle = '#9a4908';
  piCtx.lineWidth = 5;
  for (let i = -256; i < 512; i += 32) {
    piCtx.beginPath();
    piCtx.moveTo(i, 0);
    piCtx.lineTo(i + 256, 256);
    piCtx.stroke();
    piCtx.beginPath();
    piCtx.moveTo(i + 256, 0);
    piCtx.lineTo(i, 256);
    piCtx.stroke();
  }
  piCtx.fillStyle = '#f29f33';
  for (let y = 16; y < 256; y += 32) {
    for (let x = 16; x < 256; x += 32) {
      piCtx.beginPath();
      piCtx.arc(x, y, 4, 0, Math.PI * 2);
      piCtx.fill();
    }
  }
  const pineapple = finalizeColorTex(piC, maxAniso, 2, 2);

  // 3. Underwater sand
  const [saC, saCtx] = makeCanvas(256, 256);
  saCtx.fillStyle = '#c8b88a';
  saCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    saCtx.fillStyle = y % 32 === 0 ? 'rgba(255,248,220,0.14)' : 'rgba(90,78,52,0.12)';
    saCtx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wave = Math.sin((x / 256) * Math.PI * 2 + y * 0.1) * 4;
      if (x === 0) saCtx.moveTo(x, y + wave);
      else saCtx.lineTo(x, y + wave);
    }
    saCtx.lineTo(256, y + 8);
    saCtx.lineTo(0, y + 8);
    saCtx.closePath();
    saCtx.fill();
  }
  for (let i = 0; i < 650; i++) {
    saCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,240,0.22)' : 'rgba(80,68,45,0.2)';
    saCtx.fillRect((i * 73) % 256, (i * 139) % 256, 2, 2);
  }
  const sand = finalizeColorTex(saC, maxAniso, 16, 16);

  // 4. Krusty Krab weathered horror wood plank floor
  const [woC, woCtx] = makeCanvas(256, 256);
  woCtx.fillStyle = '#4f2f18';
  woCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    woCtx.fillStyle = y % 64 === 0 ? '#5a361b' : '#442814';
    woCtx.fillRect(0, y, 256, 30);
    woCtx.fillStyle = '#1e1007';
    woCtx.fillRect(0, y + 30, 256, 2);
    const joint = ((y / 32) * 97) % 220 + 18;
    woCtx.fillRect(joint, y, 2, 30);
  }
  for (let s = 0; s < 24; s++) {
    woCtx.fillStyle = s % 3 === 0 ? 'rgba(65,10,10,0.22)' : 'rgba(10,15,20,0.28)';
    woCtx.beginPath();
    woCtx.ellipse((s * 71) % 240 + 8, (s * 113) % 240 + 8, 12 + (s % 14), 5 + (s % 7), s, 0, Math.PI * 2);
    woCtx.fill();
  }
  const woodFloor = finalizeColorTex(woC, maxAniso, 5, 5);

  // 5. Krusty Krab stained horror kitchen tile
  const [tiC, tiCtx] = makeCanvas(256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      tiCtx.fillStyle = (x + y) % 2 === 0 ? '#9da39a' : '#2d4352';
      tiCtx.fillRect(x * 64, y * 64, 64, 64);
      tiCtx.strokeStyle = 'rgba(15,20,25,0.45)';
      tiCtx.lineWidth = 2;
      tiCtx.strokeRect(x * 64, y * 64, 64, 64);
    }
  }
  for (let i = 0; i < 30; i++) {
    tiCtx.fillStyle = i % 4 === 0 ? 'rgba(85,12,12,0.24)' : 'rgba(12,18,22,0.25)';
    tiCtx.beginPath();
    tiCtx.arc((i * 83) % 240 + 8, (i * 57) % 240 + 8, 5 + (i % 9), 0, Math.PI * 2);
    tiCtx.fill();
  }
  const kitchenTile = finalizeColorTex(tiC, maxAniso, 3, 3);

  // 6. Moai weathered stone texture
  const [stC, stCtx] = makeCanvas(256, 256);
  stCtx.fillStyle = '#364657';
  stCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 950; i++) {
    stCtx.fillStyle = i % 3 === 0 ? 'rgba(200,220,235,0.06)' : 'rgba(8,12,18,0.24)';
    stCtx.fillRect((i * 53) % 256, (i * 97) % 256, 3, 3);
  }
  const stone = finalizeColorTex(stC, maxAniso, 2, 2);

  // 7. Bikini Bottom sky flower cloud sprite
  const [flC, flCtx] = makeCanvas(128, 128);
  flCtx.clearRect(0, 0, 128, 128);
  flCtx.strokeStyle = 'rgba(120, 175, 225, 0.35)';
  flCtx.lineWidth = 10;
  flCtx.beginPath();
  for (let a = 0; a < 5; a++) {
    const ang = (a / 5) * Math.PI * 2;
    const px = 64 + Math.cos(ang) * 34;
    const py = 64 + Math.sin(ang) * 34;
    flCtx.moveTo(64, 64);
    flCtx.arc(px, py, 16, 0, Math.PI * 2);
  }
  flCtx.stroke();
  flCtx.fillStyle = 'rgba(120, 175, 225, 0.25)';
  flCtx.beginPath();
  flCtx.arc(64, 64, 18, 0, Math.PI * 2);
  flCtx.fill();
  const flowerCloud = new THREE.CanvasTexture(flC);
  flowerCloud.colorSpace = THREE.SRGBColorSpace;

  // 8. Bubble sprite
  const [buC, buCtx] = makeCanvas(128, 128);
  const bGrad = buCtx.createRadialGradient(64, 64, 10, 64, 64, 58);
  bGrad.addColorStop(0, 'rgba(190, 240, 255, 0.05)');
  bGrad.addColorStop(0.75, 'rgba(140, 225, 255, 0.28)');
  bGrad.addColorStop(0.92, 'rgba(235, 250, 255, 0.72)');
  bGrad.addColorStop(1, 'rgba(235, 250, 255, 0)');
  buCtx.fillStyle = bGrad;
  buCtx.fillRect(0, 0, 128, 128);
  buCtx.fillStyle = 'rgba(255,255,255,0.8)';
  buCtx.beginPath();
  buCtx.ellipse(44, 42, 10, 6, -0.5, 0, Math.PI * 2);
  buCtx.fill();
  const bubble = new THREE.CanvasTexture(buC);
  bubble.colorSpace = THREE.SRGBColorSpace;

  // 9. Contact shadow radial disc
  const [csC, csCtx] = makeCanvas(128, 128);
  const cGrad = csCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  cGrad.addColorStop(0, 'rgba(0,0,0,0.72)');
  cGrad.addColorStop(0.6, 'rgba(0,0,0,0.32)');
  cGrad.addColorStop(1, 'rgba(0,0,0,0)');
  csCtx.fillStyle = cGrad;
  csCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(csC);

  // 10. Galley Grub menu board
  const [ggC, ggCtx] = makeCanvas(512, 256);
  ggCtx.fillStyle = '#332215';
  ggCtx.fillRect(0, 0, 512, 256);
  ggCtx.strokeStyle = '#c4914d';
  ggCtx.lineWidth = 10;
  ggCtx.strokeRect(8, 8, 496, 240);
  ggCtx.fillStyle = '#f8d249';
  ggCtx.font = 'bold 34px sans-serif';
  ggCtx.textAlign = 'center';
  ggCtx.fillText('GALLEY GRUB', 256, 52);
  ggCtx.fillStyle = '#fef3c7';
  ggCtx.font = 'bold 22px monospace';
  ggCtx.textAlign = 'left';
  ggCtx.fillText('KRABBY PATTY ........ $1.25', 42, 105);
  ggCtx.fillText('DOUBLE KRABBY ....... $2.00', 42, 145);
  ggCtx.fillText('KELP FRIES .......... $1.00', 42, 185);
  ggCtx.fillText('CORAL BITS .......... $1.25', 42, 225);
  const galleySign = finalizeColorTex(ggC, maxAniso);

  // 11. Linear grayscale micro-bump map
  const [bmC, bmCtx] = makeCanvas(128, 128);
  bmCtx.fillStyle = '#808080';
  bmCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 600; i++) {
    const shade = (i * 37) % 100 + 80;
    bmCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    bmCtx.fillRect((i * 41) % 128, (i * 89) % 128, 3, 2);
  }
  const bumpNoise = new THREE.CanvasTexture(bmC);
  bumpNoise.wrapS = THREE.RepeatWrapping;
  bumpNoise.wrapT = THREE.RepeatWrapping;
  bumpNoise.repeat.set(6, 6);

  return {
    sponge,
    pineapple,
    sand,
    woodFloor,
    kitchenTile,
    stone,
    flowerCloud,
    bubble,
    contactShadow,
    galleySign,
    bumpNoise,
  };
}
