import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { createWorld } from './world.js';
import { NetworkClient } from './network.js';
import { upgradeAvatar, updateAvatar } from './avatar.js';

const $ = (s) => document.querySelector(s);
const loading=$('#loading'), menu=$('#menu'), game=$('#game');
let selectedServer='ME1';
const remotePlayers=new Map();
const networkStatus=$('#network-status');
const realtime=new NetworkClient(handleNetworkEvent);
function createAvatar(bodyColor=0x087b9e,pantsColor=0x202a38){
  const root=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xb98262,roughness:.82});
  const shirt=new THREE.MeshStandardMaterial({color:bodyColor,roughness:.78});
  const pants=new THREE.MeshStandardMaterial({color:pantsColor,roughness:.9});
  const shoe=new THREE.MeshStandardMaterial({color:0x171b20,roughness:.92});
  const trim=new THREE.MeshStandardMaterial({color:0x172c3b,roughness:.7});
  const add=(parent,geo,material,pos)=>{const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const torso=new THREE.Group();torso.position.y=1.32;root.add(torso);
  add(torso,new THREE.CapsuleGeometry(.37,.63,7,14),shirt,[0,0,0]);
  add(torso,new THREE.BoxGeometry(.7,.16,.42),trim,[0,.18,0]);
  add(torso,new THREE.CylinderGeometry(.115,.13,.18,12),skin,[0,.47,0]);
  const headGroup=new THREE.Group();headGroup.position.set(0,1.98,0);root.add(headGroup);
  add(headGroup,new THREE.SphereGeometry(.255,22,18),skin,[0,0,0]);
  add(headGroup,new THREE.SphereGeometry(.26,20,12,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x29231f,roughness:1}),[0,.075,-.015]);
  add(headGroup,new THREE.BoxGeometry(.34,.07,.16),new THREE.MeshStandardMaterial({color:0x29231f}),[0,-.04,.19]);
  const limbGeo=new THREE.CapsuleGeometry(.105,.46,5,10),upperLeg=new THREE.CapsuleGeometry(.14,.42,5,10);
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.46,1.58,0);root.add(arm);
    add(arm,limbGeo,shirt,[0,-.28,0]);add(arm,new THREE.SphereGeometry(.115,12,10),skin,[0,-.57,.015]);
    add(arm,new THREE.BoxGeometry(.19,.12,.25),trim,[0,-.1,0]);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.19,.88,0);root.add(leg);
    add(leg,upperLeg,pants,[0,-.25,0]);add(leg,limbGeo,pants,[0,-.59,0]);
    add(leg,new THREE.BoxGeometry(.24,.14,.39),shoe,[0,-.91,.09]);legs.push(leg);
  }
  add(root,new THREE.BoxGeometry(.13,.08,.06),trim,[.28,1.47,.32]);
  root.userData={torso,arms,legs,headGroup};
  return root;
}
function makeRemotePlayer(id,name){
  const group=createAvatar(0x9b3940,0x252b35);scene.add(group);upgradeAvatar(group);
  remotePlayers.set(id,{group,name});return group;
}
function handleNetworkEvent(event){
  if(event.type==='connected'){networkStatus.textContent='متصل';networkStatus.dataset.state='online';}
  else if(event.type==='offline'||event.type==='network_error'||event.type==='disconnected'){networkStatus.textContent='غير متصل';networkStatus.dataset.state='offline';}
  if(event.type==='snapshot'){for(const p of event.players||[])updateRemote(p);}
  if(event.type==='player_joined'||event.type==='player_moved')updateRemote(event.player);
  if(event.type==='player_left'){const p=remotePlayers.get(event.id);if(p){scene.remove(p.group);remotePlayers.delete(event.id);}}
  if(event.type==='error'&&networkStatus)networkStatus.textContent=event.message||'تعذر الاتصال';
}
function updateRemote(p){if(!p||!p.id)return;let item=remotePlayers.get(p.id);if(!item)makeRemotePlayer(p.id,p.name);item=remotePlayers.get(p.id);item.group.position.set(p.x,0,p.z);item.group.rotation.y=p.yaw;}

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
const player=createAvatar(0x087b9e,0x202c3c);scene.add(player);upgradeAvatar(player);
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

$('#play').addEventListener('click',()=>{$('#server-label').textContent=selectedServer;menu.classList.add('hidden');game.classList.remove('hidden');const endpoint=window.ONESTATE_REALTIME_URL||'';realtime.connect(endpoint,selectedServer,'لاعب');});
$('#exit').addEventListener('click',()=>{realtime.close();for(const p of remotePlayers.values())scene.remove(p.group);remotePlayers.clear();game.classList.add('hidden');menu.classList.remove('hidden');running=false;resetStick();});
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
  const swing=moving?Math.sin(walkTime)*.58:0;
  updateAvatar(player, moving?(running?'run':'walk'):'idle', dt);
  for(const remote of remotePlayers.values())updateAvatar(remote.group,'idle',dt);
  player.userData.arms[0].rotation.x=swing;player.userData.arms[1].rotation.x=-swing;
  player.userData.legs[0].rotation.x=-swing;player.userData.legs[1].rotation.x=swing;
  player.userData.torso.position.y=1.32+(moving?Math.abs(Math.sin(walkTime*2))*.045:0);
  player.userData.torso.rotation.z=moving?Math.sin(walkTime)*.035:0;
  player.userData.headGroup.rotation.y=THREE.MathUtils.lerp(player.userData.headGroup.rotation.y,0,dt*3);
  const desired=player.position.clone().add(new THREE.Vector3(Math.sin(yaw)*8,3.4+pitch*3,Math.cos(yaw)*8));
  camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(player.position.x,1.25,player.position.z);
  updateDistrict();realtime.move(player.position.x,player.position.z,player.rotation.y);mapTimer+=dt;if(mapTimer>.14){drawMiniMap();mapTimer=0;}
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);});
loading.classList.add('hidden');
