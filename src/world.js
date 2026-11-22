export function createWorld(THREE, scene) {
  const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const groundMat=mat(0x687b5c,1),roadMat=mat(0x252b30,.96),sideMat=mat(0xaaa99f,1),lineMat=mat(0xe0d4ad,.9);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(620,620),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
  function box(w,h,d,x,y,z,material,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;}
  // Road grid, raised sidewalks, lane dividers and crosswalks.
  for(let p=-210;p<=210;p+=70){
    box(620,.16,14,0,.015,p,roadMat,false);box(14,.16,620,p,.015,0,roadMat,false);
    box(620,.22,2.2,0,.12,p-8.2,sideMat,false);box(620,.22,2.2,0,.12,p+8.2,sideMat,false);
    box(2.2,.22,620,p-8.2,.12,0,sideMat,false);box(2.2,.22,620,p+8.2,.12,0,sideMat,false);
    for(let k=-290;k<300;k+=22){box(7,.025,.2,k,.105,p,lineMat,false);box(.2,.025,7,p,.105,k,lineMat,false);}
    for(let n=-2;n<=2;n++){box(1.1,.035,5.5,p+n*1.8,.12,p-11,sideMat,false);box(5.5,.035,1.1,p-11,.12,p+n*1.8,sideMat,false);}
  }
  const districts=[
    {name:'وسط المدينة',cx:0,cz:0,kind:'tower'},
    {name:'الحي السكني',cx:-140,cz:-140,kind:'homes'},
    {name:'المنطقة التجارية',cx:140,cz:-140,kind:'shops'},
    {name:'المنطقة الصناعية',cx:140,cz:140,kind:'industrial'},
    {name:'الواجهة البحرية',cx:-140,cz:140,kind:'homes'}
  ];
  const palettes=[0x89969a,0xb8a98e,0x607785,0xa59a86,0x71877c,0x777b80,0x9b8d80];
  const glass=mat(0x243e4d,.28,.35),darkGlass=mat(0x172c38,.22,.4),roof=mat(0x444b50,.9),trim=mat(0xd0c7b4,.72);
  for(const district of districts){
    for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
      const x=district.cx+ix*19,z=district.cz+iz*19;if(Math.abs(x)<19&&Math.abs(z)<19)continue;
      const h=district.kind==='tower'?28+Math.random()*38:district.kind==='industrial'?10+Math.random()*9:district.kind==='shops'?9+Math.random()*12:7+Math.random()*8;
      const w=district.kind==='homes'?12:13+Math.random()*4,d=district.kind==='homes'?12:13+Math.random()*4;
      const facade=mat(palettes[Math.floor(Math.random()*palettes.length)],.84);
      box(w,h,d,x,h/2,z,facade);
      box(w+.25,.35,d+.25,x,h+.16,z,roof,false);
      // Recessed-looking window bands on each visible facade.
      const floors=Math.max(1,Math.floor(h/3.2));
      for(let f=1;f<floors;f++){
        const y=f*3.1;
        for(let wx=-1;wx<=1;wx++){
          const ww=w/4.8;
          box(ww,1.35,.08,x+wx*w*.29,y,z-d/2-.045,glass,false);
          box(ww,1.35,.08,x+wx*w*.29,y,z+d/2+.045,glass,false);
        }
        if(district.kind==='tower')box(w+.08,.12,d+.08,x,y-1.1,z,trim,false);
      }
      for(let wz=-1;wz<=1;wz++)box(.08,Math.min(h*.8,12),d/4,x-w/2-.05,h*.52,z+wz*d*.28,darkGlass,false);
      if(district.kind==='industrial'){box(2,4,2,x+w*.28,h+2,z,roof);box(3,1,3,x,h+1,z,trim,false);}
      if(district.kind==='shops'){box(w*.72,2.2,.16,x,1.5,z-d/2-.12,darkGlass,false);box(w*.8,.25,.4,x,2.8,z-d/2-.2,trim,false);}
      if(district.kind==='homes'){box(w*.72,.4,d*.72,x,h+.35,z,mat(0x665e53),false);}
    }
  }
  // Landmark plaza and central tower.
  box(30,.45,30,0,.18,0,sideMat,false);box(22,58,22,0,29,0,mat(0x687982,.42,.3));
  for(let y=7;y<55;y+=6){box(22.15,.22,22.15,0,y,0,trim,false);}
  box(6,64,6,0,61,0,glass);
  // Small parks, tree rows and benches.
  const trunk=mat(0x594331),leaf=mat(0x426b48,1),bench=mat(0x4a3d30);
  for(let x=-190;x<=190;x+=35)for(const z of [-19,19]){
    box(.55,3.2,.55,x,1.6,z,trunk,false);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.25,1),leaf);crown.position.set(x,4.2,z);crown.castShadow=true;scene.add(crown);
  }
  for(const [x,z] of [[-105,-105],[-105,105],[105,-105],[105,105]]){
    box(28,.12,28,x,.02,z,mat(0x526e4c),false);
    for(let i=-1;i<=1;i++){box(.8,1.4,.8,x+i*8,.7,z,trunk,false);const c=new THREE.Mesh(new THREE.SphereGeometry(2,12,9),leaf);c.position.set(x+i*8,2,z);c.castShadow=true;scene.add(c);}
    box(5,.35,.55,x, .65,z+8,bench,false);
  }
  const pole=mat(0x343b40),lamp= new THREE.MeshStandardMaterial({color:0xffd58a,emissive:0xffb84d,emissiveIntensity:1.15});
  for(let p=-175;p<=175;p+=35)for(const z of [-11,11]){
    box(.18,5,.18,p,2.5,z,pole,false);box(1.5,.16,.16,p+.65,4.85,z,pole,false);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),lamp);bulb.position.set(p+1.35,4.8,z);scene.add(bulb);
  }
  return districts;
}
