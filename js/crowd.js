const UP = new THREE.Vector3(0, 0, 1);
const RIGHT = new THREE.Vector3(1, 0, 0);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const HTRANS = (new THREE.Matrix4()).makeRotationX(Math.PI/2).setPosition(new THREE.Vector3(0, 0, 0.5));

const states = {
  PATH: 1,
  WAIT: 2,
  GOAL: 3,
  CTRL: 0
};

class Human {
  constructor(id = 0) {
    this.towards = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.speed = 0;

    this.id = id;
    this.goal = null;
    this.waitSince = null;

    this.geometry = new THREE.CylinderBufferGeometry(1, 1, 1, 6);
    this.geometry.applyMatrix(HTRANS);

    this.material = new THREE.MeshLambertMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.up = UP;
    this.mesh.isHuman = true;
    this.mesh.unclick = () => {};
    this.mesh.click = () => {
      this.view.human = this;
    };
    this.mesh.visible = false;

    this.helper = new THREE.Group();
    this.helper.visible = false;
  }

  get position() {
    return this.mesh.position;
  }

  get active() {
    return this.mesh.visible;
  }

  get lookDir() {
    return (new THREE.Vector3(1, 0, 0)).applyAxisAngle(UP, this.mesh.rotation.z);
  }

  getY() {
    return this.site.width * Math.random() * 0.95 + this.site.bounds.min.y;
  }

  getX(forward) {
    return this.site.bounds[forward ? 'min' : 'max'].x * 0.95;
  }

  init() {
    this.velocity.set(0, 0, 0);

    let h = (Math.random() < 0.8 ? 1.5 : 1) + Math.random() * 0.2;
    let w = (h > 1.4 ? 0.3 : 0.2) + Math.random() * 0.1;
    this.mass = w * w * h;

    let forward = Math.random() > 0.5;
    this.towards.set(this.getX(!forward), this.getY(), 0);
    this.forward = forward;
    this.selectGoal();

    this.mesh.scale.set(w, w, h);
    this.mesh.position.set(this.getX(forward), this.getY(), 0);
    this.mesh.rotation.set(0, 0, forward > 0.5 ? 0 : Math.PI);
    this.mesh.visible = true;

    this.planPath();
    this.state = states.PATH;
    this.material.color.set(0xffff00);
  }

  remove() {
    if ( this.view.human === this ) {
      this.view.human = ( this.others.length > 0 ) ? this.others[0] : null;
    }
    this.mesh.visible = false;
    this.helper.remove(...this.helper.children);
  }

  toggleHelper() {
    this.helper.visible = !this.helper.visible;
  }

  update(dt) {
    if ( ! this.site.bounds.containsPoint(this.position) ) {
      this.remove(); // left bounds
      return;
    }

    if ( this.towards.distanceTo(this.position) < 0.1 ) {
      this.remove(); // reached goal
      return;
    }

    if ( this.path.length == 0 ) {
      this.remove(); // path ended
      return;
    }

    let F = new THREE.Vector3();

    switch ( this.state ) {
      case states.PATH:
        this.material.color.set(0xffff00);
        F.add(this.followPath());
        F.add(this.avoidCollisions());
        break;
      case states.WAIT:
        this.material.color.set(0x0000ff);
        this.velocity.multiplyScalar(0.1);
        this.pathTime();
        break;
      case states.GOAL:
        this.material.color.set(0x00ff00);
        this.velocity.multiplyScalar(0.1);
        this.pathTime();
        break;
      default:
        this.fpsControl();
    }

    F.addScaledVector(this.velocity, -this.dampingK);
    this.colliderStop();

    this.velocity.addScaledVector(F, this.massMult / this.mass);
    this.velocity.clampLength(this.minSpeed, this.maxSpeed);

    this.mesh.rotateZ(this.lookAngle() * dt);
    this.mesh.position.addScaledVector(this.velocity, dt);
  }

  lookAngle() {
    let curRot = this.mesh.rotation.z;
    let dir = this.velocity;
    if ( ! dir ) {
      dir = (new THREE.Vector3()).sub(this.position);
    }

    let tarRot = dir.angleTo(RIGHT);
    let angle = tarRot - curRot;

    if ( angle >= Math.PI ) {
      angle -= Math.PI;
    } else if ( angle <= -Math.PI ) {
      angle += Math.PI;
    }
    angle = Math.max(-this.maxSpin, Math.min(this.maxSpin, angle));

    return angle || 0;
  }

  pathTime() {
    let now = performance.now();
    let passed = now - this.waitSince;
    let pathChance = (passed - this.minWait * 1000) / this.maxWait / 1000;
    let path = Math.random() < pathChance;
    if ( path ) this.state = states.PATH;
  }

  enterWait() {
    this.state = states.WAIT;
    this.waitSince = performance.now();
  }

  followPath(tol = 0.1) {
    let F = new THREE.Vector3();
    let dir = (new THREE.Vector3()).subVectors(this.path[0], this.position);
    let dist = dir.length();

    if ( dist < tol ) {
      let t = this.path.shift();
      if ( this.goal && this.goal.equals(t) ) {
        this.state = states.GOAL;
      } else if ( Math.random() > 0.9 ) {
        this.enterWait();
      }
      this.setPathHelper();
    } else {
      dir.divideScalar(dist);
      F.addScaledVector(dir, this.towardsK);
    }

    return F;
  }

