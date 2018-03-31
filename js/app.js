let container, renderer, stats, gui, scene;
let views, freeView, topView;
let last = performance.now();

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

  // floor
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(18, 8),
    new THREE.MeshBasicMaterial({color: 0x0f0f0f})
  ));

  // scene.add(new THREE.AxesHelper(5));

  gui = new dat.GUI({resizable: false});
  gui.add(guiObject, 'size', 1, 10, 1);
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

  topView = new TopView(20);
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

  views.render(scene, renderer);
  stats.update();
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  views.setSize(sw, sh);
}
