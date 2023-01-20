//import {mockWithVideo, mockWithImage} from './libs/camera-mock.js';
import * as THREE from '../../libs/three.js-r132/build/three.module.js';
import {loadGLTF} from "./libs/loader.js";
//import {GLTFLoader} from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';
import { Vector3 } from './libs/three.js-r132/build/three.module.js';
import {ARButton} from '../../libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { RGBELoader } from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';
//
const trans = [0.01,new THREE.Euler(0,0,0),new Vector3(0,0,0)];
let arvore;
let loaded = 0;
let font;
let materials;
let textMesh1;

async function LoadModel(model,transform){

    // Loading GLTF
    const gltf = await loadGLTF(model);
    arvore = gltf.scenes[0];
    arvore.scale.copy(new Vector3(transform[0],transform[0],transform[0]));
    arvore.rotation.copy(transform[1]);
    arvore.position.copy(transform[2]);
    console.log(arvore);
}
let text = document.getElementById("info");


document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        //mockWithImage();
        //mockWithVideo("./static/mov/PVlow.mp4");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        AddLight(scene);
        
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        for (let i =0; i<100; i++){
            text.textContent = "Baixando Objetos 3D: " + (i+1) + "%";
            await new Promise(resolve => setTimeout(resolve, 15));
            if (i==43) i = 100;
        }
        await LoadModel('./static/TreeV03/TreeV03_Single.gltf',trans);
        // scene.add(arvore);

        for (let i = 43; i<100; i++){
            text.textContent = "Baixando Objetos 3D: " + (i+1) + "%";
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        // await new Promise(resolve => setTimeout(resolve, 500));
        // text.textContent = "Fabiano AR";
        // await new Promise(resolve => setTimeout(resolve, 2500));
        // text.textContent = "Iniciando Realidade Aumentada";
        // await new Promise(resolve => setTimeout(resolve, 1000));
        // text.textContent = "Iniciando Realidade Aumentada.";
        // await new Promise(resolve => setTimeout(resolve, 500));
        // text.textContent = "Iniciando Realidade Aumentada..";
        // await new Promise(resolve => setTimeout(resolve, 500));
        // text.textContent = "Iniciando Realidade Aumentada...";
        // await new Promise(resolve => setTimeout(resolve, 500));
        text.remove();

        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        const arButton = ARButton.createButton(renderer, {optionalFeatures: ['dom-overlay'], domOverlay: {root: document.body}});
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        const controller = renderer.xr.getController(0);
        scene.add(controller);
        controller.addEventListener('select', () => {
            scene.add(arvore);
            arvore.position.set( 0, 0, 0 ).applyMatrix4(controller.matrixWorld); 
            //arvore.quaternion.setFromRotationMatrix(controller.matrixWorld);
        });

    }
    start();
});

function AddLight(scene){
    new RGBELoader()
    .setPath('./static/hdri/')
    .load('01.hdr', function ( texture ) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        let skyboxMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
        });
        //scene.background = texture;
        scene.environment = texture;
    }); 
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    scene.add( directionalLight );
}

function GlitchEffect(a_children) {
    let c = new THREE.Color( 'white' );//new THREE.Color( Math.random() * 0xffffff );//
    if (Math.random(0, 1) > 0.25) {
        a_children.material.wireframe = true;
        //c = new THREE.Color( 'black' );
    }
    else {
        a_children.material.wireframe = false;
    }
    a_children.material.color = c;
}

function addGlitch() {
    if (!loadedfbx) return;
    if (meshBaseLine != null) {
        for (let i = 0; i< meshBaseLine.children.length; i++) {
            for (let j = 0; j< meshBaseLine.children[i].children.length; j++) {
                if (meshBaseLine.children[i].children[j].children.length > 1){
                    for (let k = 0; k< meshBaseLine.children[i].children[j].children.length; k++) {
                        //let thisChildren = meshBaseLine.children[i].children[j].children[k];
                        //GlitchEffect(thisChildren);
                    }
                }
                let thisChildren = meshBaseLine.children[i].children[j];
                GlitchEffect(thisChildren);
            }
            //let thisChildren = meshBaseLine.children[i];
            //GlitchEffect(thisChildren);
        }
    }
}
function MakeMaterial(a_children) {
    //scaleFragment.push(a_children.scale);
    //directionX.push(-1), directionY.push(-1), directionZ.push(-1);
    if (a_children.material==null)a_children.material = new THREE.MeshBasicMaterial;
    else
        a_children.material = a_children.material.clone();
    a_children.material.metalness = 0;
    a_children.material.roughness = 0.1;
    a_children.material.premultipliedAlpha = true;
    //a_children.material.blending = THREE.AdditiveBlending;
    //a_children.material.transparent = true;
    //a_children.material.alphaTest = 0.5;
    //a_children.material.wireframe = true;
    //a_children.material.wireframeLinecap ="square";
    //a_children.material.wireframeLinewidth = 10;
    //a_children.material.color.setHex(0x101010);
    a_children.material.side = THREE.DoubleSide;
}