  avoidCollisions() {
    let F = new THREE.Vector3();
    let rp = new THREE.Vector3(), distSq;

    this.others.forEach((h) => {
      rp.subVectors(h.position, this.position);
      distSq = rp.lengthSq();
      if ( distSq > 2 ) return;
      F.addScaledVector(rp, -this.peopleK / distSq);
    });

    return F;
  }

  colliderStop() {
    let rp = new THREE.Vector3(), distSq;
    let n, fp, dir = null;
    [0, 0.8, 1.5].forEach((h) => {
      if ( dir !== null ) return;
      rp.copy(this.position); rp.z = h;
      n = this.form.nearest(rp);
      if ( ! n ) return;
      [fp, distSq] = n;
      if ( distSq > 1 ) return;
      rp.subVectors(new THREE.Vector3(fp.obj[0], fp.obj[1], 0), this.position);
      distSq = rp.lengthSq();
      if ( distSq > 0.1 ) return;
      dir = rp;
    });

    if ( dir === null ) return;
    fp = dir.dot(this.velocity) / distSq;
    if ( fp ) this.velocity.addScaledVector(dir, -fp);
  }

  selectGoal() {
    if ( Math.random() > 0.5 ) {
      this.goal = null;
      return;
    }

    let p = new THREE.Vector3(1 + Math.random(), this.getY(), 0)
    this.goal = this.form.nearestValid(p);
    this.createGoalHelper();
  }

  createGoalHelper() {
    let m = new THREE.MeshBasicMaterial({color : 0x00ff00});
    let g = new THREE.SphereBufferGeometry(0.2);
    let s = new THREE.Mesh(g, m);
    s.position.set(this.goal.x, this.goal.y, 0.5);
    this.helper.add(s);
  }

  planPath() {
    let p = [this.position];

    if ( this.goal === null ) {
      p.push(...this.form.findPath(this.position, this.towards));
    } else {
      p.push(...this.form.findPath(this.position, this.goal));
      p.push(...this.form.findPath(this.goal, this.towards));
    }
    p.push(this.towards);

    this.path = p;
    this.createPathHelper();
  }

  createPathHelper() {
    this.helper.remove(...this.helper.children);

    let g = new THREE.BufferGeometry().setFromPoints(this.path);
    let m = new THREE.LineBasicMaterial({color : 0xff0000});
    let l = new THREE.Line(g, m);
    l.position.set(0, 0, 0.2);
    this.helper.add(l);

    let sg = new THREE.SphereBufferGeometry(0.2);
    let sm = new THREE.MeshBasicMaterial({color : 0xffff00});
    this.pathTargetHelper = new THREE.Mesh(sg, sm);
    this.helper.add(this.pathTargetHelper);
    this.setPathHelper();
  }

  setPathHelper() {
    if ( this.path.length === 0 ) return;
    let t = this.path[0];
    this.pathTargetHelper.position.set(t.x, t.y, 0.5);
  }

  fpsControl() {
  }

  randDir() {
    return (new THREE.Vector3(1, 0, 0)).applyAxisAngle(UP, 2.0 * Math.PI * Math.random());
  }
}

Human.prototype.minWait = 1;
Human.prototype.maxWait = 10;
Human.prototype.maxSpin = 0.5;
Human.prototype.minSpeed = 0.05;
Human.prototype.maxSpeed = 1.0;
Human.prototype.massMult = 0.5;
Human.prototype.randWalK = 0.01;
Human.prototype.towardsK = 0.01;
Human.prototype.dampingK = 0.01;
Human.prototype.peopleK = 0.05;
Human.prototype.formK = 0.3;

var humanParams = {
  formK: [0.1, 1, 0.1],
  massMult: [0.001, 1, 0.001],
  randWalK: [0.001, 0.5, 0.001],
  towardsK: [0.001, 0.5, 0.001],
  dampingK: [0.001, 0.1, 0.001],
  peopleK: [0.001, 1, 0.001]
};

class Crowd {
  constructor(scene, size = 1) {
    this.size = size;
    this.scene = scene;

    this.lastSpawn = 0;
    this.minSpawnTiming = 3.5;
    this.maxSpawnTiming = 10;

    this.humans = Array.from({length: size}).map((x, i) => this.newHuman(i));
  }

  get active() {
    return this.humans.filter((h) => h.active);
  }

  get inactive() {
    return this.humans.filter((h) => !h.active);
  }

  newHuman(id) {
    let h = new Human(id);
    this.scene.add(h.mesh);
    this.scene.add(h.helper);
    this.scene.interactiveObjects.push(h.mesh);
    return h;
  }

  toggleHelpers() {
    this.humans.forEach((h) => h.toggleHelper());
  }

  spawnTime() {
    let now = performance.now();
    let passed = now - this.lastSpawn;
    let spawnChance = (passed - this.minSpawnTiming * 1000) / this.maxSpawnTiming / 1000;
    let spawn = Math.random() < spawnChance;
    if ( spawn ) this.lastSpawn = now;
    return spawn;
  }

  update(dt) {
    if ( ! dt ) return;

    this.active.forEach((h, i) => {
      h.others = this.active.filter((_h) => h.id !== _h.id);
      h.update(dt);
    });

    if ( this.inactive.length > 0 && this.spawnTime() ) {
      this.inactive[0].init();
    }
  }
}
