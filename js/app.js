let container, renderer, stats, gui, scene;
let views = {};
let last = performance.now();
let site, form, crowd;
let startX, startY;

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
  scene.interactiveObjects = [];
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

  let humanView = new HumanView();
  Human.prototype.view = humanView;
  humanView.human = crowd.humans[0];

  let formView = new FormView();
  formView.setControl(THREE.OrbitControls, renderer.domElement);
  form.view = formView;

  views.default = new Viewports();
  views.default.add(freeView, 1, 1);
  views.default.add(topView , 0.3, 0.3);

  views.free = new Viewports();
  views.free.add(freeView , 1, 1);

  views.top = new Viewports();
  views.top.add(topView , 1, 1);

  views.pov = new Viewports();
  views.pov.add(humanView, 1, 1);

  views.form = new Viewports();
  views.form.add(formView, 1, 1);

  gui.add(settings, 'currentView', Object.keys(views)).listen();

  gui.add(settings, 'speed', {pause: 0, 'x1': 1, 'x2': 2, 'x5': 5});

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('mousedown', onMouseDown, false);
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

function onMouseDown(event) {
  startX = event.clientX / window.innerWidth;
  startY = event.clientY / window.innerHeight;
}

function onClick(event) {
  let x = event.clientX / window.innerWidth;
  let y = event.clientY / window.innerHeight;

  if ( Math.pow(x - startX, 2) + Math.pow(y - startY, 2) > 0.1 ) return;

  let caster = views[settings.currentView].cast(x, y);
  if ( ! caster ) return;

  scene.interactiveObjects.forEach((o) => o.unclick());
  let h = caster.intersectObjects(scene.interactiveObjects);
  if ( h.length === 0 ) return;

  let d = h[0], o = h[0].object;
  delete d.object;
  o.click(d);
  settings.currentView = o.isHuman ? 'pov' : 'form';
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  Object.keys(views).forEach((k) => views[k].setSize(sw, sh));
}
