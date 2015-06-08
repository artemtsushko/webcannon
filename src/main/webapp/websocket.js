var wsUri = "ws://" + document.location.host + document.location.pathname + "gameendpoint";
var websocket = new WebSocket(wsUri);

websocket.onmessage = function (evt) {
    parseTrajectory(evt.data);
};

websocket.onerror = function (evt) {
    console.error(evt.data);
};

var gun;
var gunHeight = 40;
var ball;
var trajectory = [];
var ballMoveId;
var PLANE_SIZE = 4000;
var container,
    camera,
    scene,
    renderer,
    plane;

start();

function start() {
    setTimeout(init,40);
    setInterval(renderScene, 40);
}

function init() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    scene = new THREE.Scene();
    container = document.createElement('div');
    document.body.appendChild(container);
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0,250,500);
    camera.lookAt(new THREE.Vector3());

    initPlane();
    initLight();
    initModels();

    renderer.setClearColor(0xf0f0f0);
    renderer.setSize(window.innerWidth*0.95, window.innerHeight*0.95);

    container.appendChild(renderer.domElement);

    document.addEventListener('wheel', onDocumentWheel, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);



}

function initPlane() {

    var planeTexture = new THREE.ImageUtils.loadTexture('images/grass.jpg');
    planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
    planeTexture.repeat.set(160, 40);
    var planeMaterial = new THREE.MeshBasicMaterial({map: planeTexture, side: THREE.DoubleSide});
    var planeGeometry = new THREE.PlaneBufferGeometry(PLANE_SIZE*2, PLANE_SIZE/2);
    planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    plane = new THREE.Mesh(planeGeometry, planeMaterial);

    scene.add(plane);

    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);

    scene.add( skyBox );


    scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);
}

function initLight() {
    var ambientLight = new THREE.AmbientLight(0x404040);;
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.75);
    directionalLight.position.set(-0.4,0.3,0.3);
    scene.add(directionalLight);

}

function initModels() {
    var cylinderGeometry = new THREE.CylinderGeometry( 5, 10, gunHeight * 2, 32, 1, false );
    var cylinderMaterial = new THREE.MeshPhongMaterial({
        color: 0x207010,
        ambient: 0x207010, // should generally match color
        specular: 0x103808,
        shininess: 100,
        vertexColors: THREE.VertexColors
    });
    gun = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
    gun.position.set(300,gunHeight,0);
    gun.rotation.set(0,0,Math.PI / 2);
    scene.add( gun );

    var ballGeometry = new THREE.SphereGeometry( 5, 32, 32 );
    var ballMaterial = new THREE.MeshPhongMaterial({
        color: 0x604008,
        ambient: 0x604008, // should generally match color
        specular: 0x302004,
        shininess: 100,
        vertexColors: THREE.VertexColors
    });
    ball = new THREE.Mesh(ballGeometry,ballMaterial);


    var torusGeometry = new THREE.TorusGeometry( gunHeight-10, 3, 3, 50);
    var leftWheel = new THREE.Mesh(torusGeometry,ballMaterial);
    leftWheel.position.z = 12.5;
    gun.add(leftWheel);
    var rightWheel = new THREE.Mesh(torusGeometry,ballMaterial);
    rightWheel.position.z = -12.5;
    gun.add(rightWheel);

    gun.rotation.z -= Math.PI / 6;

}

function renderScene() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth*0.95, window.innerHeight*0.95);
}


function onDocumentKeyDown(event) {
    var DOM_VK_SPACE = 32;
    var DOM_VK_LEFT = 37;
    var DOM_VK_UP = 38;
    var DOM_VK_RIGHT = 39;
    var DOM_VK_DOWN = 40;

    switch (event.keyCode) {
        case DOM_VK_SPACE:
            fire();
            break;
        case DOM_VK_LEFT:
            gun.position.x -= 1;
            renderScene();
            break;
        case DOM_VK_RIGHT:
            gun.position.x += 1;
            renderScene();
            break;
        case DOM_VK_UP:
            gun.rotation.z -= 0.02;
            renderScene();
            break;
        case DOM_VK_DOWN:
            gun.rotation.z += 0.02;
            renderScene();
            break;
    }
}

function onDocumentWheel(event) {
    event = event || window.event;
    var delta = event.wheelDelta;

    if (delta > 0) {
        camera.position.z -= 10;
        camera.position.y -= 5;
    }
    else {
        camera.position.z += 10;
        camera.position.y += 5;

    }
    camera.updateProjectionMatrix();
    renderScene();

}

function fire() {
    var msg = "" + gun.position.x
        + " " + gun.position.y
        + " " + (Math.PI / 2 - gun.rotation.z);
    websocket.send(msg);
}

function parseTrajectory(str) {
    var strings = str.split(" ");
    trajectory = [];
    clearInterval(ballMoveId);
    for (var i = 0; i < str.length; i += 2) {
        trajectory.push(parseFloat(strings[i]));
        trajectory.push(parseFloat(strings[i+1]));
    }
    ball.position.x = trajectory.shift();
    ball.position.y = trajectory.shift();
    scene.add(ball);
    ballMoveId = setInterval(drawBall,5);
}

function drawBall() {
    if(trajectory.length == 0) {
        clearInterval(ballMoveId);
        scene.remove(scene.getObjectById(ball.id));
        return;
    }
    ball.position.x = trajectory.shift();
    ball.position.y = trajectory.shift();
}
