const UP = new THREE.Vector3(0, 0, 1);

const humanV = [
  -0.22, 0.0, 1.5,
   0.22, 0.0, 1.5,
   0.0 , 0.4, 1.5,
  -0.22, 0.0, 0.0,
   0.22, 0.0, 0.0,
   0.0 , 0.4, 0.0
];

const humanT = [0, 1, 2, 0, 2, 5, 0, 5, 3, 1, 0, 3, 1, 3, 4, 2, 1, 4, 2, 4, 5];

class Human {
  constructor(position, velocity) {
    this.position = position || new THREE.Vector3(Math.random(), 0, 0);
    this.velocity = velocity || new THREE.Vector3(1, 0, 0);

    // TODO: other attributes
  }

  getP(i) {
    return this.position.getComponent(i % 3);
  }

  randomWalk(dt) {
    this.velocity = this.velocity.applyAxisAngle(UP, Math.random() - 0.5);
    this.position.addScaledVector(this.velocity, dt);
  }
}

class Crowd {
  constructor(size = 1) {
    this.size = size;
    this.humans = Array.from({length: size}).map(() => new Human());

    let tris = [];
    let vs = new Float32Array([].concat(...this.humans.map((h, i) => {
      tris.push(...humanT.map((t) => (t + 6 * i)));
      return humanV.map((v, j) => v + h.getP(j));
    })));

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(vs, 3));
    this.geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(tris), 1));
    this.geometry.dynamic = true;

    this.material = new THREE.MeshBasicMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  update(dt) {
    let p = this.geometry.attributes.position.array;
    this.humans.forEach((h, i) => {
      h.randomWalk(dt);
      humanV.forEach((v, j) => { p[i * 18 + j] = v + h.getP(j) });
    });
    this.geometry.attributes.position.needsUpdate = true;
  }
}
