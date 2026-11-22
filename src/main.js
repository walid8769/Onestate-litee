import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/RGBELoader.js';
import { createWorld } from './world.js';
import { NetworkClient } from './network.js';
import { upgradeAvatar, updateAvatar } from './avatar.js';

const $ = (s) => document.querySelector(s);
const loading=$('#loading'), menu=$('#menu'), game=$('#game');
let selectedServer='ME1';
const playerNameInput=$('#player-name');
const realtimeUrlInput=$('#realtime-url');
const passwordInput=$('#account-password');
const accountStatus=$('#account-status');
const jobSelect=$('#job-select');
let sessionToken='';
let currentAccount=null;
try{
  playerNameInput.value=localStorage.getItem('onestate-player-name')||'لاعب';
  realtimeUrlInput.value=localStorage.getItem('onestate-realtime-url')||new URLSearchParams(location.search).get('realtime')||window.ONESTATE_REALTIME_URL||'';
  sessionToken=localStorage.getItem('onestate-session-token')||'';
}catch{}
function setAccountStatus(message,state=''){
  accountStatus.textContent=message;
  accountStatus.dataset.state=state;
}
async function accountApi(path,method='GET',body=null){
  const base=(realtimeUrlInput.value||window.ONESTATE_REALTIME_URL||'').trim();
  if(!base)throw new Error('أدخل رابط خدمة اللعب الجماعي أولاً');
  const headers={'content-type':'application/json'};
  if(sessionToken)headers.authorization='Bearer '+sessionToken;
  const response=await fetch(new URL(path,base),{method,headers,body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({error:'استجابة غير مفهومة من الخادم'}));
  if(!response.ok)throw new Error(data.error||'تعذر إكمال الطلب');
  return data;
}
async function refreshAccount(){
  const result=await accountApi('/api/profile');
  currentAccount=result.account;
  $('#cash-value').textContent=Number(currentAccount.cash||0).toLocaleString('en-US');
  $('#level-value').textContent=String(currentAccount.level||1);
  $('#level-top').textContent=String(currentAccount.level||1);
  $('#job-label').textContent=({citizen:'مواطن',police:'الشرطة',medic:'الإسعاف',mechanic:'ميكانيكي',taxi:'سائق أجرة',bus:'سائق حافلة',delivery:'التوصيل'})[currentAccount.job]||'مواطن';
  const jobsResult=await accountApi('/api/jobs');
  jobSelect.innerHTML='';
  for(const job of jobsResult.jobs||[]){
    const option=document.createElement('option');
    option.value=job.id;option.textContent=job.name;jobSelect.append(option);
  }
  jobSelect.value=currentAccount.job||'citizen';
  jobSelect.disabled=false;
  setAccountStatus('تم تسجيل الدخول وحفظ الشخصية','success');
}
async function authenticate(mode){
  const username=(playerNameInput.value||'').trim();
  const password=passwordInput.value||'';
  try{
    setAccountStatus(mode==='register'?'جارٍ إنشاء الحساب...':'جارٍ تسجيل الدخول...');
    const result=await accountApi(mode==='register'?'/api/auth/register':'/api/auth/login','POST',{
      username,displayName:username,password
    });
    sessionToken=result.token;
    try{
      localStorage.setItem('onestate-session-token',sessionToken);
      localStorage.setItem('onestate-player-name',username);
      localStorage.setItem('onestate-realtime-url',realtimeUrlInput.value.trim());
    }catch{}
    passwordInput.value='';
    await refreshAccount();
  }catch(error){setAccountStatus(error.message||'تعذر الاتصال بالخادم','error');}
}
$('#account-register').addEventListener('click',()=>authenticate('register'));
$('#account-login').addEventListener('click',()=>authenticate('login'));
$('#account-logout').addEventListener('click',async()=>{
  try{if(sessionToken)await accountApi('/api/auth/logout','POST');}catch{}
  sessionToken='';currentAccount=null;
  try{localStorage.removeItem('onestate-session-token');}catch{}
  jobSelect.disabled=true;setAccountStatus('تم تسجيل الخروج');
});
jobSelect.addEventListener('change',async()=>{
  if(!sessionToken)return;
  try{
    const result=await accountApi('/api/profile/job','POST',{job:jobSelect.value});
    currentAccount=result.account;
    $('#job-label').textContent=jobSelect.selectedOptions[0]?.textContent||'مواطن';
    setAccountStatus('تم حفظ وظيفتك في الشخصية','success');
  }catch(error){setAccountStatus(error.message||'تعذر حفظ الوظيفة','error');}
});
if(sessionToken){
  refreshAccount().catch(()=>{sessionToken='';try{localStorage.removeItem('onestate-session-token');}catch{};setAccountStatus('انتهت الجلسة، سجّل الدخول من جديد','error');});
}
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
function disposeAvatarGroup(group){
  scene.remove(group);
  group.userData.avatarMixer?.stopAllAction();
  const tag=group.userData.nameTag;
  if(tag){tag.material.map?.dispose();tag.material.dispose();group.remove(tag);group.userData.nameTag=null;}
}
function setNameTag(group,name){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(9,15,22,.82)';ctx.fillRect(8,8,496,112);
  ctx.strokeStyle='rgba(216,185,119,.9)';ctx.lineWidth=5;ctx.strokeRect(10,10,492,108);
  ctx.fillStyle='#ffffff';ctx.font='bold 52px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
  const label=String(name||'لاعب').slice(0,20);ctx.fillText(label,256,64,460);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.position.set(0,2.55,0);sprite.scale.set(2.5,.62,1);
  if(group.userData.nameTag){group.remove(group.userData.nameTag);group.userData.nameTag.material.map?.dispose();group.userData.nameTag.material.dispose();}
  group.userData.nameTag=sprite;group.add(sprite);
}
function makeRemotePlayer(id,name){
  const group=createAvatar(0x9b3940,0x252b35);group.userData.remote=true;setNameTag(group,name);scene.add(group);upgradeAvatar(group);
  remotePlayers.set(id,{group,name,target:new THREE.Vector3(),targetYaw:0,lastPosition:new THREE.Vector3()});return group;
}
function clearRemotePlayers(){
  for(const item of remotePlayers.values())disposeAvatarGroup(item.group);
  remotePlayers.clear();
}
function handleNetworkEvent(event){
  if(event.type==='connected'){networkStatus.textContent='متصل';networkStatus.dataset.state='online';}
  if(event.type==='auth_required'){
    networkStatus.textContent='انتهت الجلسة';networkStatus.dataset.state='offline';
    sessionToken='';try{localStorage.removeItem('onestate-session-token');}catch{}
    setAccountStatus('انتهت الجلسة. سجّل الدخول من جديد.','error');
  }
  else if(event.type==='offline'||event.type==='network_error'||event.type==='disconnected'){
    networkStatus.textContent='غير متصل';networkStatus.dataset.state='offline';
    clearRemotePlayers();
  }
  if(event.type==='welcome'){networkStatus.textContent=`متصل • ${event.online||1}/100`;networkStatus.dataset.state='online';}
  if(event.type==='snapshot'){
    const active=new Set();
    for(const p of event.players||[]){if(p?.id){active.add(p.id);updateRemote(p);}}
    for(const [id,item] of remotePlayers){if(!active.has(id)){disposeAvatarGroup(item.group);remotePlayers.delete(id);}}
  }
  if(event.type==='player_joined'||event.type==='player_moved'){updateRemote(event.player);if(Number.isFinite(event.online)){networkStatus.textContent=`متصل • ${event.online}/100`;networkStatus.dataset.state='online';}}
  if(event.type==='player_left'){const p=remotePlayers.get(event.id);if(p){disposeAvatarGroup(p.group);remotePlayers.delete(event.id);}if(Number.isFinite(event.online)){networkStatus.textContent=`متصل • ${event.online}/100`;networkStatus.dataset.state='online';}}
  if(event.type==='error'&&networkStatus){networkStatus.textContent=event.message||'تعذر الاتصال';networkStatus.dataset.state='offline';}
}
function updateRemote(p){
  if(!p||!p.id||!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
  let item=remotePlayers.get(p.id);
  if(!item)makeRemotePlayer(p.id,p.name);
  item=remotePlayers.get(p.id);
  const nextName=p.name||item.name;
  if(nextName!==item.name){item.name=nextName;setNameTag(item.group,nextName);}
  item.target.set(p.x,0,p.z);
  if(Number.isFinite(p.yaw))item.targetYaw=p.yaw;
}

document.querySelectorAll('.server').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.server').forEach(x=>x.classList.remove('active'));
  button.classList.add('active'); selectedServer=button.dataset.server;
}));

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb8c9);
scene.fog=new THREE.Fog(0x9eb8c9,170,520);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,900);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.45:1.6));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
// CC0 1K outdoor HDRI: real sky reflections for glass, paint and wet surfaces.
const pmrem=new THREE.PMREMGenerator(renderer);
new RGBELoader().load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr',
  hdr=>{
    hdr.mapping=THREE.EquirectangularReflectionMapping;
    const baked=pmrem.fromEquirectangular(hdr);
    scene.environment=baked.texture;
    scene.environmentIntensity=.8;
    scene.background=hdr;
    scene.backgroundBlurriness=.12;
    pmrem.dispose();
  },
  undefined,
  error=>{console.warn('[OneState] Outdoor HDRI unavailable; using built-in lighting.',error);pmrem.dispose();}
);
game.prepend(renderer.domElement);
renderer.domElement.style.touchAction='none';

