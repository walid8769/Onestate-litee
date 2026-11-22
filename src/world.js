import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/utils/SkeletonUtils.js';

const KIT='https://raw.githubusercontent.com/kayquer/kit-cidade-lowpoly/main/models';
const FILES={
  house:`${KIT}/residencial/casa_sobrado.glb`,
  apartment:`${KIT}/residencial/predio_apartamentos.glb`,
  tower:`${KIT}/residencial/predio_alto.glb`,
  shop:`${KIT}/comercial/loja_esquina.glb`,
  market:`${KIT}/comercial/mercado.glb`,
  bank:`${KIT}/comercial/banco.glb`,
  office:`${KIT}/comercial/escritorio.glb`,
  restaurant:`${KIT}/comercial/restaurante.glb`,
  mall:`${KIT}/comercial/shopping.glb`,
  hotel:`${KIT}/comercial/hotel.glb`,
  police:`${KIT}/publicos/policia.glb`,
  firestation:`${KIT}/publicos/bombeiros.glb`,
  hospital:`${KIT}/publicos/hospital.glb`,
  cityhall:`${KIT}/publicos/prefeitura.glb`,
  factory:`${KIT}/industrial/fabrica.glb`,
  warehouse:`${KIT}/industrial/galpao.glb`,
  car:`${KIT}/veiculos/carro.glb`,
  electric:`${KIT}/veiculos/carro_eletrico.glb`,
  ambulance:`${KIT}/veiculos/ambulancia.glb`,
  bus:`${KIT}/veiculos/onibus.glb`,
  tree:`${KIT}/vegetacao/ipe_amarelo.glb`,
  shrubs:`${KIT}/vegetacao/arbustos.glb`,
  lamp:`${KIT}/mobiliario/poste_luz.glb`,
  bench:`${KIT}/mobiliario/banco_praca.glb`,
  signal:`${KIT}/mobiliario/semaforo.glb`,
  shelter:`${KIT}/mobiliario/ponto_onibus.glb`,
  bin:`${KIT}/mobiliario/lixeira.glb`,
  hydrant:`${KIT}/mobiliario/hidrante.glb`
};

