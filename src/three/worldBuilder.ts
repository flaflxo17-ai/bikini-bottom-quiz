import * as THREE from 'three';
import { ObbyPlatform, SlideRamp, WallBox } from '../game/rules';
import { ProceduralTextureSet } from './textures';

export interface SeaweedHazard {
  mesh: THREE.Group;
  x: number;
  z: number;
  radius: number;
  baseRotZ: number;
  phase: number;
}

export interface HidingSpot {
  x: number;
  z: number;
  radius: number;
}

export interface MovingPlatform {
  mesh: THREE.Mesh;
  platform: ObbyPlatform;
  baseX: number;
  rangeX: number;
  speed: number;
  phase: number;
}

export interface ClueHotspot {
  index: number;
  x: number;
  y: number;
  z: number;
  label: string;
  mesh: THREE.Mesh;
}

export interface CamelliaPillar {
  index: number;
  symbolName: string;
  clueText: string;
  x: number;
  z: number;
  mesh: THREE.Group;
  orb: THREE.Mesh;
  light: THREE.PointLight;
}

export interface WorldRefs {
  walls: WallBox[];
  obbyPlatforms: ObbyPlatform[];
  slides: SlideRamp[];
  movingPlatforms: MovingPlatform[];
  seaweeds: SeaweedHazard[];
  hidingSpots: HidingSpot[];
  clueHotspots: ClueHotspot[];
  camelliaPillars: CamelliaPillar[];
  kitchenDoor: THREE.Group;
  frontDoorLeft: THREE.Mesh;
  frontDoorRight: THREE.Mesh;
  frontDoorGroup: THREE.Group;
  safeDoor: THREE.Mesh;
  safeKeyMesh: THREE.Mesh;
  mapPickup: THREE.Group;
  redLampLight: THREE.PointLight;
  redLampBulb: THREE.Mesh;
  sandyExitDoor: THREE.Mesh;
  portalGroup: THREE.Group;
  portalLight: THREE.PointLight;
  treeLeaves: THREE.Group[];
  krustyLights: THREE.PointLight[];
  bubbles: THREE.Points;
  skyFlowers: THREE.Group;
  ufoPlanktonSpot: THREE.Vector3;
  sandyArenaCenter: THREE.Vector3;
  greatTreePos: THREE.Vector3;
}

function addBoxWall(
  parent: THREE.Object3D,
  walls: WallBox[],
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  registerCollision = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(cx, cy, cz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (registerCollision) {
    walls.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
    });
  }
  return mesh;
}

function createSignboardMesh(
  titleText: string,
  subText: string,
  bgHex: string,
  borderHex: string,
  textHex: string
): THREE.Group {
  const grp = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 236);
    ctx.fillStyle = textHex;
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, 256, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(subText, 256, 172);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 })
  );
  post.position.y = 1.1;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.4, 0.14),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(bgHex),
      emissiveMap: tex,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    })
  );
  board.position.y = 2.2;
  grp.add(post, board);
  return grp;
}

