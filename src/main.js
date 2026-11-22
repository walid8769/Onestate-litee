import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { createWorld } from './world.js';

const loading=document.querySelector('#loading');
const menu=document.querySelector('#menu');
const game=document.querySelector('#game');
let selectedServer='ME1';
document.querySelectorAll('.server').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.server').forEach(x=>x.classList.remove('active'));
  button.classList.add('active');
  selectedServer=button.dataset.server;
}));

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bb2c1);
scene.fog=new THREE.Fog(0x9bb2c1,100,310);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,650);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f2ff,0x59614e,2.0));
const sun=new THREE.DirectionalLight(0xffe3b0,2.0);
sun.position.set(-45,85,35);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.bias=-0.00015;
sun.shadow.normalBias=0.025;
sun.shadow.camera.left=-100;sun.shadow.camera.right=100;
sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;
scene.add(sun);

const districts=createWorld(THREE,scene);
const player=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.05,4,8),new THREE.MeshStandardMaterial({color:0x263d59,roughness:.75}));
body.position.y=1.05;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshStandardMaterial({color:0xc99570}));
head.position.y=2.05;head.castShadow=true;player.add(head);
scene.add(player);
player.position.set(0,0,36);

let yaw=0,pitch=.24,moveX=0,moveY=0,running=false,dragging=false,lastX=0,lastY=0;
const joystick=document.querySelector('#joystick');
const stick=document.querySelector('#stick');
function setStick(e){
  const r=joystick.getBoundingClientRect();
  let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  const max=36,len=Math.hypot(dx,dy);
  if(len>max){dx=dx/len*max;dy=dy/len*max}
  stick.style.transform=`translate(${dx}px,${dy}px)`;
  moveX=dx/max;moveY=dy/max;
}
joystick.addEventListener('pointerdown',e=>{joystick.setPointerCapture(e.pointerId);setStick(e)});
joystick.addEventListener('pointermove',e=>{if(e.buttons)setStick(e)});
function resetStick(){stick.style.transform='';moveX=0;moveY=0}
joystick.addEventListener('pointerup',resetStick);
joystick.addEventListener('pointercancel',resetStick);

const runButton=document.querySelector('#run');
runButton.addEventListener('pointerdown',e=>{
  e.preventDefault();
  e.stopPropagation();
  running=true;
  runButton.setPointerCapture(e.pointerId);
});
function stopRunning(e){
  if(e){e.preventDefault();e.stopPropagation();}
  running=false;
}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>runButton.addEventListener(ev,stopRunning));
renderer.domElement.addEventListener('pointerdown',e=>{
  if(e.target!==renderer.domElement)return;
  dragging=true;lastX=e.clientX;lastY=e.clientY;
});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointercancel',()=>dragging=false);
addEventListener('pointermove',e=>{
  if(!dragging||running)return;
  yaw-=(e.clientX-lastX)*.006;
  pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.003,-.12,.72);
  lastX=e.clientX;lastY=e.clientY;
});

document.querySelector('#play').addEventListener('click',()=>{
  document.querySelector('#server-label').textContent=selectedServer;
  menu.classList.add('hidden');
  game.classList.remove('hidden');
});
document.querySelector('#exit').addEventListener('click',()=>{
  game.classList.add('hidden');menu.classList.remove('hidden');
});

const districtLabel=document.querySelector('#district-label');
const mapCanvas=document.querySelector('#mini-map');
const mapCtx=mapCanvas.getContext('2d');
function drawMiniMap(){
  const ctx=mapCtx,w=mapCanvas.width,h=mapCanvas.height,scale=1.15;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#53634f';ctx.fillRect(0,0,w,h);
  ctx.save();
  ctx.translate(w/2-player.position.x*scale,h/2-player.position.z*scale);
  ctx.strokeStyle='#30383c';ctx.lineWidth=13;
  for(let p=-210;p<=210;p+=70){
    ctx.beginPath();ctx.moveTo(-300,p);ctx.lineTo(300,p);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p,-300);ctx.lineTo(p,300);ctx.stroke();
  }
  ctx.strokeStyle='#a6a49a';ctx.lineWidth=2;
  for(let p=-210;p<=210;p+=70){
    ctx.beginPath();ctx.moveTo(-300,p-8);ctx.lineTo(300,p-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p-8,-300);ctx.lineTo(p-8,300);ctx.stroke();
  }
  ctx.fillStyle='#8b999b';
  for(const d of districts){
    for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){
      const bx=d.cx+x*19,bz=d.cz+z*19;
      if(Math.abs(bx)<19&&Math.abs(bz)<19)continue;
      ctx.fillRect(bx-5,bz-5,10,10);
    }
  }
  ctx.restore();
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-yaw);
  ctx.fillStyle='#ffe16b';ctx.strokeStyle='#20252b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,5);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}
function updateDistrict(){
  let nearest=districts[0],best=Infinity;
  for(const d of districts){
    const dist=Math.hypot(player.position.x-d.cx,player.position.z-d.cz);
    if(dist<best){best=dist;nearest=d}
  }
  districtLabel.textContent=best<105?nearest.name:'أطراف المدينة';
}
const clock=new THREE.Clock();
let mapTimer=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  const speed=running?13:6.2;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  player.position.addScaledVector(forward,-moveY*speed*dt);
  player.position.addScaledVector(right,moveX*speed*dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-245,245);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-245,245);
  if(Math.abs(moveX)+Math.abs(moveY)>.08)player.rotation.y=yaw+Math.atan2(moveX,-moveY);
  const offset=new THREE.Vector3(Math.sin(yaw)*9,3.8+pitch*4,Math.cos(yaw)*9);
  camera.position.lerp(player.position.clone().add(offset),.12);
  camera.lookAt(player.position.x,1.4,player.position.z);
  updateDistrict();
  mapTimer+=dt;
  if(mapTimer>.12){drawMiniMap();mapTimer=0}
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
loading.classList.add('hidden');