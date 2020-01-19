(function () {

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
    directionalLight.shadow.mapSize.width = 10000;
    directionalLight.shadow.mapSize.height = 10000;
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 10000;
    directionalLight.shadow.camera.left = -5000;
    directionalLight.shadow.camera.right = 5000;
    directionalLight.shadow.camera.top = 5000;
    directionalLight.shadow.camera.bottom = -5000;
    directionalLight.shadow.camera.visible = true;
 //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
 //console.log(directionalLight);

    scene.add(directionalLight);
    return scene;
  }

  function calculateShadowRecord(timeStep, hStep, dStep, hStart, hEnd, dStart, dEnd, scene) {

      let shadowCasters = [];
      for(let i=0; i<scene.children.length; ++i) {
        //console.log(scene.children[i]);
        if(scene.children[i].castShadow) {
          shadowCasters.push(scene.children[i]);
        }
      }
      console.log(shadowCasters.length);

      let shadowMapOverTime = [];
      for(let ps=0; ps<=Math.PI; ps+=timeStep) {
        for(let h=hStart; h<=hEnd; h+=hStep) {
          for(let d=dStart; d<=dEnd; d+=dStep) {
              let rc = new THREE.Raycaster(new THREE.Vector3(h, 0, d), new THREE.Vector3(0, Math.sin(ps), Math.cos(ps)));
              var intersects = rc.intersectObjects(shadowCasters);
              if(intersects.length > 0) {
                //console.log(intersects);
                shadowMapOverTime.push({time: ps/timeStep, x: h, z: d});
              }
          }
        }
      }
      return shadowMapOverTime;
  }

  function transformToHeatMap(shadowRecord, hStep, dStep, hStart, hEnd, dStart, dEnd) {
    let numH = (hEnd - hStart)/hStep;
    let numD = (dEnd - dStart)/dStep;

    let heatMap = [];

    for(let i=hStart; i<=hEnd; i+=hStep) {
      let zeroArray = [];
      for(let j=dStart; j<=dEnd; j+=dStep) {
        zeroArray.push(0);
      }
      heatMap.push(zeroArray);
    }

    for(let r=0; r<shadowRecord.length; ++r) {
      let x = (-hStart + shadowRecord[r].x)/hStep;
      let z = (-dStart + shadowRecord[r].z)/dStep;
      heatMap[x][z] += 1;
    }
    return heatMap;
  }

  function insertMeadow(scene, xCenter, zCenter, width, length) {
    // Meadow

    //const meadowTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1544914379-806667cd9489?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=512&q=80');
    const meadowTexture = new THREE.TextureLoader().load('img/grass.jpg');

    meadowTexture.wrapS = THREE.RepeatWrapping;
    meadowTexture.wrapT = THREE.RepeatWrapping;
    meadowTexture.repeat.set(width/40, length/20);


    const meadowMaterial =
      new THREE.MeshLambertMaterial(
        {
          map: meadowTexture,
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
        if(age == 'old') {
          buildingTexture[0] = new THREE.TextureLoader().load('https://images.unsplash.com/32/Mc8kW4x9Q3aRR3RkP5Im_IMG_4417.jpg?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&q=80');
          buildingTexture[1] = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1494491639528-85c7ab34c2f2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60');
          buildingTexture[2] = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1547998872-71a44f061d5a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=675&q=80');
          buildingTexture[3] = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1460602594182-8568137446ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&q=80');
          buildingTexture[4] = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1508924445640-6ab6b79bce04?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60');
        }


        for(let i=0; i<buildingTexture.length; ++i) {
          buildingTexture[i].wrapS = THREE.RepeatWrapping;
          buildingTexture[i].wrapT = THREE.RepeatWrapping;
          buildingTexture[i].repeat.set(1, Math.ceil(height/10));
        }


        const oldMaterial =
          new THREE.MeshLambertMaterial(
            {
            map: buildingTexture[Math.floor(Math.random()*buildingTexture.length)],
            });

            const newMaterial =
              new THREE.MeshPhongMaterial(
                {
                color: 0x2203aa,
                shininess: 100,
                });

    if(age == 'old') {
    var building = new THREE.Mesh(new THREE.BoxGeometry(CWIDTH, height, DEPTH), oldMaterial);
  }
  else {
    var building = new THREE.Mesh(new THREE.BoxGeometry(CWIDTH, height, DEPTH), newMaterial);
  }
    building.position.z = z;
    building.position.x = x;
    building.position.y = height/2;
    building.rotation.y = Math.random()*Math.PI;
    building.name = "building";

    scene.add(building);

    const EDGES = 4;
    const OUTROOF = 0.2;
    const HEIGHT = 2;

    /*const roofTexture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1458682625221-3a45f8a844c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80');
    roofTexture.wrapS = THREE.RepeatWrapping;
    roofTexture.wrapT = THREE.RepeatWrapping;
    roofTexture.repeat.set( 2, 2 );*/

    var geometry = new THREE.ConeGeometry(0.5*(1+OUTROOF)*Math.sqrt(Math.pow(CWIDTH, 2)+Math.pow(DEPTH, 2)), HEIGHT, EDGES);
    var material = new THREE.MeshLambertMaterial( {/*map: roofTexture, */ color: 0x660000, } );
    var cone = new THREE.Mesh(geometry, material);
    cone.position.x = x;
    cone.position.z = z;
    cone.position.y = height + HEIGHT/2;
    cone.rotation.y = Math.PI/4 + building.rotation.y;
    cone.name = "roof";
    scene.add( cone );


    return scene;
  }

  const halfside = 3000;
  const square = 60;
  const minHeight = 10;
  const threshold = 10.5;
  const maxHeight = 15;

  const meadowWidth = 200;
  const meadowLength = 200;

    // Scene
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    var camera = new THREE.PerspectiveCamera(60, 13/6, .1, 1000000);
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);

    // Orbit Controls
    var controls = new THREE.OrbitControls(camera);

    // Ambient light
    scene.add( new THREE.AmbientLight( 0xffffff, 0.4 ) );

    // Sun
    let sunAngle = Math.PI*3/10;
    scene = insertDirectionalLight(scene, "sun", 0, 5000*Math.sin(sunAngle), 5000*Math.cos(sunAngle), 0xffffaa);

    // Sphere
    const RADIUS = 10;
    const SEGMENTS = 160;
    const RINGS = 160;

    const sphereMaterial =
      new THREE.MeshPhongMaterial(
        {
          color: 0x2277ee,
          shininess: 100,
          opacity: 0.7,
          transparent: true,
        });

    var sphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), sphereMaterial);
    sphere.position.z = -meadowWidth/2 - square/2;
    sphere.position.x = 0;
    sphere.position.y = RADIUS;
    sphere.name = "sphere";

    scene.add(sphere);



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

    scene.add(knot);

    // Plane

    const WIDTH = 10000;
    const HEIGHT = 10000;

    const texture = new THREE.TextureLoader().load('https://images.unsplash.com/photo-1520718052537-5d45fe9156ee?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=80');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(WIDTH/10, HEIGHT/10);

    var planeMaterial =
      new THREE.MeshLambertMaterial(
        {
          color: 0xdddddd,
          side: THREE.DoubleSide,
          map: texture,

        });

    var planeGeo = new THREE.PlaneGeometry(WIDTH, HEIGHT, 32);
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
            scene = insertBuilding(scene, x+square*(Math.random()-Math.random())/1.5, z+square*(Math.random()-Math.random())/1.5, heightOld, 'old');
          }
          else if(z<=0 && Math.abs(z)<=600 && Math.abs(x)<=400 && Math.abs(z)>=meadowWidth) {
            scene = insertBuilding(scene, x, z, heightNew, 'new');
          }
          else if(Math.abs(x)==Math.abs(z) && Math.abs(x)>140) {
            //scene = insertGalleryModule(scene, x, z, square*0.5, square*1.415);
          }
        }
      }


        scene = insertBuilding(scene, 0, meadowWidth/2 + square/2, 50, 'old');




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
    renderer.setSize(1300, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('demo').appendChild(renderer.domElement);


    // Calculate amount of shadow
    let shadowRecord = calculateShadowRecord(Math.PI/10, 10, 10, -meadowWidth/2, meadowWidth/2, -meadowLength/2, meadowLength/2, scene);
    let heatMap = transformToHeatMap(shadowRecord, 10, 10, -meadowWidth/2, meadowWidth/2, -meadowLength/2, meadowLength/2);

    // animation
    function animate() {

        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);

    };

    animate();

}());
