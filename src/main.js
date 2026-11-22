import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { createWorld } from './world.js';

const $ = (s) => document.querySelector(s);
const loading=$('#loading'), menu=$('#menu'), game=$('#game');
let selectedServer='ME1';
document.querySelectorAll('.server').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.server').forEach(x=>x.classList.remove('active'));
  button.classList.add('active'); selectedServer=button.dataset.server;
}));

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb8c9);
scene.fog=new THREE.Fog(0x9eb8c9,170,520);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,900);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
game.prepend(renderer.domElement);
renderer.domElement.style.touchAction='none';

scene.add(new THREE.HemisphereLight(0xeaf4ff,0x59614e,2.15));
const sun=new THREE.DirectionalLight(0xffe6bd,2.35);
sun.position.set(-90,140,75); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
sun.shadow.bias=-.00012;sun.shadow.normalBias=.025;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xb9d5ff,.45);fill.position.set(90,45,-100);scene.add(fill);

const districts=createWorld(THREE,scene);
const player=new THREE.Group(); scene.add(player);
const skin=new THREE.MeshStandardMaterial({color:0xb9825d,roughness:.78});
const shirt=new THREE.MeshStandardMaterial({color:0x172c49,roughness:.72});
const pants=new THREE.MeshStandardMaterial({color:0x202833,roughness:.85});
const shoes=new THREE.MeshStandardMaterial({color:0x11151b,roughness:.9});
function part(parent,geo,mat,pos){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const torso=part(player,new THREE.CapsuleGeometry(.39,.58,5,12),shirt,[0,1.25,0]);
const neck=part(player,new THREE.CylinderGeometry(.12,.14,.18,10),skin,[0,1.72,0]);
const head=part(player,new THREE.SphereGeometry(.27,20,16),skin,[0,1.99,0]);
const hair=part(player,new THREE.SphereGeometry(.275,18,12,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x29221e,roughness:1}),[0,2.06,0]);
const limbGeo=new THREE.CapsuleGeometry(.105,.48,4,9);
const armL=new THREE.Group(),armR=new THREE.Group(),legL=new THREE.Group(),legR=new THREE.Group();
for(const [g,x,y,mat] of [[armL,-.48,1.48,shirt],[armR,.48,1.48,shirt],[legL,-.19,.78,pants],[legR,.19,.78,pants]]){
  g.position.set(x,y,0);player.add(g);
  part(g,limbGeo,mat,[0,-.29,0]);
}
part(armL,new THREE.SphereGeometry(.115,10,8),skin,[0,-.58,0]);
part(armR,new THREE.SphereGeometry(.115,10,8),skin,[0,-.58,0]);
part(legL,new THREE.BoxGeometry(.22,.13,.38),shoes,[0,-.61,-.07]);
part(legR,new THREE.BoxGeometry(.22,.13,.38),shoes,[0,-.61,-.07]);
player.position.set(0,0,36);

let yaw=0,pitch=.2,moveX=0,moveY=0,running=false,dragPointer=null,lastX=0,lastY=0;
const joystick=$('#joystick'),stick=$('#stick'),runButton=$('#run');
function setStick(e){
  const r=joystick.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  const max=r.width*.29,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}
  stick.style.transform=`translate(${dx}px,${dy}px)`;moveX=dx/max;moveY=dy/max;
}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();joystick.setPointerCapture(e.pointerId);setStick(e);});
joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))setStick(e);});
function resetStick(e){if(e){e.preventDefault();e.stopPropagation();}stick.style.transform='';moveX=0;moveY=0;}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>joystick.addEventListener(ev,resetStick));
runButton.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();running=true;runButton.setPointerCapture(e.pointerId);});
function stopRun(e){if(e){e.preventDefault();e.stopPropagation();}running=false;}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>runButton.addEventListener(ev,stopRun));
renderer.domElement.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target!==renderer.domElement)return;
  dragPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;
  try{renderer.domElement.setPointerCapture(e.pointerId);}catch{}
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(dragPointer!==e.pointerId)return;
  yaw-=(e.clientX-lastX)*.0052;
  pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.0028,-.12,.62);
  lastX=e.clientX;lastY=e.clientY;
});
function endDrag(e){if(dragPointer===e.pointerId)dragPointer=null;}
renderer.domElement.addEventListener('pointerup',endDrag);
renderer.domElement.addEventListener('pointercancel',endDrag);

