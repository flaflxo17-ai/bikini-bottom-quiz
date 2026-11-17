import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'talk'
  | 'scared'
  | 'angry'
  | 'attack'
  | 'jumpscare';

export type CharacterMood = 'normal' | 'scared' | 'angry' | 'zombie' | 'evil';

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  extraLegs?: THREE.Object3D[];
  mouth?: THREE.Object3D;
  eyeMats?: THREE.MeshStandardMaterial[];
  browGroup?: THREE.Object3D;
  clawLeft?: THREE.Object3D;
  clawRight?: THREE.Object3D;
  baseHeight: number;
  setMood: (mood: CharacterMood) => void;
}

function addContactShadow(root: THREE.Group, tex: THREE.CanvasTexture, radius = 0.75) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  root.add(disc);
}

function makeCurvedLimb(
  points: THREE.Vector3[],
  radius: number,
  mat: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 10, radius, 10, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// =========================================================================
// 1. SPONGEBOB SQUAREPANTS (Organic wavy beveled sponge, non-blocky)
// =========================================================================
export function createSpongeBobRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.72);

  const body = new THREE.Group();
  body.position.y = 0.85;
  root.add(body);

  // Scalloped organic sponge silhouette
  const shape = new THREE.Shape();
  const w = 0.48;
  const h = 0.56;
  shape.moveTo(-w, -h * 0.55);
  // Left wavy edge
  shape.bezierCurveTo(-w - 0.07, -h * 0.2, -w + 0.03, h * 0.15, -w - 0.05, h * 0.52);
  // Top wavy edge
  shape.bezierCurveTo(-w * 0.4, h * 0.65, w * 0.4, h * 0.65, w + 0.05, h * 0.52);
  // Right wavy edge
  shape.bezierCurveTo(w - 0.03, h * 0.15, w + 0.07, -h * 0.2, w, -h * 0.55);
  shape.bezierCurveTo(w * 0.4, -h * 0.6, -w * 0.4, -h * 0.6, -w, -h * 0.55);

  const spongeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.07,
    bevelSegments: 4,
    curveSegments: 16,
  });
  spongeGeo.center();

  const spongeMat = new THREE.MeshStandardMaterial({
    map: textures.sponge,
    roughness: 0.78,
    metalness: 0.02,
    bumpMap: textures.bumpNoise,
    bumpScale: 0.015,
  });
  const torsoMesh = new THREE.Mesh(spongeGeo, spongeMat);
  torsoMesh.position.y = 0.44;
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // White Shirt & Brown Pants (rounded beveled extrude)
  const pantsGeo = new THREE.CapsuleGeometry(0.45, 0.22, 8, 18);
  pantsGeo.scale(1.12, 0.55, 0.62);
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const shirtMesh = new THREE.Mesh(pantsGeo, shirtMat);
  shirtMesh.position.set(0, -0.02, 0);
  body.add(shirtMesh);

  const brownMat = new THREE.MeshStandardMaterial({ color: 0x6b3e1b, roughness: 0.72 });
  const pantsMesh = new THREE.Mesh(pantsGeo, brownMat);
  pantsMesh.position.set(0, -0.18, 0);
  body.add(pantsMesh);

  // Red Tie
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const tieKnot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), tieMat);
  tieKnot.position.set(0, 0.02, 0.27);
  body.add(tieKnot);
  const tieBody = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 12), tieMat);
  tieBody.rotation.z = Math.PI;
  tieBody.scale.set(1, 1, 0.35);
  tieBody.position.set(0, -0.13, 0.27);
  body.add(tieBody);

  // Head & Face Group
  const head = new THREE.Group();
  head.position.set(0, 0.56, 0.24);
  body.add(head);

  const whiteEyeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x22a7f0, roughness: 0.15 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
  const darkSocketMat = new THREE.MeshStandardMaterial({ color: 0x160a0d, roughness: 0.9 });
  const eyeGeo = new THREE.SphereGeometry(0.145, 16, 16);

  [-0.15, 0.15].forEach((ex) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), darkSocketMat);
    socket.position.set(ex, 0.05, -0.02);
    socket.scale.set(1.06, 1.2, 0.55);
    head.add(socket);

    const eye = new THREE.Mesh(eyeGeo, whiteEyeMat);
    eye.position.set(ex, 0.05, 0);
    eye.scale.set(1, 1.15, 0.65);
    head.add(eye);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), irisMat);
    iris.position.set(ex, 0.05, 0.075);
    iris.scale.set(1, 1, 0.5);
    head.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), pupilMat);
    pupil.position.set(ex, 0.05, 0.095);
    head.add(pupil);

    // 3 eyelashes
    for (let l = -1; l <= 1; l++) {
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 6), pupilMat);
      lash.position.set(ex + l * 0.045, 0.22, 0.02);
      lash.rotation.z = -l * 0.32;
      head.add(lash);
    }
  });

  // Evil V-shaped brows (shown when SpongeBob turns evil in Pos 6)
  const evilBrowGroup = new THREE.Group();
  evilBrowGroup.visible = false;
  [-0.15, 0.15].forEach((ex, i) => {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.05), darkSocketMat);
    brow.position.set(ex, 0.2, 0.09);
    brow.rotation.z = i === 0 ? -0.45 : 0.45;
    evilBrowGroup.add(brow);
  });
  head.add(evilBrowGroup);

  // Curved SpongeBob Nose
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xf8e136, roughness: 0.65 });
  const nose = makeCurvedLimb(
    [new THREE.Vector3(0, -0.04, 0.02), new THREE.Vector3(0, -0.02, 0.16), new THREE.Vector3(0, 0.01, 0.24)],
    0.042,
    noseMat
  );
  head.add(nose);

  // Mouth & Buck Teeth + Horror Fangs
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.18, 0.04);
  head.add(mouthGroup);

  const mouthCurve = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.024, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x3f0808, roughness: 0.5 })
  );
  mouthCurve.rotation.z = Math.PI;
  mouthGroup.add(mouthCurve);

  const horrorFangs = new THREE.Group();
  horrorFangs.visible = false;
  [-0.1, -0.04, 0.04, 0.1].forEach((fx) => {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 8), whiteEyeMat);
    fang.rotation.z = Math.PI;
    fang.position.set(fx, -0.04, 0.02);
    horrorFangs.add(fang);
  });
  mouthGroup.add(horrorFangs);

  [-0.045, 0.045].forEach((tx) => {
    const tooth = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.03, 4, 8), whiteEyeMat);
    tooth.position.set(tx, -0.04, 0.01);
    tooth.scale.set(1, 1, 0.45);
    mouthGroup.add(tooth);
  });

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.56, 0.14, 0);
  leftArm.add(
    makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.14, -0.22, 0.06), new THREE.Vector3(-0.18, -0.46, 0.12)],
      0.045,
      noseMat
    )
  );
  const sleeveL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), shirtMat);
  sleeveL.scale.set(1, 1.3, 1);
  leftArm.add(sleeveL);
  body.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.56, 0.14, 0);
  rightArm.add(
    makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.14, -0.22, 0.06), new THREE.Vector3(0.18, -0.46, 0.12)],
      0.045,
      noseMat
    )
  );
  const sleeveR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), shirtMat);
  sleeveR.scale.set(1, 1.3, 1);
  rightArm.add(sleeveR);
  body.add(rightArm);

  // Legs + Shoes
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25, metalness: 0.1 });
  const makeLeg = (lx: number) => {
    const leg = new THREE.Group();
    leg.position.set(lx, -0.28, 0);
    const tube = makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.28, 0), new THREE.Vector3(0, -0.48, 0)],
      0.042,
      noseMat
    );
    leg.add(tube);
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 8, 12), shoeMat);
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(0, -0.52, 0.06);
    leg.add(shoe);
    body.add(leg);
    return leg;
  };
  const leftLeg = makeLeg(-0.2);
  const rightLeg = makeLeg(0.2);

  const setMood = (mood: CharacterMood) => {
    if (mood === 'evil' || mood === 'angry') {
      spongeMat.color.setHex(0xcab524);
      whiteEyeMat.color.setHex(0xfecaca);
      irisMat.color.setHex(0xef4444);
      irisMat.emissive.setHex(0xff1111);
      irisMat.emissiveIntensity = 1.8;
      pupilMat.color.setHex(0xff0000);
      mouthCurve.rotation.z = mood === 'evil' ? Math.PI : 0;
      evilBrowGroup.visible = true;
      horrorFangs.visible = true;
    } else if (mood === 'scared') {
      spongeMat.color.setHex(0xf8e136);
      whiteEyeMat.color.setHex(0xffffff);
      irisMat.color.setHex(0x38bdf8);
      irisMat.emissiveIntensity = 0;
      pupilMat.color.setHex(0x09090b);
      mouthCurve.rotation.z = 0;
      evilBrowGroup.visible = false;
      horrorFangs.visible = false;
    } else {
      spongeMat.color.setHex(0xf8e136);
      whiteEyeMat.color.setHex(0xffffff);
      irisMat.color.setHex(0x22a7f0);
      irisMat.emissiveIntensity = 0;
      pupilMat.color.setHex(0x09090b);
      mouthCurve.rotation.z = Math.PI;
      evilBrowGroup.visible = false;
      horrorFangs.visible = false;
    }
  };

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    mouth: mouthGroup,
    eyeMats: [irisMat],
    browGroup: evilBrowGroup,
    baseHeight: 1.7,
    setMood,
  };
}

