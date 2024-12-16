import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import io from 'socket.io-client'; // Import socket.io-client
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// Loaders
const gltfLoader = new GLTFLoader();
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

// Object Positions
const positions = {
    sensor: { x: -5, y: 0, z: 0 },
    arduino: { x: 0, y: 0, z: 0 },
    server: { x: 5, y: 0, z: 0 }
};

// Load DHT22 Sensor
gltfLoader.load('/dht22_temperature_sensor_module_gltf/scene.gltf', (gltf) => {
    const sensor = gltf.scene;
    sensor.position.set(positions.sensor.x, positions.sensor.y, positions.sensor.z);
    sensor.scale.set(20, 20, 20);  

    sensor.rotation.x = Math.PI;  // Rotate the server rack to make it stand upright
    sensor.rotation.y = Math.PI / 2;  // Rotate the server rack to make it stand upright


    scene.add(sensor);
});

// Load Arduino Nano
mtlLoader.load('/arduino-nano.mtl', (materials) => {
    materials.preload();
    objLoader.setMaterials(materials);
    objLoader.load('/arduino-nano.obj', (object) => {
        object.position.set(positions.arduino.x, positions.arduino.y + 1, positions.arduino.z);
        object.scale.set(0.5, 0.5, 0.5);
        scene.add(object);
    });
});

// Load Server Rack
gltfLoader.load('/server_rack_gltf/scene.gltf', (gltf) => {
    const server = gltf.scene;
    
    server.position.set(positions.server.x, positions.server.y, positions.server.z);
    
    server.scale.set(0.5, 0.5, 0.5);

    server.rotation.x = Math.PI / 2;  // Rotate the server rack to make it stand upright

    scene.add(server);
});

// Lines: Sensor to Arduino and Arduino to Server Rack
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const lineGeometry1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(positions.sensor.x, positions.sensor.y, positions.sensor.z),
    new THREE.Vector3(positions.arduino.x, positions.arduino.y, positions.arduino.z)
]);
const line1 = new THREE.Line(lineGeometry1, lineMaterial);
scene.add(line1);

const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(positions.arduino.x, positions.arduino.y, positions.arduino.z),
    new THREE.Vector3(positions.server.x, positions.server.y, positions.server.z)
]);
const line2 = new THREE.Line(lineGeometry2, lineMaterial);
scene.add(line2);

// Create a "data ball"
const dataMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const dataGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const dataBall = new THREE.Mesh(dataGeometry, dataMaterial);

// Set initial position of the data ball to the sensor's position
dataBall.position.set(positions.sensor.x, positions.sensor.y, positions.sensor.z);

// Add data ball to scene
scene.add(dataBall);

// Variables for animation
let t = 0;
let dataReceived = false;  // A flag to control the animation

// Camera Position
camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);

const dataBox = document.createElement('div');
dataBox.style.position = 'absolute';
dataBox.style.top = '10px';
dataBox.style.right = '10px';
dataBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
dataBox.style.color = 'white';
dataBox.style.padding = '10px';
dataBox.style.borderRadius = '8px';
dataBox.style.fontSize = '14px';
dataBox.style.fontFamily = 'Arial, sans-serif';
dataBox.style.maxWidth = '250px';
dataBox.innerHTML = `
    <h3>Sensor Data</h3>
    <p>Temperature: <span id="temperature">--</span>°C</p>
    <p>Humidity: <span id="humidity">--</span>%</p>
    <p>Time Taken: <span id="timeTaken">--</span></p>
`;

// Append to body
document.body.appendChild(dataBox);

// Initialize Socket.io Client
const socket = io('https://weathernest.mooo.com', {
    path: '/socket',
});

// Listen for incoming data from the backend
socket.on('weather', (data) => {
    // Update the temperature, humidity, and time taken in the box
    document.getElementById('temperature').textContent = data.temperature.toFixed(2);  // Assuming data contains temperature
    document.getElementById('humidity').textContent = data.humidity.toFixed(2);  // Assuming data contains humidity

    const timestamp = new Date(data.timestamp * 1000);  // Create a Date object from the timestamp
    const timeTaken = timestamp.toLocaleString();  // Convert the Date object to a human-readable string
    document.getElementById('timeTaken').textContent = timeTaken;

    // Set the position of the data ball to the sensor's position
    dataBall.position.set(positions.sensor.x, positions.sensor.y, positions.sensor.z);

    // Set the flag to true to start the animation
    dataReceived = true;
});

// Animate the "data ball"
function animateDataBall() {
    if (dataReceived) {
        t += 0.005;  // Increment the animation

        if (t <= 1) {
            // Move the ball from sensor to server based on received data
            dataBall.position.lerpVectors(
                new THREE.Vector3(positions.sensor.x, positions.sensor.y, positions.sensor.z),
                new THREE.Vector3(positions.server.x, positions.server.y, positions.server.z),
                t
            );
        } else {
            // Reset animation and stop the ball
            dataReceived = false;
            t = 0; // Reset the animation
            dataBall.position.set(positions.sensor.x, positions.sensor.y, positions.sensor.z);
        }
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    animateDataBall();  // Only animate the ball if data is received
    renderer.render(scene, camera);
}

animate();

// Create a credits section dynamically
const creditsDiv = document.createElement('div');
creditsDiv.style.position = 'absolute';
creditsDiv.style.bottom = '10px';
creditsDiv.style.left = '10px';
creditsDiv.style.color = 'white';
creditsDiv.style.fontSize = '14px';
creditsDiv.style.fontFamily = 'Arial, sans-serif';
creditsDiv.innerHTML = `
    <p><strong>Credits:</strong></p>
    <ul>
        <li>DHT22 Sensor Model: <a href="https://skfb.ly/oApBP" target="_blank" style="color: white;">Link to Source</a></li>
        <li>Processor Model: <a href="https://free3d.com/3d-model/arduino-nano-low-poly-705977.html" target="_blank" style="color: white;">Link to Source</a></li>
        <li>Server Rack Model: <a href="https://skfb.ly/6SARA" target="_blank" style="color: white;">Link to Source</a></li>
    </ul>
`;

// Add the credits div to the body
document.body.appendChild(creditsDiv);