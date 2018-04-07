const loader = new THREE.STLLoader();

class Form {
  constructor(scene) {
    this.size = new THREE.Vector3();

    this.kdtree = null;
    this.floorPoints = [];
    this.floorPointsHelper = new THREE.Group();
    this.floorPointsHelper.visible = false;
    scene.add(this.floorPointsHelper);

    this.material = new THREE.MeshLambertMaterial({color: 0xF0F0F0}) ;

    loader.load('../data/hyperbands.stl', (geometry) => {
      geometry.scale(0.1, 0.1, 0.1);
      geometry.computeBoundingBox();
      geometry.boundingBox.getSize(this.size);
      geometry.translate(-this.size.x / 2, -this.size.y / 2, 0);

      this.geometry = geometry;
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      scene.add(this.mesh);

      this.createKdTree(geometry);
      this.createFloorPoints(geometry);
    });
  }

  createKdTree(geometry) {
    let v = new Float32Array(geometry.getAttribute('position').array);
    let d = (a, b) => (Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2)+Math.pow(a[2]-b[2],2));

    let measureStart = new Date().getTime();
    this.kdtree = new THREE.TypedArrayUtils.Kdtree(v, d, 3);
    console.log('kdtree took', new Date().getTime() - measureStart, 'ms to build');
  }

  nearest(p) {
    if (!this.kdtree) return null;
    let n = this.kdtree.nearest([p.x, p.y, p.z], 1, 10);
    if (n.length === 0) return null;
    return n[0];
  }

  createFloorPoints(geometry, height = 1.6, radius = 0.4) {
    let v = geometry.getAttribute('position').array;
    let numPoints = v.length / 3;
    let i, f = {}, fps = [];

    for (i = 0; i < numPoints; ++i) {
      if (v[i * 3 + 2] > height) continue;
      let p = new THREE.Vector3(v[i * 3], v[i * 3 + 1], 0);
      let cp = null;
      if (fps.some((fp, j) => {cp = j; return fp.distanceToSquared(p) < radius;})) {
        if (cp in f) {
          f[cp][0]++; f[cp][1].add(p);
        } else {
          f[cp] = [1, p];
        }
      } else {
        fps.push(p);
      }
    }

    this.floorPoints = Object.keys(f).map((k) => f[k][1].divideScalar(f[k][0]));
    this.createHelper();
  }

  createHelper(geometry, material) {
    const cg = geometry || new THREE.BoxGeometry(1, 1, 0.1, 1);
    const cm = material || new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.floorPoints.forEach((fp) => {
      let c = new THREE.Mesh(cg, cm);
      c.position.set(fp.x, fp.y, 0.01);
      this.floorPointsHelper.add(c);
    });
  }

  toggleHelper() {
    this.floorPointsHelper.visible = !this.floorPointsHelper.visible;
  }

  collide(position, radius = 0.6) {
    let close = null, dist = null;
    if (this.floorPoints.some((fp) => {
      dist = fp.distanceTo(position); close = fp; return dist < radius;
    })) {
      return {
        collided: true,
        point: close,
        distance: dist,
        direction: (new THREE.Vector3()).subVectors(close, position)
      };
    }
    return {collided: false};
  }

  update(dt) {
  }
}