// =========================================================================
// 2. MR. KRABS (Organic Crab Shell, Eyestalks, Giant Articulated Claws)
// =========================================================================
export function createMrKrabsRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.95);

  const body = new THREE.Group();
  body.position.y = 0.85;
  root.add(body);

  const redMat = new THREE.MeshStandardMaterial({ color: 0x9e1814, roughness: 0.45, metalness: 0.08 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x7aa6d6, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3b339e, roughness: 0.78 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x422006, emissiveIntensity: 0.25, roughness: 0.25 });
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x090202, roughness: 0.95 });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0xff1e1e,
    emissive: 0xff0000,
    emissiveIntensity: 3.4,
    roughness: 0.1,
  });
  const fangMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

  // Bulbous crab torso via LatheGeometry
  const shellPts = [
    new THREE.Vector2(0.01, -0.35),
    new THREE.Vector2(0.45, -0.3),
    new THREE.Vector2(0.62, 0.05),
    new THREE.Vector2(0.56, 0.42),
    new THREE.Vector2(0.32, 0.62),
    new THREE.Vector2(0.01, 0.66),
  ];
  const shellGeo = new THREE.LatheGeometry(shellPts, 24);
  shellGeo.scale(1.12, 1, 0.85);
  const torso = new THREE.Mesh(shellGeo, shirtMat);
  torso.position.y = 0.3;
  torso.castShadow = true;
  body.add(torso);

  const pants = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), pantsMat);
  pants.scale.set(1.14, 0.8, 0.88);
  pants.position.y = 0.12;
  body.add(pants);

  const head = new THREE.Group();
  head.position.set(0, 0.88, 0.05);
  body.add(head);

  const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), redMat);
  headDome.scale.set(1.15, 0.72, 0.9);
  head.add(headDome);

  // Tall eyestalks with deep black sunken eye rings, glowing crimson pinprick pupils & heavy angry brows
  const browGroup = new THREE.Group();
  head.add(browGroup);
  [-0.17, 0.17].forEach((ex, i) => {
    const stalk = makeCurvedLimb(
      [new THREE.Vector3(ex * 0.8, 0.15, 0.08), new THREE.Vector3(ex, 0.45, 0.12)],
      0.05,
      redMat
    );
    head.add(stalk);
    const socket = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.26, 8, 12), socketMat);
    socket.position.set(ex, 0.58, 0.09);
    head.add(socket);
    const eyeBulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.102, 0.22, 8, 12), eyeMat);
    eyeBulb.position.set(ex, 0.58, 0.13);
    head.add(eyeBulb);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), pupilMat);
    pupil.position.set(ex, 0.56, 0.235);
    head.add(pupil);

    // Furrowed heavy angry crab brow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.075, 0.15), socketMat);
    brow.position.set(ex, 0.74, 0.17);
    brow.rotation.z = i === 0 ? -0.44 : 0.44;
    browGroup.add(brow);
  });

  // Wide Gaping Snarl Mouth + Sharp Fangs
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.07, 0.34);
  head.add(mouth);
  const mouthCavity = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12),
    socketMat
  );
  mouthCavity.scale.set(1.42, 0.68, 0.45);
  mouth.add(mouthCavity);
  const mouthLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.032, 8, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x3b0606, roughness: 0.4 })
  );
  mouthLip.position.y = -0.04;
  mouth.add(mouthLip);
  [-0.18, -0.09, 0, 0.09, 0.18].forEach((fx, idx) => {
    const fangTop = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 8), fangMat);
    fangTop.rotation.z = Math.PI;
    fangTop.position.set(fx, 0.065, 0.09);
    mouth.add(fangTop);
    if (idx % 2 === 1) {
      const fangBot = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.085, 8), fangMat);
      fangBot.position.set(fx, -0.075, 0.09);
      mouth.add(fangBot);
    }
  });

  // Giant Crab Claws
  const makeClawArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.62, 0.45, 0.05);
    const tube = makeCurvedLimb(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.28, -0.05, 0.15),
        new THREE.Vector3(side * 0.36, 0.12, 0.42),
      ],
      0.065,
      redMat
    );
    arm.add(tube);

    const clawGroup = new THREE.Group();
    clawGroup.position.set(side * 0.38, 0.14, 0.48);
    const upper = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), redMat);
    upper.scale.set(0.85, 0.9, 1.35);
    upper.rotation.x = -0.35;
    clawGroup.add(upper);

    const lower = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), redMat);
    lower.scale.set(0.8, 0.85, 1.25);
    lower.rotation.x = 0.35;
    clawGroup.add(lower);

    arm.add(clawGroup);
    body.add(arm);
    return { arm, clawGroup };
  };

  const left = makeClawArm(-1);
  const right = makeClawArm(1);

  // Peg legs (4 crab legs)
  const pegMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 });
  const makePeg = (lx: number, lz: number) => {
    const leg = new THREE.Group();
    leg.position.set(lx, -0.22, lz);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.64, 12), pegMat);
    cone.rotation.z = Math.PI;
    cone.position.y = -0.32;
    leg.add(cone);
    body.add(leg);
    return leg;
  };
  const leftLeg = makePeg(-0.34, 0.1);
  const rightLeg = makePeg(0.34, 0.1);
  const backL = makePeg(-0.3, -0.18);
  const backR = makePeg(0.3, -0.18);

  const setMood = (mood: CharacterMood) => {
    if (mood === 'angry' || mood === 'evil') {
      eyeMat.color.setHex(0xfca5a5);
      eyeMat.emissive.setHex(0x991b1b);
      eyeMat.emissiveIntensity = 0.95;
      pupilMat.emissiveIntensity = 2.0;
      browGroup.visible = true;
    } else {
      eyeMat.color.setHex(0xfef08a);
      eyeMat.emissiveIntensity = 0.25;
      pupilMat.emissiveIntensity = 0.6;
      browGroup.visible = true;
    }
  };

  return {
    root,
    body,
    head,
    leftArm: left.arm,
    rightArm: right.arm,
    leftLeg,
    rightLeg,
    extraLegs: [backL, backR],
    mouth,
    eyeMats: [eyeMat, pupilMat],
    browGroup,
    clawLeft: left.clawGroup,
    clawRight: right.clawGroup,
    baseHeight: 2.2,
    setMood,
  };
}

