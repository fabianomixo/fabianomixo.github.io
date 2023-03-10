//import {mockWithVideo, mockWithImage} from './libs/camera-mock.js';
import * as THREE from '../../libs/three.js-r132/build/three.module.js';
import {loadGLTF} from "./libs/loader.js";
//import {GLTFLoader} from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';
import { Clock, MathUtils, Vector3 } from './libs/three.js-r132/build/three.module.js';
import {ARButton} from '../../libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { RGBELoader } from './libs/three.js-r132/examples/jsm/loaders/RGBELoader.js';
import { GUI } from '../../libs/three.js-r132/examples/jsm/libs/dat.gui.module.js';

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

const trans = [/*0.175*/1,new THREE.Euler(0,0,0),new Vector3(0,0,0)];
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
let cameraDir = new Vector3();
let started = true;
let text = document.getElementById("info");
let guide = document.getElementById("guide");
let imgguide = document.getElementById("alinhamento");
let debug = false;
const instrucoes = "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nPara ver a obra, encaixe o\nespelho d'??gua e toque na tela";
let panel;
document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        //mockWithImage();
        //mockWithVideo("./static/mov/PVlow.mp4");
        VisibilidadeGuide(false);
        const scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        camera.far = 20000;
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
        
        guide.textContent = "Clique no bot??o ENTRAR\npara iniciar a experi??ncia \n\nSe necess??rio, baixe o app\nindicado no bot??o (WebXR Viewer)\ne siga os passos:\n1) inicie o aplicativo WebXR Viewer\n2) clique na barra de endere??o superior\n3) clique no ??cone de QR Code\n4) aponte para o QR Code no ch??o";

        let doonce = false;

        renderer.setAnimationLoop(() => {

            if (renderer.xr.isPresenting){
                if (!doonce){
                    guide.textContent = instrucoes;
                    VisibilidadeGuide(true);
                    doonce = true;
                }
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
                    reset = false;
                }

                // if (started) {
                //     guide.textContent = '';
                // }
                // else {
                    
                // }
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
            if (reset) return;
            started = true;

            if (firstTime){
                scene.add(arvore);
                camera.getWorldDirection(cameraDir);
                ColocarArvore(settings.Distancia);
                arvore.position.y = settings.Altura;
                if (!timeline_running)Timeline();
                firstTime = false;
            }

            leafs = [];
            
        });

    }
    start();
});
let firstTime = true;
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

    createPanel();
    panel.hide();
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
    
    await Timeline();
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
    text.textContent = "Iniciando   ";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando.  ";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando.. ";
    await new Promise(resolve => setTimeout(resolve, 300));
    text.textContent = "Iniciando...";
    await new Promise(resolve => setTimeout(resolve, 800));
    text.textContent = "";
    await new Promise(resolve => setTimeout(resolve, 1000));
    text.textContent = "Galeria Invis??vel do Amanh?? \r\n\r\nMuseu do Amanh??";
    await new Promise(resolve => setTimeout(resolve, 3000));
    text.textContent = "apresenta";
    await new Promise(resolve => setTimeout(resolve, 2000));
    text.textContent = "MEM??RIA DE IBIR??\r\n\r\nde Fabiano Mixo";
    await new Promise(resolve => setTimeout(resolve, 2500));
    text.textContent = "MEM??RIA DE IBIR??\r\n\r\nde Fabiano Mixo";
    await new Promise(resolve => setTimeout(resolve, 2500));
}
let settings;
let reset;

function createPanel() {

    panel = new GUI( { width: window.innerWidth - 100 } );

    const folder1 = panel.addFolder( 'Ajustes Arvore' );
    const folder2 = panel.addFolder( 'Modo' );

    settings = {
        'Resetar Pos': ResetarCameraDir,
        'Tamanho': 1.0,
        'Distancia': 19.9, //15.75,
        'Altura': -1.5,
        'Modo Debug': false
    };
    folder1.add(settings, 'Resetar Pos');
    folder1.add( settings, 'Tamanho', 0.05, 5, 0.005 ).listen().onChange(function ( tamanho ) {
        if (debug) return;
        arvore.scale.copy(new Vector3(tamanho,tamanho,tamanho));
     });
    folder1.add( settings, 'Distancia', 2, 40, 0.01 ).listen().onChange(function ( distancia ) {
        if (debug) return;
        ColocarArvore(distancia);
     });
    folder1.add( settings, 'Altura', -2.0, 2.0, 0.001 ).listen().onChange(function ( altura ) {
        if (debug) return;
        arvore.position.y = altura;
    });
    folder2.add( settings, 'Modo Debug').onChange( function (_debug){
        debug = _debug;
        console.log(settings);
        if (_debug){
            arvore.scale.copy(new Vector3(0.1,0.1,0.1));
            ColocarArvore(1.5);
        }
        else {
            arvore.scale.copy(new Vector3(settings.Tamanho,settings.Tamanho,settings.Tamanho));
            ColocarArvore(settings.Distancia);
            arvore.position.y = settings.Altura;
        }
    } );
}

function ColocarArvore(distancia){
    let pos = new Vector3();
    pos.copy(camera.position);
    pos.y = 0;
    pos.addScaledVector(cameraDir,distancia);
    arvore.position.copy(pos);
    arvore.visible = true;
    guide.textContent = '';
    VisibilidadeGuide(false);
}

function ResetarCameraDir(){
    arvore.visible = false;
    firstTime = true;
    VisibilidadeGuide(true);
    guide.textContent = instrucoes;
    reset = true;
    return;
    camera.getWorldDirection(cameraDir);
    ColocarArvore(settings.Distancia);
    arvore.position.y = settings.Altura;
}

function VisibilidadeGuide(visivel){
    if (visivel){
        imgguide.style.display = 'block';
    }
    else {
        imgguide.style.display = 'none';
    }
}

