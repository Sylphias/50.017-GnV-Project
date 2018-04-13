class TopView {
  constructor(frustum, height = 3, near = 0.1, far = 100) {
    this.h = frustum / 2;
    this.camera = new THREE.OrthographicCamera(-this.h, this.h, this.h, -this.h, near, far);
    this.camera.position.z = height;
  }

  update() {
  }

  resize(aspect) {
    const r = aspect * this.h;
    this.camera.left   = -r;
    this.camera.right  =  r;
    this.camera.top    =  this.h;
    this.camera.bottom = -this.h;
    this.camera.updateProjectionMatrix();
  }
}

class FreeView {
  constructor(fov = 75, near = 1, far = 100) {
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.camera.position.z = 10;
    this.camera.up = new THREE.Vector3(0,0,1);
    this.control = null;
  }

  setControl(controlType, dom) {
    this.control = new controlType(this.camera, dom);
    this.control.panningMode = THREE.HorizontalPanning;
    this.control.maxPolarAngle = Math.PI / 2;
  }

  update() {
    this.control && this.control.update();
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}

class PovView {
  constructor(fov = 75, near = 1, far = 100, pos = new THREE.Vector3(0, 0, 0)) {
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.up = new THREE.Vector3(0,0,1);
    this.mesh = null;
    this.control = null;
  }

  update() {
    let pos = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, 1.5);
    let rot = this.mesh.rotation;
    this.camera.position.set(pos.x, pos.y, pos.z);
    //this.camera.setRotationFromEuler(new THREE.Euler(0, 0, rot.z,'XYZ'));
    this.camera.lookAt(new THREE.Vector3(0,0,1.5));
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}

class StrucView {
  constructor(fov = 75, near = 1, far = 100, pos = new THREE.Vector3(0, 0, 0)) {
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.up = new THREE.Vector3(0,0,1);
    this.control = null;
  }

  setControl(controlType, dom) {
    this.control = new controlType(this.camera, dom);
    this.control.enableZoom = false;
    this.control.enablePan = false;
  }

  update() {
    this.control && this.control.update();
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}

class Viewport {
  constructor(view, w, h, x = 0, y = 0, z = 0) {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    this.view = view;
    this.caster = new THREE.Raycaster();
    this.wRatio = w; this.w = w * sw;
    this.hRatio = h; this.h = h * sh;
    this.xRatio = x; this.x = x * sw;
    this.yRatio = y; this.y = y * sh;
    this.z = z;
  }

  cast(x, y) {
    if (x < this.xRatio || x > this.xRatio + this.wRatio ||
        y < this.yRatio || y > this.yRatio + this.hRatio ) return null;
    let xr = 2 * (x - this.xRatio) / this.wRatio - 1;
    let yr = 2 * (this.yRatio - y) / this.hRatio + 1;
    this.caster.setFromCamera(new THREE.Vector2(xr, yr), this.view.camera);
    return this.caster;
  }

  render(scene, renderer) {
    this.view.update();
    renderer.setViewport(this.x, this.y, this.w, this.h);
    renderer.render(scene, this.view.camera);
  }

  resize(sw, sh) {
    this.x = this.xRatio * sw;
    this.y = this.yRatio * sh;
    this.w = this.wRatio * sw;
    this.h = this.hRatio * sh;
    this.view.resize(this.w / this.h);
  }
}

class Viewports {
  constructor() {
    this.views = [];
    this.lastZ = 0;
  }

  add(view, w, h, x = 0, y = 0, z = null) {
    if (z === null) {
      this.lastZ += 1;
      z = this.lastZ;
    }
    this.views.push(new Viewport(view, w, h, x, y, z));
    this.views.sort((a, b) => (a.z - b.z));
  }

  cast(x, y) {
    let caster = null;
    this.views.slice().reverse().some((v) => {caster = v.cast(x, y); return caster;})
    return caster;
  }

  render(scene, renderer) {
    renderer.clear();
    this.views.forEach((v) => v.render(scene, renderer));
  }

  setSize(sw, sh) {
    this.views.forEach((v) => v.resize(sw, sh));
  }
}
