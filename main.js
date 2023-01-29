//import {mockWithVideo, mockWithImage} from './libs/camera-mock.js';
import * as THREE from '../../libs/three.js-r132/build/three.module.js';
import {loadGLTF} from "./libs/loader.js";
//import {GLTFLoader} from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';
import { Clock, MathUtils, Vector3 } from './libs/three.js-r132/build/three.module.js';
import {ARButton} from '../../libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { RGBELoader } from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';


class Leaf {
    constructor(mesh,movementRange){
        this.mesh = mesh;
        this.initialPos = new Vector3();
        this.initialPos.copy(this.mesh.position);
        //console.log(this.initialPos);
        this.movementRange = movementRange; 
    }

    update(delta, wind){

        let newpos = new Vector3();
        newpos.copy(this.initialPos);
        //console.log(newpos);
        newpos.addScaledVector(wind,0.01*this.movementRange);
        let dist = this.mesh.position.distanceTo(this.initialPos);
        //console.log(dist);
        if (dist< 0.05) {
            this.mesh.position.lerp(newpos,0.001);
            //console.log(dist);
        }
        
        
        //console.log(this.mesh.position);
    }
}
class Wind {
    constructor(maxWindForce){
        this.direction = RandomDirection();
        this.maxWindForce = maxWindForce;
        console.log(this.direction);
        console.log(this.maxWindForce);
    }
    update(){
        //console.log(this.direction);
        //wind.changeDirection(RandomDirection(this.direction));
        this.windforce = this.direction.addScalar(MathUtils.randFloat(0,this.maxWindForce));
        //console.log(this.windforce);
    }
    changeDirection(direction){
        //console.log(direction);
        this.direction = direction;
    }
}

const trans = [0.175,new THREE.Euler(0,0,0),new Vector3(0,0,0)];
let timer = 0;
let time = new THREE.Clock(true);
let camera;
let directionalLight;

let wind = new Wind(0.01);
let leafs = [];
let arvore;
let mesh_arvorebase;
let mesh_cravos = [];
let mesh_paubrasils = [];
let mesh_ivys;
let mesh_troncos = [];
let mesh_groups = [];
let timeline_running = false;
let lightRotator = new THREE.Object3D();
let started = true;
let text = document.getElementById("info");
let guide = document.getElementById("guide");

document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        //mockWithImage();
        //mockWithVideo("./static/mov/PVlow.mp4");




        const scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        AddLight(scene);
        
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        text.setAttribute('style', 'white-space: pre;');
        
        guide.setAttribute('style', 'white-space: pre;');


        
        for (let i =0; i<100; i++){
            text.textContent = "Baixando Objetos 3D: " + (i+1) + "%";
            await new Promise(resolve => setTimeout(resolve, 15));
            if (i==93) i = 100;
        }
        await LoadModel('./static/TreeV07/tree.gltf',trans);

        await TextAnimation();

        text.remove();
        time.start();
        
        renderer.setAnimationLoop(() => {

            if (renderer.xr.isPresenting){
                wind.update();
                leafs.forEach(leaf => leaf.update(time.getDelta(),wind.windforce));
    
                lightRotator.position.copy(arvore.position);
                lightRotator.rotation.y = time.getElapsedTime()*0.4;
                directionalLight.target = arvore;
                //arvore.rotation.y = -time.getElapsedTime()*0.1;
                
                if (time.elapsedTime - timer > 2) {
                    AddGlitch();
                    wind.changeDirection(RandomDirection());
                    timer = time.elapsedTime;
                }

                if (started) {
                    guide.textContent = '';
                }
                else {
                    guide.textContent = 'Para iniciar a experiência,\r\n alinhe o chafariz entre as barras\r\ne toque na tela\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n__________________________________________________\r\n\r\n__________________________________________________';
                }
            }
            else {
                started = false;
            }

            renderer.render(scene, camera);
        });

        const arButton = ARButton.createButton(renderer, {optionalFeatures: ['dom-overlay'], domOverlay: {root: document.body}});

        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);
        

        const controller = renderer.xr.getController(0);
        scene.add(controller);
        controller.addEventListener('select', () => {
            started = true;
            scene.add(arvore);
            let pos = new Vector3();
            let dir = new Vector3();
            camera.getWorldDirection(dir);
            pos.copy(camera.position);
            pos.addScaledVector(dir,2);
            pos.add(new Vector3(0,-0.5,0))
            console.log(pos);
            arvore.position.copy(pos);
            //arvore.position.set( 0, 0, 0 ).applyMatrix4(controller.matrixWorld); 
            leafs = [];
            if (!timeline_running)Timeline();
        });

    }
    start();
});