scene.add(new THREE.HemisphereLight(0xeaf4ff,0x59614e,2.15));
const sun=new THREE.DirectionalLight(0xffe6bd,2.35);
sun.position.set(-90,140,75); sun.castShadow=true;
sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
sun.shadow.camera.left=-360;sun.shadow.camera.right=360;sun.shadow.camera.top=360;sun.shadow.camera.bottom=-360;sun.shadow.camera.far=700;sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias=-.00012;sun.shadow.normalBias=.025;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xb9d5ff,.45);fill.position.set(90,45,-100);scene.add(fill);

const districts=createWorld(THREE,scene);
const player=createAvatar(0x087b9e,0x202c3c);scene.add(player);upgradeAvatar(player);
player.position.set(0,0,0);

let missionState=null,missionMarker=null;
const missionPanel=$('#mission-panel'),missionList=$('#mission-list'),missionActive=$('#mission-active');
const missionProgress=$('#mission-progress'),missionCompleteButton=$('#mission-complete');
function clearMissionMarker(){
  if(!missionMarker)return;
  scene.remove(missionMarker);
  missionMarker.traverse(node=>{node.geometry?.dispose?.();if(node.material){if(Array.isArray(node.material))node.material.forEach(m=>m.dispose?.());else node.material.dispose?.();}});
  missionMarker=null;
}
function setActiveMission(mission,token,server,startedAt){
  missionState={mission,token,server,startedAt};
  missionList.classList.add('hidden');missionActive.classList.remove('hidden');
  $('#mission-title').textContent=mission.title;
  $('#mission-description').textContent=mission.description;
  clearMissionMarker();
  missionMarker=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.28,10,44),new THREE.MeshBasicMaterial({color:0x42e8d0,transparent:true,opacity:.9,depthWrite:false}));
  ring.rotation.x=Math.PI/2;ring.position.y=.35;ring.renderOrder=20;missionMarker.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.38,7,12),new THREE.MeshBasicMaterial({color:0x42e8d0,transparent:true,opacity:.24,depthWrite:false}));
  beam.position.y=3.5;beam.renderOrder=19;missionMarker.add(beam);
  missionMarker.position.set(mission.destination.x,0,mission.destination.z);
  scene.add(missionMarker);
}
async function loadMissions(){
  if(!sessionToken){missionList.textContent='سجّل الدخول لعرض المهام.';return;}
  try{
    const data=await accountApi('/api/missions');
    if(data.activeMission){
      const active=data.activeMission;
      const mission=(data.missions||[]).find(item=>item.id===active.id);
      if(mission){setActiveMission(mission,active.token,active.server,active.startedAt);return;}
    }
    missionState=null;clearMissionMarker();missionActive.classList.add('hidden');missionList.classList.remove('hidden');missionList.innerHTML='';
    for(const mission of data.missions||[]){
      const card=document.createElement('article');card.className='mission-card';
      const title=document.createElement('strong');title.textContent=mission.title;
      const description=document.createElement('p');description.textContent=mission.description;
      const reward=document.createElement('small');reward.textContent='المكافأة: '+mission.reward+' دولار • XP '+mission.xp;
      const start=document.createElement('button');start.type='button';start.textContent='بدء المهمة';
      start.addEventListener('click',async()=>{
        if(!realtime.connected){const note=document.createElement('p');note.textContent='اتصل بالسيرفر أولاً لبدء المهمة.';missionList.prepend(note);return;}
        try{
          const result=await accountApi('/api/missions/start','POST',{missionId:mission.id,server:selectedServer});
          setActiveMission(result.mission,result.missionToken,selectedServer,result.startedAt);
        }catch(error){const note=document.createElement('p');note.textContent=error.message;missionList.prepend(note);}
      });
      card.append(title,description,reward,start);missionList.append(card);
    }
  }catch(error){missionList.textContent=error.message||'تعذر تحميل المهام.';}
}
$('#mission-toggle').addEventListener('click',()=>{missionPanel.classList.toggle('hidden');if(!missionPanel.classList.contains('hidden'))loadMissions();});
$('#mission-close').addEventListener('click',()=>missionPanel.classList.add('hidden'));
$('#mission-cancel').addEventListener('click',async()=>{
  try{await accountApi('/api/missions/cancel','POST',{});missionState=null;clearMissionMarker();missionActive.classList.add('hidden');missionList.classList.remove('hidden');await loadMissions();}
  catch(error){missionProgress.textContent=error.message;}
});
missionCompleteButton.addEventListener('click',async()=>{
  if(!missionState)return;
  missionCompleteButton.disabled=true;
  try{
    const result=await accountApi('/api/missions/complete','POST',{missionToken:missionState.token,server:missionState.server});
    currentAccount=result.account;
    $('#cash-value').textContent=Number(currentAccount.cash||0).toLocaleString('en-US');
    $('#level-value').textContent=String(currentAccount.level||1);
    $('#level-top').textContent=String(currentAccount.level||1);
    missionProgress.textContent='اكتملت المهمة! المكافأة '+result.reward+' دولار و '+result.xp+' XP';
    missionState=null;clearMissionMarker();
    await refreshAccount();
    setTimeout(()=>{missionActive.classList.add('hidden');missionList.classList.remove('hidden');loadMissions();},1400);
  }catch(error){missionProgress.textContent=error.message||'تعذر إكمال المهمة.';missionCompleteButton.disabled=false;}
});
function updateMissionProgress(){
  if(!missionState)return;
  const destination=missionState.mission.destination;
  const distance=Math.hypot(player.position.x-destination.x,player.position.z-destination.z);
  const elapsed=(Date.now()-missionState.startedAt)/1000;
  const remaining=Math.max(0,missionState.mission.minSeconds-elapsed);
  const sameServer=realtime.connected&&selectedServer===missionState.server;
  if(distance>12)missionProgress.textContent='المسافة إلى الهدف: '+Math.round(distance)+' م';
  else if(remaining>0)missionProgress.textContent='وصلت إلى الهدف — انتظر '+Math.ceil(remaining)+' ثانية';
  else if(!sameServer)missionProgress.textContent='اتصل بالسيرفر '+missionState.server+' لإكمال المهمة';
  else missionProgress.textContent='وصلت! يمكنك إكمال المهمة الآن';
  missionCompleteButton.disabled=distance>12||remaining>0||!sameServer;
}

