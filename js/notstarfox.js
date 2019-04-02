var isGameRunning = false,
score = 0;

var renderer = null,
scene = null,
camera = null,
root = null,
spaceShip = null,
spaceShipCollider = null,
group = null;

// Flags to determine which direction the space ship is moving
var moveUp = false;
var moveDown = false;
var moveLeft = false;
var moveRight = false;
// Velocity vector for the space ship
var playerVelocity = new THREE.Vector3();
// How fast the space ship will move
var PLAYERSPEED = 800.0;

var score = 0,
timer = 0,
time = 60,
life = 0;

var objLoader = null,
mtlLoader = null;
// enemy loader
var enemyObjLoader = null,
enemyMtlLoader = null;

var rock = null;
var cactus = null;
var rocks = [];
var cactusContainer = [];
var klingon = null;
var klingons = [];
var nowTime = null;
var nowTimeKlingon = null;
var currentTime = null;
var clock = null;
var bullets = [];
var bulletCollider = null;
var floor = null;

var animator = null,
durationAnimation = 2, // sec
loopAnimation = false;

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function startGame() {
    if (!isGameRunning) {
        score = 0;
        life = 100;
        isGameRunning = true;
        nowTime = 0;
        nowTimeKlingon = 0;
    }
}

function floorAnimation() {
  if (floor){
    animator = new KF.KeyFrameAnimator;
    animator.init({
      interps:[{
        keys:[0, 1],
        values:[
                { x : 0, y : 0 },
                { x : 0, y : -1 },
                ],
        target: floor.material.map.offset
        },
      ],
      loop: true,
      duration: 1000
    })
    animator.start()
  }
}

function animate() {
    if (isGameRunning) {
        currentTime = clock.elapsedTime;
        console.log('currentTime', currentTime);
        console.log('nowTime', nowTime);

        // time to show
        timer = parseInt(time - currentTime);

        // Update Animation
        KF.update();

        // Space ship Collider
        spaceShipCollider = new THREE.Box3().setFromObject(spaceShip);

        //
        if (currentTime - nowTime > 1) {
          cloneCactus();
          nowTime = currentTime;
        }

        if (currentTime - nowTimeKlingon > 4) {
          cloneKlingon();
          nowTimeKlingon = currentTime;
        }

        // Get the change in time between frames
        var delta = clock.getDelta();
        animatePlayer(delta);

        for (var index=0; index<bullets.length; index++) {
          if (bullets[index] === undefined ) continue;
          if (bullets[index].alive == false) {
            bullets.splice(index, 1);
            continue;
          }
          bullets[index].position.add(bullets[index].velocity);
        }

        if (cactusContainer) {
          for (cactus_i of cactusContainer){
            cactus_i.position.z += 2;
            if (cactus_i.position.z >= 100){
                scene.remove(cactus_i);
            }
          }
        }

        if (klingons) {
          for (klingon_i of klingons){
            klingon_i.position.z += 4;
            if (klingon_i.position.z >= 100){
                scene.remove(klingon_i);
            }
          }
        }

        updateTimer();
        checkSpaceShip();
        collisionDetected();
    }
}

function run() {
    requestAnimationFrame(function() { run(); });

    // Render the scene
    renderer.render( scene, camera );

    // Animate for next frame
    animate();
}

function createScene(canvas) {

    clock = new THREE.Clock();
    listenForPlayerMovement();
    listenForShot();

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 5000 );
    camera.position.set(0, 25, 100);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/desert.jpg' );
  	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  	floorTexture.repeat.set(10, 10);
  	var floorMaterial = new THREE.MeshLambertMaterial( { map: floorTexture, side: THREE.DoubleSide } );
  	var floorGeometry = new THREE.PlaneGeometry(1000, 5000, 10, 10);
  	floor = new THREE.Mesh(floorGeometry, floorMaterial);
  	var floorHalfHeight = floor.geometry.height/2;
  	var floorHalfWidth = floor.geometry.width/2;
  	floor.position.y = 10;
  	floor.rotation.x = Math.PI / 2;
  	floor.receiveShadow = true;
    floorAnimation();
    root.add(floor);

    // Light

    var light = new THREE.HemisphereLight(0xffffff, 0x999999, 1);
	  light.position.set(3000, 1000, -5000);
	  root.add(light);

    directionalLight = new THREE.DirectionalLight (0xffffff, 1);
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(300, 100, -500);
    directionalLight.position.multiplyScalar(50);
    root.add(directionalLight);

    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.camera.fov = 45;
    directionalLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    directionalLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    // Create the objects
    loadSpaceShip();

    // Create obstacles
    loadCactus();

    // Create enemy
    loadSpaceShipKlingon();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Now add the group to our scene
    scene.add( root );

}

