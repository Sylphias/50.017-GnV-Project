const loader = new THREE.STLLoader();

class Form {
  constructor(scene) {
    this.size = new THREE.Vector3();

    this.kdtree = null;
    this.contours = [];
    this.navMesh = null;

    this.floorPointsHelper = new THREE.Group();
    this.floorPointsHelper.visible = false;
    scene.add(this.floorPointsHelper);

    this.material = new THREE.MeshLambertMaterial({color: 0xF0F0F0}) ;

    loader.load('data/hyperbands.stl', (geometry) => {
      geometry.scale(0.1, 0.1, 0.1);
      geometry.computeBoundingBox();
      geometry.boundingBox.getSize(this.size);
      geometry.translate(-this.size.x / 2, -this.size.y / 2, 0);

      this.geometry = geometry;
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      scene.add(this.mesh);

      this.createKdTree(geometry);
      this.createContours(geometry);
      this.createNavMesh();
      this.createHelper();

      scene.ready = true;
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
    if ( p.isVector3 ) { p = [p.x, p.y, p.z]; }
    let n = this.kdtree.nearest(p, 1, 10);
    if (n.length === 0) return null;
    return n[0];
  }

  createContours(geometry, heights = [0.1, 0.9, 1.6]) {
    let v = geometry.getAttribute('position').array;
    let numPoints = v.length / 3;
    let numFaces = numPoints / 3;

    let i, idx, l, lines;

    this.contours = heights.map((h) => {
      lines = [];
      for (i = 0; i < numFaces; ++i) {
        idx = i * 9;
        l = contourFace(0, 0, 1, h, ...v.slice(idx, idx + 9));
        if ( l === 0 ) continue;
        lines.push(l);
      }

      joinLines(lines);

      return lines.map((l) => {
        let c = new THREE.Path(l.map(([x, y, z]) => new THREE.Vector2(x, y)));
        c.closePath(); return c;
      });
    });
  }

  createNavMesh(border = 0.2, resolution = 0.3) {
    let bb = this.geometry.boundingBox;
    let larg = 2;
    let minx = bb.min.x * larg,
        miny = bb.min.y * larg,
        maxx = bb.max.x * larg,
        maxy = bb.max.y * larg;

    let i, j, x, y, n, a, b, c, d, idx;
    let xw = 0, yw = 0;
    let points = [];
    this.navMesh = new THREE.Geometry();

    x = minx;
    while (x < maxx) {
      y = miny;
      while (y < maxy) {
        n = this.nearest([x, y, 0.8]);
        if (n !== null && n[1] < border) {
          points.push(new THREE.Vector3(x, y, 1));
        } else {
          points.push(new THREE.Vector3(x, y, 0));
        }
        if (xw === 0){ ++yw; }
        y += resolution;
      }
      ++xw;
      x += resolution;
    }

    this.navMesh.setFromPoints(points);

    for (i = 0; i < xw - 1; ++i) {
      idx = i * yw;
      for (j = 0; j < yw - 1; ++j) {
        a = idx + j;
        b = idx + j + 1;
        c = idx + j + yw;
        d = idx + j + yw + 1;
        n = [a, b, c, d].map((f) => points[f].z < 0.5);

        if (n.reduce((_, v) => _ + v, 0) < 3) continue;

        if (n.every((f) => f)) {
          this.navMesh.faces.push(new THREE.Face3(a, c, b));
          this.navMesh.faces.push(new THREE.Face3(b, c, d));
        } else if (!n[0]) {
          this.navMesh.faces.push(new THREE.Face3(b, c, d));
        } else if (!n[1]) {
          this.navMesh.faces.push(new THREE.Face3(a, c, d));
        } else if (!n[2]) {
          this.navMesh.faces.push(new THREE.Face3(a, d, b));
        } else {
          this.navMesh.faces.push(new THREE.Face3(a, c, b));
        }
      }
    }
  }

  createHelper(geometry, material) {
    material = material || new THREE.MeshBasicMaterial({color: 0xffffff});
    let mesh = new THREE.Mesh(this.navMesh, material);
    mesh.position.set(0, 0, 0.01);
    this.floorPointsHelper.add(mesh);
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