const pedestrianSpecs=[
  {color:0x9b563d,pants:0x26384a,start:[-190,20],path:[[-190,20],[-160,20],[-160,50],[-190,50]]},
  {color:0x315f88,pants:0x30343b,start:[160,-50],path:[[160,-50],[190,-50],[190,-20],[160,-20]]},
  {color:0x9b8742,pants:0x273d34,start:[20,160],path:[[20,160],[50,160],[50,190],[20,190]]},
  {color:0x674c82,pants:0x252c37,start:[-50,-190],path:[[-50,-190],[-20,-190],[-20,-160],[-50,-160]]}
];
const pedestrians=pedestrianSpecs.map((spec,index)=>{
  const group=createAvatar(spec.color,spec.pants);group.userData.remote=true;
  group.position.set(spec.start[0],0,spec.start[1]);
  scene.add(group);upgradeAvatar(group);
  return {group,path:spec.path,index:0,phase:index*.9,speed:1.05+index*.08};
});

let yaw=0,pitch=.2,moveX=0,moveY=0,running=false,dragPointer=null,lastX=0,lastY=0;
let activeVehicle=null,vehicleSpeed=0;
const vehicles= districts.vehicles || [];
const obstacles= districts.obstacles || [];
function blockedAt(x,z,radius=0.8){
  return obstacles.some(o=>Math.abs(x-o.x)<o.halfX+radius&&Math.abs(z-o.z)<o.halfZ+radius);
}
function moveWithCollision(object,dx,dz,radius=0.8){
  const nx=THREE.MathUtils.clamp(object.position.x+dx,-345,345);
  const nz=THREE.MathUtils.clamp(object.position.z+dz,-345,345);
  if(!blockedAt(nx,object.position.z,radius))object.position.x=nx;
  if(!blockedAt(object.position.x,nz,radius))object.position.z=nz;
}
const vehicleButton=document.createElement('button');vehicleButton.id='vehicle';vehicleButton.className='vehicle-action';vehicleButton.textContent='قيادة';game.appendChild(vehicleButton);
const vehiclePanel=document.createElement('div');vehiclePanel.className='vehicle-panel';vehiclePanel.innerHTML='<span>السرعة</span><strong id="vehicle-speed">0</strong><small>KM/H</small>';game.appendChild(vehiclePanel);
const speedReadout=vehiclePanel.querySelector('#vehicle-speed');
function nearestVehicle(){let best=null,dist=Infinity;for(const v of vehicles){const d=v.position.distanceTo(player.position);if(d<dist){dist=d;best=v;}}return dist<8?best:null;}
function toggleVehicle(){if(activeVehicle){activeVehicle.userData.speed=0;activeVehicle=null;vehicleSpeed=0;player.visible=true;vehicleButton.textContent='قيادة';vehiclePanel.style.display='none';runButton.textContent='ركض';return;}const near=nearestVehicle();if(!near)return;activeVehicle=near;vehicleSpeed=0;player.visible=false;vehicleButton.textContent='نزول';vehiclePanel.style.display='flex';runButton.textContent='توربو';}
vehicleButton.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();toggleVehicle();});
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