function loadSpaceShip() {
    if(!mtlLoader) {
        mtlLoader = new THREE.MTLLoader();
    }
    mtlLoader.load(
        'models/ncc/Excelsior.mtl',
        function(materials){
            materials.preload();
            if(!objLoader) {
                objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
            }
            objLoader.load(
                'models/ncc/Excelsior.obj',
                function(object) {
                    object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    spaceShip = object;
                    spaceShip.scale.set(2.5, 2.5, 2.5);
                    spaceShip.position.set(0, 20, 70);
                    spaceShip.rotation.z = -Math.PI/2;
                    spaceShip.rotation.y = -Math.PI;
                    group.add(spaceShip);
                },
                // called when is loading
                function ( xhr ) {
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                // called when loading has errors
                function ( error ) {
                    console.log( 'An error happened' );
                });
        }
    )
}

function loadSpaceShipKlingon() {
    if(!enemyMtlLoader) {
        enemyMtlLoader = new THREE.MTLLoader();
    }
    enemyMtlLoader.load(
        'models/klingon/neghvar.mtl',
        function(materials){
            materials.preload();
            if(!enemyObjLoader) {
                enemyObjLoader = new THREE.OBJLoader();
                enemyObjLoader.setMaterials(materials);
            }
            enemyObjLoader.load(
                'models/klingon/neghvar.obj',
                function(object) {
                    object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    klingon = object;
                    klingon.scale.set(1.5, 1.5, 1.5);
                    klingon.position.set(0, 0, 0);
                    klingon.rotation.y = Math.PI;
                },
                // called when is loading
                function ( xhr ) {
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                // called when loading has errors
                function ( error ) {
                    console.log( 'An error happened' );
                });
        }
    )
}

function loadCactus() {
    if(!mtlLoader) {
        mtlLoader = new THREE.MTLLoader();
    }
    mtlLoader.load(
        'models/cactus/Cactus_v1_max2010_it2.mtl',
        function(materials){
            materials.preload();
            if(!objLoader) {
                objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
            }
            objLoader.load(
                'models/cactus/Cactus_v1_max2010_it2.obj',
                function(object) {
                    var texture = new THREE.TextureLoader().load('models/cactus/10436_Cactus_v1_Diffuse.jpg');
                    object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material.map = texture;
                        }
                    });

                    cactus = object;
                    cactus.scale.set(0.1, 0.1, 0.1);
                    cactus.position.set(0, 10, 0);
                    cactus.rotation.x = -Math.PI/2;
                },
                // called when is loading
                function ( xhr ) {
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                // called when loading has errors
                function ( error ) {
                    console.log( 'An error happened' );
                });
        }
    )
}

function loadRock() {
    if(!mtlLoader) {
        mtlLoader = new THREE.MTLLoader();
    }
    mtlLoader.load(
        'models/rock/Rock.mtl',
        function(materials){
            materials.preload();
            if(!objLoader) {
                objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
            }
            objLoader.load(
                'models/rock/Rock.obj',
                function(object) {
                    //var texture = new THREE.TextureLoader().load('models/cactus/cactus_flower.png');
                    object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            //child.material.map = texture;
                        }
                    });

                    rock = object;
                    rock.scale.set(10, 10, 10);
                    rock.position.set(0, 30, 50);
                    //rock.rotation.z = Math.PI * (Math.random() * (20 -5) +5);
                    //rock.rotation.y = -Math.PI;
                    //scene.add(rock);
                },
                // called when is loading
                function ( xhr ) {
                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                // called when loading has errors
                function ( error ) {
                    console.log( 'An error happened' );
                });
        }
    )
}

function cloneCactus() {
  var newCactus = cactus.clone();
  newCactus.position.set(
    Math.random() * (50 - (-50)) + (-50),
    10,
    -Math.random() * (300 - (-100)) + (-100));
  scene.add(newCactus);
  cactusContainer.push(newCactus);
}

function cloneKlingon() {
  var newKlingon = klingon.clone();
  newKlingon.position.set(
    Math.random() * (50 - (-50)) + (-50),
    Math.random() * (50 - 10) + (10),
    -Math.random() * (200 - (-100)) + (-100));
  scene.add(newKlingon);
  klingons.push(newKlingon);
}

