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

var robots = [];
var currentTime = Date.now();
var clock = null;

var animator = null,
durationAnimation = 2, // sec
loopAnimation = false;

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "images/checker_large.gif";
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
        var delta = clock.getDelta() * 1000;
        currentTime = now;
        var seconds = parseInt(30 - clock.elapsedTime);
        console.log(seconds);

        KF.update();

        // Get the change in time between frames
        var delta = clock.getDelta();
        animatePlayer(delta);
    }
}

function run() {
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Spin the cube for next frame
    animate();
}

function createScene(canvas) {

    clock = new THREE.Clock();
    listenForPlayerMovement();

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
    spotLight.position.set(0, 20, -10);
    spotLight.target.position.set(0, 30, 90);
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
    loadObj();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    
    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );
    
}

function loadObj() {
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
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.y -= playerVelocity.y * 10.0 * delta;
  
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