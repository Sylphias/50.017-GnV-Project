const loader = new THREE.STLLoader();

class Form {
  constructor(scene) {
    this.material = new THREE.MeshLambertMaterial({color: 0xF0F0F0}) ;

    loader.load('../data/hyperbands.stl', (geometry) => {
      geometry.scale(0.1, 0.1, 0.1);

      this.geometry = geometry;
      this.bounds = new THREE.Box3();
      this.size = new THREE.Vector3();

      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.bounds.setFromObject(this.mesh);
      this.bounds.getSize(this.size);

      this.mesh.position.x -= this.size.x / 2;
      this.mesh.position.y -= this.size.y / 2;

      scene.add(this.mesh);
    });
  }

  update() {
  }
}
