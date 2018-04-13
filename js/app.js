let container, renderer, stats, gui, scene;
let views = {};
let interactiveObjects = [];
let last = performance.now();
let site, form, crowd;
let strucView;
let povView;
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

  site = new Site(scene);
  Crowd.prototype.site = site;

  form = new Form(scene);
  Human.prototype.form = form;

  form.interactiveObjects = interactiveObjects;
  Crowd.prototype.interactiveObjects = interactiveObjects;

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
  freeView.setControl(THREE.OrbitControls, renderer.domElement);
  povView = new PovView();
  strucView = new StrucView();
  strucView.setControl(THREE.OrbitControls, renderer.domElement);

  views.default = new Viewports();
  views.default.add(freeView, 1, 1);
  views.default.add(topView , 0.3, 0.3);

  views.free = new Viewports();
  views.free.add(freeView , 1, 1);

  views.top = new Viewports();
  views.top.add(topView , 1, 1);

  views.pov = new Viewports();
  views.pov.add(povView, 1, 1);

  views.struc = new Viewports();
  views.struc.add(strucView, 1, 1);

  gui.add(settings, 'currentView', Object.keys(views)).listen();

  gui.add(settings, 'speed', {pause: 0, 'x1': 1, 'x2': 2, 'x5': 5});

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener("mousedown", function(){
    startX = event.clientX / window.innerWidth;
    startY = event.clientY / window.innerHeight;
  }, false);
  window.addEventListener('click', onClick, false);
}

function animate() {
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

  console.log(Math.sqrt(Math.pow(x - startX,2) + Math.pow(y - startY,2)));

  if (Math.sqrt(Math.pow(x - startX,2) + Math.pow(y - startY,2)) < 0.01) {

    let caster = views[settings.currentView].cast(x, y);
    if (caster) {
      interactiveObjects.forEach((o) => o.unclick());
      let h = caster.intersectObjects(interactiveObjects);
      if (h.length > 0) {
        let d = h[0], o = h[0].object;
        delete d.object;
        o.click(d);
        if (o.isHuman){
          settings.currentView = 'pov';
          povView.mesh = o;
        }
        else{
          settings.currentView = 'struc';
          let newDir = (new THREE.Vector3()).copy(caster.ray.direction).negate().normalize();
          let newPos = (new THREE.Vector3()).copy(h[0].point).addScaledVector(newDir, 0.001);
          let newAim = (new THREE.Vector3()).copy(h[0].point).addScaledVector(newDir, 0.002);
          newDir.z = 0;
          let newLook = (new THREE.Vector3()).copy(newPos).add(newDir);
          strucView.camera.position.set(newPos.x, newPos.y, newPos.z);
          strucView.camera.lookAt(newLook);

          strucView.control.target = newAim;
        }
      }
    }
  }
}

function onWindowResize() {
  let sw = window.innerWidth;
  let sh = window.innerHeight;
  renderer.setSize(sw, sh);
  views[settings.currentView].setSize(sw, sh);
}
