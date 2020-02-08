    var scene = new THREE.Scene();
    let resolution = 5;
      const halfside = 750;
  const square = 60;
  const minHeight = 10;
  const threshold = 10.5;
  const maxHeight = 15;

  const meadowWidth = 200;
  const meadowLength = 200;
  
(function () {


  function obtainDataHeat(t, map, xMin, zMin, xMax, zMax, xStep, zStep) {
    
    let heatData = [];
    
    for(let x=xMin; x<=xMax; x+=xStep) {
      let currentX = [];
      for(let z=zMin; z<=zMax; z+=zStep) {
        let presence = selectOccForTime(t, x, z, map);
        currentX.push(presence);
      }
      heatData.push(currentX);
    }
    

    return heatData;
  }
  
  function obtainVisHeat(map, xStep, zStep) {
    
    let heatData = [];
    
    for(let x=-halfside; x<=halfside; x+=xStep) {
      let currentX = [];
      for(let z=-halfside; z<=halfside; z+=zStep) {
        let count = getScore(map, x, z, xStep, zStep);
        currentX.push(count);
      }
      heatData.push(currentX);
    }
    
    return heatData;
  }
  
  function getScore(map, x, z, xStep, zStep) {
    for(let k=0; k<map.length; ++k) {
      if(Math.floor(map[k].x/xStep)*xStep == x && Math.floor(map[k].z/zStep)*zStep == z) {
        return map[k].tot;
      }
    }
    return 0;
  }
 

  function insertPointLight(scene, name, x, y, z, color, intensity, distance, decay) {
    const pointLight = new THREE.PointLight(color, intensity, distance, decay);
    pointLight.position.set(x, y, z);
    pointLight.name = name;
    scene.add(pointLight);
    return scene;
  }

  function insertDirectionalLight(scene, name, x, y, z, color, intensity) {
    var directionalLight = new THREE.DirectionalLight(color, 1);
    directionalLight.position.set(x, y, z);
    directionalLight.name = name;
    directionalLight.castShadow = true;

    //directionalLight.shadowDarkness = 0.1;
    directionalLight.shadow.mapSize.width = 5000;
    directionalLight.shadow.mapSize.height = 5000;
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 10000;
    directionalLight.shadow.camera.left = -5000;
    directionalLight.shadow.camera.right = 5000;
    directionalLight.shadow.camera.top = 5000;
    directionalLight.shadow.camera.bottom = -5000;
    directionalLight.shadow.camera.visible = true;
  //  directionalLight.shadow.bias = 0.00000001;
 //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
 //console.log(directionalLight);
 //scene.add(new THREE.DirectionalLightHelper(directionalLight));
    scene.add(directionalLight);
    return scene;
  }

  function selectOccForTime(t, x, z, shadowRecord) {
     for(let i=0; i<shadowRecord.length; ++i) {
       if(shadowRecord[i].time == t && Math.floor(shadowRecord[i].x/5)*5 == x && Math.floor(shadowRecord[i].z/5)*5 == z) {
         return 1;
       }
     }
     return 0;
  }

  function calculateShadowRecord(timeStep, hStep, dStep, hStart, hEnd, dStart, dEnd, scene) {

      let shadowCasters = [];
      for(let i=0; i<scene.children.length; ++i) {
        if(scene.children[i].castShadow) {
          shadowCasters.push(scene.children[i]);
        }
      }

      let shadowMapOverTime = [];

      for(let ps=0; ps<=Math.PI; ps+=timeStep) {
        for(let h=hStart; h<=hEnd; h+=hStep) {
          for(let d=dStart; d<=dEnd; d+=dStep) {
          
              let rc = new THREE.Raycaster();

              rc.set(new THREE.Vector3(h, 0, d), new THREE.Vector3(0, Math.sin(ps), -Math.cos(ps)).normalize());
              
              rc.near = 0;
              rc.far = Infinity;
   
              let intersects = rc.intersectObjects(shadowCasters, true);
               if(intersects.length > 0) {            
                    for(let p=0; p<intersects.length; ++p) {                      
                      shadowMapOverTime.push({time: ps/timeStep, x: h, z: d}); 
                    }
              }
          }
        }
      }
      return shadowMapOverTime;
  }

  /*function transformToHeatMap(shadowRecord, hStep, dStep, hStart, hEnd, dStart, dEnd) {
    /*let numH = (hEnd - hStart)/hStep;
    let numD = (dEnd - dStart)/dStep;

    let heatMap = [];

    for(let i=-100; i<=100; i+=5) {
      let zeroArray = [];
      for(let j=-100; j<=100; j+=5) {
        zeroArray.push(0);
      }
      heatMap.push(zeroArray);
    }

    for(let r=0; r<shadowRecord.length; ++r) {
      let x = Math.floor((100 + shadowRecord[r].x)/5);
      let z = Math.floor((100 + shadowRecord[r].z)/5);
      heatMap[x][z] += 1;
    }
    return heatMap;
  }*/

  function diffMatrix(shadowRecord) {
    let diffMap = [];
    
    for(let i=0; i<shadowRecord.length; ++i) {

      if(shadowRecord[i].time > 0) {
        let diff = selectOccForTime(shadowRecord[i].time, shadowRecord[i].x, shadowRecord[i].z, shadowRecord) - selectOccForTime(shadowRecord[i].time - 1, shadowRecord[i].x, shadowRecord[i].z, shadowRecord);
        if(diff != 0) {
          diffMap.push({time: shadowRecord[i].time, x: shadowRecord[i].x, z: shadowRecord[i].z});
        }
      }
    }
    return diffMap;
  }

  function insertMeadow(scene, xCenter, zCenter, width, length) {
    // Meadow

    //const meadowTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1544914379-806667cd9489?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=512&q=80');
    const meadowTexture = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/grass.jpg');

    meadowTexture.wrapS = THREE.RepeatWrapping;
    meadowTexture.wrapT = THREE.RepeatWrapping;
    meadowTexture.repeat.set(width/40, length/20);

    const meadowBump = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/grassbump.jpg');

    meadowBump.wrapS = THREE.RepeatWrapping;
    meadowBump.wrapT = THREE.RepeatWrapping;
    meadowBump.repeat.set(width/40, length/20);


    const meadowMaterial =
      new THREE.MeshStandardMaterial (
        {
          map: meadowTexture,
          bumpMap: meadowBump,
          side: THREE.DoubleSide,
        });

    var meadow = new THREE.Mesh(new THREE.PlaneGeometry(width, length, 10, 10), meadowMaterial);
    meadow.position.z = zCenter;
    meadow.position.x = xCenter;
    meadow.position.y = 0.1;
    meadow.rotation.x = Math.PI/2;
    meadow.noCast = true;
    meadow.name = "meadow";
    
    scene.add(meadow);

    return scene;
  }

  function insertGalleryModule(scene, x, z, radius, depth) {
    // Gallery module
    const galleryMaterial =
      new THREE.MeshPhongMaterial(
        {
          color: 0x000066,
          opacity: 0.8,
          transparent: true,
        });

    const galleryModule = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 32, 1, true), galleryMaterial);
    galleryModule.position.z = z;
    galleryModule.position.x = x;
    galleryModule.position.y = -radius/6;

    galleryModule.rotation.x = Math.PI/2;
    galleryModule.rotation.z = -Math.sign(x*z)*Math.PI/4;

    scene.add(galleryModule);


    return scene;
  }


  function insertBuilding(scene, x, z, height, age) {
    // Building
    const CWIDTH = 10;
    const DEPTH = 10;

        var buildingTexture = [];
        var bumpTexture = [];

        if(age.includes('old')) {
          buildingTexture[0] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick001.jpg');
          buildingTexture[1] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick002.jpg');
          buildingTexture[2] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick003.jpg');
          buildingTexture[3] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick004.jpg');
          buildingTexture[4] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick005.jpg');
          buildingTexture[5] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick006.jpg');

          bumpTexture[0] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick001bump.jpg');
          bumpTexture[1] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick002bump.jpg');
          bumpTexture[2] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick003bump.jpg');
          bumpTexture[3] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick004bump.jpg');
          bumpTexture[4] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick005bump.jpg');
          bumpTexture[5] = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/brick006bump.jpg');

        }

        concreteTexture = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/concrete.jpg');
        concreteBump = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/concretebump.jpg');



        for(let i=0; i<buildingTexture.length; ++i) {
          buildingTexture[i].wrapS = THREE.RepeatWrapping;
          buildingTexture[i].wrapT = THREE.RepeatWrapping;
          buildingTexture[i].repeat.set(2, 2*Math.ceil(height/10));

          bumpTexture[i].wrapS = THREE.RepeatWrapping;
          bumpTexture[i].wrapT = THREE.RepeatWrapping;
          bumpTexture[i].repeat.set(2, 2*Math.ceil(height/10));
        }

        concreteTexture.wrapS = THREE.RepeatWrapping;
        concreteTexture.wrapT = THREE.RepeatWrapping;
        concreteTexture.repeat.set(2, 2*Math.ceil(height/10));

        concreteBump.wrapS = THREE.RepeatWrapping;
        concreteBump.wrapT = THREE.RepeatWrapping;
        concreteBump.repeat.set(2, 2*Math.ceil(height/10));


        let whichTexture = Math.floor(Math.random()*buildingTexture.length);

        const oldMaterial =
          new THREE.MeshStandardMaterial(
            {
            map: buildingTexture[whichTexture],
            bumpMap: bumpTexture[whichTexture],

            });

            const newMaterial =
              new THREE.MeshStandardMaterial(
                {
                  map: concreteTexture,
                  bumpMap: concreteBump,
                });

    if(age.includes('old')) {
    var building = new THREE.Mesh(new THREE.BoxGeometry(CWIDTH, height, DEPTH), oldMaterial);
  }
  else {
    var building = new THREE.Mesh(new THREE.BoxGeometry(CWIDTH, height, DEPTH), newMaterial);
  }

    building.position.z = z;
    building.position.x = x;
    building.position.y = height/2;
    building.rotation.y = Math.random()*Math.PI;
    building.name = age+"building";

    scene.add(building);

    if(age.includes('old')) {
      const EDGES = 4;
      const OUTROOF = 0.2;
      const HEIGHT = 2;

      const roofTexture = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/roof.jpg');
      roofTexture.wrapS = THREE.RepeatWrapping;
      roofTexture.wrapT = THREE.RepeatWrapping;
      roofTexture.repeat.set(1,1);

      const roofBump = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/roofbump.jpg');
      roofBump.wrapS = THREE.RepeatWrapping;
      roofBump.wrapT = THREE.RepeatWrapping;
      roofBump.repeat.set(1,1);

      var geometry = new THREE.ConeGeometry(0.5*(1+OUTROOF)*Math.sqrt(Math.pow(CWIDTH, 2)+Math.pow(DEPTH, 2)), HEIGHT, EDGES);
      var material = new THREE.MeshStandardMaterial( {map: roofTexture, bumpMap: roofBump, /* color: 0x660000, */} );
      var cone = new THREE.Mesh(geometry, material);
      cone.position.x = x;
      cone.position.z = z;
      cone.position.y = height + HEIGHT/2;
      cone.rotation.y = Math.PI/4 + building.rotation.y;
      cone.name = "roof";
      scene.add(cone);

    }
    return scene;
  }




    // Scene
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, .1, 1000000);
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);

    // Orbit Controls
    var controls = new THREE.OrbitControls(camera, document.querySelector("#demo"));

    // Ambient light
    scene.add( new THREE.AmbientLight( 0xffffff, 0.4 ) );

    var fjaroraEnv = new function() {
        this.timeOfDay = 1;
    }
    // Sun
    let sunAngle = Math.PI*fjaroraEnv.timeOfDay/10;
    scene = insertDirectionalLight(scene, "sun", 0, 5000*Math.sin(sunAngle), -5000*Math.cos(sunAngle), 0xffffaa);

    // Sphere
    var sphereTexture = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/glass.jpg');
    sphereTexture.wrapS = THREE.RepeatWrapping;
    sphereTexture.wrapT = THREE.RepeatWrapping;
    sphereTexture.repeat.set(2, 2);

    const RADIUS = 10;
    const SEGMENTS = 160;
    const RINGS = 160;

    const sphereMaterial =
      new THREE.MeshPhongMaterial(
        {
          map: sphereTexture,
          //color: 0x2277ee,
          shininess: 100,
          opacity: 0.9,
          transparent: true,
        });

    var sphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), sphereMaterial);
    sphere.position.z = -meadowWidth/2 - square/2;
    sphere.position.x = 0;
    sphere.position.y = RADIUS;
    sphere.name = "sphere";

    //scene.add(sphere);



    // Knot sculpture
   const knotMaterial =
      new THREE.MeshPhongMaterial(
        {
          color: 0xadd8e6,
          shininess: 100,
          opacity: 0.5,
          transparent: true,
        });

    var knot = new THREE.Mesh(new THREE.TorusKnotGeometry(40, 3, 60, 60, 4, 9), knotMaterial);
    knot.position.z = -meadowWidth/2 - square/2;
    knot.position.x = 0;
    knot.position.y = RADIUS;
    knot.name = "knot";

    //scene.add(knot); 

    // Ground

    const WIDTH = 1500;
    const HEIGHT = 1500;

    const pavementTexture = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/pavement.jpg');
    pavementTexture.wrapS = THREE.RepeatWrapping;
    pavementTexture.wrapT = THREE.RepeatWrapping;
    pavementTexture.repeat.set(WIDTH/20, HEIGHT/20);

    const bumpPavement = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/pavementbump.jpg');
    bumpPavement.wrapS = THREE.RepeatWrapping;
    bumpPavement.wrapT = THREE.RepeatWrapping;
    bumpPavement.repeat.set(WIDTH/20, HEIGHT/20);

    var planeMaterial =
      new THREE.MeshStandardMaterial(
        {
          color: 0xdddddd,
          side: THREE.DoubleSide,
          map: pavementTexture,
          bumpMap: bumpPavement,

        });

    var planeGeo = new THREE.PlaneGeometry(WIDTH, HEIGHT, 1);
    var plane = new THREE.Mesh(planeGeo, planeMaterial);
    plane.rotation.x = Math.PI/2;
    plane.noCast = true;
    plane.name = "cityFloor";

   scene.add(plane);

    // Buildings

    for(let x=-halfside; x<halfside; x+=square) {
      for(let z=-halfside; z<halfside; z+=square) {
        let heightOld = minHeight + 0.1*Math.abs(Math.pow(x,2)/halfside-Math.pow(z, 2)/halfside);
        let heightNew = 50 + Math.abs(maxHeight*Math.sin(x+z));

          if(heightOld>threshold && heightOld < maxHeight && z>=0) {
            //scene = insertBuilding(scene, x+square*(Math.random()-Math.random())/1.5, z+square*(Math.random()-Math.random())/1.5, heightOld, 'old');
          }
          else if(z<=0 && Math.abs(z)<=600 && Math.abs(x)<=400 && Math.abs(z)>=meadowWidth) {
            scene = insertBuilding(scene, x, z, heightNew, 'new');
          }
          else if(Math.abs(x)==Math.abs(z) && Math.abs(x)>140) {
            //scene = insertGalleryModule(scene, x, z, square*0.5, square*1.415);
          }
        }
      }


        scene = insertBuilding(scene, 50, meadowWidth/2 + square/2, 50, 'landmark_old');

        scene = insertMeadow(scene, 0, 0, meadowWidth, meadowLength);

    scene.traverse( function( child ) {
        if(child.isMesh) {
          if(!child.noCast) {
            child.castShadow = true;
          }
            child.receiveShadow = true;
        }
    } );

    // Render
    var renderer = new THREE.WebGLRenderer();
    renderer.antialias = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let skyArray = [];
    let sky_ft = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_ft.jpg');
    let sky_bk = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_bk.jpg');
    let sky_dn = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_dn.jpg');
    let sky_lf = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_lf.jpg');
    let sky_rt = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_rt.jpg');
    let sky_up = new THREE.TextureLoader().load('https://nicolopinci.github.io/fjarora/js/img/bluecloud_up.jpg');

    skyArray.push(new THREE.MeshBasicMaterial({map: sky_ft, side: THREE.DoubleSide,}));
    skyArray.push(new THREE.MeshBasicMaterial({map: sky_bk, side: THREE.DoubleSide,}));
    skyArray.push(new THREE.MeshBasicMaterial({map: sky_up, side: THREE.DoubleSide,}));
    skyArray.push(new THREE.MeshBasicMaterial({map: sky_dn, side: THREE.DoubleSide,}));
    skyArray.push(new THREE.MeshBasicMaterial({map: sky_rt, side: THREE.DoubleSide,}));
    skyArray.push(new THREE.MeshBasicMaterial({map: sky_lf, side: THREE.DoubleSide,}));



    let skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    let skybox = new THREE.Mesh(skyboxGeometry, skyArray);
    scene.add(skybox);

    document.getElementById('demo').appendChild(renderer.domElement);
    
    // Calculate amount of shadow
    scene.updateMatrixWorld();
    let shadowRecord = calculateShadowRecord(Math.PI/10, resolution, resolution, -meadowWidth/2, meadowWidth/2, -meadowLength/2, meadowLength/2, scene);
    let D = diffMatrix(shadowRecord);
    
    
    var data = [
    {
      z: obtainDataHeat(fjaroraEnv.timeOfDay, shadowRecord, -meadowWidth/2, -meadowLength/2, meadowWidth/2, meadowLength/2, resolution, resolution),
      type: 'heatmap'
    }
  ];


    
    var diffD = [
    {
      z: obtainDataHeat(fjaroraEnv.timeOfDay, D, -meadowWidth/2, -meadowLength/2, meadowWidth/2, meadowLength/2, resolution, resolution),
      type: 'heatmap'
    }
  ];
  

  
  var visMap = [
    {
      z: obtainVisHeat(computeVisibility(), resolution, resolution),
      type: 'heatmap'
    }
  ];
    
    
  var layoutHM = {
  margin: {
    l: 25,
    r: 25,
    b: 25,
    t: 40,
    pad: 2
    },
    xaxis: {visible: false},
    yaxis: {visible: false},
    title: "Heat map"
  };
  
   var layoutCFH = {
  margin: {
    l: 25,
    r: 25,
    b: 25,
    t: 40,
    pad: 2 },
    xaxis: {visible: false},
    yaxis: {visible: false},
    title: "CFH"
  };
  
    var layoutVis = {
  margin: {
    l: 25,
    r: 25,
    b: 25,
    t: 40,
    pad: 2 },
    //xaxis: {visible: false},
    //yaxis: {visible: false},
    title: "Visibility map"
  };

  Plotly.newPlot('heatMap', data, layoutHM);
    Plotly.newPlot('difference', diffD, layoutCFH);
          Plotly.newPlot('visibility', visMap, layoutVis);

    var gui = new dat.GUI();

    var sunPos = gui.addFolder('Fjarora environment');
    var currentTime = sunPos.add(fjaroraEnv, 'timeOfDay', 0, 10).step(1).listen();
    sunPos.open();

    currentTime.onChange(updateLight);
    // Fog
    // scene.fog = new THREE.Fog(0x444444, 300, 900);

    // animation
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };

    animate();
    
    
    function updateLight() {
  scene.getObjectByName("sun").position.set(0, 5000*Math.sin(this.object.timeOfDay*Math.PI/10), -5000*Math.cos(this.object.timeOfDay*Math.PI/10));
  
  var data = [
    {
      z: obtainDataHeat(this.object.timeOfDay, shadowRecord, -meadowWidth/2, -meadowLength/2, meadowWidth/2, meadowLength/2, resolution, resolution),
      type: 'heatmap'
    }
  ];
  
      var diffD = [
    {
      z: obtainDataHeat(fjaroraEnv.timeOfDay, D, -meadowWidth/2, -meadowLength/2, meadowWidth/2, meadowLength/2, resolution, resolution),
      type: 'heatmap'
    }
  ];
  
  
  

  var layoutHM = {
  margin: {
    l: 25,
    r: 25,
    b: 25,
    t: 40,
    pad: 2 },
    xaxis: {visible: false},
    yaxis: {visible: false},
    title: "Heat map"
  };
  
   var layoutCFH = {
  margin: {
    l: 25,
    r: 25,
    b: 25,
    t: 40,
    pad: 2 },
    xaxis: {visible: false},
    yaxis: {visible: false},
    title: "CFH"
  };
  


  Plotly.newPlot('heatMap', data, layoutHM);
  Plotly.newPlot('difference', diffD, layoutCFH);


}


