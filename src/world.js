import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/DRACOLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/utils/SkeletonUtils.js';
import { createUrbanBuilding } from './architecture.js';

const REAL_CAR='https://tevy.dev/models/electric-gt/v1/lod1.glb';
const REAL_SUV='https://tevy.dev/models/suv/v1/lod1.glb';
const REAL_VAN='https://tevy.dev/models/family-minivan/v1/lod1.glb';
const REAL_COUPE='https://tevy.dev/models/supercar/v2/lod1.glb';
const REAL_CITY_CAR='https://tevy.dev/models/city-taxi/v1/lod1.glb';
const REAL_SALOON='https://tevy.dev/models/family-sedan/v1/lod1.glb';
const REAL_AMBULANCE='https://tevy.dev/models/ambulance/v1/lod1.glb';
const REAL_BUS='https://tevy.dev/models/city-bus/v1/lod1.glb';
const REAL_POLICE='https://tevy.dev/models/police-car/v1/lod1.glb';
const REAL_FIRE_ENGINE='https://tevy.dev/models/fire-engine/v1/lod1.glb';
const BUILDING_ASSETS={
  tower:['https://tevy.dev/models/office-tower/v2/lod0.glb','https://tevy.dev/models/office-tower/v2/lod1.glb','https://tevy.dev/models/office-tower/v2/lod2.glb'],
  koreanTower:['https://tevy.dev/models/korean-apartment-tower/v1/lod0.glb','https://tevy.dev/models/korean-apartment-tower/v1/lod1.glb','https://tevy.dev/models/korean-apartment-tower/v1/lod2.glb'],
  pencil:['https://tevy.dev/models/pencil-building/v1/lod0.glb','https://tevy.dev/models/pencil-building/v1/lod1.glb','https://tevy.dev/models/pencil-building/v1/lod2.glb'],
  adobe:['https://tevy.dev/models/adobe-house/v1/lod0.glb','https://tevy.dev/models/adobe-house/v1/lod1.glb','https://tevy.dev/models/adobe-house/v1/lod2.glb'],
  publicHousing:['https://tevy.dev/models/public-housing-slab/v1/lod0.glb','https://tevy.dev/models/public-housing-slab/v1/lod1.glb','https://tevy.dev/models/public-housing-slab/v1/lod2.glb'],
  apartment:['https://tevy.dev/models/apartment-block/v2/lod0.glb','https://tevy.dev/models/apartment-block/v2/lod1.glb','https://tevy.dev/models/apartment-block/v2/lod2.glb'],
  house:['https://tevy.dev/models/village-house/v2/lod0.glb','https://tevy.dev/models/village-house/v2/lod1.glb','https://tevy.dev/models/village-house/v2/lod2.glb'],
  villa:['https://tevy.dev/models/korean-villa-block/v1/lod0.glb','https://tevy.dev/models/korean-villa-block/v1/lod1.glb','https://tevy.dev/models/korean-villa-block/v1/lod2.glb'],
  cottage:['https://tevy.dev/models/red-cottage/v2/lod0.glb','https://tevy.dev/models/red-cottage/v2/lod1.glb','https://tevy.dev/models/red-cottage/v2/lod2.glb'],
  shop:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  market:['https://tevy.dev/models/general-store/v1/lod0.glb','https://tevy.dev/models/general-store/v1/lod1.glb','https://tevy.dev/models/general-store/v1/lod2.glb'],
  supermarket:['https://tevy.dev/models/supermarket-shell/v2/lod0.glb','https://tevy.dev/models/supermarket-shell/v2/lod1.glb','https://tevy.dev/models/supermarket-shell/v2/lod2.glb'],
  office:['https://tevy.dev/models/office-tower/v2/lod0.glb','https://tevy.dev/models/office-tower/v2/lod1.glb','https://tevy.dev/models/office-tower/v2/lod2.glb'],
  hotel:['https://tevy.dev/models/apartment-block/v2/lod0.glb','https://tevy.dev/models/apartment-block/v2/lod1.glb','https://tevy.dev/models/apartment-block/v2/lod2.glb'],
  mall:['https://tevy.dev/models/mixed-tenant-block/v1/lod0.glb','https://tevy.dev/models/mixed-tenant-block/v1/lod1.glb','https://tevy.dev/models/mixed-tenant-block/v1/lod2.glb'],
  restaurant:['https://tevy.dev/models/noodle-shop/v1/lod0.glb','https://tevy.dev/models/noodle-shop/v1/lod1.glb','https://tevy.dev/models/noodle-shop/v1/lod2.glb'],
  bank:['https://tevy.dev/models/corner-shop-block/v2/lod0.glb','https://tevy.dev/models/corner-shop-block/v2/lod1.glb','https://tevy.dev/models/corner-shop-block/v2/lod2.glb'],
  police:['https://tevy.dev/models/police-station/v1/lod0.glb','https://tevy.dev/models/police-station/v1/lod1.glb','https://tevy.dev/models/police-station/v1/lod2.glb'],
  firestation:['https://tevy.dev/models/fire-station/v1/lod0.glb','https://tevy.dev/models/fire-station/v1/lod1.glb','https://tevy.dev/models/fire-station/v1/lod2.glb'],
  hospital:['https://tevy.dev/models/hospital-building/v2/lod0.glb','https://tevy.dev/models/hospital-building/v2/lod1.glb','https://tevy.dev/models/hospital-building/v2/lod2.glb'],
  cityhall:['https://tevy.dev/models/town-hall/v1/lod0.glb','https://tevy.dev/models/town-hall/v1/lod1.glb','https://tevy.dev/models/town-hall/v1/lod2.glb'],
  factory:['https://tevy.dev/models/factory-hall/v1/lod0.glb','https://tevy.dev/models/factory-hall/v1/lod1.glb','https://tevy.dev/models/factory-hall/v1/lod2.glb'],
  warehouse:['https://tevy.dev/models/warehouse/v2/lod0.glb','https://tevy.dev/models/warehouse/v2/lod1.glb','https://tevy.dev/models/warehouse/v2/lod2.glb'],
  fuelstation:['https://tevy.dev/models/fuel-station/v2/lod0.glb','https://tevy.dev/models/fuel-station/v2/lod1.glb','https://tevy.dev/models/fuel-station/v2/lod2.glb'],
  fbi:['https://tevy.dev/models/office-tower/v2/lod0.glb','https://tevy.dev/models/office-tower/v2/lod1.glb','https://tevy.dev/models/office-tower/v2/lod2.glb'],
  militaryHangar:['https://tevy.dev/models/aircraft-hangar/v2/lod0.glb','https://tevy.dev/models/aircraft-hangar/v2/lod1.glb','https://tevy.dev/models/aircraft-hangar/v2/lod2.glb']
};
const FILES={
  car:REAL_CAR,
  suv:REAL_SUV,
  ambulance:REAL_AMBULANCE,
  bus:REAL_BUS,
  van:REAL_VAN,
  coupe:REAL_COUPE,
  citycar:REAL_CITY_CAR,
  saloon:REAL_SALOON,
  policecar:REAL_POLICE,
  fbiSUV:REAL_SUV,
  fireengine:REAL_FIRE_ENGINE,
  tree:'https://tevy.dev/models/european-beech/v1/lod2.glb',
  tree2:'https://tevy.dev/models/ginkgo-tree/v1/lod1.glb',
  lamp:'https://tevy.dev/models/city-street-lamp/v1/lod1.glb',
  bench:'https://tevy.dev/models/empty-mall-bench/v1/lod0.glb',
  signal:'https://tevy.dev/models/traffic-light/v1/lod1.glb',
  shelter:'https://tevy.dev/models/glass-bus-shelter/v1/lod2.glb',
  bin:'https://tevy.dev/models/waste-bin/v1/lod1.glb',
  hydrant:'https://tevy.dev/models/fire-hydrant/v1/lod1.glb',
  sidewalkFence:'https://tevy.dev/models/city-sidewalk-guard-fence-12-m/v1/lod1.glb',
  militaryGuardTower:'https://tevy.dev/models/military-guard-tower/v1/lod1.glb',
  militaryVehicle:'https://tevy.dev/models/military-utility-vehicle/v1/lod1.glb',
  battleTank:'https://tevy.dev/models/main-battle-tank/v1/lod1.glb',
  infantryFightingVehicle:'https://tevy.dev/models/tracked-infantry-fighting-vehicle/v1/lod1.glb'
};

