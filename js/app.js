let container, renderer, stats, gui, scene;
let views = {};
let interactiveObjects = [];
let last = performance.now();
let site, form, crowd;

var settings = {
  speed: 1,
  currentView: 'default'
};

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  scene.ready = false;

  site = new Site(scene);
  Human.prototype.site = site;

  form = new Form(scene);
  Human.prototype.form = form;

  crowd = new Crowd(scene, 10);

  gui = new dat.GUI({resizable: false});

  let guiSite = gui.addFolder('Site');
  Object.keys(siteParams).forEach((k) => {
    guiSite.add(site, k, ...siteParams[k]);
  });

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

  let topView = new TopView(site.width);
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

  gui.add(settings, 'speed', {pause: 0, 'x1': 1, 'x2': 2, 'x5': 5});

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('click', onClick, false);
}

function animate() {
  if ( ! scene.ready ) { setTimeout(animate, 500); return; }

  requestAnimationFrame(animate);

  let now = performance.now();
  let dt = (now - last) / 1000;
  if (dt > 1) dt = 1; // safety cap
  last = now;

  dt *= settings.speed;

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
