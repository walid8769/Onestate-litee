import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/utils/SkeletonUtils.js';

const REAL_CAR='https://cdn.3dassets.dev/assets/18684/v1/model.glb';
const REAL_SUV='https://cdn.3dassets.dev/assets/18686/v1/model.glb';
const REAL_VAN='https://cdn.3dassets.dev/assets/18680/v1/model.glb';
const REAL_COUPE='https://cdn.3dassets.dev/assets/32488/v1/model.glb';
const REAL_CITY_CAR='https://cdn.3dassets.dev/assets/32487/v1/model.glb';
const REAL_SALOON='https://cdn.3dassets.dev/assets/32490/v1/model.glb';
const REAL_AMBULANCE='https://tevy.dev/models/ambulance/v1/lod1.glb';
const REAL_BUS='https://tevy.dev/models/city-bus/v1/lod1.glb';
const BUILDING_ASSETS={
  tower:['https://tevy.dev/models/office-tower/v2/lod0.glb','https://tevy.dev/models/office-tower/v2/lod1.glb','https://tevy.dev/models/office-tower/v2/lod2.glb'],
  apartment:['https://tevy.dev/models/apartment-block/v2/lod0.glb','https://tevy.dev/models/apartment-block/v2/lod1.glb','https://tevy.dev/models/apartment-block/v2/lod2.glb'],
  house:['https://tevy.dev/models/village-house/v2/lod0.glb','https://tevy.dev/models/village-house/v2/lod1.glb','https://tevy.dev/models/village-house/v2/lod2.glb'],
  shop:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  market:['https://tevy.dev/models/supermarket-shell/v2/lod0.glb','https://tevy.dev/models/supermarket-shell/v2/lod1.glb','https://tevy.dev/models/supermarket-shell/v2/lod2.glb'],
  office:['https://tevy.dev/models/office-tower/v2/lod0.glb','https://tevy.dev/models/office-tower/v2/lod1.glb','https://tevy.dev/models/office-tower/v2/lod2.glb'],
  hotel:['https://tevy.dev/models/apartment-block/v2/lod0.glb','https://tevy.dev/models/apartment-block/v2/lod1.glb','https://tevy.dev/models/apartment-block/v2/lod2.glb'],
  mall:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  restaurant:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  bank:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  police:['https://tevy.dev/models/police-station/v1/lod0.glb','https://tevy.dev/models/police-station/v1/lod1.glb','https://tevy.dev/models/police-station/v1/lod2.glb'],
  firestation:['https://tevy.dev/models/fire-station/v1/lod0.glb','https://tevy.dev/models/fire-station/v1/lod1.glb','https://tevy.dev/models/fire-station/v1/lod2.glb'],
  hospital:['https://tevy.dev/models/hospital-building/v2/lod0.glb','https://tevy.dev/models/hospital-building/v2/lod1.glb','https://tevy.dev/models/hospital-building/v2/lod2.glb'],
  cityhall:['https://tevy.dev/models/town-hall/v1/lod0.glb','https://tevy.dev/models/town-hall/v1/lod1.glb','https://tevy.dev/models/town-hall/v1/lod2.glb'],
  factory:['https://tevy.dev/models/factory-hall/v1/lod0.glb','https://tevy.dev/models/factory-hall/v1/lod1.glb','https://tevy.dev/models/factory-hall/v1/lod2.glb'],
  warehouse:['https://tevy.dev/models/warehouse/v2/lod0.glb','https://tevy.dev/models/warehouse/v2/lod1.glb','https://tevy.dev/models/warehouse/v2/lod2.glb'],
  fuelstation:['https://tevy.dev/models/fuel-station/v2/lod0.glb','https://tevy.dev/models/fuel-station/v2/lod1.glb','https://tevy.dev/models/fuel-station/v2/lod2.glb']
};
const FILES={
  car:REAL_CAR,
  electric:REAL_SUV,
  ambulance:REAL_AMBULANCE,
  bus:REAL_BUS,
  van:REAL_VAN,
  coupe:REAL_COUPE,
  citycar:REAL_CITY_CAR,
  saloon:REAL_SALOON,
  policecar:REAL_SALOON,
  tree:'https://tevy.dev/models/european-beech/v1/lod2.glb',
  tree2:'https://tevy.dev/models/ginkgo-tree/v1/lod1.glb',
  lamp:'https://tevy.dev/models/city-street-lamp/v1/lod1.glb',
  bench:'https://tevy.dev/models/empty-mall-bench/v1/lod0.glb',
  signal:'https://tevy.dev/models/traffic-light/v1/lod1.glb',
  shelter:'https://tevy.dev/models/glass-bus-shelter/v1/lod2.glb',
  bin:'https://tevy.dev/models/waste-bin/v1/lod1.glb',
  hydrant:'https://tevy.dev/models/fire-hydrant/v1/lod1.glb'
};

