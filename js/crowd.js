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
    this.mesh.isHuman = true;

    this.mesh.unclick = () => {};
    this.mesh.click = () => {};

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

    let n = this.form.nearest(this.mesh.position);
    if (n) {
      let mag = 0, fp = n[0].obj;
      let dir = (new THREE.Vector3(fp[0], fp[1], 0)).sub(this.mesh.position);
      dir.normalize();

      if ( n[1] < 0.6 ) {
        mag = -Math.sqrt(n[1]);
      } else if ( n[1] < 4 ) {
        mag = -0.1 * Math.sqrt(n[1]);
      } else if ( n[1] > 9 ) {
        mag = 0.5 / n[1];
      }

      F.addScaledVector(dir, mag * this.formK);
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

    this.humans = Array.from({length: size}).map(() => new Human(this.initPos()));
    this.humans.forEach((h) => {
      scene.add(h.mesh);
      this.interactiveObjects.push(h.mesh);
    });
  }

  initPos() {
    let y = this.site.width * Math.random() * 0.95 + this.site.bounds.min.y;
    let x = this.site.bounds[Math.random() > 0.5 ? 'min' : 'max'].x * 0.95;
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
      if ( !this.site.bounds.containsPoint(h.position) ) {
        h.init(this.initPos()); // left bounds, reset
      }
    });
  }
}
