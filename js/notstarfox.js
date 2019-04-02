var isGameRunning = false,
score = 0;

var renderer = null,
scene = null,
camera = null,
root = null,
spaceShip = null,
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

var objLoader = null,
mtlLoader = null;

var rock = null;
var rocks = [];
var currentTime = Date.now();
var clock = null;
var bullets = [];

var animator = null,
durationAnimation = 2, // sec
loopAnimation = false;

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function startGame() {
    if (!isGameRunning) {
        score= 0;
        isGameRunning = true;
    }
}

function animate() {
    if (isGameRunning) {
        var now = Date.now();
        var deltat = now - currentTime;
        currentTime = now;
        var seconds = parseInt(120 - clock.elapsedTime);
        console.log(seconds);
        KF.update();

        if(seconds > 100 && seconds < 120 ||
            seconds > 60 && seconds < 80 ||
            seconds > 20 && seconds < 40) {
          cloneRock();
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

        for (rock_i of rocks){
          rock_i.position.z += 2;
          if (rock_i.position.z >= 100){
              scene.remove(rock_i);
          }
        }

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

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0, 30, 100);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(0, 60, 100);
    spotLight.target.position.set(0, 50, 60);
    root.add(spotLight);

    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    // Create the objects
    loadSpaceShip();

    // Create obstacles
    loadRock();

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
                    spaceShip.position.set(0, 25, 70);
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
                    var texture = new THREE.TextureLoader().load('models/rock/RockTexture.jpg');
                    object.traverse( function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material.map = texture;
                        }
                    });

                    rock = object;
                    rock.scale.set(2.5, 2.5, 2.5);
                    rock.position.set(0, 40, 0);
                    rock.rotation.z = Math.PI * (Math.random() * (10 -5) +5);
                    rock.rotation.y = -Math.PI;
                    //group.add(rock);
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

function cloneRock() {
  var newRock = rock.clone();
  newRock.position.set(
    Math.random() * (100 - (-100)) + (-100),
    Math.random() * (50 - (-50)) + (-50),
    -Math.random() * (100 - (-100)) + (-100));
  scene.add(newRock);
  rocks.push(newRock);
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
  setTimeout(() => {
    bullet.alive = false;
    scene.remove(bullet);
  }, 3000);
  bullets.push(bullet);
  scene.add(bullet);
}
