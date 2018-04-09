const CENTER = new THREE.Vector3();

let lights = [[8, 4, 3], [-8, -4, 3]];

class Site {
  constructor(scene) {
    this.size = new THREE.Vector3(30, 15, 1);
    this.bounds = new THREE.Box3();

    scene.add(new THREE.AmbientLight(0x333333));

    lights.forEach((l) => {
      let pl = new THREE.PointLight(0xFFFFFF, 0.5, 100, 2);
      pl.position.set(...l);
      scene.add(pl);
    });

    this.floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(),
      new THREE.MeshPhongMaterial({color: 0x0f0f0f})
    );

    this.resizeFloor();
    scene.add(this.floor);
  }

  get width() {
    return this.size.y;
  }

  set width(v) {
    this.size.y = v;
    this.resizeFloor();
  }

  get length() {
    return this.size.x;
  }

  set length(v) {
    this.size.x = v;
    this.resizeFloor();
  }

  resizeFloor() {
    this.bounds.setFromCenterAndSize(CENTER, this.size);
    this.floor.scale.set(this.size.x, this.size.y, this.size.z);
  }
}

var siteParams = {
  width: [10, 20, 1],
  length: [20, 40, 1]
}
