class CubeStructs{
  constructor(scene,bounds,amount=10,width=1,height=1,depth=1){
    this.structMeshes = [];
    var geometry = new THREE.BoxGeometry( width, height, depth );
    var material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF});
    for(var x =0 ; x < amount; x++){
      var cube = new THREE.Mesh( geometry, material );
      let pos = this.getRandomPosition(bounds)
      cube.position.set(pos.x*1/2,pos.y*1/2,0+1/2*height);
      this.structMeshes.push(cube);
    }
    this.structMeshes.forEach((s) => scene.add(s));
  }

  getRandomPosition(bounds) {
    let position = new THREE.Vector3(
      Math.random() * (bounds.max.x - bounds.min.x) + bounds.min.x,
      Math.random() * (bounds.max.y - bounds.min.y) + bounds.min.y,
      Math.random() * bounds.max.z
    );// Ensure that all cubes are above the floor level
    return position
  }
}
