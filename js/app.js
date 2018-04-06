let container, renderer, stats, gui, scene;
let views, freeView, topView;
let last = performance.now();
let crowd;

let siteBounds = [25, 14];

let bounds = new THREE.Box3(
  new THREE.Vector3(...siteBounds.map((b) => (-b/2)), -1),
  new THREE.Vector3(...siteBounds.map((b) => (b/2)), 3)
);

let lights = [[8, 4, 3], [-8, -4, 3]];

var guiObject = {
  size: 1
};

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0);

  form = new Form(scene);
  Human.prototype.form = form;
  crowd = new Crowd(scene, bounds, 10);

  // lights
  scene.add(new THREE.AmbientLight(0x333333));

  lights.forEach((l) => {
    let pl = new THREE.PointLight(0xFFFFFF, 0.5, 100, 2);
    pl.position.set(...l);
    scene.add(pl);
  });

  // floor
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(...siteBounds),
    new THREE.MeshBasicMaterial({color: 0x0f0f0f})
  ));

  // scene.add(new THREE.AxesHelper(5));

  guiObject.toggleHelper = () => form.toggleHelper();

  gui = new dat.GUI({resizable: false});
  gui.add(guiObject, 'size', 1, 10, 1);
  gui.add(guiObject, 'toggleHelper');
  gui.close();

  stats = new Stats();
  container.appendChild(stats.dom);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClearColor = false;
  container.appendChild(renderer.domElement);

  views = new Viewports();

  freeView = new FreeView();
  freeView.setControl(THREE.TrackballControls, renderer.domElement);
  views.add(freeView, 1, 1);

  topView = new TopView(siteBounds[1]);
  views.add(topView, 0.2, 0.2);

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);

  let now = performance.now();
  let dt = (now - last) / 1000;
  if (dt > 1) dt = 1; // safety cap
  last = now;

  form.update(dt);
  crowd.update(dt);
  views.render(scene, renderer);
  stats.update();
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  views.setSize(sw, sh);
}
