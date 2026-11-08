/* Globe 3D interaktif untuk hero section — Three.js
   - Globe titik (dot globe) dengan titik program Zakat Hijau dari data.js
   - Titik program berdenyut sesuai warna aspek
   - Cincin orbit, partikel daun yang melayang, glow atmosfer
   - Bisa diputar dengan drag (mouse/touch), dan bereaksi pada gerak kursor */
import * as THREE from "./vendor/three.module.min.js";

const host = document.getElementById("hero3d");
if (host && window.WebGLRenderingContext) init();

function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.7);

  const R = 2;
  const world = new THREE.Group();       // diputar oleh user
  const globe = new THREE.Group();       // isi globe
  world.add(globe);
  scene.add(world);

  // posisi lat/lng -> vektor; globe diputar agar Indonesia menghadap kamera
  const toVec = (lat, lng, r = R) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lng + 180);
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };
  const front = toVec(-2, 118).normalize();
  globe.quaternion.setFromUnitVectors(front, new THREE.Vector3(0, 0, 1));

  // inti globe
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x0b5b2e, transparent: true, opacity: 0.55 })
  ));

  // dot globe (fibonacci sphere)
  const N = 2600, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    pos.set([Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R], i * 3);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  globe.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: 0xbfe8c8, size: 0.022, transparent: true, opacity: 0.55 })));

  // garis lintang & bujur tipis
  const gridMat = new THREE.LineBasicMaterial({ color: 0x7fd18f, transparent: true, opacity: 0.18 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let lng = -180; lng <= 180; lng += 5) pts.push(toVec(lat, lng, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let lng = -180; lng < 180; lng += 30) {
    const pts = []; for (let lat = -90; lat <= 90; lat += 5) pts.push(toVec(lat, lng, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  // titik program (berdenyut)
  const aspekColor = Object.fromEntries((window.ASPEK || []).map((a) => [a.id, a.warna]));
  const progs = window.PROGRAMS || [];
  const maxC = Math.max(1, ...progs.map((p) => p.tco2e));
  const dotGeom = new THREE.SphereGeometry(1, 12, 12);
  const pulses = [];
  progs.forEach((p, i) => {
    const color = new THREE.Color(aspekColor[p.aspek] || "#2E9E48");
    const base = 0.03 + 0.065 * Math.sqrt(p.tco2e / maxC);
    const m = new THREE.Mesh(dotGeom, new THREE.MeshBasicMaterial({ color }));
    m.position.copy(toVec(p.lat, p.lng, R * 1.01));
    m.scale.setScalar(base);
    globe.add(m);
    // halo
    const h = new THREE.Mesh(dotGeom, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false }));
    h.position.copy(m.position);
    globe.add(h);
    pulses.push({ h, base, phase: i * 0.37 });
  });

  // busur antar wilayah (Jakarta -> beberapa provinsi) sebagai "aliran zakat"
  const hub = toVec(-6.2, 106.85, R);
  const arcTargets = [[3.07, 116.04], [-8.66, 121.08], [-3.24, 129.49], [-4.27, 138.08], [4.7, 96.75], [1.0, 124.5], [-3.09, 115.28]];
  const arcs = [];
  arcTargets.forEach(([lat, lng], i) => {
    const end = toVec(lat, lng, R);
    const mid = hub.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.25);
    const curve = new THREE.QuadraticBezierCurve3(hub, mid, end);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf4c21b, transparent: true, opacity: 0.85 }));
    globe.add(line);
    arcs.push({ geo, offset: i * 0.9 });
  });

  // atmosfer
  const atm = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.12, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.75 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.55,0.95,0.6,1.0)*i*0.55; }",
    })
  );
  scene.add(atm);

  // cincin orbit + satelit
  const orbit = new THREE.Group();
  orbit.rotation.set(1.15, 0.2, 0.35);
  orbit.add(new THREE.Mesh(new THREE.TorusGeometry(R * 1.42, 0.006, 8, 200), new THREE.MeshBasicMaterial({ color: 0xf4c21b, transparent: true, opacity: 0.7 })));
  const sat = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  orbit.add(sat);
  scene.add(orbit);

  // partikel daun melayang
  const leafN = 70, leafPos = new Float32Array(leafN * 3), leafSpd = [];
  for (let i = 0; i < leafN; i++) {
    leafPos.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3 - 1], i * 3);
    leafSpd.push(0.002 + Math.random() * 0.006);
  }
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute("position", new THREE.BufferAttribute(leafPos, 3));
  const leafTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); g.fillStyle = "#ffffff";
    g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 32, 32, 60); g.quadraticCurveTo(2, 32, 32, 4); g.fill();
    return new THREE.CanvasTexture(c);
  })();
  scene.add(new THREE.Points(leafGeo, new THREE.PointsMaterial({ size: 0.12, map: leafTex, transparent: true, opacity: 0.55, color: 0xc8f2cf, depthWrite: false })));

  // interaksi: drag untuk memutar, kursor untuk parallax
  let dragging = false, lastX = 0, lastY = 0, rotX = 0, rotY = 0, velX = 0, velY = 0, mouseX = 0, mouseY = 0;
  const el = renderer.domElement;
  el.style.cursor = "grab"; el.style.touchAction = "pan-y";
  el.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; });
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2; mouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.005; velX = (e.clientY - lastY) * 0.005;
    rotY += velY; rotX = THREE.MathUtils.clamp(rotX + velX, -0.9, 0.9);
    lastX = e.clientX; lastY = e.clientY;
  });
  const end = () => { dragging = false; el.style.cursor = "grab"; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", () => { mouseX = mouseY = 0; });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // hanya animasi ketika hero terlihat (hemat baterai)
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    if (!dragging) {
      // lepas drag: momentum, lalu perlahan kembali menghadap Indonesia
      velY *= 0.94; velX *= 0.94;
      rotY += velY; rotX = THREE.MathUtils.clamp(rotX + velX, -0.9, 0.9);
      const wrapped = Math.atan2(Math.sin(rotY), Math.cos(rotY));
      rotY = wrapped + (0 - wrapped) * 0.012; rotX += (0 - rotX) * 0.012;
    }
    const sway = reduceMotion ? 0 : Math.sin(t * 0.3) * 0.38;
    world.rotation.y = rotY + sway;
    world.rotation.x = rotX;
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.35 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    pulses.forEach((p) => {
      const k = (t * 0.8 + p.phase) % 1.6;
      p.h.scale.setScalar(p.base * (1 + k * 1.5));
      p.h.material.opacity = Math.max(0, 0.32 - k * 0.22);
    });
    arcs.forEach((a) => {
      const k = ((t * 0.35 + a.offset) % 2.5) / 1.6;
      const n = Math.floor(Math.min(1, k) * 65);
      const start = k > 1 ? Math.floor((k - 1) / 0.56 * 65) : 0;
      a.geo.setDrawRange(Math.min(start, 65), Math.max(0, n - start));
    });
    const sa = t * 0.6;
    sat.position.set(Math.cos(sa) * R * 1.42, Math.sin(sa) * R * 1.42, 0);
    orbit.rotation.z = 0.35 + t * 0.05;

    const arr = leafGeo.attributes.position.array;
    for (let i = 0; i < leafN; i++) {
      arr[i * 3 + 1] += leafSpd[i];
      arr[i * 3] += Math.sin(t + i) * 0.002;
      if (arr[i * 3 + 1] > 3.2) arr[i * 3 + 1] = -3.2;
    }
    leafGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();
  host.classList.add("ready");
}