function computeVisibility() {


                        
  let landmarks = [];
  let buildings = [];
  let visibilityMap = [];
  
  for(let i=0; i<scene.children.length; ++i) {
    if(scene.children[i].name.includes("landmark")) {
      landmarks.push(scene.children[i]);
    }
    if(scene.children[i].name.includes("building")) {
            buildings.push(scene.children[i]);
    }
  }
  let first = true;
  for(let i=0; i<scene.children.length; ++i) {
    if(scene.children[i].name.includes("building")) {
      let x = scene.children[i].position.x;
      let z = scene.children[i].position.z;
      let height = 2*scene.children[i].position.y;
      let countIntersections = 0;
      
      for(let h=0; h<height; h+=resolution) {

        for(let theta=0; theta<360; theta+=10) {
                                scene.updateMatrixWorld();

         
              let rc = new THREE.Raycaster();

              rc.set(new THREE.Vector3(x, h, z), new THREE.Vector3(Math.sin(theta*Math.PI/180), 0, Math.cos(theta*Math.PI/180)).normalize());
              
              rc.near = 0;
              rc.far = Infinity;
              
              let intersects = rc.intersectObjects(buildings, true);
              
             
              
              /*if(intersects.length > 0 && intersects[0].object.name.includes("landmark")) {
         
              
                              var pointA = new THREE.Vector3(x, h, z);
                  var direction = new THREE.Vector3(Math.sin(theta*Math.PI/180), 0, Math.cos(theta*Math.PI/180));
                  direction.normalize();

                  var distance = 800; // at what distance to determine pointB

                  var pointB = new THREE.Vector3();
                  pointB.addVectors ( pointA, direction.multiplyScalar( distance ) );

                  var geometry = new THREE.Geometry();
                  geometry.vertices.push( pointA );
                  geometry.vertices.push( pointB );
                  var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
                  var line = new THREE.Line( geometry, material );
                  scene.add( line );
                }*/
                
                
               if(intersects.length > 0) {            
                   
                    if(intersects[0].object.name.includes("landmark")) {
                      countIntersections += 1;
                    }
                    
                      if(intersects[0].object.name.includes("landmark")) {
             // console.log(intersects);
              first = false;
              
              
              
               var pointA = new THREE.Vector3(x, h, z);
                  var direction = new THREE.Vector3(Math.sin(theta*Math.PI/180), 0, Math.cos(theta*Math.PI/180));
                  direction.normalize();

                  var distance = 800; // at what distance to determine pointB

                  var pointB = new THREE.Vector3();
                  pointB.addVectors ( pointA, direction.multiplyScalar( distance ) );

                  var geometry = new THREE.Geometry();
                  geometry.vertices.push( pointA );
                  geometry.vertices.push( pointB );
                  var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
                  var line = new THREE.Line( geometry, material );
                  scene.add( line );
                  
                  
              }
                   
                    
              }
      }
      }
      
      if(countIntersections > 0) {
        var geometry = new THREE.ConeGeometry( 5, 20, 32 );
        var material = new THREE.MeshBasicMaterial( {color: "rgb("+countIntersections*20 +", 102, 102)"} );
        var marker = new THREE.Mesh( geometry, material );
        marker.position.x = x;
        marker.position.z = z;
        marker.position.y = height + 30;
        marker.rotation.x = Math.PI;
        scene.add(marker);
        
       
        
      }
      visibilityMap.push({"x": x, "z": z, "tot": countIntersections}); 
      //allBuildings.push(scene.children[i]);
    }
  }
  
  return visibilityMap;
}

}());
