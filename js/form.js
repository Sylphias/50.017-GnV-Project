const loader = new THREE.STLLoader();
const modifier = new THREE.SimplifyModifier();
const ZONE = '_';

class Form {
  constructor(scene) {
    this.size = new THREE.Vector3();

    this.kdtree = null;
    this.navMesh = null;
    this.path = new THREE.Pathfinding();

    this.formHelper = new THREE.Group();
    this.formHelper.visible = false;
    scene.add(this.formHelper);

    this.material = new THREE.MeshLambertMaterial({color: 0xF0F0F0}) ;

    loader.load('data/hyperbands.stl', (geometry) => {
      geometry.scale(0.1, 0.1, 0.1);
      geometry.computeBoundingBox();
      geometry.boundingBox.getSize(this.size);
      geometry.translate(-this.size.x / 2, -this.size.y / 2, 0);

      this.geometry = geometry;
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      scene.add(this.mesh);

      this.createKdTree();
      this.createNavMesh();
      this.initPathfinding();
      this.createNavMeshHelper();

      scene.ready = true;
    });
  }

  createKdTree() {
    let v = new Float32Array(this.geometry.getAttribute('position').array);
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

  createNavMesh(border = 0.2, resolution = 0.3) {
    let bb = this.geometry.boundingBox;
    let larg = 1 + border;
    let minx = bb.min.x - larg,
        miny = bb.min.y - larg,
        maxx = bb.max.x + larg,
        maxy = bb.max.y + larg;

    let i, j, x, y, n, a, b, c, d, idx;
    let xw = 0, yw = 0;
    let points = [];
    this.navMesh = new THREE.Geometry();

    x = minx;
    while (x < maxx) {
      y = miny;
      while (y < maxy) {
        idx = [0, 0.5, 1.5].some((z) => {
          n = this.nearest([x, y, z]);
          return ( n !== null && n[1] < border );
        });
        points.push(new THREE.Vector3(x, y, idx ? 1 : 0));
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

  initPathfinding() {
    this.navMesh = modifier.modify(this.navMesh, 1770);
    let measureStart = new Date().getTime();
    let zone = THREE.Pathfinding.createZone(this.navMesh);
    console.log('nav mesh took', new Date().getTime() - measureStart, 'ms to build');
    this.path.setZoneData(ZONE, zone);
  }

  nearestValid(point) {
    let p = this.path.getClosestNode(point, ZONE, 0);
    return p.centroid
  }

  findPath(start, end) {
    let e = this.path.getClosestNode(end, ZONE, 0);
    return this.path.findPath(start, e.centroid, ZONE, 0);
  }

  createNavMeshHelper() {
    const m = new THREE.MeshBasicMaterial({color: 0x888888, wireframe: true});
    let mesh = new THREE.Mesh(this.navMesh, m);
    mesh.position.set(0, 0, 0.01);
    this.formHelper.add(mesh);
  }

  toggleHelper() {
    this.formHelper.visible = !this.formHelper.visible;
  }

  update(dt) {
  }
}
