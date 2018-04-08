let container, renderer, stats, gui, scene;
let views = {};
let interactiveObjects = [];
let last = performance.now();
let crowd;

let siteBounds = [25, 14];

let bounds = new THREE.Box3(
  new THREE.Vector3(...siteBounds.map((b) => (-b/2)), -1),
  new THREE.Vector3(...siteBounds.map((b) => (b/2)), 3)
);

let lights = [[8, 4, 3], [-8, -4, 3]];

var settings = {
  currentView: 'default'
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

  gui = new dat.GUI({resizable: false});

  let guiHuman = gui.addFolder('Humans');
  Object.keys(humanParams).forEach((k) => {
    guiHuman.add(Human.prototype, k, ...humanParams[k]);
  });

  gui.close();

  stats = new Stats();
  container.appendChild(stats.dom);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClearColor = false;
  container.appendChild(renderer.domElement);

  let topView = new TopView(siteBounds[1]);
  let freeView = new FreeView();
  freeView.setControl(THREE.TrackballControls, renderer.domElement);

  views.default = new Viewports();
  views.default.add(freeView, 1, 1);
  views.default.add(topView , 0.3, 0.3);

  views.free = new Viewports();
  views.free.add(freeView , 1, 1);

  views.top = new Viewports();
  views.top.add(topView , 1, 1);

  gui.add(settings, 'currentView', Object.keys(views));

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('click', onClick, false);
}

function animate() {
  requestAnimationFrame(animate);

  let now = performance.now();
  let dt = (now - last) / 1000;
  if (dt > 1) dt = 1; // safety cap
  last = now;

  form.update(dt);
  crowd.update(dt);
  views[settings.currentView].render(scene, renderer);
  stats.update();
}

function onClick(event) {
  let x = event.clientX / window.innerWidth;
  let y = event.clientY / window.innerHeight;

  let caster = views[settings.currentView].cast(x, y);
  if (caster) {
    interactiveObjects.forEach((o) => o.unclick());
    let h = caster.intersectObjects(interactiveObjects);
    if (h.length > 0) {
      let d = h[0], o = h[0].object;
      delete d.object;
      o.click(d);
    }
  }
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  views[settings.currentView].setSize(sw, sh);
}