// =========================================================================
// 3. SQUIDWARD TENTACLES (Bulbous Head, Drooping Nose, 4 Flowing Tentacles)
// =========================================================================
export function createSquidwardRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.72);

  const body = new THREE.Group();
  body.position.y = 0.88;
  root.add(body);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x5c968b, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x6b3e19, roughness: 0.82 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.25 });
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x0d1414, roughness: 0.9 });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
    roughness: 0.15,
  });

  // Slender torso in brown polo
  const torsoPts = [
    new THREE.Vector2(0.01, -0.15),
    new THREE.Vector2(0.24, -0.1),
    new THREE.Vector2(0.18, 0.35),
    new THREE.Vector2(0.12, 0.65),
    new THREE.Vector2(0.01, 0.68),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 18), shirtMat);
  torso.castShadow = true;
  body.add(torso);

  // Bulbous pear-shaped Squidward head
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0);
  body.add(head);

  const headPts = [
    new THREE.Vector2(0.01, -0.24),
    new THREE.Vector2(0.22, -0.18),
    new THREE.Vector2(0.24, 0.05),
    new THREE.Vector2(0.42, 0.28),
    new THREE.Vector2(0.38, 0.52),
    new THREE.Vector2(0.01, 0.62),
  ];
  const headMesh = new THREE.Mesh(new THREE.LatheGeometry(headPts, 22), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Drooping nose
  const nose = makeCurvedLimb(
    [new THREE.Vector3(0, 0.02, 0.22), new THREE.Vector3(0, -0.12, 0.4), new THREE.Vector3(0, -0.28, 0.36)],
    0.09,
    skinMat
  );
  head.add(nose);

  // Sunken Eyes + Glowing Pupils + Angry Furrowed Brow
  const sqBrow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.065, 0.12), socketMat);
  sqBrow.position.set(0, 0.28, 0.24);
  head.add(sqBrow);

  [-0.13, 0.13].forEach((ex) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 12), socketMat);
    socket.position.set(ex, 0.12, 0.19);
    socket.scale.set(1.0, 1.32, 0.55);
    head.add(socket);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 14), eyeMat);
    eye.position.set(ex, 0.12, 0.22);
    eye.scale.set(0.95, 1.25, 0.65);
    head.add(eye);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.07, 0.04), pupilMat);
    pupil.position.set(ex, 0.11, 0.29);
    head.add(pupil);

    // Heavy eyelids
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.112, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
      skinMat
    );
    lid.position.set(ex, 0.13, 0.22);
    head.add(lid);
  });

  // Creepy fanged snarl under nose
  const sqMouth = new THREE.Group();
  sqMouth.position.set(0, -0.14, 0.22);
  const sqMouthCavity = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), socketMat);
  sqMouth.add(sqMouthCavity);
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
  [-0.09, 0, 0.09].forEach((tx) => {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.065, 6), toothMat);
    t.rotation.z = Math.PI;
    t.position.set(tx, 0.015, 0.03);
    sqMouth.add(t);
  });
  head.add(sqMouth);

  // Arms
  const makeArm = (s: number) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.22, 0.5, 0);
    arm.add(
      makeCurvedLimb(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.2, -0.25, 0.08), new THREE.Vector3(s * 0.22, -0.58, 0.15)],
        0.048,
        skinMat
      )
    );
    body.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // 4 Wavy Tentacle Legs
  const makeTentacle = (tx: number, tz: number) => {
    const leg = new THREE.Group();
    leg.position.set(tx, -0.12, tz);
    leg.add(
      makeCurvedLimb(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(tx * 0.35, -0.4, tz * 0.35), new THREE.Vector3(tx * 0.55, -0.74, tz * 0.55)],
        0.065,
        skinMat
      )
    );
    body.add(leg);
    return leg;
  };
  const leftLeg = makeTentacle(-0.14, 0.08);
  const rightLeg = makeTentacle(0.14, 0.08);
  const tent3 = makeTentacle(-0.14, -0.1);
  const tent4 = makeTentacle(0.14, -0.1);

  const setMood = (mood: CharacterMood) => {
    if (mood === 'angry' || mood === 'zombie') {
      skinMat.color.setHex(0x4f7863);
      eyeMat.color.setHex(0xfca5a5);
      eyeMat.emissive.setHex(0x991b1b);
      eyeMat.emissiveIntensity = 1.0;
      pupilMat.emissiveIntensity = 2.0;
    } else {
      skinMat.color.setHex(0x5c968b);
      eyeMat.color.setHex(0xfef9c3);
      eyeMat.emissiveIntensity = 0.15;
      pupilMat.emissiveIntensity = 0.6;
    }
  };

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    extraLegs: [tent3, tent4],
    mouth: sqMouth,
    eyeMats: [eyeMat, pupilMat],
    baseHeight: 2.3,
    setMood,
  };
}

