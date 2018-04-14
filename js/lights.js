class Lights{
  /**
  This class will contain all the declarations for the lights in the structure
  as well as the different kinds of patterns it can take/display
  It will store the STL object as a geometry as face and vertice information are required

  **/
  constructor(scene,bufferGeometry,xInterval,yInterval){
    this.geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
    this.geometry.computeBoundingBox();
    this.updateIntervals(xInterval,yInterval);
    this.placeLights();
    // this.drawPlanes(scene)
    this.lights.forEach((light)=>{
      scene.add(light);
    });

  }

  placeLights(){
    // Reset all lights and hues
    this.lights = []
    //
    this.gradientHues = [];
    let counter = 0;
    // First take the geometry and run each face through the plane
    this.geometry.faces.forEach((face)=>{
      this.yPlanes.forEach((planey)=>{
        let line = this.planeIntersection(face,planey);
        if(line != 0 && line != -1){
          this.xPlanes.forEach((planex)=>{
            let pt = this.lineIntersection(line.pt1,line.pt2,planex);
            if(pt != 0 && pt != -1){
              this.gradientHues.push(counter%360);
              this.addLight(pt,counter%360);
              counter += 3;
            }
          });
        }
      });
    })
  }
  // Use this to initialize the starting values for each pattern. use when
  // we decide on more patterns
  initializePatternHueValues(){

  }
  addLight(pt,hue){
    var geometry = new THREE.BoxBufferGeometry( 0.05, 0.05, 0.05 );
    let color = new THREE.Color("hsl(0,100%,50%)");
    var material = new THREE.MeshBasicMaterial( {color: color} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(pt.x,pt.y,pt.z);
    this.lights.push(cube);
  }

  drawPlanes(scene){
    this.yPlanes.forEach((planey)=>{
      let helper = new THREE.PlaneHelper(planey, 10, 0xffff00 );
      scene.add(helper);
    });
    this.xPlanes.forEach((planex)=>{
      let helperx = new THREE.PlaneHelper(planex, 10, 0x00ffff );
      scene.add(helperx);
    });
  }

  drawBbox(scene){
    var box = new THREE.BoxHelper( this.geometry, 0xffff00 );
    scene.add(box);
  }

  drawContours(scene){
    let lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff } );
    let lGeo = new THREE.Geometry();
    this.lights.forEach((light)=>{
      lGeo.vertices.push(light.position);
    });
    var line = new THREE.Line(lGeo,lineMaterial);
    scene.add(line);
  }

