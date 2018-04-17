const CENTER = new THREE.Vector3();
const textureLoader = new THREE.TextureLoader();

let lights = [[8, 4, 3], [-8, -4, 3]];

class Site {
  constructor(scene) {
    this.size = new THREE.Vector3(90, 15, 1);
    this.bounds = new THREE.Box3();

    scene.add(new THREE.AmbientLight(0x333333));

    lights.forEach((l) => {
      let pl = new THREE.PointLight(0xFFFFFF, 0.5, 100, 2);
      pl.position.set(...l);
      scene.add(pl);
    });

    this.floorTexture = textureLoader.load('data/tile.png');
    this.floorTexture.wrapS = THREE.MirroredRepeatWrapping;
    this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.anisotropy = 8;

    this.floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(),
      new THREE.MeshPhongMaterial({color: 0xffffff, map: this.floorTexture})
    );

    this.resizeFloor();
    scene.add(this.floor);

    this.buildingTexture = textureLoader.load('data/building.png');
    this.buildingTexture.wrapS = THREE.RepeatWrapping;
    this.buildingTexture.premultiplyAlpha = true;
    this.buildingTexture.repeat.set(15, 1);
    this.buildingTexture.anisotropy = 8;

    this.building = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(135, 9),
      new THREE.MeshPhongMaterial({color: 0xffffff, map: this.buildingTexture})
    );

    this.building.rotation.x += Math.PI / 2;
    this.building.position.y += 6;
    this.building.position.z += 4.5;

    scene.add(this.building);

    let ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(500, 500),
      new THREE.MeshBasicMaterial({color: 0x0f0f0f})
    );

    ground.position.z = -0.01;
    scene.add(ground);

    scene.background = new THREE.Color(0x0f0f18);
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
    this.floorTexture.repeat.set(this.size.x / 3, this.size.y / 3);
  }
}

var siteParams = {
  width: [10, 20, 1],
  length: [20, 90, 1]
}
