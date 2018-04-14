const UP = new THREE.Vector3(0, 0, 1);
const RIGHT = new THREE.Vector3(1, 0, 0);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const HTRANS = (new THREE.Matrix4()).makeRotationX(Math.PI/2).setPosition(new THREE.Vector3(0, 0, 0.5));

class Human {
  constructor() {
    this.towards = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    this.geometry = new THREE.CylinderBufferGeometry(1, 1, 1, 6);
    this.geometry.applyMatrix(HTRANS);

    this.material = new THREE.MeshLambertMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.up = UP;
    this.mesh.visible = false;
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

    let h = (Math.random() < 0.8 ? 1.5 : 1) + Math.random() * 0.2;
    let w = (h > 1.4 ? 0.3 : 0.2) + Math.random() * 0.1;
    this.mass = w * w * h;

    let forward = Math.random() > 0.5;
    this.towards.set(this.getX(!forward), this.getY(), 0);

    this.mesh.scale.set(w, w, h);
    this.mesh.position.set(this.getX(forward), this.getY(), 0);
    this.mesh.rotation.set(0, 0, forward > 0.5 ? 0 : Math.PI);
    this.mesh.visible = true;
  }

  remove() {
    this.mesh.visible = false;
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

    // torque and force
    let T = 0, F = new THREE.Vector3();

    F.addScaledVector(this.randDir(), this.randWalK);
    F.addScaledVector(this.velocity, -this.dampingK);

    let towardsDir = (new THREE.Vector3()).subVectors(this.towards, this.position);
    towardsDir.normalize();
    F.addScaledVector(towardsDir, this.towardsK);

    let people = pairwiseDist.reduce((f, h) => {
      let dir = (new THREE.Vector3()).copy(h[1]).normalize();
      return f.addScaledVector(dir, this.personForce(h[2]));
    }, new THREE.Vector3());
    F.addScaledVector(people, this.peopleK);

    let n = this.form.nearest(this.position), formDir;
    if (n) {
      let fp = n[0].obj;
      formDir = new THREE.Vector3(fp[0], fp[1], 0);
      formDir.sub(this.position).normalize();
      F.addScaledVector(formDir, this.formForce(n[1]) * this.formK);
    } else {
      formDir = ORIGIN;
    }

    this.velocity.addScaledVector(F, this.massMult / this.mass);

    let speed = this.velocity.length();
    if ( speed < this.minSpeed ) {
      this.velocity.set(0, 0, 0);
    } else if ( speed > this.maxSpeed ) {
      this.velocity.multiplyScalar(this.maxSpeed/speed);
      speed = this.maxSpeed;
    }

    this.mesh.position.addScaledVector(this.velocity, dt);

    let lookPos = new THREE.Vector3();
    if ( this.velocity.dot(formDir) > 0 ) {
      let speedRatio = (speed - this.minSpeed) / this.maxSpeed;
      lookPos.addScaledVector(this.velocity, speedRatio);
      lookPos.addScaledVector(formDir, 1 - speedRatio);
    } else {
      lookPos.add(this.velocity);
    }

    let curRot = this.mesh.rotation.z;
    let tarRot = lookPos.angleTo(RIGHT);
    let rotation = tarRot - curRot;
    if (rotation <= -Math.PI) {
      rotation += Math.PI;
    } else if (rotation >= Math.PI) {
      rotation -= Math.PI;
    }
    if ( Math.abs(rotation) > this.maxSpin ) {
      rotation = Math.sign(rotation) * this.maxSpin;
    }
    if (rotation) {
      this.mesh.rotation.set(0, 0, curRot + rotation * dt);
    }
  }

  personForce(distSq) {
    let mag = 0;
    if ( distSq < 1.5 ) {
      mag = -Math.sqrt(distSq);
    } else if ( distSq > 4 ) {
      mag = 0.5 / distSq;
    }
    return mag;
  }

  formForce(distSq) {
    let mag = 0;
    if ( distSq < 0.6 ) {
      mag = -Math.sqrt(distSq);
    } else if ( distSq < 1 ) {
      mag = -0.1 * Math.sqrt(distSq);
    } else if ( distSq > 9 ) {
      mag = 0.5 / distSq;
    }
    return mag;
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
    return h;
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
    if ( ! this.scene.ready ) return;

    this.active.forEach((h, i) => {
      h.update(dt, this.pairwiseDistance(h, i));
    });

    if ( this.inactive.length > 0 && this.spawnTime() ) {
      this.inactive[0].init();
    }
  }
}
