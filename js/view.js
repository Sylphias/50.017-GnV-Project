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
    this.control = null;
  }

  setControl(controlType, dom) {
    this.control = new controlType(this.camera, dom);
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
    this.wRatio = w; this.w = w * sw;
    this.hRatio = h; this.h = h * sh;
    this.xRatio = x; this.x = x * sw;
    this.yRatio = y; this.y = y * sh;
    this.z = z;
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

  render(scene, renderer) {
    renderer.clear();
    this.views.forEach((v) => v.render(scene, renderer));
  }

  setSize(sw, sh) {
    this.views.forEach((v) => v.resize(sw, sh));
  }
}