export function createWorld(T, scene, renderer) {
  const loader=new GLTFLoader();
  const ktx2=new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/basis/').detectSupport(renderer);
  loader.setKTX2Loader(ktx2);
  const draco=new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/');
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const cache=new Map();
  const obstacles=[];
  const vehicles=[];
  const windObjects=[];
  const districts=[
    {name:'وسط المدينة',cx:0,cz:0,kind:'tower'},
    {name:'الحي السكني',cx:-105,cz:-105,kind:'homes'},
    {name:'المنطقة التجارية',cx:105,cz:-105,kind:'shops'},
    {name:'المنطقة الصناعية',cx:105,cz:105,kind:'industrial'},
    {name:'الواجهة البحرية',cx:-105,cz:105,kind:'water'},
    {name:'ضواحي الشمال الغربي',cx:-245,cz:-245,kind:'homes'},
    {name:'ضواحي الشمال الشرقي',cx:245,cz:-245,kind:'homes'},
    {name:'ضواحي الجنوب الشرقي',cx:245,cz:245,kind:'shops'},
    {name:'الميناء الصناعي',cx:-245,cz:245,kind:'industrial'},
    {name:'المقر الفيدرالي FBI',cx:385,cz:-385,kind:'federal'},
    {name:'القاعدة العسكرية',cx:420,cz:490,kind:'military'}
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
  applyPBR(groundMat,'leafy_grass',80,80);
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
  for(let p=-490;p<=490;p+=70){
    plane(1050,17,0,p,roadMat,-.105);plane(17,1050,p,0,roadMat,-.105);
    for(const s of [-1,1]){
      plane(1050,2.5,0,p+s*10.2,sidewalkMat,-.045);
      plane(2.5,1050,p+s*10.2,0,sidewalkMat,-.045);
      const curbH=.18;
      const horizontalCurb=new T.Mesh(new T.BoxGeometry(1050,curbH,.25),curbMat);
      horizontalCurb.position.set(0,-.015,p+s*8.62);horizontalCurb.castShadow=true;horizontalCurb.receiveShadow=true;scene.add(horizontalCurb);
      const verticalCurb=new T.Mesh(new T.BoxGeometry(.25,curbH,1050),curbMat);
      verticalCurb.position.set(p+s*8.62,-.015,0);verticalCurb.castShadow=true;verticalCurb.receiveShadow=true;scene.add(verticalCurb);
    }
    for(let q=-510;q<520;q+=18){
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
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];for(const material of materials){for(const map of [material.map,material.normalMap,material.roughnessMap,material.metalnessMap,material.aoMap])if(map)map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});
    return model;
  }
  const architecturalKeys=new Set(['house','villa','cottage','apartment','tower','koreanTower','pencil','adobe','publicHousing','shop','market','bank','office','restaurant','mall','hotel','police','firestation','hospital','cityhall','supermarket','factory','warehouse','fuelstation','fbi','militaryHangar']);
  async function place(key,x,z,w,h,d,rotation=0){
    if(architecturalKeys.has(key)){
      if(BUILDING_ASSETS[key]){
        try{
          const urls=BUILDING_ASSETS[key];
          // Load the full-resolution facade first. The old path showed LOD1 immediately
          // and silently stayed with procedural boxes whenever that first request failed.
          const highGltf=await loadUrl(urls[0]);
          const high=cloneSkeleton(highGltf.scene);
          fitModel(high,w,h,d);
          const lod=new T.LOD();
          lod.addLevel(high,0);
          lod.position.set(x,0,z);lod.rotation.y=rotation;lod.updateMatrixWorld(true);scene.add(lod);
          // Stream lighter versions only after the real building is already visible.
          Promise.all([loadUrl(urls[1]).catch(()=>null),loadUrl(urls[2]).catch(()=>null)]).then(([middleGltf,farGltf])=>{
            if(middleGltf){
              const middle=cloneSkeleton(middleGltf.scene);
              fitModel(middle,w,h,d);
              lod.addLevel(middle,68);
            }
            if(farGltf){
              const far=cloneSkeleton(farGltf.scene);
              fitModel(far,w,h,d);
              far.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
              lod.addLevel(far,145);
            }
          }).catch(error=>console.warn('[OneState LOD] distance models failed:',key,error));
          return lod;
        }catch(error){console.warn('[OneState buildings] high-detail GLB failed; using detailed procedural architecture:',key,error);}
      }
      const fallback=createUrbanBuilding(T,key,w,h,d);
      fallback.position.set(x,0,z);
      fallback.rotation.y=rotation;
      scene.add(fallback);
      return fallback;
    }
    try{
      const gltf=await load(key);
      const model=cloneSkeleton(gltf.scene);
      fitModel(model,w,h,d);
      const wheelClip=gltf.animations?.find(clip=>/wheel-roll/i.test(clip.name));
      if(wheelClip){const mixer=new T.AnimationMixer(model);mixer.clipAction(wheelClip).play();model.userData.mixer=mixer;}
      model.position.x+=x;model.position.z+=z;model.rotation.y=rotation;
      scene.add(model);
      if(key==='tree'||key==='tree2')windObjects.push({object:model,phase:Math.random()*Math.PI*2,amplitude:.01+Math.random()*.008});
      return model;
    }catch(error){console.warn('[OneState assets] failed:',key,error);return null;}
  }
  const buildingPlan=[];
  const seeded=()=>{let s=731;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
  const random=seeded();
  districts.forEach((district)=>{
    if(district.kind==='federal'||district.kind==='military')return;
    const slots=district.kind==='tower'?[-38,38]:district.kind==='industrial'?[-13,13]:district.kind==='shops'?[-16,0,16]:[-24,0,24];
    for(const ox of slots)for(const oz of slots){
      const x=district.cx+ox,z=district.cz+oz;
      if(district.kind==='tower'&&Math.abs(x)<25&&Math.abs(z)<25)continue;
      if(district.kind==='shops'&&ox===0&&oz===0)continue;
      let key='house',h=12+random()*5,w=13,d=13;
      if(district.kind==='tower'){key=random()>.48?'tower':'koreanTower';h=60;w=40;d=25;}
      if(district.kind==='homes'){const roll=random();key=roll>.91?'apartment':roll>.78?'adobe':roll>.62?'villa':roll>.32?'cottage':'house';h=key==='apartment'?18:key==='adobe'?5.5:key==='villa'?12:key==='cottage'?9:9;w=key==='apartment'?24.5:key==='adobe'?14:key==='villa'?14:key==='cottage'?12:13;d=key==='apartment'?14:key==='adobe'?8:key==='villa'?12:key==='cottage'?11:13;}
      if(district.kind==='shops'){const choices=['shop','hotel','bank','office','restaurant','mall','market','pencil'];key=choices[Math.floor(random()*choices.length)];h=key==='pencil'?36:key==='mall'?26:key==='office'?42:key==='hotel'?22:key==='restaurant'?9:key==='market'?10:13+random()*7;w=key==='pencil'?11:key==='mall'?18:key==='office'?22:key==='restaurant'?8:key==='market'?12:18;d=key==='pencil'?14:key==='mall'?18:key==='office'?20:key==='restaurant'?13:key==='market'?14:18;}
      if(district.kind==='industrial'){key=random()>.5?'factory':'warehouse';h=15;w=20;d=20;}
      if(district.kind==='water'){key=random()>.5?'house':'shop';h=10+random()*5;w=14;d=14;}
      buildingPlan.push({key,x,z,w,h,d});
      obstacles.push({x,z,halfX:w*.48+1,halfZ:d*.48+1});
    }
  });

  const landmarkPlan=[
    {key:'cityhall',x:-54,z:-54,w:36,h:31.22,d:34},
    {key:'police',x:54,z:-54,w:31.18,h:19.36,d:29.5},
    {key:'hospital',x:-54,z:54,w:54,h:32.34,d:38.5},
    {key:'firestation',x:54,z:54,w:30.84,h:32,d:18.4},
    {key:'fuelstation',x:105,z:-35,w:16,h:6,d:13},
    {key:'supermarket',x:105,z:-105,w:30,h:8,d:22},
    {key:'publicHousing',x:-245,z:-180,w:42,h:14,d:10},
    {key:'fbi',x:385,z:-385,w:46,h:71,d:29},
    {key:'militaryHangar',x:385,z:455,w:62,h:19,d:53},
    {key:'warehouse',x:455,z:455,w:36,h:13,d:24},
    {key:'warehouse',x:385,z:525,w:34,h:12,d:22}
  ];
  for(const p of landmarkPlan){
    obstacles.push({x:p.x,z:p.z,halfX:p.w*.5+1,halfZ:p.d*.5+1});
  }

  // Distinct asset instances; load shared source files once and clone for every placement.
  const coreJobs=[];
  for(const p of buildingPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  for(const p of landmarkPlan)coreJobs.push(place(p.key,p.x,p.z,p.w,p.h,p.d));
  // Military base: a fenced, guarded compound with real GLB towers and vehicles.
  const militaryAssets=[
    ['militaryGuardTower',360,430,15,10,6,0],['militaryGuardTower',480,430,15,10,6,Math.PI],
    ['militaryGuardTower',360,550,15,10,6,0],['militaryGuardTower',480,550,15,10,6,Math.PI],
    ['militaryVehicle',448,500,2.7,4,5.4,Math.PI],['battleTank',455,525,3.8,4.5,9.7,Math.PI/2],
    ['infantryFightingVehicle',455,545,3.8,3.9,7.7,Math.PI/2]
  ];
  for(const [key,x,z,w0,h0,d0,rot] of militaryAssets){
    coreJobs.push(place(key,x,z,w0,h0,d0,rot));
    if(key==='militaryGuardTower')obstacles.push({x,z,halfX:3.2,halfZ:3.2});
  }
  // Repeated 12 m CC0 fence modules define a clear military perimeter.
  for(let x=366;x<=474;x+=12){
    // Leave a 24 m opening for the guarded vehicle entrance.
    if(Math.abs(x-420)>=12){
      coreJobs.push(place('sidewalkFence',x,430,1.2,2.2,12,Math.PI/2));
      obstacles.push({x,z:430,halfX:5.8,halfZ:.9});
    }
    coreJobs.push(place('sidewalkFence',x,550,1.2,2.2,12,Math.PI/2));
    obstacles.push({x,z:550,halfX:5.8,halfZ:.9});
  }
  for(let z=442;z<=538;z+=12){
    coreJobs.push(place('sidewalkFence',360,z,1.2,2.2,12,0));
    coreJobs.push(place('sidewalkFence',480,z,1.2,2.2,12,0));
    obstacles.push({x:360,z,halfX:.9,halfZ:5.8},{x:480,z,halfX:.9,halfZ:5.8});
  }
  // Agency signs are real 3D boards with crisp canvas lettering, not flat UI labels.
  function agencySign(title,subtitle,x,z,width,color){
    const group=new T.Group();
    const metal=new T.MeshStandardMaterial({color:0x252d35,metalness:.72,roughness:.34});
    const board=new T.Mesh(new T.BoxGeometry(width,2.6,.34),metal);board.position.y=5.4;group.add(board);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#ffffff';ctx.font='bold '+(title.length>22?52:76)+'px Arial';ctx.textAlign='center';ctx.fillText(title,512,112);
    ctx.font='600 34px Arial';ctx.fillStyle='#e8edf2';ctx.fillText(subtitle,512,184);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(width-.35,2.25),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));face.position.set(0,5.4,.19);group.add(face);
    for(const side of [-1,1]){const post=new T.Mesh(new T.BoxGeometry(.28,5.4,.32),metal);post.position.set(side*(width/2-.45),2.7,0);group.add(post);}
    group.position.set(x,0,z);scene.add(group);return group;
  }
  agencySign('FEDERAL BUREAU OF INVESTIGATION','FBI • FEDERAL FIELD OFFICE',385,-368,17,'#173d67');
  agencySign('ARMY BASE','MILITARY COMMAND • AUTHORIZED PERSONNEL ONLY',420,432,20,'#354b37');
  // Guard booth, concrete gate posts and a striped boom arm at the base entrance.
  const gateGroup=new T.Group();
  const gateConcrete=new T.MeshStandardMaterial({color:0x6e777b,roughness:.88});
  const gateGlass=new T.MeshPhysicalMaterial({color:0x29404b,metalness:.18,roughness:.12,transparent:true,opacity:.78});
  for(const side of [-1,1]){
    const post=new T.Mesh(new T.BoxGeometry(.9,4.2,.9),gateConcrete);post.position.set(side*8,2.1,0);gateGroup.add(post);
  }
  const booth=new T.Mesh(new T.BoxGeometry(3.2,2.8,3.2),gateConcrete);booth.position.set(12,1.4,5);gateGroup.add(booth);
  const boothWindow=new T.Mesh(new T.BoxGeometry(3.25,1.05,.08),gateGlass);boothWindow.position.set(12,1.9,3.35);gateGroup.add(boothWindow);
  const barrier=new T.Group();barrier.position.set(-7,3.2,0);gateGroup.add(barrier);
  const arm=new T.Mesh(new T.BoxGeometry(14,.2,.2),new T.MeshStandardMaterial({color:0xe8e5dc,roughness:.45}));arm.position.x=7;barrier.add(arm);
  for(let stripe=0;stripe<7;stripe++){
    const band=new T.Mesh(new T.BoxGeometry(.72,.22,.23),new T.MeshStandardMaterial({color:stripe%2?0x20252a:0xe1b94e,roughness:.5}));band.position.set(1+stripe*1.8,0,0);barrier.add(band);
  }
  gateGroup.position.set(420,0,430);scene.add(gateGroup);
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
  // Real modular sidewalk fencing gives the waterfront a finished pedestrian edge.
  for(let x=-264;x<=-144;x+=12)propPlan.push({key:'sidewalkFence',x,z:164,w:6,h:1,d:12,rotation:Math.PI/2});
  for(const [x,z] of [[-175,35],[175,-35],[35,175],[-35,-175],[-175,-105],[175,105]]){
    plane(25,25,x,z,mat(0x536d4b),-.02);
    for(let k=-1;k<=1;k++)propPlan.push({key:k===0?'tree2':'tree',x:x+k*7,z:z+(k%2)*3,w:5,h:9,d:5});
    propPlan.push({key:'bench',x,z:z+8,w:4,h:1.5,d:1.5});
  }
  for(const [x,z] of [[-175,-245],[175,-245],[175,245],[-175,245]]){
    plane(30,24,x,z,mat(0x4f704a),-.02);
    for(const [dx,dz] of [[-9,-6],[0,-7],[9,-6],[-8,7],[8,7]]){
      propPlan.push({key:Math.abs(dx)<1?'tree2':'tree',x:x+dx,z:z+dz,w:5,h:10,d:5});
    }
    propPlan.push({key:'bench',x:x-5,z:z+1,w:4,h:1.5,d:1.5});
    propPlan.push({key:'bench',x:x+5,z:z+1,w:4,h:1.5,d:1.5});
    propPlan.push({key:'bin',x:x+12,z:z+8,w:1.2,h:1.5,d:1.2});
  }
  for(let p=-280;p<=280;p+=70){
    if(Math.abs(p)<=175)continue;
    for(const side of [-1,1]){
      propPlan.push({key:'lamp',x:p,z:side*11,w:.5,h:9,d:3.42});
      propPlan.push({key:'lamp',x:side*11,z:p,w:.5,h:9,d:3.42});
    }
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
  function createVehicleFallback(key,dims,emergency=false){
    const [width,height,length]=dims;
    const group=new T.Group();
    const paintColor=key==='policecar'?0x172f50:key==='fireengine'?0xc62c2c:key==='ambulance'?0xe7e9e5:key==='bus'?0x277e82:key==='coupe'?0x9b3029:key==='suv'?0x8cabb2:key==='van'?0xb8b9b5:0x536c7b;
    const paint=new T.MeshPhysicalMaterial({color:paintColor,metalness:.48,roughness:.3,clearcoat:.8,clearcoatRoughness:.22});
    const glass=new T.MeshPhysicalMaterial({color:0x1c3440,metalness:.22,roughness:.12,transparent:true,opacity:.88});
    const rubber=new T.MeshStandardMaterial({color:0x111417,roughness:.94});
    const alloy=new T.MeshStandardMaterial({color:0x9ca6a8,metalness:.85,roughness:.24});
    const trim=new T.MeshStandardMaterial({color:0x252c31,metalness:.55,roughness:.45});
    const lamp=new T.MeshStandardMaterial({color:0xe8f0ec,emissive:0x66716e,roughness:.24});
    const red=new T.MeshStandardMaterial({color:0xb9252a,emissive:0x310508});
    const add=(parent,geo,material,x,y,z)=>{const mesh=new T.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
    const lower=add(group,new T.BoxGeometry(width*.94,height*.34,length*.9),paint,0,height*.31,0);
    const hood=add(group,new T.BoxGeometry(width*.88,height*.18,length*.28),paint,0,height*.48,length*.3);
    const cabin=add(group,new T.BoxGeometry(width*.78,height*.42,length*.48),paint,0,height*.69,-length*.035);
    add(group,new T.BoxGeometry(width*.72,height*.32,.045),glass,0,height*.72,length*.205);
    add(group,new T.BoxGeometry(width*.72,height*.3,.045),glass,0,height*.72,-length*.275);
    for(const side of [-1,1]){
      add(group,new T.BoxGeometry(.045,height*.25,length*.34),glass,side*width*.395,height*.72,-length*.045);
      add(group,new T.BoxGeometry(.12,.13,.28),paint,side*width*.49,height*.64,length*.2);
      for(const z of [-length*.29,length*.29]){
        const wheel=new T.Group();wheel.name=(z>0?'wheel_F':'wheel_R')+(side<0?'L':'R');
        wheel.position.set(side*width*.49,height*.23,z);group.add(wheel);
        const tyre=add(wheel,new T.CylinderGeometry(height*.22,height*.22,.22,24),rubber,0,0,0);tyre.rotation.z=Math.PI/2;
        const rim=add(wheel,new T.CylinderGeometry(height*.12,height*.12,.235,20),alloy,0,0,0);rim.rotation.z=Math.PI/2;
        const hub=add(wheel,new T.CylinderGeometry(height*.055,height*.055,.245,16),trim,0,0,0);hub.rotation.z=Math.PI/2;
      }
    }
    add(group,new T.BoxGeometry(width*.98,.13,.18),trim,0,height*.22,length*.46);
    add(group,new T.BoxGeometry(width*.98,.13,.18),trim,0,height*.22,-length*.46);
    for(const side of [-1,1]){
      add(group,new T.BoxGeometry(width*.16,.14,.08),lamp,side*width*.32,height*.48,length*.455);
      add(group,new T.BoxGeometry(width*.14,.13,.08),red,side*width*.32,height*.43,-length*.455);
      add(group,new T.BoxGeometry(.1,.22,.12),lamp,side*width*.49,height*.73,length*.12);
    }
    add(group,new T.BoxGeometry(width*.42,.2,.08),trim,0,height*.39,length*.47);
    if(key==='bus'){
      for(let row=0;row<5;row++)for(const side of [-1,1])add(group,new T.BoxGeometry(.045,.42,.92),glass,side*width*.485,height*.75,-length*.32+row*length*.14);
      add(group,new T.BoxGeometry(width*.72,.1,.07),trim,0,height*.9,-length*.06);
    }
    const emergencyLights=[];
    if(key==='ambulance'||key==='policecar'||emergency){
      add(group,new T.BoxGeometry(width*.62,.12,.32),trim,0,height*1.02,-length*.03);
      emergencyLights.push(add(group,new T.BoxGeometry(width*.25,.16,.28),new T.MeshStandardMaterial({color:0x2879ef,emissive:0x102c88}),-width*.17,height*1.04,-length*.03));
      emergencyLights.push(add(group,new T.BoxGeometry(width*.25,.16,.28),new T.MeshStandardMaterial({color:0xd82c36,emissive:0x65070c}),width*.17,height*1.04,-length*.03));
    }
    group.userData.fallbackVehicle=true;
    group.userData.emergencyLights=emergencyLights;
    return group;
  }
  async function car(key,x,z,rotation=0,emergency=false){
    const dims=key==='fireengine'?[3.21,3.68,10.53]:key==='bus'?[2.89,3.1,12.4]:key==='ambulance'?[2.55,3.01,7.29]:key==='van'?[2.46,2.4,5.53]:key==='suv'||key==='fbiSUV'?[2.14,1.7,4.65]:key==='coupe'?[2.058,1.33,4.702]:key==='citycar'?[1.828,1.533,3.592]:key==='saloon'||key==='policecar'?[2,1.403,4.822]:[2.27,1.57,5.2];
    let loaded=await place(key,x,z,...dims,rotation);
    if(!loaded){
      loaded=createVehicleFallback(key,dims,emergency);
      loaded.position.set(x,0,z);
      loaded.rotation.y=rotation;
    }
    // Vehicle models face +Z; the driving rig uses -Z as forward.
    const emergencyLights=[...(loaded.userData.emergencyLights||[])];
    const model=new T.Group();
    model.position.copy(loaded.position);
    model.rotation.y=rotation;
    scene.remove(loaded);
    loaded.position.set(0,0,0);
    loaded.rotation.y=Math.PI;
    model.add(loaded);
    scene.add(model);
    const wheelNodes=[];
    loaded.traverse(node=>{
      if(/(wheel-(front|rear).*(rubber|metal|accent)|wheel_(fl|fr|rl|rr))/i.test(node.name)){
        node.userData.restQuaternion=node.quaternion.clone();
        node.userData.frontWheel=/wheel_(fl|fr)/i.test(node.name)||/wheel-front/i.test(node.name);
        wheelNodes.push(node);
      }
    });
    model.userData={...loaded.userData,vehicle:true,type:key,emergency,speed:0,steer:0,wheels:wheelNodes,mixer:loaded.userData.mixer||null,emergencyLights};
    if(emergency&&!emergencyLights.length){
      const red=new T.MeshStandardMaterial({color:0xd92735,emissive:0x4a0508});
      const blue=new T.MeshStandardMaterial({color:0x236be8,emissive:0x071a52});
      const lightGeo=new T.BoxGeometry(.48,.16,.22);
      const a=new T.Mesh(lightGeo,red),b=new T.Mesh(lightGeo,blue);
      a.position.set(-.42,1.95,0);b.position.set(.42,1.95,0);model.add(a,b);emergencyLights.push(a,b);
      const beacon=new T.Mesh(new T.BoxGeometry(1.15,.12,.34),new T.MeshStandardMaterial({color:0xf0f1ef,roughness:.45}));beacon.position.set(0,1.82,0);model.add(beacon);
    }
    if(key==='policecar'||key==='fbiSUV'){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
      const ctx=canvas.getContext('2d');ctx.fillStyle=key==='fbiSUV'?'#173d67':'#12385f';ctx.fillRect(0,0,512,128);
      ctx.fillStyle='#ffffff';ctx.font='bold 78px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(key==='fbiSUV'?'FBI':'POLICE',256,66);
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
    ['car',31,-12,.05,false],['suv',38,-12,.05,false],['coupe',-32,15,Math.PI,false],['policecar',38,-54,0,true],['fireengine',80,54,Math.PI/2,true],
    ['saloon',8,34,Math.PI/2,false],['ambulance',-54,82,Math.PI,true],['fireengine',54,82,Math.PI,true],
    ['fbiSUV',440,-385,Math.PI/2,true],['saloon',440,-397,Math.PI/2,false],
    ['citycar',-102,-70,Math.PI/2,false],['van',102,-70,Math.PI/2,false],['bus',130,35,0,false],
    ['saloon',-70,102,0,false],['coupe',70,102,0,false],['ambulance',170,32,Math.PI/2,true],
    ['car',-170,-30,Math.PI/2,false],['citycar',157,-117,0,false],['saloon',169,-117,0,false],['coupe',181,-117,0,false],['suv',193,-117,0,false]
  ];
  for(const [key,x,z,rot,emergency] of carPlan)coreJobs.push(car(key,x,z,rot,emergency));
  const trafficLoop=[[-280,-280],[280,-280],[280,280],[-280,280]];
  const busRoute=[[0,-280],[0,280],[70,280],[70,-280]];
  const trafficPlan=[
    {x:-235,z:-280,rot:Math.PI/2,index:1,key:'citycar'},
    {x:280,z:-30,rot:Math.PI,index:2,key:'saloon'},
    {x:235,z:280,rot:-Math.PI/2,index:3,key:'coupe'},
    {x:-280,z:30,rot:0,index:0,key:'van'},
    {x:0,z:-140,rot:-Math.PI/2,index:1,key:'bus',speed:4.5},
    {x:120,z:-280,rot:Math.PI/2,index:1,key:'suv',speed:6.8},
    {x:-280,z:-160,rot:0,index:0,key:'saloon',speed:8}
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
  const decorReady=ready.then(()=>Promise.allSettled(propPlan.map(p=>place(p.key,p.x,p.z,p.w,p.h,p.d,p.rotation||0))));
  districts.vehicles=vehicles;
  districts.windObjects=windObjects;
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