// =========================================================================
// 4. PATRICK STAR (Organic Curved Conical Starfish + Zombie Mode)
// =========================================================================
export function createPatrickRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.85);

  const body = new THREE.Group();
  body.position.y = 0.55;
  root.add(body);

  const pinkMat = new THREE.MeshStandardMaterial({ color: 0x8d6377, roughness: 0.78 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0x5c8c14, roughness: 0.78 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xd9f99d, roughness: 0.25 });
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x160710, roughness: 0.9 });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: 0xdc2626,
    emissiveIntensity: 1.6,
    roughness: 0.1,
  });

  // Conical starfish body + pointed head via LatheGeometry
  const starPts = [
    new THREE.Vector2(0.01, -0.15),
    new THREE.Vector2(0.52, -0.1),
    new THREE.Vector2(0.58, 0.22),
    new THREE.Vector2(0.45, 0.65),
    new THREE.Vector2(0.32, 1.05),
    new THREE.Vector2(0.16, 1.38),
    new THREE.Vector2(0.01, 1.54),
  ];
  const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(starPts, 24), pinkMat);
  bodyMesh.castShadow = true;
  body.add(bodyMesh);

  // Green shorts
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.55, 0.38, 22), shortsMat);
  shorts.position.y = 0.08;
  body.add(shorts);

  const head = new THREE.Group();
  head.position.set(0, 1.0, 0.26);
  body.add(head);

  [-0.1, 0.1].forEach((ex, idx) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 12), socketMat);
    socket.position.set(ex, 0.06, -0.02);
    socket.scale.set(1.0, 1.32, 0.55);
    head.add(socket);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), eyeMat);
    eye.position.set(ex, 0.06, 0);
    eye.scale.set(0.95, 1.25, 0.65);
    head.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), pupilMat);
    pupil.position.set(ex, 0.05, 0.062);
    head.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.06), socketMat);
    brow.position.set(ex, 0.2, 0.03);
    brow.rotation.z = idx === 0 ? -0.4 : 0.4;
    head.add(brow);
  });

  // Gaping horror jaw with jagged fangs
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.17, 0.04);
  const mouthHole = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), socketMat);
  mouthHole.scale.set(1.3, 0.85, 0.5);
  mouth.add(mouthHole);
  const patToothMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  [-0.11, -0.04, 0.04, 0.11].forEach((tx) => {
    const fTop = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.07, 6), patToothMat);
    fTop.rotation.z = Math.PI;
    fTop.position.set(tx, 0.06, 0.05);
    mouth.add(fTop);
    const fBot = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.065, 6), patToothMat);
    fBot.position.set(tx * 0.85, -0.06, 0.05);
    mouth.add(fBot);
  });
  head.add(mouth);

  const makeConeArm = (s: number) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.44, 0.68, 0);
    const cone = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 8, 12), pinkMat);
    cone.rotation.z = s * 0.95;
    cone.position.set(s * 0.22, -0.12, 0.08);
    arm.add(cone);
    body.add(arm);
    return arm;
  };
  const leftArm = makeConeArm(-1);
  const rightArm = makeConeArm(1);

  const makeStubLeg = (lx: number) => {
    const leg = new THREE.Group();
    leg.position.set(lx, -0.05, 0);
    const cone = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 8, 12), pinkMat);
    cone.position.y = -0.28;
    leg.add(cone);
    body.add(leg);
    return leg;
  };
  const leftLeg = makeStubLeg(-0.24);
  const rightLeg = makeStubLeg(0.24);

  const setMood = (mood: CharacterMood) => {
    if (mood === 'zombie' || mood === 'angry') {
      pinkMat.color.setHex(0x7e5f73);
      eyeMat.color.setHex(0xd9f99d);
      eyeMat.emissive.setHex(0x65a30d);
      eyeMat.emissiveIntensity = 1.2;
      pupilMat.emissiveIntensity = 2.0;
    } else {
      pinkMat.color.setHex(0xf48fb1);
      eyeMat.color.setHex(0xffffff);
      eyeMat.emissiveIntensity = 0;
      pupilMat.emissiveIntensity = 0.2;
    }
  };

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    mouth,
    eyeMats: [eyeMat, pupilMat],
    baseHeight: 2.1,
    setMood,
  };
}

