const UP = new THREE.Vector3(0, 0, 1);
const ORIGIN = new THREE.Vector3(0, 0, 0);

class Human {
  constructor(position, radius = 0.3, height = 1.6) {
    this.towards = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.omega = 0; // angular velocity

    this.zOffset = height / 2;
    this.geometry = new THREE.CylinderGeometry(radius, radius, height, 3,2);

    this.material = new THREE.MeshLambertMaterial({color: 0xffff00});
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.up = UP;

    if (position) this.init(position);
    this.position = this.mesh.position;

    // TODO: other attributes
  }

  init(position) {
    position.z = this.zOffset;
    this.velocity.set(0, 0, 0);
    this.towards.setX(position.x ? 1 : -1);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.lookAt(ORIGIN);
  }

  update(dt, pairwiseDist = [], structMeshes) {
    // torque and force
    let T = 0, F = new THREE.Vector3(0, 0, 0);

    F.addScaledVector(this.randDir(), 0.01);
    F.addScaledVector(this.towards, 0.0001);

    let people = pairwiseDist.reduce((f, h) => {
      let dir = (new THREE.Vector3(0, 0, 0)).copy(h[1]).normalize();
      let mag = 0;

      if ( h[2] < 1.5 ) {
        mag = -Math.sqrt(h[2]);
      } else if ( h[2] > 4 ) {
        mag = 0.5 / h[2];
      }

      return f.addScaledVector(dir, mag);
    }, new THREE.Vector3(0, 0, 0));

    F.addScaledVector(people, 0.05);

    T = (Math.random() - 0.5) * 0.005;

    let {collided, collisionForce} = this.checkCollision(structMeshes);
    if(collided){
      this.velocity.addScaledVector(collisionForce, 0.4);
    }
    else{
      this.velocity.addScaledVector(F, 1);
    }


    this.mesh.position.addScaledVector(this.velocity, dt);

    this.omega += T;
    this.mesh.rotateY(this.omega * dt);
  }

  // This function checks for collision with any meshes and adds a negative
  // directional force to the
  checkCollision(structure){

    for (var vertexIndex = 0; vertexIndex < this.mesh.geometry.vertices.length; vertexIndex++)
    {
      var localVertex = this.mesh.geometry.vertices[vertexIndex].clone();
      var globalVertex = localVertex.applyMatrix4( this.mesh.matrix );
      var directionVector = globalVertex.sub( this.mesh.position ); // direction given from position to vertex

      var ray = new THREE.Raycaster( this.mesh.position.clone(), directionVector.clone().normalize() );
      var collisionResults = ray.intersectObjects( structure.structMeshes );
      if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
          // the moment the person hits the wall or another person, he should apply a force in an opposing direction
          console.log("Hit");
          // lets do some simple deflection math using face normals
          var faceNormal = collisionResults[0].face.normal
          var pointOfImpact = collisionResults[0].point;
          pointOfImpact.z = 0;
          var negativeDir = directionVector.reflect(faceNormal);
          negativeDir.z = 0;

          return {collided:true,collisionForce:negativeDir};
      }
    }
    return {collided:false,collisionForce:new THREE.Vector3()};
  }

  randDir() {
    return (new THREE.Vector3(1, 0, 0)).applyAxisAngle(UP, 2.0 * Math.PI * Math.random());
  }
}

class Crowd {
  constructor(scene, bounds, size = 1) {
    this.size = size;
    this.bounds = bounds;

    this.humans = Array.from({length: size}).map(() => new Human(this.initPos()));
    this.humans.forEach((h) => scene.add(h.mesh));
  }

  initPos() {
    const ysize = (bounds.max.y - bounds.min.y) * 0.95;
    let y = Math.random() * ysize + bounds.min.y;
    let x = this.bounds[Math.random() > 0.5 ? 'min' : 'max'].x * 0.95;
    return new THREE.Vector3(x, y, 0);
  }

  excReduce(h_id, initalValue, func) {
    return this.humans.reduce((acc, h, i) => (i === h_id) ? acc : func(acc, h, i), initalValue);
  }

  pairwiseDistance(h, h_id) {
    return this.excReduce(h_id, [], (dists, _h) => {
      const d = (new THREE.Vector3(0, 0, 0)).subVectors(_h.position, h.position);
      const l = d.lengthSq();
      if ( l < 9 ) dists.push([_h, d, l]);
      return dists;
    });
  }

  update(dt,structureMeshes) {
    this.humans.forEach((h, i) => {

      h.update(dt, this.pairwiseDistance(h, i),structureMeshes);
      if ( !this.bounds.containsPoint(h.position) ) {
        h.init(this.initPos()); // left bounds, reset
      }
    });
  }
}