function listenForPlayerMovement() {
    // A key has been pressed
    var onKeyDown = function(event) {
        switch (event.keyCode) {
            case 38: // up
                moveUp = true;
                break;
            case 37: // left
                moveLeft = true;
                break;
            case 40: // down
                moveDown = true;
                break;
            case 39: // right
                moveRight = true;
                break;
        }
    };

  // A key has been released
    var onKeyUp = function(event) {
        switch (event.keyCode) {
            case 38: // up
                moveUp = false;
                break;
            case 37: // left
                moveLeft = false;
                break;
            case 40: // down
                moveDown = false;
                break;
            case 39: // right
                moveRight = false;
                break;
        }
    };

    // Add event listeners for when movement keys are pressed and released
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

function animatePlayer(delta) {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 5.0 * delta;
    playerVelocity.y -= playerVelocity.y * 5.0 * delta;

    if (moveUp) {
      playerVelocity.x -= PLAYERSPEED * delta;
    }
    if (moveDown) {
      playerVelocity.x += PLAYERSPEED * delta;
    }
    if (moveLeft) {
      playerVelocity.y += PLAYERSPEED * delta;
    }
    if (moveRight) {
      playerVelocity.y -= PLAYERSPEED * delta;
    }
    if( !( moveUp || moveDown || moveLeft ||moveRight)) {
      // No movement key being pressed. Stop movememnt
      playerVelocity.y = 0;
      playerVelocity.x = 0;
    }
    spaceShip.translateX(playerVelocity.x * delta);
    spaceShip.translateY(playerVelocity.y * delta);
}

function listenForShot(delta) {
    // A key has been pressed
    var onKeyDown = function(event) {
      switch (event.keyCode) {
          case 32: // spacebar
            createBullet(delta);
            break;
      }
    };
    // Add event listeners for when movement keys are pressed and released
    document.addEventListener('keydown', onKeyDown, false);
}

function createBullet(delta) {
  var bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({color: 0xffffff})
  )
  bullet.position.set(
    spaceShip.position.x,
    spaceShip.position.y,
    spaceShip.position.z
  )
  bullet.velocity = new THREE.Vector3(
    0,
    0,
    -0.5
  );
  bullet.alive = true;
  bulletCollider = new THREE.Box3().setFromObject(bullet)
  setTimeout(() => {
    bullet.alive = false;
    scene.remove(bullet);
  }, 5000);
  bullets.push(bullet);
  scene.add(bullet);
}

function collisionDetected() {
  // Detect cactus
  if (spaceShipCollider && cactusContainer) {
      for (var index=0; index<cactusContainer.length; index++) {
        var item = new THREE.Box3().setFromObject(cactusContainer[index]);
        if (spaceShipCollider.intersectsBox(item)) {
            cactusCollisionDetected();
        }
      }
  }

  // Detect cactus
  if (spaceShipCollider && klingons) {
      for (var index=0; index<klingons.length; index++) {
        var item = new THREE.Box3().setFromObject(klingons[index]);
        if (spaceShipCollider.intersectsBox(item)) {
            klingonCollisionDetected();
        }
      }
  }

  // Detect bullet collision
  if (bulletCollider && klingons) {
    for (var index=0; index<klingons.length; index++) {
      var item = new THREE.Box3().setFromObject(klingons[index]);
      if (spaceShipCollider.intersectsBox(item)) {
          klingonDeleted();
          scene.remove(klingons[index]);
      }
    }
  }

}

function cactusCollisionDetected() {
  life -= 1;
  $("#life").text("Life: " +life);
}

function klingonCollisionDetected() {
  life -= 5;
  $("#life").text("Life: " +life);
}

function klingonDeleted() {
  score += 1;
  $("#score").text("Score: " +score);
}

function updateTimer() {
  if (timer <= 0) {
    lose();
  }
  if (timer < 10) {
    $("#timer").css({"color": "#ff0000", "font-size": "1.5rem"});
  }
  $("#timer").text("Time: " +timer);
}

function checkSpaceShip() {
  if (life <= 0) {
    lose();
  }
  if (life < 10) {
    $("#life").css({"color": "#ff0000", "font-size": "1.5rem"});
  }
}

function lose() {
  isGameRunning = false;
  $(".game_loader").css("opacity", 1);
  $("#start").css("visibility", "hidden");
  $("#restart").css("visibility", "visible");
}