// =========================================================================
// 5. SANDY CHEEKS (Squirrel, Astronaut Suit, Glass Diving Helmet & Tail)
// =========================================================================
export function createSandyRig(textures: ProceduralTextureSet, isSoftwareGl: boolean): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.78);

  const body = new THREE.Group();
  body.position.y = 0.72;
  root.add(body);

  const furMat = new THREE.MeshStandardMaterial({ color: 0xa1623b, roughness: 0.85 });
  const suitMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.4 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15 });

  // Astronaut suit torso
  const suitTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 10, 16), suitMat);
  suitTorso.position.y = 0.35;
  suitTorso.castShadow = true;
  body.add(suitTorso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.045, 10, 20), purpleMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.7;
  body.add(collar);

  // Fluffy curled tail sticking out
  const tail = makeCurvedLimb(
    [
      new THREE.Vector3(0, 0.12, -0.22),
      new THREE.Vector3(0, 0.48, -0.52),
      new THREE.Vector3(0, 0.88, -0.45),
      new THREE.Vector3(0, 1.02, -0.28),
    ],
    0.13,
    furMat
  );
  body.add(tail);

  // Head inside glass helmet
  const head = new THREE.Group();
  head.position.set(0, 1.05, 0);
  body.add(head);

  const squirrelHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 16), furMat);
  head.add(squirrelHead);

  // Squirrel ears
  [-0.16, 0.16].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 6, 10), furMat);
    ear.position.set(ex, 0.25, 0);
    ear.rotation.z = -ex * 0.6;
    head.add(ear);
  });

  const sandySocketMat = new THREE.MeshStandardMaterial({ color: 0x160707, roughness: 0.9 });
  const sandyBrowGroup = new THREE.Group();
  head.add(sandyBrowGroup);

  // Eyes + Dark Sockets + Angry Brows + Sharp Fangs inside Glass Helmet
  [-0.09, 0.09].forEach((ex, i) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), sandySocketMat);
    socket.position.set(ex, 0.05, 0.21);
    head.add(socket);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeMat);
    eye.position.set(ex, 0.05, 0.23);
    head.add(eye);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.04), sandySocketMat);
    brow.position.set(ex, 0.13, 0.24);
    brow.rotation.z = i === 0 ? -0.45 : 0.45;
    sandyBrowGroup.add(brow);
  });

  const sandyMouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.05), sandySocketMat);
  sandyMouth.position.set(0, -0.09, 0.23);
  head.add(sandyMouth);
  [-0.045, 0.045].forEach((fx) => {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.055, 6),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    fang.rotation.z = Math.PI;
    fang.position.set(fx, -0.08, 0.25);
    head.add(fang);
  });

  // Glass helmet
  const helmetMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    roughness: 0.08,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.75,
    transparent: true,
    opacity: isSoftwareGl ? 0.32 : 0.45,
    depthWrite: false,
  });
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 20), helmetMat);
  helmet.renderOrder = 4;
  head.add(helmet);

  // Pink flower on top of helmet
  const flower = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 })
  );
  flower.position.set(0.24, 0.36, 0.12);
  head.add(flower);

  const makeArm = (s: number) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 0.56, 0);
    arm.add(
      makeCurvedLimb(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 0.18, -0.22, 0.12), new THREE.Vector3(s * 0.2, -0.45, 0.2)],
        0.075,
        suitMat
      )
    );
    body.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const makeBootLeg = (lx: number) => {
    const leg = new THREE.Group();
    leg.position.set(lx, -0.02, 0);
    const tube = makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(0, -0.58, 0.04)],
      0.085,
      suitMat
    );
    leg.add(tube);
    body.add(leg);
    return leg;
  };
  const leftLeg = makeBootLeg(-0.15);
  const rightLeg = makeBootLeg(0.15);

  const setMood = (mood: CharacterMood) => {
    if (mood === 'evil' || mood === 'angry') {
      eyeMat.color.setHex(0xff2222);
      eyeMat.emissive.setHex(0xef4444);
      eyeMat.emissiveIntensity = 1.9;
      sandyBrowGroup.visible = true;
    } else {
      eyeMat.color.setHex(0x09090b);
      eyeMat.emissiveIntensity = 0;
      sandyBrowGroup.visible = false;
    }
  };

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    eyeMats: [eyeMat],
    browGroup: sandyBrowGroup,
    baseHeight: 2.1,
    setMood,
  };
}