export function createWorld(T, scene) {
  const loader=new GLTFLoader();
  const cache=new Map();
  const obstacles=[];
  const vehicles=[];
  const districts=[
    {name:'وسط المدينة',cx:0,cz:0,kind:'tower'},
    {name:'الحي السكني',cx:-140,cz:-140,kind:'homes'},
    {name:'المنطقة التجارية',cx:140,cz:-140,kind:'shops'},
    {name:'المنطقة الصناعية',cx:140,cz:140,kind:'industrial'},
    {name:'الواجهة البحرية',cx:-140,cz:140,kind:'water'}
  ];
  const mat=(color,roughness=1,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const groundMat=mat(0x64765b);
  const roadMat=mat(0x30363b,.96);
  const sidewalkMat=mat(0xbcb9ae,.94);
  const markingMat=mat(0xe8e1cc,.85);
  const plane=(w,d,x,z,material,y=-.12)=>{
    const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
  };
  plane(720,720,0,0,groundMat,-.2);

  // Continuous road network with clean flat geometry; all buildings and vehicles are loaded GLB assets.
  for(let p=-210;p<=210;p+=70){
    plane(720,17,0,p,roadMat,-.105);plane(17,720,p,0,roadMat,-.105);
    for(const s of [-1,1]){
      plane(720,2.5,0,p+s*10.2,sidewalkMat,-.045);
      plane(2.5,720,p+s*10.2,0,sidewalkMat,-.045);
    }
    for(let q=-340;q<350;q+=18){
      plane(5.5,.13,q,p,markingMat,-.045);
      plane(.13,5.5,p,q,markingMat,-.045);
    }
    for(let n=-3;n<=3;n++){
      plane(1,5.3,p+n*1.65,p-13,markingMat,-.04);
      plane(5.3,1,p-13,p+n*1.65,markingMat,-.04);
    }
  }

  function load(key){
    if(!cache.has(key))cache.set(key,loader.loadAsync(FILES[key]).then(g=>g.scene));
    return cache.get(key);
  }
  function fitModel(model,targetW,targetH,targetD){
    model.updateMatrixWorld(true);
    const b=new T.Box3().setFromObject(model);
    const size=b.getSize(new T.Vector3());
    const factor=Math.min(targetW/Math.max(size.x,.001),targetH/Math.max(size.y,.001),targetD/Math.max(size.z,.001));
    model.scale.multiplyScalar(factor);
    model.updateMatrixWorld(true);
    const fitted=new T.Box3().setFromObject(model);
    const center=fitted.getCenter(new T.Vector3());
    model.position.x-=center.x;model.position.z-=center.z;model.position.y-=fitted.min.y;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.roughness=Math.max(m.roughness??.7,.42);}}}});
    return model;
  }
  async function place(key,x,z,w,h,d,rotation=0){
    try{
      const source=await load(key);
      const model=cloneSkeleton(source);
      fitModel(model,w,h,d);
      model.position.x+=x;model.position.z+=z;model.rotation.y=rotation;
      scene.add(model);
      return model;
    }catch(error){console.warn('[OneState assets] failed:',key,error);return null;}
  }
  const buildingPlan=[];
  const seeded=()=>{let s=731;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
  const random=seeded();
  districts.forEach((district,di)=>{
    for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
      const x=district.cx+ix*20,z=district.cz+iz*20;
      if(Math.abs(x)<25&&Math.abs(z)<25)continue;
      let key='house',h=12+random()*5,w=13,d=13;
      if(district.kind==='tower'){key=random()>.45?'tower':'apartment';h=32+random()*18;w=16;d=16;}
      if(district.kind==='homes'){key=random()>.72?'apartment':'house';h=10+random()*5;w=13;d=13;}
      if(district.kind==='shops'){const choices=['shop','market','hotel','bank','office','restaurant','mall'];key=choices[Math.floor(random()*choices.length)];h=key==='mall'?17:13+random()*7;w=key==='mall'?20:15;d=key==='mall'?20:14;}
      if(district.kind==='industrial'){key=random()>.5?'factory':'warehouse';h=13+random()*5;w=17;d=17;}
      if(district.kind==='water'){key=random()>.5?'house':'shop';h=10+random()*5;w=14;d=14;}
      buildingPlan.push({key,x,z,w,h,d});
      obstacles.push({x,z,halfX:w*.48+1,halfZ:d*.48+1});
    }
  });

  const landmarkPlan=[
    {key:'cityhall',x:0,z:-48,w:25,h:24,d:25},
    {key:'police',x:48,z:0,w:19,h:14,d:19},
    {key:'hospital',x:-48,z:0,w:24,h:15,d:24},
    {key:'firestation',x:-48,z:-48,w:21,h:15,d:21},
    {key:'bank',x:48,z:-48,w:18,h:14,d:18}
  ];
  for(const p of landmarkPlan){
    obstacles.push({x:p.x,z:p.z,halfX:p.w*.5+1,halfZ:p.d*.5+1});
  }

  // Distinct asset instances; load shared source files once and clone for every placement.
  const coreJobs=[];
  const decorJobs=[];
  for(const p of buildingPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  for(const p of landmarkPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  // A central plaza, lawn islands and a small coastal water edge.
  plane(38,38,0,0,sidewalkMat,-.035);
  const plazaLine=mat(0xd8c8a2,.75);
  for(let k=-1;k<=1;k++){plane(34,.18,0,k*11,plazaLine,.005);plane(.18,34,k*11,0,plazaLine,.005);}
  const waterMat=new T.MeshStandardMaterial({color:0x3f8294,roughness:.22,metalness:.12});
  plane(130,42,-205,140,waterMat,-.13);

  const propPlan=[];
  for(const [x,z] of [[-105,-105],[-105,105],[105,-105],[105,105],[-175,0],[175,0]]){
    plane(25,25,x,z,mat(0x536d4b),-.02);
    for(let k=-1;k<=1;k++)propPlan.push({key:'tree',x:x+k*7,z:z+(k%2)*3,w:5,h:9,d:5});
    propPlan.push({key:'bench',x,z:z+8,w:4,h:1.5,d:1.5});
  }
  for(let p=-175;p<=175;p+=35)for(const side of [-1,1]){
    if(Math.abs(p)<45)continue;
    propPlan.push({key:'lamp',x:p,z:side*11,w:1.5,h:7,d:1.5});
    propPlan.push({key:'lamp',x:side*11,z:p,w:1.5,h:7,d:1.5});
  }
  for(const [x,z] of [[-35,-118],[35,-118],[118,-35],[118,35],[-118,35],[-118,-35]])propPlan.push({key:'shelter',x,z,w:7,h:4,d:3});
  for(const [x,z] of [[-20,-24],[20,-24],[-24,20],[24,20],[-90,12],[90,-12],[12,90],[-12,-90]]){
    propPlan.push({key:'bin',x,z,w:1.2,h:1.5,d:1.2});
    propPlan.push({key:'hydrant',x:x+1.7,z,w:.8,h:1.2,d:.8});
  }
  for(const p of propPlan)decorJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));

  async function car(key,x,z,rotation=0,emergency=false){
    const model=await place(key,x,z,key==='bus'?7:4.8,key==='bus'?4.3:2.8,key==='bus'?13:6.5,rotation);
    if(!model)return null;
    model.userData={vehicle:true,emergency,speed:0,steer:0};
    vehicles.push(model);
    return model;
  }
  const carPlan=[
    ['car',31,-12,.05,false],['electric',38,-12,.05,false],['car',-32,15,Math.PI,false],
    ['car',8,34,Math.PI/2,false],['ambulance',26,10,Math.PI/2,true],
    ['car',-102,-70,Math.PI/2,false],['electric',102,-70,Math.PI/2,false],
    ['car',-70,102,0,false],['car',70,102,0,false],['ambulance',170,32,Math.PI/2,true],
    ['bus',-170,-30,Math.PI/2,false]
  ];
  for(const [key,x,z,rot,emergency] of carPlan)coreJobs.push(car(key,x,z,rot,emergency));

  // Load the playable city first. Small street props stream in afterwards so a slow
  // bench/tree request cannot keep the player trapped on the loading screen.
  const ready=Promise.allSettled(coreJobs);
  const decorReady=Promise.allSettled(decorJobs);
  districts.vehicles=vehicles;
  districts.obstacles=obstacles;
  districts.assetsReady=ready;
  districts.decorReady=decorReady;
  districts.assetStatus='loading';
  ready.then(results=>{
    const failed=results.filter(r=>r.status==='rejected'||r.value===null).length;
    districts.assetStatus=failed?'partial':'ready';
    console.info('[OneState] core GLB assets:',results.length-failed,'loaded,',failed,'failed');
  });
  decorReady.then(results=>{
    const failed=results.filter(r=>r.status==='rejected'||r.value===null).length;
    console.info('[OneState] street detail GLB assets:',results.length-failed,'loaded,',failed,'failed');
  });
  return districts;
}
