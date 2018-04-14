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

  createNavMesh(border = 0.7, resolution = 80) {
    let bb = this.geometry.boundingBox;
    let larg = 2;
    let minx = bb.min.x * larg,
        miny = bb.min.y * larg,
        maxx = bb.max.x * larg,
        maxy = bb.max.y * larg;

    let navMeshShapes = this.contours.map((contour) => {
      let shape = new THREE.Shape([
        new THREE.Vector2(minx, miny),
        new THREE.Vector2(minx, maxy),
        new THREE.Vector2(maxx, maxy),
        new THREE.Vector2(maxx, miny)
      ]);
      shape.closePath();

      shape.holes.push(...contour.map((c) =>
        new THREE.Path(Array.from({length: resolution}, (x, i) => {
          let t = i/resolution, m = c.getTangent(t), p = c.getPoint(t);
          p.addScaledVector(new THREE.Vector2(m.y, -m.x), border);
          return p;
        }))
      ));
      return shape;
    });

    this.navMesh = new THREE.ShapeGeometry(navMeshShapes[0]);
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
