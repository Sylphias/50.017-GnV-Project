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
  constructor() {
    this.towards = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.speed = 0;

    this.goal = null;

    this.geometry = new THREE.CylinderBufferGeometry(1, 1, 1, 6);
    this.geometry.applyMatrix(HTRANS);

    this.material = new THREE.MeshLambertMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.up = UP;
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

  getY() {
    return this.site.width * Math.random() * 0.95 + this.site.bounds.min.y;
  }

  getX(forward) {
    return this.site.bounds[forward ? 'min' : 'max'].x * 0.95;
  }

  init() {
    this.velocity.set(0, 0, 0);
    this.speed = 0.5;

    let h = (Math.random() < 0.8 ? 1.5 : 1) + Math.random() * 0.2;
    let w = (h > 1.4 ? 0.3 : 0.2) + Math.random() * 0.1;
    this.mass = w * w * h;

    let forward = Math.random() > 0.5;
    this.towards.set(this.getX(!forward), this.getY(), 0);
    this.selectGoal();

    this.mesh.scale.set(w, w, h);
    this.mesh.position.set(this.getX(forward), this.getY(), 0);
    this.mesh.rotation.set(0, 0, forward > 0.5 ? 0 : Math.PI);
    this.mesh.visible = true;

    this.planPath();
    this.state = states.PATH;
  }

  remove() {
    this.mesh.visible = false;
    this.helper.remove(...this.helper.children);
  }

  toggleHelper() {
    this.helper.visible = !this.helper.visible;
  }

  update(dt, pairwiseDist = []) {
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

    switch ( this.state ) {
      case states.PATH:
        this.followPath();
        break;
      case states.WAIT:
        if ( this.speed > this.minSpeed ) this.speed *= 0.8;
        if ( Math.random() > 0.7 ) this.state = states.PATH;
        break;
      case states.GOAL:
        if ( this.speed > this.minSpeed ) this.speed *= 0.8;
        if ( Math.random() > 0.9 ) this.state = states.PATH;
        break;
      default:
        this.fpsControl();
    }

    this.mesh.position.addScaledVector(this.velocity, this.speed * dt);
  }

  followPath(tol = 0.1) {
    let dir = (new THREE.Vector3()).subVectors(this.path[0], this.position);
    let dist = dir.length();

    if ( dist < tol ) {
      let t = this.path.shift();
      if ( this.goal && this.goal.equals(t) ) {
        this.state = states.GOAL;
      } else if ( Math.random() > 0.7 ) {
        this.state = states.WAIT;
      }
    } else {
      this.velocity = dir.divideScalar(dist);
      if ( this.speed < this.maxSpeed ) this.speed *= 1.2;
    }
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
    let g = new THREE.BufferGeometry().setFromPoints(this.path);
    let m = new THREE.LineBasicMaterial({color : 0xff0000});
    let l = new THREE.Line(g, m);
    l.position.set(0, 0, 0.2);
    this.helper.add(l);
  }

  fpsControl() {
  }

  randDir() {
    return (new THREE.Vector3(1, 0, 0)).applyAxisAngle(UP, 2.0 * Math.PI * Math.random());
  }
}

Human.prototype.maxSpin = 0.5;
Human.prototype.minSpeed = 0.05;
Human.prototype.maxSpeed = 1.0;
Human.prototype.massMult = 0.5;
Human.prototype.randWalK = 0.01;
Human.prototype.towardsK = 0.02;
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

    this.humans = Array.from({length: size}).map(() => this.newHuman());
  }

  get active() {
    return this.humans.filter((h) => h.active);
  }

  get inactive() {
    return this.humans.filter((h) => !h.active);
  }

  newHuman() {
    let h = new Human();
    this.scene.add(h.mesh);
    this.scene.add(h.helper);
    return h;
  }

  toggleHelpers() {
    this.humans.forEach((h) => h.toggleHelper());
  }

  excReduce(h_id, initalValue, func) {
    return this.active.reduce((acc, h, i) => (i === h_id) ? acc : func(acc, h, i), initalValue);
  }

  pairwiseDistance(h, h_id) {
    return this.excReduce(h_id, [], (dists, _h) => {
      const d = (new THREE.Vector3(0, 0, 0)).subVectors(_h.position, h.position);
      const l = d.lengthSq();
      if ( l < 9 ) dists.push([_h, d, l]);
      return dists;
    });
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
      h.update(dt, this.pairwiseDistance(h, i));
    });

    if ( this.inactive.length > 0 && this.spawnTime() ) {
      this.inactive[0].init();
    }
  }
}