export function buildBikiniBottomWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl = false
): WorldRefs {
  const walls: WallBox[] = [];
  const obbyPlatforms: ObbyPlatform[] = [];
  const slides: SlideRamp[] = [];
  const movingPlatforms: MovingPlatform[] = [];
  const seaweeds: SeaweedHazard[] = [];
  const hidingSpots: HidingSpot[] = [];
  const clueHotspots: ClueHotspot[] = [];
  const camelliaPillars: CamelliaPillar[] = [];
  const krustyLights: THREE.PointLight[] = [];
  const treeLeaves: THREE.Group[] = [];

  // Ocean Floor Seabed
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.sand,
    roughness: 0.9,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 80);
  ground.receiveShadow = true;
  scene.add(ground);

  // Bikini Bottom Sky Flower Clouds
  const skyFlowers = new THREE.Group();
  const flowerMat = new THREE.MeshBasicMaterial({
    map: textures.flowerCloud,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flowerPlane = new THREE.PlaneGeometry(18, 18);
  for (let i = 0; i < 18; i++) {
    const fl = new THREE.Mesh(flowerPlane, flowerMat);
    fl.position.set(
      Math.sin(i * 1.7) * 75,
      26 + (i % 4) * 5,
      -20 + i * 13
    );
    fl.rotation.y = i * 0.6;
    skyFlowers.add(fl);
  }
  scene.add(skyFlowers);

  // Rising Underwater Bubbles Particle System
  const bubbleCount = 260;
  const bubblePositions = new Float32Array(bubbleCount * 3);
  for (let i = 0; i < bubbleCount; i++) {
    bubblePositions[i * 3] = (Math.random() - 0.5) * 160;
    bubblePositions[i * 3 + 1] = Math.random() * 24 + 0.5;
    bubblePositions[i * 3 + 2] = Math.random() * 190 - 20;
  }
  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
  const bubbleMat = new THREE.PointsMaterial({
    map: textures.bubble,
    size: 0.85,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
  scene.add(bubbles);

  // =========================================================================
  // POS 1: KRUSTY KRAB INTERIOR (x: -9..9, z: -10..10.1)
  // =========================================================================
  const kkGroup = new THREE.Group();
  scene.add(kkGroup);

  const woodWallMat = new THREE.MeshStandardMaterial({ color: 0x5c3318, roughness: 0.85 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2e1709, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.72 });
  const diningFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 13),
    new THREE.MeshStandardMaterial({ map: textures.woodFloor, roughness: 0.8 })
  );
  diningFloor.rotation.x = -Math.PI / 2;
  diningFloor.position.set(0, 0.02, 3.5);
  diningFloor.receiveShadow = true;
  kkGroup.add(diningFloor);

  const kitchenFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 7),
    new THREE.MeshStandardMaterial({ map: textures.kitchenTile, roughness: 0.55 })
  );
  kitchenFloor.rotation.x = -Math.PI / 2;
  kitchenFloor.position.set(0, 0.025, -6.5);
  kitchenFloor.receiveShadow = true;
  kkGroup.add(kitchenFloor);

  // Outer walls of Krusty Krab
  addBoxWall(kkGroup, walls, 0, 2.5, -10.2, 18.4, 5, 0.5, woodWallMat);
  addBoxWall(kkGroup, walls, -9.2, 2.5, 0, 0.5, 5, 20.5, woodWallMat);
  addBoxWall(kkGroup, walls, 9.2, 2.5, 0, 0.5, 5, 20.5, woodWallMat);
  addBoxWall(kkGroup, walls, -5.4, 2.5, 10.1, 7.6, 5, 0.5, woodWallMat);
  addBoxWall(kkGroup, walls, 5.4, 2.5, 10.1, 7.6, 5, 0.5, woodWallMat);
  addBoxWall(kkGroup, walls, 0, 4.3, 10.1, 3.4, 1.4, 0.5, woodWallMat, false);

  // Curved Boat Barrel Roof + Krusty Krab Sign
  const kkRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(9.6, 9.6, 20.5, 24, 1, false, 0, Math.PI),
    darkWoodMat
  );
  kkRoof.rotation.z = Math.PI / 2;
  kkRoof.rotation.y = Math.PI / 2;
  kkRoof.position.set(0, 5.0, 0);
  kkGroup.add(kkRoof);

  [-6.5, 6.5].forEach((wx) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 0.65), metalMat);
    frame.position.set(wx, 2.4, 10.1);
    kkGroup.add(frame);
  });
  const kkSignTexCanvas = document.createElement('canvas');
  kkSignTexCanvas.width = 512;
  kkSignTexCanvas.height = 160;
  const kkCtx = kkSignTexCanvas.getContext('2d');
  if (kkCtx) {
    kkCtx.fillStyle = '#3b1c0a';
    kkCtx.fillRect(0, 0, 512, 160);
    kkCtx.strokeStyle = '#facc15';
    kkCtx.lineWidth = 10;
    kkCtx.strokeRect(8, 8, 496, 144);
    kkCtx.fillStyle = '#fef08a';
    kkCtx.font = 'bold 54px sans-serif';
    kkCtx.textAlign = 'center';
    kkCtx.textBaseline = 'middle';
    kkCtx.fillText('KRUSTY KRAB', 256, 82);
  }
  const kkSignTex = new THREE.CanvasTexture(kkSignTexCanvas);
  kkSignTex.colorSpace = THREE.SRGBColorSpace;
  const kkSignMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 2.0, 0.35),
    new THREE.MeshStandardMaterial({
      map: kkSignTex,
      emissive: 0xf59e0b,
      emissiveMap: kkSignTex,
      emissiveIntensity: 0.9,
      roughness: 0.4,
    })
  );
  kkSignMesh.position.set(0, 5.8, 10.6);
  kkGroup.add(kkSignMesh);

  // Partition between Kitchen & Dining
  addBoxWall(kkGroup, walls, -5.2, 2.5, -3, 7.8, 5, 0.4, woodWallMat);
  addBoxWall(kkGroup, walls, 5.2, 2.5, -3, 7.8, 5, 0.4, woodWallMat);
  addBoxWall(kkGroup, walls, 0, 4.2, -3, 2.8, 1.6, 0.4, woodWallMat, false);

  const kitchenDoor = new THREE.Group();
  kitchenDoor.position.set(-1.25, 0, -3);
  const kDoorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.3, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 })
  );
  kDoorPanel.position.set(1.2, 1.65, 0);
  kitchenDoor.add(kDoorPanel);
  const porthole = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), metalMat);
  porthole.position.set(1.2, 2.15, 0.08);
  kitchenDoor.add(porthole);
  kkGroup.add(kitchenDoor);

  const frontDoorGroup = new THREE.Group();
  frontDoorGroup.position.set(0, 0, 10.1);
  kkGroup.add(frontDoorGroup);
  const glassDoorMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55,
  });
  const frontDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.55, 3.4, 0.16), glassDoorMat);
  frontDoorLeft.position.set(-0.8, 1.7, 0);
  frontDoorGroup.add(frontDoorLeft);
  const frontDoorRight = new THREE.Mesh(new THREE.BoxGeometry(1.55, 3.4, 0.16), glassDoorMat);
  frontDoorRight.position.set(0.8, 1.7, 0);
  frontDoorGroup.add(frontDoorRight);
  walls.push({ id: 'kk_front_door', minX: -1.75, maxX: 1.75, minZ: 9.8, maxZ: 10.45 });

  // Kitchen Appliances
  addBoxWall(kkGroup, walls, -5.8, 0.65, -8.5, 3.2, 1.3, 1.6, metalMat);
  const pan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.4, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 })
  );
  pan.position.set(-5.6, 1.36, -8.4);
  kkGroup.add(pan);
  const pattyBunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  const pattyMeatMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85 });
  const makeKrabbyPatty = (px: number, py: number, pz: number) => {
    const g = new THREE.Group();
    g.position.set(px, py, pz);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.08, 14), pattyBunMat);
    const meat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.09, 14), pattyMeatMat);
    meat.position.y = 0.08;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), pattyBunMat);
    top.position.y = 0.12;
    g.add(bot, meat, top);
    kkGroup.add(g);
  };
  makeKrabbyPatty(-5.6, 1.46, -8.4);
  makeKrabbyPatty(3.1, 1.15, -6.5);
  makeKrabbyPatty(3.8, 1.15, -6.3);

  addBoxWall(kkGroup, walls, 3.4, 0.55, -6.4, 3.0, 1.1, 1.5, metalMat);
  addBoxWall(kkGroup, walls, 6.2, 1.6, -8.6, 2.8, 3.2, 1.2, darkWoodMat);
  addBoxWall(kkGroup, walls, -7.8, 1.2, -5.2, 1.4, 2.4, 2.2, woodWallMat);

  const galleyMenu = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.1),
    new THREE.MeshStandardMaterial({ map: textures.galleySign, roughness: 0.6 })
  );
  galleyMenu.position.set(-4.5, 2.9, -2.75);
  kkGroup.add(galleyMenu);

  const boatMat = new THREE.MeshStandardMaterial({ color: 0x5c3419, roughness: 0.72 });
  addBoxWall(kkGroup, walls, -4.6, 0.65, 1.6, 3.6, 1.3, 1.6, boatMat);
  const register = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.5), metalMat);
  register.position.set(-4.6, 1.55, 1.6);
  kkGroup.add(register);

  const makeTableSet = (tx: number, tz: number) => {
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.95, 16), boatMat);
    tbl.position.set(tx, 0.48, tz);
    tbl.castShadow = true;
    kkGroup.add(tbl);
    walls.push({ minX: tx - 0.9, maxX: tx + 0.9, minZ: tz - 0.9, maxZ: tz + 0.9 });
    [-1.25, 1.25].forEach((sx) => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.58, 12), darkWoodMat);
      stool.position.set(tx + sx, 0.29, tz);
      kkGroup.add(stool);
    });
  };
  makeTableSet(2.2, 1.5);
  makeTableSet(2.5, 6.2);
  makeTableSet(-4.8, 6.2);

  // Mr. Krabs' Safe
  const safeBody = addBoxWall(kkGroup, walls, 7.6, 1.15, 0.4, 1.8, 2.3, 1.8, metalMat);
  safeBody.castShadow = true;
  const safeDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 2.0, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.85 })
  );
  safeDoor.position.set(6.65, 1.15, 0.4);
  const safeWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.05, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.9 })
  );
  safeWheel.rotation.y = Math.PI / 2;
  safeWheel.position.set(-0.12, 0, 0);
  safeDoor.add(safeWheel);
  kkGroup.add(safeDoor);

  const safeKeyMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  safeKeyMesh.position.set(7.3, 1.1, 0.4);
  kkGroup.add(safeKeyMesh);

  const clueCoords: Array<[number, number, number, string]> = [
    [3.4, 1.35, -6.4, 'Resep Rahasia Dapur (Digit 1)'],
    [-4.6, 1.85, 1.6, 'Mesin Kasir (Digit 2)'],
    [2.2, 1.1, 1.5, 'Meja Pelanggan (Digit 3)'],
    [-4.8, 1.1, 6.2, 'Meja Sudut (Digit 4)'],
    [6.1, 1.4, 4.5, 'Catatan Kantor Krabs (Digit 5)'],
  ];
  const clueMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.1,
    roughness: 0.25,
  });
  clueCoords.forEach(([cx, cy, cz, label], index) => {
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), clueMat.clone());
    orb.position.set(cx, cy, cz);
    kkGroup.add(orb);
    clueHotspots.push({ index, x: cx, y: cy, z: cz, label, mesh: orb });
  });

  const fallenStool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.58, 12), darkWoodMat);
  fallenStool.rotation.z = Math.PI / 2;
  fallenStool.rotation.y = 0.6;
  fallenStool.position.set(-2.4, 0.3, 4.1);
  kkGroup.add(fallenStool);

  const webMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, transparent: true, opacity: 0.65 });
  [[-7.5, -8.2], [7.5, -8.2], [-7.5, 8.0], [7.5, 8.0]].forEach(([wx, wz]) => {
    const strand = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6), webMat);
    strand.rotation.x = Math.PI;
    strand.position.set(wx, 4.35, wz);
    kkGroup.add(strand);
  });

  const kkLight1 = new THREE.PointLight(0xb45309, 1.15, 17, 1.8);
  kkLight1.position.set(0, 4.2, 3.5);
  scene.add(kkLight1);
  krustyLights.push(kkLight1);

  const kkLight2 = new THREE.PointLight(0xdc2626, 1.35, 15, 1.7);
  kkLight2.position.set(0, 4.0, -6.5);
  scene.add(kkLight2);
  krustyLights.push(kkLight2);

  const kkExteriorLight = new THREE.PointLight(0xfef08a, 4.2, 36, 1.1);
  kkExteriorLight.position.set(0, 5.2, 12.8);
  scene.add(kkExteriorLight);
  krustyLights.push(kkExteriorLight);

  // =========================================================================
  // RED MYSTERY CHECKPOINT LAMP JUST OUTSIDE KRUSTY KRAB (x: -2.4, z: 11.4)
  // =========================================================================
  const lampPost = new THREE.Group();
  lampPost.position.set(-2.4, 0, 11.4);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 12), metalMat);
  pole.position.y = 1.6;
  lampPost.add(pole);
  const redLampMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
    roughness: 0.2,
  });
  const redLampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), redLampMat);
  redLampBulb.position.y = 3.35;
  lampPost.add(redLampBulb);
  const redLampLight = new THREE.PointLight(0xef4444, 1.2, 18, 1.4);
  redLampLight.position.set(-2.4, 3.4, 11.4);
  scene.add(lampPost, redLampLight);

  // =========================================================================
  // NEIGHBORHOOD HOUSE BUILDER (Many Iconic Bikini Bottom Houses!)
  // =========================================================================
  const winGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });

  const addTownHouse = (
    kind: 'coral' | 'shell' | 'anchor' | 'dome' | 'chum_bucket',
    hx: number,
    hz: number,
    rotY = 0,
    colorHex = 0xec4899
  ) => {
    const g = new THREE.Group();
    g.position.set(hx, 0, hz);
    g.rotation.y = rotY;
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.65 });

    if (kind === 'coral') {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 6.2, 16), mat);
      tower.position.y = 3.1;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 10, 18), mat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 6.1;
      const win1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), winGlowMat);
      win1.rotation.z = Math.PI / 2;
      win1.position.set(2.15, 3.8, 0);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 1.1), darkWoodMat);
      door.position.set(2.25, 1.0, 0);
      g.add(tower, rim, win1, door);
    } else if (kind === 'shell') {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
        mat
      );
      shell.scale.set(1.0, 1.15, 1.15);
      const win1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), winGlowMat);
      win1.position.set(2.5, 1.9, 1.1);
      const win2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), winGlowMat);
      win2.position.set(2.5, 1.9, -1.1);
      g.add(shell, win1, win2);
    } else if (kind === 'anchor') {
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 6.8, 16), mat);
      hull.position.y = 3.4;
      const cross = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 4.2, 6, 10), mat);
      cross.rotation.x = Math.PI / 2;
      cross.position.set(0, 6.2, 0);
      const win = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), winGlowMat);
      win.position.set(2.2, 4.0, 0);
      g.add(hull, cross, win);
    } else if (kind === 'dome') {
      const domePts = [
        new THREE.Vector2(0.01, 0),
        new THREE.Vector2(3.1, 0.2),
        new THREE.Vector2(2.8, 2.5),
        new THREE.Vector2(1.8, 4.8),
        new THREE.Vector2(0.01, 5.6),
      ];
      const dome = new THREE.Mesh(new THREE.LatheGeometry(domePts, 18), mat);
      const win = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.35, 14), winGlowMat);
      win.rotation.z = Math.PI / 2;
      win.position.set(2.6, 2.5, 0);
      g.add(dome, win);
    } else {
      // Chum Bucket!
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.7, 6.5, 20), metalMat);
      bucket.position.y = 3.25;
      const fist = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }));
      fist.position.y = 7.4;
      const neon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 3.2), new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 1.5 }));
      neon.position.set(3.0, 4.2, 0);
      g.add(bucket, fist, neon);
    }

    scene.add(g);
    walls.push({ minX: hx - 2.6, maxX: hx + 2.6, minZ: hz - 2.6, maxZ: hz + 2.6 });
  };

  // =========================================================================
  // POS 2 (1 METER SETELAH KRUSTY KRAB): RUMAH SQUIDWARD + RUMPUT LAUT 1M + BANYAK RUMAH
  // =========================================================================
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const roadPos2 = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 18), roadMat);
  roadPos2.rotation.x = -Math.PI / 2;
  roadPos2.position.set(0, 0.02, 19);
  roadPos2.receiveShadow = true;
  scene.add(roadPos2);

  // Squidward's Easter Island Head House RIGHT AFTER Krusty Krab (x: 6.4, z: 14.5)
  const squidHouse = new THREE.Group();
  squidHouse.position.set(6.4, 0, 14.5);
  const stoneMat = new THREE.MeshStandardMaterial({ map: textures.stone, roughness: 0.85 });
  const moaiPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(3.1, 0.2),
    new THREE.Vector2(2.9, 3.8),
    new THREE.Vector2(2.7, 7.2),
    new THREE.Vector2(2.4, 8.3),
    new THREE.Vector2(0.01, 8.8),
  ];
  const moaiBody = new THREE.Mesh(new THREE.LatheGeometry(moaiPts, 20), stoneMat);
  squidHouse.add(moaiBody);
  const moaiNose = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 2.0, 6, 12), stoneMat);
  moaiNose.position.set(-2.9, 4.3, 0);
  moaiNose.rotation.z = 0.22;
  squidHouse.add(moaiNose);
  const moaiBrow = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 3.8), stoneMat);
  moaiBrow.position.set(-2.6, 6.0, 0);
  squidHouse.add(moaiBrow);
  const moaiEyeMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.1,
  });
  [-1.15, 1.15].forEach((ez) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 14), moaiEyeMat);
    eye.rotation.z = Math.PI / 2;
    eye.position.set(-2.7, 5.1, ez);
    squidHouse.add(eye);
  });
  const sqDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 1.4), darkWoodMat);
  sqDoor.position.set(-2.9, 1.3, 0);
  squidHouse.add(sqDoor);
  scene.add(squidHouse);
  walls.push({ minX: 3.6, maxX: 9.4, minZ: 11.6, maxZ: 17.4 });

  // SpongeBob's Pineapple House opposite Squidward (x: -9.5, z: 17.5)
  const pineappleGroup = new THREE.Group();
  pineappleGroup.position.set(-9.5, 0, 17.5);
  const pinePts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(2.9, 0.2),
    new THREE.Vector2(3.6, 2.4),
    new THREE.Vector2(3.4, 4.9),
    new THREE.Vector2(2.3, 6.8),
    new THREE.Vector2(0.01, 7.4),
  ];
  const pineMesh = new THREE.Mesh(
    new THREE.LatheGeometry(pinePts, 24),
    new THREE.MeshStandardMaterial({ map: textures.pineapple, roughness: 0.72 })
  );
  pineappleGroup.add(pineMesh);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.0, 8), leafMat);
    const a = (i / 8) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.0, 8.0, Math.sin(a) * 1.0);
    leaf.rotation.z = -Math.cos(a) * 0.55;
    leaf.rotation.x = Math.sin(a) * 0.55;
    pineappleGroup.add(leaf);
  }
  const pineDoor = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16), metalMat);
  pineDoor.rotation.z = Math.PI / 2;
  pineDoor.position.set(3.3, 1.3, 0);
  pineappleGroup.add(pineDoor);
  [
    [3.1, 4.0, 1.2],
    [1.5, 3.6, 3.0],
  ].forEach(([px, py, pz]) => {
    const winGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.42, 16), winGlowMat);
    winGlass.position.set(px, py, pz);
    winGlass.lookAt(px * 2, py, pz * 2);
    winGlass.rotateX(Math.PI / 2);
    pineappleGroup.add(winGlass);
  });
  scene.add(pineappleGroup);
  walls.push({ minX: -13.1, maxX: -5.9, minZ: 13.9, maxZ: 21.1 });

  // Extra Neighborhood Houses around Pos 2 & Title Area!
  addTownHouse('shell', 9.2, 23.0, Math.PI, 0xf472b6);
  addTownHouse('coral', -10.5, 26.5, 0, 0x38bdf8);
  addTownHouse('anchor', -15.5, 10.0, 0, 0x94a3b8);
  addTownHouse('dome', 14.5, 8.0, Math.PI, 0xa78bfa);

  // 1-Meter Seaweed Hazards right after Krusty Krab (z: 12.2 .. 21.5) -> touch = Squidward Jumpscare!
  const seaweedMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    emissive: 0x15803d,
    emissiveIntensity: 0.75,
    roughness: 0.55,
  });
  const seaweedCoords: Array<[number, number]> = [
    [-1.4, 12.8],
    [1.5, 14.8],
    [-1.1, 16.8],
    [1.6, 18.8],
    [-1.3, 20.8],
  ];
  seaweedCoords.forEach(([sx, sz], idx) => {
    const swGroup = new THREE.Group();
    swGroup.position.set(sx, 0, sz);
    for (let b = 0; b < 5; b++) {
      const ox = (b - 2) * 0.19;
      const oz = ((b % 2) - 0.5) * 0.26;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ox, 0, oz),
        new THREE.Vector3(ox + 0.08, 0.55, oz + 0.06),
        new THREE.Vector3(ox - 0.06, 1.08, oz - 0.05),
      ]);
      const blade = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.08, 8, false), seaweedMat);
      swGroup.add(blade);
    }
    scene.add(swGroup);
    seaweeds.push({ mesh: swGroup, x: sx, z: sz, radius: 0.72, baseRotZ: 0, phase: idx * 1.3 });
  });

  // =========================================================================
  // BRIGHT STREETLAMPS ACROSS BIKINI BOTTOM STREETS (Pos 2, Pos 3, Pos 5)
  // =========================================================================
  const addBrightStreetLamp = (lx: number, lz: number, withLight = true) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.4, 10), metalMat);
    post.position.set(lx, 2.2, lz);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef08a, emissiveIntensity: 1.8 })
    );
    bulb.position.set(lx, 4.5, lz);
    scene.add(post, bulb);
    if (withLight) {
      const sl = new THREE.PointLight(0xfef3c7, 5.2, 26, 1.15);
      sl.position.set(lx, 4.4, lz);
      scene.add(sl);
    }
  };
  [
    [-4.2, 14.5],
    [4.2, 21.0],
    [-4.2, 28.0],
    [4.2, 40.0],
    [-4.2, 54.0],
    [4.2, 68.0],
    [-4.6, 86.0],
    [4.6, 98.0],
    [-4.6, 112.0],
    [4.6, 126.0],
    [0, 136.0],
  ].forEach(([lx, lz], i) => addBrightStreetLamp(lx, lz, !isSoftwareGl || i % 2 === 0));

  // =========================================================================
  // POS 3: PATRICK'S ROCK + OBBY NAIK-TURUN + SELUNCURAN + 2 JALAN + PETA (z: 27..79)
  // =========================================================================
  const patRock = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.92 })
  );
  patRock.position.set(-10.5, 0, 30);
  scene.add(patRock);

  const trenchMat = new THREE.MeshStandardMaterial({ color: 0x103152, roughness: 0.9 });
  const trench = new THREE.Mesh(new THREE.PlaneGeometry(34, 52), trenchMat);
  trench.rotation.x = -Math.PI / 2;
  trench.position.set(0, 0.03, 53);
  scene.add(trench);

  const obbyRockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
  const obbyUpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
  const obbyDownMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.6 });
  const bridgeSafeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const bridgeTrapMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.75 });

  const addStaticObby = (id: string, cx: number, cz: number, w: number, d: number, topY: number, mat: THREE.Material) => {
    const h = Math.max(0.4, topY);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, topY - h / 2, cz);
    mesh.receiveShadow = true;
    scene.add(mesh);
    obbyPlatforms.push({
      id,
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      topY,
    });
  };

  // Start platform -> Climb UP -> Step DOWN -> Slide Ramp -> Fork (Left = Sesat / Right = Benar) -> Map!
  addStaticObby('ob-start', 0, 29.0, 7.2, 5.2, 0.6, obbyRockMat);
  // NAIK KE ATAS
  addStaticObby('ob-up-1', -1.2, 33.8, 3.6, 3.6, 1.2, obbyUpMat);
  addStaticObby('ob-up-2', 1.2, 37.8, 3.6, 3.6, 1.8, obbyUpMat);
  addStaticObby('ob-up-3', 0, 41.8, 3.8, 3.6, 2.5, obbyUpMat);
  addStaticObby('ob-up-peak', 0, 46.0, 4.8, 3.8, 3.1, obbyUpMat);
  // TURUN KE BAWAH
  addStaticObby('ob-down-1', -1.0, 50.2, 3.8, 3.4, 2.4, obbyDownMat);
  addStaticObby('ob-down-2', 0, 53.8, 4.2, 3.2, 1.7, obbyDownMat);

  // SELUNCURAN (Slide from z=55.4 y=1.7 down to z=64.4 y=0.5)
  const slideStartZ = 55.4;
  const slideEndZ = 64.4;
  const slideStartY = 1.7;
  const slideEndY = 0.5;
  const slideLen = Math.hypot(slideEndZ - slideStartZ, slideStartY - slideEndY);
  const slideAngle = Math.atan2(slideStartY - slideEndY, slideEndZ - slideStartZ);
  const slideGroup = new THREE.Group();
  slideGroup.position.set(0, (slideStartY + slideEndY) / 2, (slideStartZ + slideEndZ) / 2);
  slideGroup.rotation.x = slideAngle;
  const slideDeck = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.24, slideLen),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.1 })
  );
  slideDeck.position.y = -0.12;
  const railMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 });
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, slideLen), railMat);
  railL.position.set(-1.6, 0.16, 0);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, slideLen), railMat);
  railR.position.set(1.6, 0.16, 0);
  slideGroup.add(slideDeck, railL, railR);
  scene.add(slideGroup);
  slides.push({
    id: 'ob-seluncuran',
    minX: -1.6,
    maxX: 1.6,
    startZ: slideStartZ,
    endZ: slideEndZ,
    startY: slideStartY,
    endY: slideEndY,
  });

  // Landing & Fork Platform after Slide
  addStaticObby('ob-fork', 0, 66.8, 9.6, 4.8, 0.5, obbyRockMat);

  // Two Fork Paths with Written Signboards!
  // LEFT PATH (SESAT -> Dead end trap at x: -3.6, z: 69..77)
  addStaticObby('ob-left-path', -3.6, 73.2, 3.0, 8.2, 0.5, bridgeTrapMat);
  const leftSign = createSignboardMesh('← KIRI', 'Kalo ke kiri kamu bakal sesat!', '#7f1d1d', '#ef4444', '#fecaca');
  leftSign.position.set(-3.4, 0.5, 68.2);
  scene.add(leftSign);

  // RIGHT PATH (BENAR -> Safe path to Map at x: +3.6, z: 69..78)
  addStaticObby('ob-right-path', 3.6, 73.5, 3.2, 9.0, 0.5, bridgeSafeMat);
  const rightSign = createSignboardMesh('KANAN →', 'Kalo kanan kamu benar!', '#14532d', '#4ade80', '#bbf7d0');
  rightSign.position.set(3.4, 0.5, 68.2);
  scene.add(rightSign);

  // Peta Bikini Bottom Pickup at End of Right Path (x: 3.6, z: 77.2)
  const mapPickup = new THREE.Group();
  mapPickup.position.set(3.6, 1.35, 77.2);
  const scrollBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.95, 14),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0.75, roughness: 0.4 })
  );
  scrollBody.rotation.z = Math.PI / 3;
  const scrollRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.05, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.4 })
  );
  mapPickup.add(scrollBody, scrollRing);
  scene.add(mapPickup);

  const mapSign = createSignboardMesh('PETA DI SINI', 'Ambil Peta untuk ke Pos 4!', '#0c4a6e', '#38bdf8', '#fde047');
  mapSign.position.set(3.6, 0.5, 78.6);
  scene.add(mapSign);

  // =========================================================================
  // POS 5: CHASE AVENUE TO SANDY'S TREEDOME (z: 80..140, MANY HOUSES + BRIGHT LAMPS!)
  // =========================================================================
  const chaseRoad = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 62), roadMat);
  chaseRoad.rotation.x = -Math.PI / 2;
  chaseRoad.position.set(0, 0.02, 111);
  chaseRoad.receiveShadow = true;
  scene.add(chaseRoad);

  // Line Pos 5 with plenty of colorful Bikini Bottom Houses!
  addTownHouse('coral', -8.8, 86, 0, 0x22d3ee);
  addTownHouse('shell', 8.8, 88, Math.PI, 0xfb7185);
  addTownHouse('anchor', -9.2, 98, 0, 0x64748b);
  addTownHouse('dome', 9.0, 102, Math.PI, 0xfbbf24);
  addTownHouse('coral', -9.0, 112, 0, 0x34d399);
  addTownHouse('shell', 9.2, 115, Math.PI, 0xc084fc);
  addTownHouse('dome', -8.8, 125, 0, 0xf97316);
  addTownHouse('anchor', 8.8, 128, Math.PI, 0x38bdf8);

  const domeExt = new THREE.Mesh(
    new THREE.SphereGeometry(9.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshPhysicalMaterial({
      color: 0xbaf2ff,
      roughness: 0.15,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.48,
      depthWrite: false,
    })
  );
  domeExt.position.set(0, 0, 145);
  scene.add(domeExt);

  // =========================================================================
  // POS 4: PLANKTON'S CHUM BUCKET LAB / PLAZA (x: 80, z: 0)
  // =========================================================================
  const ufoCenter = new THREE.Vector3(80, 0, 0);
  const ufoGroup = new THREE.Group();
  ufoGroup.position.copy(ufoCenter);
  scene.add(ufoGroup);

  const ufoFloor = new THREE.Mesh(
    new THREE.CircleGeometry(10, 28),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.65 })
  );
  ufoFloor.rotation.x = -Math.PI / 2;
  ufoFloor.position.y = 0.02;
  ufoGroup.add(ufoFloor);

  const ufoWall = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 5.5, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6, side: THREE.BackSide })
  );
  ufoWall.position.y = 2.75;
  ufoGroup.add(ufoWall);

  const ufoGreenLight = new THREE.PointLight(0x4ade80, 5.2, 26, 1.1);
  ufoGreenLight.position.set(80, 4.8, 0);
  scene.add(ufoGreenLight);

  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    emissive: 0x22c55e,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.9), metalMat);
    consoleMesh.position.set(Math.cos(a) * 6.5, 0.6, Math.sin(a) * 6.5);
    consoleMesh.lookAt(ufoCenter.x, 0.6, ufoCenter.z);
    ufoGroup.add(consoleMesh);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), holoMat);
    screen.position.set(Math.cos(a) * 6.0, 1.7, Math.sin(a) * 6.0);
    screen.lookAt(ufoCenter.x, 1.7, ufoCenter.z);
    ufoGroup.add(screen);
  }
  addTownHouse('chum_bucket', 80, -13, 0, 0x64748b);

  // =========================================================================
  // POS 6 & POS 7: SANDY'S TREEDOME INTERIOR + POHON KAMELIA BESAR (x: -80, z: 0..-28)
  // =========================================================================
  const sandyCenter = new THREE.Vector3(-80, 0, 0);
  const sandyGroup = new THREE.Group();
  sandyGroup.position.copy(sandyCenter);
  scene.add(sandyGroup);

  const grassFloor = new THREE.Mesh(
    new THREE.CircleGeometry(15.5, 32),
    new THREE.MeshStandardMaterial({ color: 0x2f7a3e, roughness: 0.9 })
  );
  grassFloor.rotation.x = -Math.PI / 2;
  grassFloor.position.y = 0.03;
  sandyGroup.add(grassFloor);

  const treedomeShell = new THREE.Mesh(
    new THREE.SphereGeometry(15.6, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      roughness: 0.12,
      transparent: true,
      opacity: isSoftwareGl ? 0.25 : 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  sandyGroup.add(treedomeShell);

  const sandyLight = new THREE.PointLight(0xfef9c3, 5.5, 38, 1.0);
  sandyLight.position.set(-80, 9.5, 0);
  scene.add(sandyLight);

  const hideSpotCoords: Array<[number, number, number, number]> = [
    [-85, -3, 2.0, 1.4],
    [-75, -2, 2.0, 1.4],
    [-84, 5, 2.2, 1.4],
    [-75, 6, 2.0, 1.4],
  ];
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
  hideSpotCoords.forEach(([hx, hz, w, h], idx) => {
    const prop =
      idx % 2 === 0
        ? new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), boatMat)
        : new THREE.Mesh(new THREE.SphereGeometry(1.3, 14, 12), bushMat);
    prop.position.set(hx - sandyCenter.x, h / 2, hz - sandyCenter.z);
    sandyGroup.add(prop);
    walls.push({ minX: hx - w / 2, maxX: hx + w / 2, minZ: hz - 0.8, maxZ: hz + 0.8 });
    hidingSpots.push({ x: hx, z: hz, radius: 2.5 });
  });

  const sandyExitDoor = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 3.6, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x15803d,
      emissive: 0x166534,
      emissiveIntensity: 0.7,
      roughness: 0.45,
    })
  );
  sandyExitDoor.position.set(0, 1.8, -13.8);
  sandyGroup.add(sandyExitDoor);

  // =========================================================================
  // POS 7: POHON KAMELIA BESAR & TEKA-TEKI 4 PILAR PORTAL (x: -80, z: -28)
  // =========================================================================
  const greatTreePos = new THREE.Vector3(-80, 0, -28);
  const treeGroup = new THREE.Group();
  treeGroup.position.copy(greatTreePos);
  scene.add(treeGroup);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.88 });
  const trunkPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(2.3, 0.3),
    new THREE.Vector2(1.45, 4.0),
    new THREE.Vector2(1.2, 8.5),
    new THREE.Vector2(1.65, 11.5),
    new THREE.Vector2(0.01, 12.6),
  ];
  const trunk = new THREE.Mesh(new THREE.LatheGeometry(trunkPts, 20), trunkMat);
  treeGroup.add(trunk);

  // Lush Canopy with Blooming Pink & White Camellia Flowers!
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
  const camelliaPinkMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 0.55,
    roughness: 0.4,
  });
  const camelliaWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfdf2f8,
    emissive: 0xfbcfe8,
    emissiveIntensity: 0.4,
    roughness: 0.4,
  });
  const canopyOffsets: Array<[number, number, number, number]> = [
    [0, 12.6, 0, 4.8],
    [-3.4, 11.0, 1.5, 3.3],
    [3.4, 11.2, -1.2, 3.5],
    [0.5, 11.0, 3.2, 3.1],
    [-1.2, 11.5, -2.8, 3.2],
  ];
  canopyOffsets.forEach(([lx, ly, lz, rad], idx) => {
    const grp = new THREE.Group();
    grp.position.set(lx, ly, lz);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), canopyMat);
    sphere.scale.set(1.15, 0.76, 1.15);
    grp.add(sphere);
    // Add blooming Camellia blossoms on the canopy!
    for (let f = 0; f < 4; f++) {
      const a = (f / 4) * Math.PI * 2 + idx;
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45, 1),
        (f + idx) % 2 === 0 ? camelliaPinkMat : camelliaWhiteMat
      );
      flower.position.set(Math.cos(a) * rad * 0.88, -0.35, Math.sin(a) * rad * 0.88);
      grp.add(flower);
    }
    treeGroup.add(grp);
    treeLeaves.push(grp);
  });

  const treeLight = new THREE.PointLight(0xf9a8d4, 4.8, 34, 1.0);
  treeLight.position.set(-80, 7.5, -25);
  scene.add(treeLight);

  // 4 Riddle Pillars around the Camellia Tree Base (Solved in Order: 1 Krab -> 2 Nanas -> 3 Bintang -> 4 Kamelia!)
  const pillarConfigs: Array<{
    index: number;
    symbolName: string;
    clueText: string;
    px: number;
    pz: number;
    colorHex: number;
  }> = [
    {
      index: 0,
      symbolName: 'Pilar 1 · Capit Krab',
      clueText: 'Awal mula kita terbangun di dapur restoran',
      px: -84.8,
      pz: -24.2,
      colorHex: 0xef4444,
    },
    {
      index: 1,
      symbolName: 'Pilar 2 · Nanas Kuning',
      clueText: 'Sosok bermuka dua yang menyuruh kita ke rumah Sandy',
      px: -85.2,
      pz: -29.8,
      colorHex: 0xfacc15,
    },
    {
      index: 2,
      symbolName: 'Pilar 3 · Bintang Laut',
      clueText: 'Penjaga jembatan obby & seluncuran tempat peta ditemukan',
      px: -74.8,
      pz: -29.8,
      colorHex: 0xf472b6,
    },
    {
      index: 3,
      symbolName: 'Pilar 4 · Bunga Kamelia',
      clueText: 'Pohon suci pembuka portal pulang ke dunia asli',
      px: -75.2,
      pz: -24.2,
      colorHex: 0x38bdf8,
    },
  ];

  pillarConfigs.forEach((cfg) => {
    const pg = new THREE.Group();
    pg.position.set(cfg.px, 0, cfg.pz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.5, 14), stoneMat);
    base.position.y = 0.75;
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.4, 1),
      new THREE.MeshStandardMaterial({
        color: cfg.colorHex,
        emissive: cfg.colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      })
    );
    orb.position.y = 2.15;
    const pLight = new THREE.PointLight(cfg.colorHex, 0.8, 8, 1.5);
    pLight.position.y = 2.4;
    pg.add(base, orb, pLight);
    scene.add(pg);
    camelliaPillars.push({
      index: cfg.index,
      symbolName: cfg.symbolName,
      clueText: cfg.clueText,
      x: cfg.px,
      z: cfg.pz,
      mesh: pg,
      orb,
      light: pLight,
    });
  });

  // Swirling Exit Portal at Base of Giant Camellia Tree (y = 2.2, z offset = 2.7 -> world (-80, 2.2, -25.3))
  const portalGroup = new THREE.Group();
  portalGroup.position.set(0, 2.2, 2.7);
  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.22, 12, 28),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.35,
    })
  );
  const portalCore = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 24),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  const portalLight = new THREE.PointLight(0x38bdf8, 1.2, 24, 1.2);
  portalGroup.add(portalRing, portalCore, portalLight);
  treeGroup.add(portalGroup);

  return {
    walls,
    obbyPlatforms,
    slides,
    movingPlatforms,
    seaweeds,
    hidingSpots,
    clueHotspots,
    camelliaPillars,
    kitchenDoor,
    frontDoorLeft,
    frontDoorRight,
    frontDoorGroup,
    safeDoor,
    safeKeyMesh,
    mapPickup,
    redLampLight,
    redLampBulb,
    sandyExitDoor,
    portalGroup,
    portalLight,
    treeLeaves,
    krustyLights,
    bubbles,
    skyFlowers,
    ufoPlanktonSpot: ufoCenter,
    sandyArenaCenter: sandyCenter,
    greatTreePos,
  };
}
