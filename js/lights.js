class Lights{
  /**
  This class will contain all the declarations for the lights in the structure
  as well as the different kinds of patterns it can take/display
  **/
  constructor(scene,meshVertices){
    this.lights = [];
    this.points = [];
    for(var i = 0 ; i < meshVertices.length; i = i+3){
      this.points.push(new THREE.Vector3(meshVertices[i],meshVertices[i+1],meshVertices[i+2]));
    }
    // let counter = -1;
    // this.points.map((pt)=>{
    //   counter ++;
    //   if(counter%100 == 0){return;}
    //   var light = new THREE.PointLight( this.HsvToHex(counter%360,1,1), 1, 100 );
    //   light.position.set(pt.x,pt.y,pt.z );
    //   this.lights.push(light);
    //   scene.add( light );
    // });

    //create a blue LineBasicMaterial
var lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff } );
    for(let x = 1 ; x < 4;x++){
      let pt = this.points[100*x];
      let hue = 100*x;
      let color = new THREE.Color("hsl("+hue+",50%,50%)");

      let light = new THREE.PointLight( color, 1, 100 );
      let lGeo = new THREE.Geometry();
      lGeo.vertices.push(new THREE.Vector3(0,0,0));
      lGeo.vertices.push(new THREE.Vector3(pt.x,pt.y,pt.z));
      var line = new THREE.Line(lGeo,lineMaterial);
      scene.add(line);
      light.position.set(pt.x,pt.y,pt.z );
      this.lights.push(light);
      scene.add(light);
    }

    console.log("done");
  }

  /** Function to convert HSV -> hex Values
      Formulas from https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
      H => [0,360] S=>[0,1] V=>[0,1]
      turns out I dont need this, but I'll keep this here for now
  **/
  HsvToHex(h,s,v){
    let chroma = s*v;
    let h_prime = h/60;
    let x = chroma * (1- Math.abs(h_prime%2 - 1));
    let rgbPrime;
    if(h_prime<0){rgbPrime = new THREE.Vector3(0,0,0)};
    if(h_prime<=1){rgbPrime = new THREE.Vector3(chroma,x,0)};
    if(h_prime<=2){rgbPrime = new THREE.Vector3(x,chroma,0)};
    if(h_prime<=3){rgbPrime = new THREE.Vector3(0,chroma,x)};
    if(h_prime<=4){rgbPrime = new THREE.Vector3(0,x,chroma)};
    if(h_prime<=5){rgbPrime = new THREE.Vector3(x,0,chroma)};
    if(h_prime<=6){rgbPrime = new THREE.Vector3(chroma,0,x)};
    let m = v-chroma;
    return parseInt(this.ComponentToHex(Math.floor(rgbPrime.x+m))
    +this.ComponentToHex(Math.floor(rgbPrime.y+m))
    +this.ComponentToHex(Math.floor(rgbPrime.z+m)),16);
  }

  ComponentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
}