async function LoadModel(model,transform){

    // Loading GLTF
    const gltf = await loadGLTF(model);
    arvore = gltf.scenes[0];
    arvore.scale.copy(new Vector3(transform[0],transform[0],transform[0]));
    arvore.rotation.copy(transform[1]);
    arvore.position.copy(transform[2]);
    console.log(arvore);

    mesh_arvorebase = arvore.children[0];
    mesh_troncos = mesh_arvorebase.children[0]; 
    mesh_cravos = mesh_arvorebase.children[1]; 
    mesh_paubrasils = mesh_arvorebase.children[2]; 
    mesh_ivys = mesh_arvorebase.children[3]; 
    mesh_groups = [mesh_troncos,mesh_cravos,mesh_paubrasils, mesh_ivys];

    console.log(mesh_arvorebase);
    console.log(mesh_troncos);
    console.log(mesh_cravos);
    console.log(mesh_paubrasils);
    console.log(mesh_ivys);

    mesh_arvorebase.visible = false;
    mesh_groups.forEach(group => (group.children.forEach(child=>(child.visible = false))));
    // mesh_groups.forEach(group => (group.children.forEach(child=>(MakeMaterial(child)))));
    mesh_troncos.children.forEach(child=>(MakeMaterialMetal(child)));
    mesh_cravos.children.forEach(child=>(MakeMaterialNormal(child)));
    mesh_paubrasils.children.forEach(child=>(MakeMaterialNormal(child)));
    mesh_ivys.children.forEach(child=>(MakeMaterialNormal(child)));
    MakeMaterialMetal(mesh_arvorebase);
}

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
    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.castShadow = false;
    directionalLight.position.set(3,3,2);
    directionalLight.intensity = 1.1;
    lightRotator.add(directionalLight);

    // directionalLight.position.copy(camera.position);
    // let direction = new Vector3();
    // camera.getWorldDirection(direction);

    scene.add( lightRotator );
}

function AddGlitch(){
    mesh_ivys.children.forEach(mesh => oldGlitchEffect(mesh));
    mesh_cravos.children.forEach(mesh => oldGlitchEffect(mesh));
    mesh_paubrasils.children.forEach(mesh => oldGlitchEffect(mesh));
}

function SetGlitchEffect(a_children,active) {
    //let c = new THREE.Color( 'white' );//new THREE.Color( Math.random() * 0xffffff );//
    a_children.material.wireframe = active;
    //a_children.material.color = c;
}

function MakeMaterialMetal(a_children) {
    if (a_children.material==null)a_children.material = new THREE.MeshBasicMaterial;
    else
        a_children.material = a_children.material.clone();
    a_children.material.metalness = 0.5;
    a_children.material.roughness = 0.75;
    a_children.material.premultipliedAlpha = true;
    a_children.material.side = THREE.DoubleSide;
}

function MakeMaterialNormal(a_children) {
    if (a_children.material==null)a_children.material = new THREE.MeshBasicMaterial;
    else
        a_children.material = a_children.material.clone();
    a_children.material.metalness = 0;
    a_children.material.roughness = 0.1;
    a_children.material.premultipliedAlpha = true;
    a_children.material.side = THREE.DoubleSide;
}