export function createWorld(T, scene) {
  const loader=new GLTFLoader();
  const cache=new Map();
  const obstacles=[];
  const vehicles=[];
  const districts=[
    {name:'وسط المدينة',cx:0,cz:0,kind:'tower'},
    {name:'الحي السكني',cx:-105,cz:-105,kind:'homes'},
    {name:'المنطقة التجارية',cx:105,cz:-105,kind:'shops'},
    {name:'المنطقة الصناعية',cx:105,cz:105,kind:'industrial'},
    {name:'الواجهة البحرية',cx:-105,cz:105,kind:'water'},
    {name:'ضواحي الشمال الغربي',cx:-245,cz:-245,kind:'homes'},
    {name:'ضواحي الشمال الشرقي',cx:245,cz:-245,kind:'homes'},
    {name:'ضواحي الجنوب الشرقي',cx:245,cz:245,kind:'shops'},
    {name:'الميناء الصناعي',cx:-245,cz:245,kind:'industrial'}
  ];
  const mat=(color,roughness=1,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const groundMat=mat(0x64765b,1);
  const roadMat=mat(0x30363b,.96);
  const sidewalkMat=mat(0xbcb9ae,.94);
  const curbMat=mat(0x777b79,.9);
  // CC0 PBR surface maps from Poly Haven; small 1K maps keep mobile memory bounded.
  const textureLoader=new T.TextureLoader();
  const textureBase='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/';
  function applyPBR(material,asset,repeatX,repeatY){
    const loadMap=(suffix,space)=>new Promise(resolve=>{
      textureLoader.load(textureBase+asset+'/'+asset+'_'+suffix+'_1k.jpg',texture=>{
        texture.wrapS=texture.wrapT=T.RepeatWrapping;
        texture.repeat.set(repeatX,repeatY);
        if(space)texture.colorSpace=space;
        resolve(texture);
      },undefined,()=>resolve(null));
    });
    Promise.all([loadMap('diff',T.SRGBColorSpace),loadMap('nor_gl'),loadMap('rough')]).then(([color,normal,rough])=>{
      if(color)material.map=color;
      if(normal)material.normalMap=normal;
      if(rough)material.roughnessMap=rough;
      material.needsUpdate=true;
    });
  }
  applyPBR(groundMat,'grass',80,80);
  applyPBR(roadMat,'asphalt_01',90,3);
  applyPBR(sidewalkMat,'concrete_pavement',80,3);
  const markingMat=mat(0xe8e1cc,.85);
  const plane=(w,d,x,z,material,y=-.12)=>{
    const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
  };
  function createCityTerrain(){
    const size=1200,segments=144,positions=[],uvs=[],indices=[];
    for(let iz=0;iz<=segments;iz++){
      const z=-size/2+size*iz/segments;
      for(let ix=0;ix<=segments;ix++){
        const x=-size/2+size*ix/segments;
        const radius=Math.hypot(x,z);
        const t=T.MathUtils.clamp((radius-360)/180,0,1);
        const smooth=t*t*(3-2*t);
        const hills=Math.max(4,15+12*Math.sin(x*.014)*Math.cos(z*.012)+8*Math.sin((x+z)*.022)+5*Math.cos((x-z)*.019));
        const coastalBed=x<-135&&x>-275&&z>95&&z<185;
        const y=coastalBed?-.28:-.2+smooth*hills;
        positions.push(x,y,z);
        uvs.push(ix/segments,iz/segments);
        if(ix<segments&&iz<segments){
          const a=iz*(segments+1)+ix,b=a+1,c0=a+segments+1,d=c0+1;
          indices.push(a,c0,b,b,c0,d);
        }
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const terrain=new T.Mesh(geometry,groundMat);terrain.receiveShadow=true;scene.add(terrain);
  }
  createCityTerrain();

  // Continuous road network with clean flat geometry; all buildings and vehicles are loaded GLB assets.
  for(let p=-280;p<=280;p+=70){
    plane(700,17,0,p,roadMat,-.105);plane(17,700,p,0,roadMat,-.105);
    for(const s of [-1,1]){
      plane(700,2.5,0,p+s*10.2,sidewalkMat,-.045);
      plane(2.5,700,p+s*10.2,0,sidewalkMat,-.045);
      const curbH=.18;
      const horizontalCurb=new T.Mesh(new T.BoxGeometry(700,curbH,.25),curbMat);
      horizontalCurb.position.set(0,-.015,p+s*8.62);horizontalCurb.castShadow=true;horizontalCurb.receiveShadow=true;scene.add(horizontalCurb);
      const verticalCurb=new T.Mesh(new T.BoxGeometry(.25,curbH,700),curbMat);
      verticalCurb.position.set(p+s*8.62,-.015,0);verticalCurb.castShadow=true;verticalCurb.receiveShadow=true;scene.add(verticalCurb);
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

  function loadUrl(url){
    if(!cache.has(url)){
      const request=loader.loadAsync(url);
      const bounded=new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error('GLB load timeout: '+url)),15000);
        request.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
      }).catch(error=>{cache.delete(url);throw error;});
      cache.set(url,bounded);
    }
    return cache.get(url);
  }
  function load(key){return loadUrl(FILES[key]);}
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
  const architecturalKeys=new Set(['house','apartment','tower','shop','market','bank','office','restaurant','mall','hotel','police','firestation','hospital','cityhall','factory','warehouse','fuelstation']);
  async function place(key,x,z,w,h,d,rotation=0){
    if(architecturalKeys.has(key)){
      if(BUILDING_ASSETS[key]){
        try{
          const urls=BUILDING_ASSETS[key];
          const middleGltf=await loadUrl(urls[1]);
          const lod=new T.LOD();
          const middle=cloneSkeleton(middleGltf.scene);
          fitModel(middle,w,h,d);
          lod.addLevel(middle,0);
          lod.position.set(x,0,z);lod.rotation.y=rotation;lod.updateMatrixWorld(true);scene.add(lod);
          Promise.all([loadUrl(urls[0]).catch(()=>null),loadUrl(urls[2]).catch(()=>null)]).then(([highGltf,farGltf])=>{
            const high=highGltf?cloneSkeleton(highGltf.scene):middle;
            if(high!==middle)fitModel(high,w,h,d);
            const far=farGltf?cloneSkeleton(farGltf.scene):null;
            if(far){
              fitModel(far,w,h,d);
              far.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
            }
            lod.clear();
            lod.levels.length=0;
            lod.addLevel(high,0);
            if(high!==middle)lod.addLevel(middle,72);
            if(far)lod.addLevel(far,145);
          }).catch(error=>console.warn('[OneState LOD] upgrade failed:',key,error));
          return lod;
        }catch(error){console.warn('[OneState buildings] realistic GLB failed:',key,error);}
      }
      console.warn('[OneState buildings] skipped unavailable realistic model:',key);
      return null;
    }
    try{
      const gltf=await load(key);
      const model=cloneSkeleton(gltf.scene);
      fitModel(model,w,h,d);
      const wheelClip=gltf.animations?.find(clip=>/wheel-roll/i.test(clip.name));
      if(wheelClip){const mixer=new T.AnimationMixer(model);mixer.clipAction(wheelClip).play();model.userData.mixer=mixer;}
      model.position.x+=x;model.position.z+=z;model.rotation.y=rotation;
      scene.add(model);
      return model;
    }catch(error){console.warn('[OneState assets] failed:',key,error);return null;}
  }
  const buildingPlan=[];
  const seeded=()=>{let s=731;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
  const random=seeded();
  districts.forEach((district)=>{
    const slots=district.kind==='tower'?[-30,30]:district.kind==='industrial'?[-13,13]:district.kind==='shops'?[-16,0,16]:[-17,0,17];
    for(const ox of slots)for(const oz of slots){
      const x=district.cx+ox,z=district.cz+oz;
      if(district.kind==='tower'&&Math.abs(x)<25&&Math.abs(z)<25)continue;
      if(district.kind==='shops'&&ox===0&&oz===0)continue;
      let key='house',h=12+random()*5,w=13,d=13;
      if(district.kind==='tower'){key=random()>.45?'tower':'apartment';h=50+random()*15;w=20;d=18;}
      if(district.kind==='homes'){key=random()>.82?'apartment':'house';h=key==='house'?7+random()*4:10+random()*3;w=13;d=13;}
      if(district.kind==='shops'){const choices=['shop','hotel','bank','office','restaurant','mall'];key=choices[Math.floor(random()*choices.length)];h=key==='mall'?17:13+random()*7;w=key==='mall'?20:15;d=key==='mall'?20:14;}
      if(district.kind==='industrial'){key=random()>.5?'factory':'warehouse';h=15;w=20;d=20;}
      if(district.kind==='water'){key=random()>.5?'house':'shop';h=10+random()*5;w=14;d=14;}
      buildingPlan.push({key,x,z,w,h,d});
      obstacles.push({x,z,halfX:w*.48+1,halfZ:d*.48+1});
    }
  });

  const landmarkPlan=[
    {key:'cityhall',x:-54,z:-54,w:25,h:24,d:25},
    {key:'police',x:54,z:-54,w:19,h:14,d:19},
    {key:'hospital',x:-54,z:54,w:24,h:15,d:24},
    {key:'firestation',x:54,z:54,w:21,h:15,d:21},
    {key:'fuelstation',x:105,z:-35,w:16,h:6,d:13},
    {key:'market',x:105,z:-105,w:30,h:8,d:22}
  ];
  for(const p of landmarkPlan){
    obstacles.push({x:p.x,z:p.z,halfX:p.w*.5+1,halfZ:p.d*.5+1});
  }

  // Distinct asset instances; load shared source files once and clone for every placement.
  const coreJobs=[];
  for(const p of buildingPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  for(const p of landmarkPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  // A central plaza, lawn islands and a small coastal water edge.
  plane(38,38,0,0,sidewalkMat,-.035);
  const plazaLine=mat(0xd8c8a2,.75);
  for(let k=-1;k<=1;k++){plane(34,.18,0,k*11,plazaLine,.005);plane(.18,34,k*11,0,plazaLine,.005);}
  const waterMat=new T.MeshPhysicalMaterial({color:0x3f8294,roughness:.13,metalness:.05,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.1});
  const sandMat=mat(0xc7b48c,.94);
  plane(130,42,-205,140,waterMat,-.13);
  obstacles.push({x:-205,z:140,halfX:65,halfZ:21});
  plane(18,42,-131,140,sandMat,-.105);
  plane(9,42,-117,140,sidewalkMat,-.075);
  const parkingMat=mat(0x292f32,.96);
  applyPBR(parkingMat,'asphalt_01',6,4);
  plane(44,34,175,-105,parkingMat,-.095);
  plane(43,.14,175,-120,markingMat,-.035);
  for(let bay=0;bay<=7;bay++)plane(.13,5.8,153+bay*5.8,-117,markingMat,-.035);

  const propPlan=[];
  for(const [x,z] of [[-175,35],[175,-35],[35,175],[-35,-175],[-175,-105],[175,105]]){
    plane(25,25,x,z,mat(0x536d4b),-.02);
    for(let k=-1;k<=1;k++)propPlan.push({key:k===0?'tree2':'tree',x:x+k*7,z:z+(k%2)*3,w:5,h:9,d:5});
    propPlan.push({key:'bench',x,z:z+8,w:4,h:1.5,d:1.5});
  }
  for(let p=-175;p<=175;p+=35)for(const side of [-1,1]){
    if(Math.abs(p)<45)continue;
    propPlan.push({key:'lamp',x:p,z:side*11,w:.5,h:9,d:3.42});
    propPlan.push({key:'lamp',x:side*11,z:p,w:.5,h:9,d:3.42});
  }
  for(const [x,z] of [[-35,-118],[35,-118],[118,-35],[118,35],[-118,35],[-118,-35]])propPlan.push({key:'shelter',x,z,w:7,h:4,d:3});
  for(const [x,z] of [[-9,-9],[9,-9],[-9,9],[9,9],[61,-9],[79,-9],[-79,9],[-61,9]]){
    propPlan.push({key:'signal',x,z,w:.58,h:3.51,d:.73});
  }
  for(const [x,z] of [[-20,-24],[20,-24],[-24,20],[24,20],[-90,12],[90,-12],[12,90],[-12,-90]]){
    propPlan.push({key:'bin',x,z,w:1.2,h:1.5,d:1.2});
    propPlan.push({key:'hydrant',x:x+1.7,z,w:.8,h:1.2,d:.8});
  }
  async function car(key,x,z,rotation=0,emergency=false){
    const dims=key==='bus'?[2.89,3.1,12.4]:key==='ambulance'?[2.55,3.01,7.29]:key==='van'?[2.46,2.4,5.53]:key==='electric'?[2.37,1.94,5.05]:key==='coupe'?[2.058,1.33,4.702]:key==='citycar'?[1.828,1.533,3.592]:key==='saloon'||key==='policecar'?[2,1.403,4.822]:[2.27,1.57,5.2];
    const loaded=await place(key,x,z,...dims,rotation);
    if(!loaded)return null;
    // 3DAssets vehicle models face +Z; the driving rig uses -Z as forward.
    const model=new T.Group();
    model.position.copy(loaded.position);
    model.rotation.y=rotation;
    scene.remove(loaded);
    loaded.position.set(0,0,0);
    loaded.rotation.y=Math.PI;
    model.add(loaded);
    scene.add(model);
    const wheelNodes=[];
    loaded.traverse(node=>{if(/(wheel-(front|rear).*(rubber|metal|accent)|wheel_(fl|fr|rl|rr))/i.test(node.name))wheelNodes.push(node);});
    model.userData={vehicle:true,type:key,emergency,speed:0,steer:0,wheels:wheelNodes,mixer:loaded.userData.mixer||null};
    if(emergency){
      const red=new T.MeshStandardMaterial({color:0xd92735,emissive:0x4a0508});
      const blue=new T.MeshStandardMaterial({color:0x236be8,emissive:0x071a52});
      const lightGeo=new T.BoxGeometry(.48,.16,.22);
      const a=new T.Mesh(lightGeo,red),b=new T.Mesh(lightGeo,blue);
      a.position.set(-.42,1.95,0);b.position.set(.42,1.95,0);model.add(a,b);
      const beacon=new T.Mesh(new T.BoxGeometry(1.15,.12,.34),new T.MeshStandardMaterial({color:0xf0f1ef,roughness:.45}));beacon.position.set(0,1.82,0);model.add(beacon);
    }
    if(key==='policecar'){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#12385f';ctx.fillRect(0,0,512,128);
      ctx.fillStyle='#ffffff';ctx.font='bold 78px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('POLICE',256,66);
      const decal=new T.CanvasTexture(canvas);decal.colorSpace=T.SRGBColorSpace;
      const material=new T.MeshBasicMaterial({map:decal,transparent:true,side:T.DoubleSide});
      for(const side of [-1,1]){
        const panel=new T.Mesh(new T.PlaneGeometry(1.25,.31),material);
        panel.position.set(side*1.015,.92,0);panel.rotation.y=side>0?Math.PI/2:-Math.PI/2;model.add(panel);
      }
    }
    vehicles.push(model);
    return model;
  }
  const carPlan=[
    ['car',31,-12,.05,false],['electric',38,-12,.05,false],['coupe',-32,15,Math.PI,false],['policecar',38,-54,0,true],
    ['saloon',8,34,Math.PI/2,false],['ambulance',26,10,Math.PI/2,true],
    ['citycar',-102,-70,Math.PI/2,false],['van',102,-70,Math.PI/2,false],['bus',130,35,0,false],
    ['saloon',-70,102,0,false],['coupe',70,102,0,false],['ambulance',170,32,Math.PI/2,true],
    ['car',-170,-30,Math.PI/2,false],['citycar',157,-117,0,false],['saloon',169,-117,0,false],['coupe',181,-117,0,false],['electric',193,-117,0,false]
  ];
  for(const [key,x,z,rot,emergency] of carPlan)coreJobs.push(car(key,x,z,rot,emergency));
  const trafficLoop=[[-280,-280],[280,-280],[280,280],[-280,280]];
  const busRoute=[[0,-280],[0,280],[70,280],[70,-280]];
  const trafficPlan=[
    {x:-235,z:-280,rot:Math.PI/2,index:1,key:'citycar'},
    {x:280,z:-30,rot:Math.PI,index:2,key:'saloon'},
    {x:235,z:280,rot:-Math.PI/2,index:3,key:'coupe'},
    {x:-280,z:30,rot:0,index:0,key:'van'},
    {x:0,z:-140,rot:-Math.PI/2,index:1,key:'bus',speed:4.5}
  ];
  for(const p of trafficPlan){
    coreJobs.push(car(p.key||'car',p.x,p.z,p.rot,false).then(vehicle=>{
      if(vehicle)vehicle.userData.traffic={points:p.key==='bus'?busRoute:trafficLoop,index:p.index,speed:p.speed||7.5};
      return vehicle;
    }));
  }

  // Load the playable city first. Small street props stream in afterwards so a slow
  // bench/tree request cannot keep the player trapped on the loading screen.
  const ready=Promise.allSettled(coreJobs);
  const decorReady=ready.then(()=>Promise.allSettled(propPlan.map(p=>place(p.key,p.x,p.z,p.w,p.h,p.d))));
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