// =========================================================================
// 6. PLANKTON (Tiny Green Cyclops + Long Curved Antennae)
// =========================================================================
export function createPlanktonRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.32);

  const body = new THREE.Group();
  body.position.y = 0.28;
  root.add(body);

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
  const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.32, 10, 16), greenMat);
  pill.position.y = 0.24;
  body.add(pill);

  const head = new THREE.Group();
  head.position.set(0, 0.35, 0.14);
  body.add(head);

  const eyeWhite = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2 })
  );
  eyeWhite.scale.set(1, 1.15, 0.55);
  head.add(eyeWhite);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.6 })
  );
  pupil.position.z = 0.045;
  head.add(pupil);

  // Two long antennae
  [-0.08, 0.08].forEach((ax) => {
    const ant = makeCurvedLimb(
      [new THREE.Vector3(ax, 0.18, -0.14), new THREE.Vector3(ax * 2.2, 0.48, -0.05), new THREE.Vector3(ax * 2.8, 0.68, 0.08)],
      0.016,
      greenMat
    );
    head.add(ant);
  });

  const makeSmallLimb = (x: number, y: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.16, 4, 8), greenMat);
    m.position.y = -0.08;
    g.add(m);
    body.add(g);
    return g;
  };

  return {
    root,
    body,
    head,
    leftArm: makeSmallLimb(-0.18, 0.2),
    rightArm: makeSmallLimb(0.18, 0.2),
    leftLeg: makeSmallLimb(-0.08, -0.04),
    rightLeg: makeSmallLimb(0.08, -0.04),
    baseHeight: 0.9,
    setMood: () => {},
  };
}