function RandomDirection(){
    let v3 = new Vector3(0,0,0);
    const u = ( Math.random() - 0.5 ) * 2;
    const t = Math.random() * Math.PI * 2;
    const f = Math.sqrt( 1 - u ** 2 );

    v3.x = f * Math.cos( t );
    v3.y = f * Math.sin( t );
    v3.z = u;

    return v3;
}

async function ArrayAnimation(array,millis,isLeaf,isIn, cut = 0){
    let length = array.length;
    console.log(length);
    if (cut>0) length = length*cut;
    console.log(length);
    for (let i=0;i<length;i++){
        await MeshAnimation(array[i], millis, isLeaf, isIn);
    }
}

async function MeshAnimation(mesh,millis,isLeaf,isIn){
    mesh.visible = true;
    let random = MathUtils.randInt(1,6);
    let active = true;
    for (let i=0; i<random;i++){
        SetGlitchEffect(mesh,active);
        await new Promise(resolve => setTimeout(resolve, millis));
        active = !active;
    }

    if (!isLeaf) {
        SetGlitchEffect(mesh,false);
    }
    
    if (!isIn){
        mesh.visible = false;
        return;
    }

    if (!isLeaf) return;
    let ran = MathUtils.randFloat(1,100);
    leafs.push(new Leaf(mesh, ran));
}

async function Timeline(){
    timeline_running = true;
    mesh_arvorebase.visible = false;
    mesh_groups.forEach(group => (group.children.forEach(child=>(child.visible = false))));
    
    await ArrayAnimation([mesh_arvorebase], 50, false , true);
    await ArrayAnimation(mesh_troncos.children, 10, false, true);
    await ArrayAnimation(mesh_ivys.children, 10, true, true);
    await ArrayAnimation(mesh_cravos.children, 3.5, true, true);
    await new Promise(resolve => setTimeout(resolve, 5000));

    await ArrayAnimation(mesh_cravos.children, 1, true, false);
    await ArrayAnimation(mesh_ivys.children, 1, false, false);
    await ArrayAnimation(mesh_troncos.children, 1, false, false, 0.8);
    //await ArrayAnimation([mesh_arvorebase], 1, false , false);

    await new Promise(resolve => setTimeout(resolve, 100));

    //await ArrayAnimation([mesh_arvorebase], 100, false , true);
    await ArrayAnimation(mesh_troncos.children, 6, false, true);
    //await ArrayAnimation(mesh_ivys.children, 20, true, true);
    await ArrayAnimation(mesh_paubrasils.children, 5, true, true);
    await new Promise(resolve => setTimeout(resolve, 5000));

    await ArrayAnimation(mesh_paubrasils.children, 1, true, false);
    //await ArrayAnimation(mesh_ivys.children, 20, false, false);
    await ArrayAnimation(mesh_troncos.children, 2, false, false);
    await ArrayAnimation([mesh_arvorebase], 70, false , false);

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    Timeline();
}


function oldGlitchEffect(a_children) {
    if (!a_children.visible) return;

    if (Math.random(0, 1) > 0.25) {
        a_children.material.wireframe = true;
        //c = new THREE.Color( 'black' );
    }
    else {
        a_children.material.wireframe = false;
    }
}

async function TextAnimation(){
    for (let i =93; i<100; i++){
        text.textContent = "Aplicando materiais: " + (i+1) + "%";
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    text.textContent = "Iniciando";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando.";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando..";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando...";
    await new Promise(resolve => setTimeout(resolve, 800));
    text.textContent = "";
    await new Promise(resolve => setTimeout(resolve, 1000));
    text.textContent = "O Museu do Amanhã \r\n\r\napresenta";
    await new Promise(resolve => setTimeout(resolve, 4000));
    text.textContent = "MEMÓRIA DE IBIRÁ\r\n\r\nde Fabiano Mixo";
    await new Promise(resolve => setTimeout(resolve, 4000));
    text.textContent = "MEMÓRIA DE IBIRÁ\r\n\r\nde Fabiano Mixo";
    await new Promise(resolve => setTimeout(resolve, 4000));
}