/*-------------------------------------------------------------------------
   Create a contour slice through a 3 vertex facet pa,pb,pc
   The contour "level" is a horizontal plane perpendicular to the z axis,
        ie: The equation of the contour plane Ax + By + Cz + D = 0
                 has A = 0, B = 0, C = 1, D = -level
   Return
         0 if the contour plane doesn't cut the facet
         2 if it does cut the facet
        -1 for an unexpected occurrence
   If a vertex touches the contour plane nothing need to be drawn!?
  */
  planeIntersection(face,plane){
    let a = this.geometry.vertices[face.a];
    let b = this.geometry.vertices[face.b];
    let c = this.geometry.vertices[face.c];

    // Check for intersection in each of the 3 lines
    /*
       Evaluate the equation of the plane for each vertex
       Where A is the plane x, B =y and C = z, and D is the plane distance from
        origin to plane
         sidea = A * pa.x + B * pa.y + C * pa.z + D;
         sideb = A * pb.x + B * pb.y + C * pb.z + D;
         sidec = A * pc.x + B * pc.y + C * pc.z + D;
    */
    // Basically this takes the points of the vectors passed in and subs in the
    // values into the plane equation, this tells us the nature of the point
    // in relation to the plane.
    let sideA = plane.normal.x*a.x +plane.normal.y*a.y+plane.normal.z*a.z
    + plane.constant;
    let sideB = plane.normal.x*b.x +plane.normal.y*b.y+plane.normal.z*b.z
    + plane.constant;
    let sideC = plane.normal.x*c.x +plane.normal.y*c.y+plane.normal.z*c.z
    + plane.constant;

    // Now you want to check the sign of the plane equations to check if
    // the vertice points lies below the plane or above the plane
    let sA = Math.sign(sideA);
    let sB = Math.sign(sideB);
    let sC = Math.sign(sideC);

    let p1= new THREE.Vector3();
    let p2= new THREE.Vector3();
    /* if all the vertices are greater than or equal to 0 it means either
    *  the face is above the contour or it lies on the contour (less than means
    *  under the contour) */
    if (sideA >= 0 && sideB >= 0 && sideC >= 0) {
        return 0;
    } else if (sideA <= 0 && sideB <= 0 && sideC <= 0) {
        return 0;
    }
    // A and B are opposite side of the plane, and A and C are opposite sides
    else if (sA != sB && sA != sC) {
        p1.x = a.x - sideA * (c.x - a.x) / (sideC - sideA);
        p1.y = a.y - sideA * (c.y - a.y) / (sideC - sideA);
        p1.z = a.z - sideA * (c.z - a.z) / (sideC - sideA);
        p2.x = a.x - sideA * (b.x - a.x) / (sideB - sideA);
        p2.y = a.y - sideA * (b.y - a.y) / (sideB - sideA);
        p2.z = a.z - sideA * (b.z - a.z) / (sideB - sideA);
        return {pt1: p1, pt2: p2};
    }
    // A and B are opposite side of the plane, and B and C are opposite sides
    else if (sB != sA && sB != sC) {
        p1.x = b.x - sideB * (c.x - b.x) / (sideC - sideB);
        p1.y = b.y - sideB * (c.y - b.y) / (sideC - sideB);
        p1.z = b.z - sideB * (c.z - b.z) / (sideC - sideB);
        p2.x = b.x - sideB * (a.x - b.x) / (sideA - sideB);
        p2.y = b.y - sideB * (a.y - b.y) / (sideA - sideB);
        p2.z = b.z - sideB * (a.z - b.z) / (sideA - sideB);
        return {pt1: p1, pt2: p2};
    }
    // C and B are opposite side of the plane, and A and C are opposite sides
    else if (sC != sB && sC != sA) {
        p1.x = c.x - sideC * (a.x - c.x) / (sideA - sideC);
        p1.y = c.y - sideC * (a.y - c.y) / (sideA - sideC);
        p1.z = c.z - sideC * (a.z - c.z) / (sideA - sideC);
        p2.x = c.x - sideC * (b.x - c.x) / (sideB - sideC);
        p2.y = c.y - sideC * (b.y - c.y) / (sideB - sideC);
        p2.z = c.z - sideC * (b.z - c.z) / (sideB - sideC);
       return {pt1: p1, pt2: p2};
    } else {
        return -1; // Error, unknown condition
    }
  }
  lineIntersection(p1,p2,plane){
    let sideA = plane.normal.x*p1.x +plane.normal.y*p1.y+plane.normal.z*p1.z
    + plane.constant;
    let sideB = plane.normal.x*p2.x +plane.normal.y*p2.y+plane.normal.z*p2.z
    + plane.constant;
    let sA = Math.sign(sideA);
    let sB = Math.sign(sideB);

    let pt =new  THREE.Vector3();
    if (sideA >= 0 && sideB >= 0) {
        return 0;
    } else if (sideA <= 0 && sideB <= 0 ) {
        return 0;
    }
    else if (sA != sB) {
        pt.x = p1.x - sideA * (p2.x - p1.x) / (sideB - sideA);
        pt.y = p1.y - sideA * (p2.y - p1.y) / (sideB - sideA);
        pt.z = p1.z - sideA * (p2.z - p1.z) / (sideB - sideA);
        return pt;
    }
    return -1;
  }

  drawCube(x,y,z,colorx=120){
    var geometry = new THREE.BoxBufferGeometry( 0.05, 0.05, 0.05 );
    let color = new THREE.Color("hsl("+colorx%360+",100%,50%)");
    var material = new THREE.MeshBasicMaterial( {color: color} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(x,y,z);
    return cube;
  }

// update the xplane and yplanes
  updateIntervals(xInterval,yInterval){
    this.xPlanes = [];
    this.yPlanes = [];
    for (var x = this.geometry.boundingBox.min.x; x < this.geometry.boundingBox.max.x; x += xInterval) {
      var planeX = new THREE.Plane(new THREE.Vector3(1,0,0), -x);
      this.xPlanes.push(planeX)
    }
    for (var y = this.geometry.boundingBox.min.z; y < this.geometry.boundingBox.max.z; y += yInterval) {
      var planeY = new THREE.Plane(new THREE.Vector3(0,0,1), -y);
      this.yPlanes.push(planeY)
    }
  }
  // Currently havent mapped each light to an x y coordinate.
  // will use the plane information to animate the lights
  gradientPattern(){
    for(let i=0;i<this.lights.length;i++){
      this.gradientHues[i]=(this.gradientHues[i]+3)%360
      let color = new THREE.Color("hsl("+this.gradientHues[i]+",100%,50%)");
      this.lights[i].material.color = color;
    }
  }
  update(){
    this.gradientPattern();
  }
}