// =========================================================================
// 7. ZOMBIE BIKINI BOTTOM CITIZEN FISH (Organic Fish Silhouette)
// =========================================================================
export function createZombieFishRig(
  textures: ProceduralTextureSet,
  tintHex = 0x5f8f7a
): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.68);

  const body = new THREE.Group();
  body.position.y = 0.72;
  root.add(body);

  const scaleMat = new THREE.MeshStandardMaterial({ color: tintHex, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xd9f99d,
    emissive: 0x84cc16,
    emissiveIntensity: 1.2,
  });

  // Curved organic fish torso
  const torsoPts = [
    new THREE.Vector2(0.01, -0.1),
    new THREE.Vector2(0.26, -0.05),
    new THREE.Vector2(0.32, 0.28),
    new THREE.Vector2(0.24, 0.62),
    new THREE.Vector2(0.01, 0.68),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 18), shirtMat);
  torso.scale.set(1, 1, 0.78);
  body.add(torso);

  const head = new THREE.Group();
  head.position.set(0, 0.88, 0.04);
  body.add(head);

  const fishHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), scaleMat);
  fishHead.scale.set(0.95, 1.1, 1.05);
  head.add(fishHead);

  // Dorsal fin
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), scaleMat);
  fin.rotation.x = -0.6;
  fin.scale.set(0.25, 1, 1);
  fin.position.set(0, 0.25, -0.18);
  head.add(fin);

  // Sunken Glowing Zombie Fish Eyes + Gaping Fanged Jaw
  const zSocketMat = new THREE.MeshStandardMaterial({ color: 0x0b120e, roughness: 0.9 });
  [-0.1, 0.1].forEach((ex) => {
    const sock = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), zSocketMat);
    sock.position.set(ex, 0.05, 0.22);
    head.add(sock);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), eyeMat);
    eye.position.set(ex, 0.05, 0.245);
    head.add(eye);
  });
  const zMouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.08), zSocketMat);
  zMouth.position.set(0, -0.11, 0.24);
  head.add(zMouth);

  const makeLimb = (x: number, y: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    g.add(
      makeCurvedLimb(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.26, 0.05), new THREE.Vector3(0, -0.48, 0.08)],
        0.045,
        scaleMat
      )
    );
    body.add(g);
    return g;
  };

  return {
    root,
    body,
    head,
    leftArm: makeLimb(-0.32, 0.5),
    rightArm: makeLimb(0.32, 0.5),
    leftLeg: makeLimb(-0.14, -0.05),
    rightLeg: makeLimb(0.14, -0.05),
    eyeMats: [eyeMat],
    baseHeight: 1.9,
    setMood: () => {},
  };
}

// =========================================================================
// 8. PLAYER AVATAR: ANAK KECIL MEMAKAI JAS HUJAN KUNING
// =========================================================================
export function createKidAvatarRig(textures: ProceduralTextureSet): CharacterRig {
  const root = new THREE.Group();
  addContactShadow(root, textures.contactShadow, 0.58);

  const body = new THREE.Group();
  body.position.y = 0.56;
  root.add(body);

  const raincoatMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0x713f12,
    emissiveIntensity: 0.12,
    roughness: 0.38,
    metalness: 0.05,
  });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3c69f, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.78 });
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.65 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Flared Yellow Raincoat Coat (LatheGeometry)
  const coatPts = [
    new THREE.Vector2(0.01, -0.14),
    new THREE.Vector2(0.34, -0.12),
    new THREE.Vector2(0.28, 0.16),
    new THREE.Vector2(0.22, 0.42),
    new THREE.Vector2(0.17, 0.52),
    new THREE.Vector2(0.01, 0.54),
  ];
  const coat = new THREE.Mesh(new THREE.LatheGeometry(coatPts, 20), raincoatMat);
  coat.castShadow = true;
  body.add(coat);

  // Coat front buttons / zipper trim
  for (let b = 0; b < 3; b++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), hairMat);
    btn.position.set(0, 0.05 + b * 0.15, 0.26 - b * 0.03);
    body.add(btn);
  }

  // Explorer pouch on back (visible in 3rd-person view!)
  const pouch = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.16, 6, 12), pouchMat);
  pouch.position.set(0, 0.24, -0.24);
  pouch.scale.set(1.15, 1, 0.7);
  body.add(pouch);

  // Head + Yellow Raincoat Hood
  const head = new THREE.Group();
  head.position.set(0, 0.74, 0.01);
  body.add(head);

  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.285, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.85),
    raincoatMat
  );
  hood.rotation.x = -0.2;
  hood.scale.set(1.04, 1.05, 1.08);
  hood.position.set(0, 0.02, -0.03);
  head.add(hood);

  // Brim framing the face
  const hoodBrim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.042, 8, 18), raincoatMat);
  hoodBrim.position.set(0, 0.01, 0.12);
  head.add(hoodBrim);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 16), skinMat);
  face.position.set(0, 0.0, 0.03);
  head.add(face);

  // Hair fringe peeking beneath hood
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    hairMat
  );
  hair.position.set(0, 0.03, 0.04);
  hair.rotation.x = 0.25;
  head.add(hair);

  [-0.075, 0.075].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), whiteMat);
    eye.position.set(ex, 0.02, 0.21);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), pupilMat);
    pupil.position.set(ex, 0.02, 0.235);
    head.add(eye, pupil);
  });

  // Yellow Raincoat Sleeves + Hands
  const makeKidArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.25, 0.42, 0);
    const sleeve = makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * 0.08, -0.2, 0.04), new THREE.Vector3(side * 0.1, -0.36, 0.07)],
      0.062,
      raincoatMat
    );
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), skinMat);
    hand.position.set(side * 0.1, -0.4, 0.08);
    arm.add(sleeve, hand);
    body.add(arm);
    return arm;
  };
  const leftArm = makeKidArm(-1);
  const rightArm = makeKidArm(1);

  // Pants + Yellow Rain Boots
  const makeKidLeg = (lx: number) => {
    const leg = new THREE.Group();
    leg.position.set(lx, -0.06, 0);
    const pant = makeCurvedLimb(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.22, 0), new THREE.Vector3(0, -0.38, 0)],
      0.065,
      pantsMat
    );
    const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.1, 8, 12), bootMat);
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, -0.43, 0.04);
    const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.12, 12), bootMat);
    bootCuff.position.set(0, -0.37, 0);
    leg.add(pant, boot, bootCuff);
    body.add(leg);
    return leg;
  };
  const leftLeg = makeKidLeg(-0.11);
  const rightLeg = makeKidLeg(0.11);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    baseHeight: 1.48,
    setMood: () => {},
  };
}