$('#play').addEventListener('click',()=>{$('#server-label').textContent=selectedServer;menu.classList.add('hidden');game.classList.remove('hidden');});
$('#exit').addEventListener('click',()=>{game.classList.add('hidden');menu.classList.remove('hidden');running=false;resetStick();});
const districtLabel=$('#district-label'),mapCanvas=$('#mini-map'),mapCtx=mapCanvas.getContext('2d');
function drawMiniMap(){
  const ctx=mapCtx,w=mapCanvas.width,h=mapCanvas.height,s=1.05;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#65775b';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2-player.position.x*s,h/2-player.position.z*s);
  ctx.strokeStyle='#292f33';ctx.lineWidth=12;
  for(let p=-280;p<=280;p+=70){ctx.beginPath();ctx.moveTo(-340,p);ctx.lineTo(340,p);ctx.stroke();ctx.beginPath();ctx.moveTo(p,-340);ctx.lineTo(p,340);ctx.stroke();}
  ctx.strokeStyle='#c0bba9';ctx.lineWidth=1.7;
  for(let p=-280;p<=280;p+=70){ctx.beginPath();ctx.moveTo(-340,p-8);ctx.lineTo(340,p-8);ctx.stroke();ctx.beginPath();ctx.moveTo(p-8,-340);ctx.lineTo(p-8,340);ctx.stroke();}
  ctx.fillStyle='#9da9a5';for(const d of districts){for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){const bx=d.cx+x*19,bz=d.cz+z*19;if(Math.abs(bx)<19&&Math.abs(bz)<19)continue;ctx.fillRect(bx-5,bz-5,10,10);}}
  ctx.restore();ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-yaw);ctx.fillStyle='#ffe16b';ctx.strokeStyle='#1b2228';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(8,9);ctx.lineTo(0,5);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function updateDistrict(){let nearest=districts[0],best=Infinity;for(const d of districts){const dist=Math.hypot(player.position.x-d.cx,player.position.z-d.cz);if(dist<best){best=dist;nearest=d;}}districtLabel.textContent=best<115?nearest.name:'أطراف المدينة';}
const clock=new THREE.Clock();let mapTimer=0,walkTime=0;
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
  const moving=Math.abs(moveX)+Math.abs(moveY)>.08,speed=running?13.5:6.4;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const direction=forward.clone().multiplyScalar(-moveY).add(right.clone().multiplyScalar(moveX));
  if(direction.lengthSq()>1)direction.normalize();
  player.position.addScaledVector(direction,speed*dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-250,250);player.position.z=THREE.MathUtils.clamp(player.position.z,-250,250);
  if(moving){player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,Math.atan2(direction.x,direction.z),Math.min(1,dt*12));walkTime+=dt*(running?12:8);}
  const swing=moving?Math.sin(walkTime)*.62:0;
  armL.rotation.x=swing;armR.rotation.x=-swing;legL.rotation.x=-swing;legR.rotation.x=swing;
  torso.position.y=1.25+(moving?Math.abs(Math.sin(walkTime*2))*.035:0);
  const desired=player.position.clone().add(new THREE.Vector3(Math.sin(yaw)*8,3.4+pitch*3,Math.cos(yaw)*8));
  camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(player.position.x,1.25,player.position.z);
  updateDistrict();mapTimer+=dt;if(mapTimer>.14){drawMiniMap();mapTimer=0;}
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);});
loading.classList.add('hidden');
