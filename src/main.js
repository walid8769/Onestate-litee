import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const loading=document.querySelector('#loading');
const menu=document.querySelector('#menu');
const game=document.querySelector('#game');
let selectedServer='ME1';
document.querySelectorAll('.server').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.server').forEach(x=>x.classList.remove('active'));
  button.classList.add('active'); selectedServer=button.dataset.server;
}));
document.querySelector('#server-label').textContent=selectedServer;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bb2c1);
scene.fog=new THREE.Fog(0x9bb2c1,65,230);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
game.prepend(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xe8f2ff,0x59614e,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe3b0,2.2);sun.position.set(-45,80,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420),new THREE.MeshStandardMaterial({color:0x65735e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const roadMat=new THREE.MeshStandardMaterial({color:0x30363b,roughness:.95});
function road(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),roadMat);m.position.set(x,.06,z);m.receiveShadow=true;scene.add(m)}
road(0,.08,420,15);road(0,.08,15,420);road(0,.08,15,420);
const buildingMats=[0x89939a,0xb0a99a,0x6e7d87,0x9b8e7d,0x7a8980].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85}));
for(let x=-180;x<=180;x+=30){for(let z=-180;z<=180;z+=30){if(Math.abs(x)<22||Math.abs(z)<22)continue;
 const h=8+Math.random()*26,w=12+Math.random()*8,d=12+Math.random()*8;
 const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),buildingMats[Math.floor(Math.random()*buildingMats.length)]);
 b.position.set(x+(Math.random()-.5)*5,h/2,z+(Math.random()-.5)*5);b.castShadow=true;b.receiveShadow=true;scene.add(b);
}}
const player=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.05,4,8),new THREE.MeshStandardMaterial({color:0x263d59,roughness:.75}));body.position.y=1.05;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshStandardMaterial({color:0xc99570}));head.position.y=2.05;head.castShadow=true;player.add(head);scene.add(player);
player.position.set(0,0,0);
let yaw=0,pitch=.25,moveX=0,moveY=0,running=false,dragging=false,lastX=0,lastY=0;
const joystick=document.querySelector('#joystick'),stick=document.querySelector('#stick');
function setStick(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}stick.style.transform=`translate(${dx}px,${dy}px)`;moveX=dx/max;moveY=dy/max}
joystick.addEventListener('pointerdown',e=>{joystick.setPointerCapture(e.pointerId);setStick(e)});
joystick.addEventListener('pointermove',e=>{if(e.buttons)setStick(e)});
function resetStick(){stick.style.transform='';moveX=0;moveY=0}
joystick.addEventListener('pointerup',resetStick);joystick.addEventListener('pointercancel',resetStick);
document.querySelector('#run').addEventListener('pointerdown',()=>running=true);
['pointerup','pointercancel','pointerleave'].forEach(ev=>document.querySelector('#run').addEventListener(ev,()=>running=false));
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*.006;pitch=Math.max(-.1,Math.min(.8,pitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY});
document.querySelector('#play').addEventListener('click',()=>{document.querySelector('#server-label').textContent=selectedServer;menu.classList.add('hidden');game.classList.remove('hidden');camera.position.set(0,5,9)});
document.querySelector('#exit').addEventListener('click',()=>{game.classList.add('hidden');menu.classList.remove('hidden')});
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);const speed=running?12:6;
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 player.position.addScaledVector(forward,-moveY*speed*dt);player.position.addScaledVector(right,moveX*speed*dt);
 player.position.x=THREE.MathUtils.clamp(player.position.x,-195,195);player.position.z=THREE.MathUtils.clamp(player.position.z,-195,195);
 player.rotation.y=yaw;
 const offset=new THREE.Vector3(Math.sin(yaw)*9,3.8+pitch*4,Math.cos(yaw)*9);camera.position.lerp(player.position.clone().add(offset),.12);camera.lookAt(player.position.x,1.4,player.position.z);
 renderer.render(scene,camera)}
const clock=new THREE.Clock();animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
loading.classList.add('hidden');