$('#play').addEventListener('click',async()=>{
  const playerName=(playerNameInput.value||'لاعب').trim().slice(0,20)||'لاعب';
  setNameTag(player,playerName);
  const endpoint=(realtimeUrlInput.value||window.ONESTATE_REALTIME_URL||'').trim();
  try{localStorage.setItem('onestate-player-name',playerName);if(endpoint)localStorage.setItem('onestate-realtime-url',endpoint);}catch{}
  if(endpoint&&!sessionToken){
    setAccountStatus('أنشئ حساباً أو سجّل الدخول قبل دخول السيرفرات الجماعية','error');
    return;
  }
  if(endpoint&&sessionToken){
    try{await accountApi('/api/auth/me');}
    catch(error){
      sessionToken='';
      try{localStorage.removeItem('onestate-session-token');}catch{}
      setAccountStatus('انتهت الجلسة. سجّل الدخول من جديد.','error');
      return;
    }
  }
  $('#server-label').textContent=selectedServer;
  menu.classList.add('hidden');game.classList.remove('hidden');
  realtime.connect(endpoint,selectedServer,playerName,sessionToken);
});
$('#exit').addEventListener('click',()=>{realtime.close();for(const p of remotePlayers.values())disposeAvatarGroup(p.group);remotePlayers.clear();activeVehicle=null;vehicleSpeed=0;player.visible=true;vehicleButton.textContent='قيادة';vehicleButton.style.display='';runButton.textContent='ركض';vehiclePanel.style.display='none';game.classList.add('hidden');menu.classList.remove('hidden');running=false;resetStick();});
const districtLabel=$('#district-label'),mapCanvas=$('#mini-map'),mapCtx=mapCanvas.getContext('2d');
function drawMiniMap(){
  const ctx=mapCtx,w=mapCanvas.width,h=mapCanvas.height,s=1.05;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#65775b';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2-player.position.x*s,h/2-player.position.z*s);
  ctx.fillStyle='#3f8294';ctx.fillRect(-270,119,130,42);
  ctx.fillStyle='#c7b48c';ctx.fillRect(-140,119,18,42);
  ctx.fillStyle='#292f32';ctx.fillRect(153,-122,44,34);
  ctx.fillStyle='#536d4b';for(const [px,pz] of [[-175,35],[175,-35],[35,175],[-35,-175],[-175,-105],[175,105],[-175,-245],[175,-245],[175,245],[-175,245]])ctx.fillRect(px-12.5,pz-12.5,25,25);
  ctx.strokeStyle='#292f33';ctx.lineWidth=12;
  for(let p=-280;p<=280;p+=70){ctx.beginPath();ctx.moveTo(-380,p);ctx.lineTo(380,p);ctx.stroke();ctx.beginPath();ctx.moveTo(p,-380);ctx.lineTo(p,380);ctx.stroke();}
  ctx.strokeStyle='#c0bba9';ctx.lineWidth=1.7;
  for(let p=-280;p<=280;p+=70){ctx.beginPath();ctx.moveTo(-340,p-8);ctx.lineTo(340,p-8);ctx.stroke();ctx.beginPath();ctx.moveTo(p-8,-340);ctx.lineTo(p-8,340);ctx.stroke();}
  ctx.fillStyle='#9da9a5';
  for(const d of districts){
    const offsets=d.kind==='tower'?[-30,30]:d.kind==='industrial'?[-13,13]:d.kind==='shops'?[-16,0,16]:[-17,0,17];
    for(const ox of offsets)for(const oz of offsets){
      if(d.kind==='shops'&&ox===0&&oz===0)continue;
      ctx.fillRect(d.cx+ox-5,d.cz+oz-5,10,10);
    }
  }
  ctx.fillStyle='#d4b16d';ctx.fillRect(-66,-66,8,8);ctx.fillRect(46,-66,8,8);ctx.fillRect(-66,42,8,8);ctx.fillRect(46,42,8,8);
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
  if(activeVehicle){
    const throttle=THREE.MathUtils.clamp(-moveY,-1,1);
    const maxSpeed=activeVehicle.userData.type==='bus'?(running?20:15):(running?31:22);
    vehicleSpeed=THREE.MathUtils.damp(vehicleSpeed,throttle*maxSpeed,throttle===0?3.4:1.9,dt);
    if(Math.abs(throttle)<.05)vehicleSpeed=THREE.MathUtils.damp(vehicleSpeed,0,1.8,dt);
    speedReadout.textContent=String(Math.round(Math.abs(vehicleSpeed)*3.6));
    activeVehicle.rotation.y-=moveX*vehicleSpeed*.018*dt;
    const fwd=new THREE.Vector3(-Math.sin(activeVehicle.rotation.y),0,-Math.cos(activeVehicle.rotation.y));
    moveWithCollision(activeVehicle,fwd.x*vehicleSpeed*dt,fwd.z*vehicleSpeed*dt,2.2);
    if(!activeVehicle.userData.mixer)for(const wheel of activeVehicle.userData.wheels||[])wheel.rotation.x+=vehicleSpeed*dt*.72;
    player.position.copy(activeVehicle.position);player.rotation.y=activeVehicle.rotation.y;
  }else{
    moveWithCollision(player,direction.x*speed*dt,direction.z*speed*dt,.8);
  }
  if(moving&&!activeVehicle){player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,Math.atan2(direction.x,direction.z),Math.min(1,dt*12));walkTime+=dt*(running?12:8);}
  const swing=moving?Math.sin(walkTime)*.58:0;
  updateAvatar(player, activeVehicle?'idle':(moving?(running?'run':'walk'):'idle'), dt);
  for(const npc of pedestrians){
    const target=npc.path[npc.index],dx=target[0]-npc.group.position.x,dz=target[1]-npc.group.position.z;
    const distance=Math.hypot(dx,dz);
    if(distance<.55)npc.index=(npc.index+1)%npc.path.length;
    else{
      const step=Math.min(distance,npc.speed*dt);
      npc.group.position.x+=dx/distance*step;npc.group.position.z+=dz/distance*step;
      npc.group.rotation.y=Math.atan2(dx,dz);npc.phase+=dt*7;
    }
    updateAvatar(npc.group,'walk',dt);
    if(!npc.group.userData.realAvatarLoaded){
      const swing=Math.sin(npc.phase)*.32;
      npc.group.userData.arms[0].rotation.x=swing;npc.group.userData.arms[1].rotation.x=-swing;
      npc.group.userData.legs[0].rotation.x=-swing;npc.group.userData.legs[1].rotation.x=swing;
    }
  }
  for(const remote of remotePlayers.values()){
    remote.group.position.lerp(remote.target,1-Math.exp(-dt*13));
    const angleDelta=Math.atan2(Math.sin(remote.targetYaw-remote.group.rotation.y),Math.cos(remote.targetYaw-remote.group.rotation.y));
    remote.group.rotation.y+=angleDelta*(1-Math.exp(-dt*12));
    const remoteMoving=remote.group.position.distanceToSquared(remote.lastPosition)>.0008;
    if(remote.group.position.distanceToSquared(player.position)<22500)updateAvatar(remote.group,remoteMoving?'walk':'idle',dt);
    remote.lastPosition.copy(remote.group.position);
  }
  if(!player.userData.realAvatarLoaded){player.userData.arms[0].rotation.x=swing;player.userData.arms[1].rotation.x=-swing;player.userData.legs[0].rotation.x=-swing;player.userData.legs[1].rotation.x=swing;player.userData.torso.position.y=1.32+(moving?Math.abs(Math.sin(walkTime*2))*.045:0);player.userData.torso.rotation.z=moving?Math.sin(walkTime)*.035:0;player.userData.headGroup.rotation.y=THREE.MathUtils.lerp(player.userData.headGroup.rotation.y,0,dt*3);}
  for(const vehicle of vehicles){
    vehicle.userData.mixer?.update(dt);
    const traffic=vehicle.userData.traffic;
    if(traffic&&!activeVehicle){
      const target=traffic.points[traffic.index];
      const dx=target[0]-vehicle.position.x,dz=target[1]-vehicle.position.z;
      const distance=Math.hypot(dx,dz);
      if(distance<2)traffic.index=(traffic.index+1)%traffic.points.length;
      else{
        const step=Math.min(distance,traffic.speed*dt);
        vehicle.position.x+=dx/distance*step;
        vehicle.position.z+=dz/distance*step;
        vehicle.rotation.y=Math.atan2(-dx,-dz);
      }
    }
  }
  if(activeVehicle){yaw=activeVehicle.rotation.y;vehiclePanel.style.display='flex';}else vehiclePanel.style.display='none';
  const desired=player.position.clone().add(new THREE.Vector3(Math.sin(yaw)* (activeVehicle?11:8), (activeVehicle?4.5:3.4)+pitch*3,Math.cos(yaw)*(activeVehicle?11:8)));
  camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(player.position.x,1.25,player.position.z);
  if(!activeVehicle){const near=nearestVehicle();vehicleButton.style.display=near?'block':'none';vehicleButton.textContent='قيادة';}else vehicleButton.style.display='block';
  if(missionMarker)missionMarker.rotation.y+=dt*.65;
  updateMissionProgress();
  updateDistrict();realtime.move(player.position.x,player.position.z,player.rotation.y);mapTimer+=dt;if(mapTimer>.14){drawMiniMap();mapTimer=0;}
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.6));renderer.setSize(innerWidth,innerHeight);sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);});
// Keep the loading screen visible until the real GLB environment has either loaded or failed.
await districts.assetsReady;
loading.classList.add('hidden');
