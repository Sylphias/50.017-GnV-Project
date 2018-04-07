const UP = new THREE.Vector3(0, 0, 1);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const HTRANS = (new THREE.Matrix4()).makeTranslation(0, 0.5, 0);

class Human {
  constructor(position) {
    this.towards = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.omega = 0; // angular velocity

    this.geometry = new THREE.CylinderBufferGeometry(1, 1, 1, 6);
    this.geometry.applyMatrix(HTRANS);

    this.material = new THREE.MeshLambertMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.up = UP;

    this.init(position);
  }

  get position() {
    return this.mesh.position;
  }

  init(position) {
    position = position || new THREE.Vector3();
    this.velocity.set(0, 0, 0);
    this.towards.setX(position.x < 0 ? 1 : -1);
    this.omega = 0;

    let h = (Math.random() < 0.8 ? 1.5 : 1) + Math.random() * 0.2;
    let w = (h > 1.4 ? 0.3 : 0.2) + Math.random() * 0.1;
    this.mass = w * w * h;

    this.mesh.scale.set(w, h, w);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.lookAt(ORIGIN);
  }

  update(dt, pairwiseDist = []) {
    // torque and force
    let T = 0, F = new THREE.Vector3();

    F.addScaledVector(this.randDir(), this.randWalK);
    F.addScaledVector(this.towards, this.towardsK);
    F.addScaledVector(this.velocity, -this.dampingK);

    let people = pairwiseDist.reduce((f, h) => {
      let dir = (new THREE.Vector3()).copy(h[1]).normalize();
      let mag = 0;

      if ( h[2] < 1.5 ) {
        mag = -Math.sqrt(h[2]);
      } else if ( h[2] > 4 ) {
        mag = 0.5 / h[2];
      }

      return f.addScaledVector(dir, mag);
    }, new THREE.Vector3());

    F.addScaledVector(people, this.peopleK);

    let c = this.form.collide(this.mesh.position);
    if (c.collided) {
      //
    }

    T = (Math.random() - 0.5) * 0.005;

    this.velocity.addScaledVector(F, this.massMult / this.mass);
    this.mesh.position.addScaledVector(this.velocity, dt);

    this.omega += T;
    this.mesh.rotateY(this.omega * dt);
  }

  randDir() {
    return (new THREE.Vector3(1, 0, 0)).applyAxisAngle(UP, 2.0 * Math.PI * Math.random());
  }
}

Human.prototype.massMult = 0.5;
Human.prototype.randWalK = 0.01;
Human.prototype.towardsK = 0.001;
Human.prototype.dampingK = 0.01;
Human.prototype.peopleK = 0.05;

var humanParams = {
  massMult: [0.001, 1, 0.001],
  randWalK: [0.001, 0.5, 0.001],
  towardsK: [0.001, 0.5, 0.001],
  dampingK: [0.001, 0.1, 0.001],
  peopleK: [0.001, 1, 0.001]
};

class Crowd {
  constructor(scene, bounds, size = 1) {
    this.size = size;
    this.bounds = bounds;

    this.humans = Array.from({length: size}).map(() => new Human(this.initPos()));
    this.humans.forEach((h) => scene.add(h.mesh));
  }

  initPos() {
    const ysize = (bounds.max.y - bounds.min.y) * 0.95;
    let y = Math.random() * ysize + bounds.min.y;
    let x = this.bounds[Math.random() > 0.5 ? 'min' : 'max'].x * 0.95;
    return new THREE.Vector3(x, y, 0);
  }

  excReduce(h_id, initalValue, func) {
    return this.humans.reduce((acc, h, i) => (i === h_id) ? acc : func(acc, h, i), initalValue);
  }

  pairwiseDistance(h, h_id) {
    return this.excReduce(h_id, [], (dists, _h) => {
      const d = (new THREE.Vector3(0, 0, 0)).subVectors(_h.position, h.position);
      const l = d.lengthSq();
      if ( l < 9 ) dists.push([_h, d, l]);
      return dists;
    });
  }

  update(dt) {
    this.humans.forEach((h, i) => {
      h.update(dt, this.pairwiseDistance(h, i));
      if ( !this.bounds.containsPoint(h.position) ) {
        h.init(this.initPos()); // left bounds, reset
      }
    });
  }
}