// =========================================================================
// SMOOTH PROCEDURAL ANIMATOR (All 8 Required Animation States)
// =========================================================================
export function animateCharacter(
  rig: CharacterRig,
  state: CharacterAnimState,
  elapsed: number,
  dt: number
) {
  const damp = 1 - Math.exp(-12 * dt);

  let targetBodyY = rig.baseHeight * 0.42;
  let targetBodyRotX = 0;
  let targetHeadRotX = 0;
  let targetHeadRotY = 0;
  let targetLArmX = 0;
  let targetRArmX = 0;
  let targetLArmZ = 0.08;
  let targetRArmZ = -0.08;
  let targetLLegX = 0;
  let targetRLegX = 0;

  if (state === 'idle') {
    targetBodyY += Math.sin(elapsed * 2.2) * 0.03;
    targetHeadRotY = Math.sin(elapsed * 0.9) * 0.14;
    targetLArmX = Math.sin(elapsed * 2.0) * 0.06;
    targetRArmX = -Math.sin(elapsed * 2.0) * 0.06;
  } else if (state === 'walk') {
    const cyc = elapsed * 6.5;
    targetBodyY += Math.abs(Math.sin(cyc)) * 0.06;
    targetLArmX = Math.sin(cyc) * 0.55;
    targetRArmX = -Math.sin(cyc) * 0.55;
    targetLLegX = -Math.sin(cyc) * 0.65;
    targetRLegX = Math.sin(cyc) * 0.65;
  } else if (state === 'run') {
    const cyc = elapsed * 12.5;
    targetBodyY += Math.abs(Math.sin(cyc)) * 0.11;
    targetBodyRotX = 0.18;
    targetLArmX = Math.sin(cyc) * 0.95;
    targetRArmX = -Math.sin(cyc) * 0.95;
    targetLLegX = -Math.sin(cyc) * 0.95;
    targetRLegX = Math.sin(cyc) * 0.95;
  } else if (state === 'talk') {
    targetBodyY += Math.sin(elapsed * 4.5) * 0.035;
    targetHeadRotY = Math.sin(elapsed * 3.1) * 0.12;
    targetLArmX = -0.45 + Math.sin(elapsed * 6) * 0.25;
    targetRArmX = -0.65 + Math.cos(elapsed * 5.5) * 0.28;
    if (rig.mouth) {
      rig.mouth.scale.y = 0.8 + Math.abs(Math.sin(elapsed * 14)) * 0.7;
    }
  } else if (state === 'scared') {
    targetBodyY += Math.sin(elapsed * 26) * 0.025;
    targetHeadRotY = Math.sin(elapsed * 18) * 0.15;
    targetLArmX = -1.6;
    targetRArmX = -1.6;
    targetLArmZ = 0.45;
    targetRArmZ = -0.45;
  } else if (state === 'angry') {
    targetBodyRotX = 0.12;
    targetHeadRotX = 0.15;
    targetLArmX = -0.9 + Math.sin(elapsed * 8) * 0.2;
    targetRArmX = -0.9 + Math.cos(elapsed * 8) * 0.2;
    targetLArmZ = 0.35;
    targetRArmZ = -0.35;
  } else if (state === 'attack') {
    const cyc = elapsed * 14;
    targetBodyRotX = 0.25;
    targetLArmX = -1.35 + Math.sin(cyc) * 0.5;
    targetRArmX = -1.35 - Math.sin(cyc) * 0.5;
    targetLLegX = -Math.sin(cyc) * 0.85;
    targetRLegX = Math.sin(cyc) * 0.85;
  } else if (state === 'jumpscare') {
    targetBodyRotX = 0.22;
    targetLArmX = -2.1 + Math.sin(elapsed * 22) * 0.25;
    targetRArmX = -2.1 + Math.cos(elapsed * 22) * 0.25;
    targetHeadRotY = Math.sin(elapsed * 25) * 0.16;
  }

  if (state !== 'talk' && rig.mouth) {
    rig.mouth.scale.y = THREE.MathUtils.lerp(rig.mouth.scale.y, 1, damp);
  }

  rig.body.rotation.x = THREE.MathUtils.lerp(rig.body.rotation.x, targetBodyRotX, damp);
  rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, targetHeadRotX, damp);
  rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, targetHeadRotY, damp);
  rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, targetLArmX, damp);
  rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, targetRArmX, damp);
  rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, targetLArmZ, damp);
  rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, targetRArmZ, damp);
  rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, targetLLegX, damp);
  rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, targetRLegX, damp);

  if (rig.extraLegs) {
    rig.extraLegs.forEach((leg, idx) => {
      const sign = idx % 2 === 0 ? 1 : -1;
      leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, targetLLegX * sign, damp);
    });
  }

  if (rig.clawLeft && rig.clawRight) {
    const snap = state === 'angry' || state === 'attack' || state === 'jumpscare'
      ? 0.25 + Math.abs(Math.sin(elapsed * 12)) * 0.35
      : 0.12;
    rig.clawLeft.rotation.z = snap;
    rig.clawRight.rotation.z = -snap;
  }
}
