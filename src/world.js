export function createWorld(THREE, scene) {
  const mats = {
    ground: new THREE.MeshStandardMaterial({ color: 0x66745d, roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: 0x292f34, roughness: 0.95 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x999b96, roughness: 1 }),
    line: new THREE.MeshStandardMaterial({ color: 0xd5c79e, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x594332 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x456b4a, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8aa6b3, metalness: 0.35, roughness: 0.25 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffd58a, emissive: 0xffb84d, emissiveIntensity: 1.3 })
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), mats.ground);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; scene.add(ground);
  function block(w,h,d,x,y,z,mat,shadow=true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z); m.castShadow=shadow; m.receiveShadow=true; scene.add(m); return m;
  }
  // Main avenues and smaller cross streets.
  for (let p=-210;p<=210;p+=70) {
    block(520,.14,13,0,.02,p,mats.road,false);
    block(13,.14,520,p,.02,0,mats.road,false);
    block(520,.16,2,0,.11,p-7.5,mats.sidewalk,false);
    block(520,.16,2,0,.11,p+7.5,mats.sidewalk,false);
    block(2,.16,520,p-7.5,.11,0,mats.sidewalk,false);
    block(2,.16,520,p+7.5,.11,0,mats.sidewalk,false);
    for(let k=-240;k<240;k+=18){
      block(5,.025,.22,k,.105,p,mats.line,false);
      block(.22,.025,5,p,.105,k,mats.line,false);
    }
  }
  const palettes=[0x8c969a,0xb1a38d,0x657783,0x9c927e,0x7c8c80,0x77777a];
  const buildingMats=palettes.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.78}));
  const windowMat=new THREE.MeshStandardMaterial({color:0x263e4b,metalness:.25,roughness:.28});
  const districts=[
    {name:"وسط المدينة",cx:0,cz:0,kind:"tower"},
    {name:"الحي السكني",cx:-140,cz:-140,kind:"homes"},
    {name:"المنطقة التجارية",cx:140,cz:-140,kind:"shops"},
    {name:"المنطقة الصناعية",cx:140,cz:140,kind:"industrial"},
    {name:"الواجهة البحرية",cx:-140,cz:140,kind:"homes"}
  ];
  for(const district of districts){
    for(let ix=-1;ix<=1;ix++) for(let iz=-1;iz<=1;iz++){
      const x=district.cx+ix*19, z=district.cz+iz*19;
      if(Math.abs(x)<19&&Math.abs(z)<19) continue;
      const h=district.kind==="tower"?24+Math.random()*38:
        district.kind==="industrial"?9+Math.random()*9:
        district.kind==="shops"?8+Math.random()*12:6+Math.random()*8;
      const w=district.kind==="homes"?12:13+Math.random()*4;
      const d=district.kind==="homes"?12:13+Math.random()*4;
      const mat=new THREE.MeshStandardMaterial({color:palettes[Math.floor(Math.random()*palettes.length)],roughness:.8});
      block(w,h,d,x,h/2,z,mat);
      if(h>12){
        for(let floor=3;floor<h-2;floor+=4){
          block(w+.03,.18,d+.03,x,floor,z,windowMat,false);
        }
      }
      if(district.kind==="industrial"){
        block(2,4,2,x+w*.28,h+2,z,mat);
      }
    }
  }
  // Central landmark tower and plaza.
  block(24,54,24,0,27,0,new THREE.MeshStandardMaterial({color:0x777f82,metalness:.25,roughness:.45}));
  block(27,1,27,0,.35,0,mats.sidewalk,false);
  block(5,58,5,0,57,0,mats.glass);
  // Trees along selected sidewalks.
  for(let x=-190;x<=190;x+=35) for(const z of [-18,18]){
    block(.8,4,.8,x,2,z,mats.trunk,false);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(2.5,8,7),mats.leaf);crown.position.set(x,5,z);crown.castShadow=true;scene.add(crown);
  }
  // Street lamps.
  for(let p=-175;p<=175;p+=35) for(const z of [-10,10]){
    block(.22,5,.22,p,2.5,z,new THREE.MeshStandardMaterial({color:0x33383c}),false);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),mats.lamp);bulb.position.set(p,5,z);scene.add(bulb);
  }
  return districts;
}