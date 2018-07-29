const CENTER = new THREE.Vector3();
const textureLoader = new THREE.TextureLoader();

let lights = [[8, 4, 3], [-8, -4, 3]];
let chairs = [
  [-5, 4], [-3.5, 4], [3.5, -4], [5, -4],
  [10, 4], [9.35, 4.4], [8.7, 4], [10, 3.25], [9.35, 2.85], [8.7, 3.25],
  [-10, -4], [-9.35, -4.4], [-8.7, -4], [-10, -3.25], [-9.35, -2.85], [-8.7, -3.25],
];

class Site {
  constructor(scene) {
    this.size = new THREE.Vector3(30, 10, 1);
    this.bounds = new THREE.Box3();
    this.bounds.setFromCenterAndSize(CENTER, this.size);

    this.floorTexture = textureLoader.load('data/tile.png');
    this.floorTexture.wrapS = THREE.MirroredRepeatWrapping;
    this.floorTexture.wrapT = THREE.MirroredRepeatWrapping;
    this.floorTexture.repeat.set(8, 4);
    this.floorTexture.anisotropy = 8;

    this.floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(),
      new THREE.MeshPhongMaterial({color: 0xffffff, map: this.floorTexture})
    );
    this.floor.scale.set(this.size.x, this.size.y, this.size.z);

    scene.add(this.floor);

    this.grass = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(),
      new THREE.MeshPhongMaterial({color: 0x005500})
    );
    this.grass.scale.set(this.size.x, 2, this.size.z);
    this.grass.position.set(0, 7, -0.01);

    scene.add(this.grass);

    this.buildingTexture = textureLoader.load('data/building.png');
    this.buildingTexture.wrapS = THREE.RepeatWrapping;
    this.buildingTexture.premultiplyAlpha = true;
    this.buildingTexture.repeat.set(5, 1);
    this.buildingTexture.anisotropy = 8;

    this.building = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(45, 9),
      new THREE.MeshPhongMaterial({
        color: 0xffffff, transparent: true, map: this.buildingTexture
      })
    );

    this.building.rotation.x += Math.PI / 2;
    this.building.position.y += 8.2;
    this.building.position.z += 4.5;

    scene.add(this.building);

    this.corridor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(45, 9),
      new THREE.MeshPhongMaterial({color: 0x888888})
    );

    this.corridor.rotation.x += Math.PI / 2;
    this.corridor.position.y += 10;
    this.corridor.position.z += 4.5;

    scene.add(this.corridor);

    this.chairTexture = textureLoader.load('data/chair.png');
    this.chairTexture.wrapS = THREE.MirroredRepeatWrapping;
    this.chairTexture.wrapT = THREE.MirroredRepeatWrapping;
    this.chairTexture.repeat.set(1, 3);
    this.chairTexture.anisotropy = 8;
    this.chairTexture.rotation = 0.3;

    chairs.forEach(([x, y]) => {
      let ch = new THREE.Mesh(
        new THREE.CylinderBufferGeometry(0.4, 0.4, 0.45, 6),
        new THREE.MeshBasicMaterial({color: 0x888888, map: this.chairTexture})
      );
      ch.rotation.x += Math.PI / 2;
      ch.rotation.y += Math.PI / 2;
      ch.position.x = x;
      ch.position.y = y;
      ch.position.z += 0.2;
      scene.add(ch);
    });

    let ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(500, 500),
      new THREE.MeshBasicMaterial({color: 0x0f0f0f})
    );

    ground.position.z = -0.1;
    scene.add(ground);

    scene.background = new THREE.Color(0x0f0f18);

    scene.add(new THREE.AmbientLight(0x333333));

    lights.forEach((l) => {
      let pl = new THREE.PointLight(0xFFFFFF, 0.5, 100, 2);
      pl.position.set(...l);
      scene.add(pl);
    });
  }
}
