const loader = new THREE.STLLoader();

class Form {
  constructor(scene) {
    this.size = new THREE.Vector3();
    this.material = new THREE.MeshLambertMaterial({color: 0xFFFFFF, wireframe:true});

    loader.load('data/hyperbands.stl', (geometry) => {
      geometry.scale(0.1, 0.1, 0.1);
      geometry.computeBoundingBox();
      geometry.boundingBox.getSize(this.size);
      geometry.translate(-this.size.x / 2, -this.size.y / 2, 0);

      this.geometry = geometry;
      this.mesh = new THREE.Mesh(this.geometry, this.material);

      this.mesh.unclick = () => {};
      this.mesh.click = (h) => {
        let d = h.face.normal.normalize();
        let p = (new THREE.Vector3()).copy(h.point).addScaledVector(d, 0.001);
        let a = (new THREE.Vector3()).copy(h.point).addScaledVector(d, 0.002);

        d.z = 0;
        this.view.camera.position.set(p.x, p.y, p.z);
        this.view.camera.lookAt(p.add(d));
        this.view.control.target = a;
      };

      this.mesh.isHuman = false;
      scene.add(this.mesh);
      scene.interactiveObjects.push(this.mesh);

      scene.ready = true;
    });
  }

  update(dt) {
  }
}
