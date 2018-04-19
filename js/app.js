let container, renderer, scene;
let last = performance.now();
let site, form, crowd;
let startX, startY;
let views = {};

let gui;
let guiView;

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
  settings.formHelpers = () => form.toggleHelper();

  crowd = new Crowd(scene, 10);
  settings.crowdHelpers = () => crowd.toggleHelpers();

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

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClearColor = false;
  container.appendChild(renderer.domElement);

  let topView = new TopView(site.width);
  let freeView = new FreeView();
  freeView.setControl(THREE.OrbitControls, renderer.domElement);

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
  views.pov.add(topView, 0.3, 0.3, 0, 0.7);

  views.form = new Viewports();
  views.form.add(formView, 1, 1);

  guiView = gui.add(settings, 'currentView', Object.keys(views)).onFinishChange(changeView);

  gui.add(settings, 'speed', {pause: 0, 'x1': 1, 'x2': 2, 'x5': 5});
  gui.add(settings, 'crowdHelpers').name('crowd helpers');
  gui.add(settings, 'formHelpers').name('form helpers');

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
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
}

function changeView(v) {
  Object.keys(views).forEach((k) => { k.isActive = false; });
  gui.close();
  setTimeout(() => guiView.updateDisplay(), 1000);
  views[v].isActive = true;
}

function onMouseDown(event) {
  startX = event.clientX;
  startY = event.clientY;
}

function onMouseUp(event) {
  let dx = (event.clientX - startX) || 0;
  let dy = (event.clientY - startY) || 0;
  if ( Math.pow(dx, 2) + Math.pow(dy, 2) > 9 ) return;
  
  switch ( event.button ) {
    case 0: // left 
      let x = event.clientX / window.innerWidth;
      let y = event.clientY / window.innerHeight;
      globalCast(x, y);
      break;

    case 1: // middle
      break;

    case 2: // right
      settings.currentView = 'default';
      views['free'].views[0].view.control.reset();
      changeView(settings.currentView);
      break;
  }

}

function globalCast(x, y) {
  let caster = views[settings.currentView].cast(x, y);
  if ( ! caster ) return;

  scene.interactiveObjects.forEach((o) => o.unclick());
  let h = caster.intersectObjects(scene.interactiveObjects);
  if ( h.length === 0 ) return;

  let d = h[0], o = h[0].object;
  delete d.object;
  o.click(d);
  settings.currentView = o.isHuman ? 'pov' : 'form';
  changeView(settings.currentView);
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  Object.keys(views).forEach((k) => views[k].setSize(sw, sh));
}
