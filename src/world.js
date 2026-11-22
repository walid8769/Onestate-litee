export function createWorld(T, scene) {
  const mat=(color,roughness=.78,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const mats={
    asphalt:mat(0x292e32,.96),sidewalk:mat(0xb7b5ad,.94),line:mat(0xe9e3d2,.8),
    grass:mat(0x66785b,1),curb:mat(0xd0c9b9,.9),glass:mat(0x263f50,.2,.48),
    glassLite:mat(0x66818d,.24,.32),concrete:mat(0xd2d0c9,.86),white:mat(0xe2e0d9,.7),
    dark:mat(0x343a3e,.85),metal:mat(0x778087,.38,.72),wood:mat(0x68513d,.9),
    leaf:mat(0x3d6947,1),trunk:mat(0x594532,1),roadMark:mat(0xe6dfc9,.8)
  };
  const box=(w,h,d,x,y,z,m,shadow=true)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;scene.add(o);return o;};
  const cyl=(r1,r2,h,x,y,z,m,seg=12)=>{const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;};
  const ground=new T.Mesh(new T.PlaneGeometry(720,720),mats.grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.16;ground.receiveShadow=true;scene.add(ground);
  // A broad, connected street grid with raised curbs, sidewalks, dashed lanes and crossings.
  for(let p=-210;p<=210;p+=70){
    box(720,.12,17,0,-.015,p,mats.asphalt,false);box(17,.12,720,p,-.015,0,mats.asphalt,false);
    for(const s of [-1,1]){box(720,.2,2.1,0,.08,p+s*10,mats.sidewalk,false);box(2.1,.2,720,p+s*10,.08,0,mats.sidewalk,false);box(720,.22,.22,0,.18,p+s*8.95,mats.curb,false);box(.22,.22,720,p+s*8.95,.18,0,mats.curb,false);}
    for(let q=-340;q<350;q+=18){box(6,.018,.16,q,.052,p,mats.roadMark,false);box(.16,.018,6,p,.052,q,mats.roadMark,false);}
    for(let n=-3;n<=3;n++){box(1.05,.025,5.8,p+n*1.65,.055,p-13,mats.line,false);box(5.8,.025,1.05,p-13,.055,p+n*1.65,mats.line,false);}
    // Drain covers and sidewalk slabs add scale and texture.
    for(let q=-280;q<290;q+=35){box(1.5,.025,.75,q,.205,p+11.1,mats.dark,false);box(.75,.025,1.5,p+11.1,.205,q,mats.dark,false);}
  }
  const districts=[
    {name:'وسط المدينة',cx:0,cz:0,kind:'tower'},
    {name:'الحي السكني',cx:-140,cz:-140,kind:'homes'},
    {name:'المنطقة التجارية',cx:140,cz:-140,kind:'shops'},
    {name:'المنطقة الصناعية',cx:140,cz:140,kind:'industrial'},
    {name:'الواجهة البحرية',cx:-140,cz:140,kind:'water'}
  ];
  const palettes=[0xd1d1ca,0xbab7ad,0x8b9ba0,0xc3b49c,0x71858d,0xaaa9a1,0x9caaa5];
  const windowMats=[mats.glass,mats.glassLite,mat(0x172d3a,.18,.5)];
  const obstacles=[];
  function building(x,z,w,d,h,kind,index){
    obstacles.push({x,z,halfX:w*.5+.8,halfZ:d*.5+.8});
    const facade=mat(palettes[index%palettes.length],.86);
    box(w,h,d,x,h/2,z,facade);
    // Architectural podium, vertical fins and a strong roofline.
    box(w+.45,.55,d+.45,x,.28,z,mats.concrete,false);
    box(w+.3,.24,d+.3,x,h-.08,z,mats.white,false);
    const floors=Math.max(2,Math.floor(h/3.15));
    for(let f=0;f<floors;f++){
      const y=1.55+f*3.05;if(y>h-1)continue;
      const count=Math.max(2,Math.floor(w/2.8));
      for(let n=0;n<count;n++){
        const xx=x-w/2+(n+.5)*w/count;
        const win=windowMats[(n+f+index)%windowMats.length];
        box(w/count*.72,1.75,.095,xx,y,z-d/2-.055,win,false);
        box(w/count*.72,1.75,.095,xx,y,z+d/2+.055,win,false);
        box(.055,1.85,.12,xx,y,z-d/2-.11,mats.metal,false);
        box(.055,1.85,.12,xx,y,z+d/2+.11,mats.metal,false);
      }
      if(kind==='tower'||kind==='shops'){
        box(w+.12,.12,.55,x,y-.95,z-d/2-.22,mats.white,false);
        box(w+.12,.12,.55,x,y-.95,z+d/2+.22,mats.white,false);
      }
    }
    for(const side of [-1,1])for(let n=-1;n<=1;n++){
      const xx=x+n*w*.29;
      box(.18,h*.84,.2,xx,h*.52,z+side*(d/2+.09),mats.concrete,false);
    }
    // Ground-floor storefronts, canopies, signage bands and recessed entrances.
    box(w*.66,2.25,.13,x,1.55,z-d/2-.12,mats.glass,false);
    box(w*.16,2.35,.16,x-w*.34,1.55,z-d/2-.16,mats.dark,false);
    box(w*.78,.22,.72,x,2.82,z-d/2-.42,mats.dark,false);
    box(w*.72,.09,.12,x,2.68,z-d/2-.82,mat(0xd2b477,.6),false);
    for(let n=-1;n<=1;n++){box(.09,2.05,.12,x+n*w*.27,1.55,z-d/2-.2,mats.white,false);}
    // Repeated balcony rails and slab edges make upper floors read as architecture.
    if(kind!=='industrial')for(let f=1;f<Math.min(floors,7);f+=2){const by=1.55+f*3.05;box(w*.84,.12,.75,x,by-.82,z+d/2+.22,mats.concrete,false);box(w*.84,.08,.08,x,by-.38,z+d/2+.55,mats.metal,false);for(let q=-3;q<=3;q++)box(.055,.42,.055,x+q*w*.11,by-.59,z+d/2+.55,mats.metal,false);}
    if(kind==='homes'){
      box(w*.82,.45,d*.82,x,h+.22,z,mat(0x716b60),false);
      for(let k=-1;k<=1;k++)box(w*.76,.16,.7,x,2.7,z+k*d*.28,mats.white,false);
    }
    if(kind==='industrial'){
      box(w*.18,2.6,.18,x+w*.28,1.7,z-d/2-.16,mats.dark,false);
      for(let k=0;k<2;k++)cyl(1.05,1.25,3.4,x-w*.25+k*3,h+1.7,z, mats.metal,16);
    }
    if(kind==='tower'){
      for(let k=0;k<4;k++)box(.3,h*.78,.34,x-w*.42+k*w*.28,h*.52,z-d/2-.2,mats.white,false);
      box(w*.7,1.2,d*.7,x,h+.55,z,mats.dark,false);
    }
    // Rooftop equipment, parapets and HVAC units.
    box(w*.22,.9,d*.2,x-w*.25,h+.58,z,mats.dark,false);
    box(w*.12,.55,d*.16,x+w*.25,h+.4,z,mats.metal,false);
    box(w+.35,.65,.28,x,h+.25,z-d/2,mats.concrete,false);box(w+.35,.65,.28,x,h+.25,z+d/2,mats.concrete,false);
    for(let q=-1;q<=1;q++)box(.8,.65,.8,x+q*w*.28,h+.7,z,mats.metal,false);
  }
  let seed=731;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  districts.forEach((d,di)=>{
    for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
      const x=d.cx+ix*20,z=d.cz+iz*20;if(Math.abs(x)<24&&Math.abs(z)<24)continue;
      const kind=d.kind==='tower'?'tower':d.kind;
      const h=kind==='tower'?25+rnd()*34:kind==='industrial'?10+rnd()*8:kind==='shops'?12+rnd()*13:8+rnd()*9;
      building(x,z,kind==='homes'?13:14+rnd()*4,kind==='homes'?13:14+rnd()*4,h,kind,di+ix+iz+5);
    }
  });
  // Central civic landmark, glass facade and plaza.
  box(34,.38,34,0,.12,0,mats.sidewalk,false);
  for(let k=-1;k<=1;k++){box(34,.1,1.2,0,.34,k*12,mats.white,false);box(1.2,.1,34,k*12,.34,0,mats.white,false);}
  const tower=mat(0x718995,.22,.4);box(20,61,20,0,30.5,0,tower);
  for(let y=5;y<58;y+=5){box(20.25,.22,20.25,0,y,0,mats.metal,false);box(20.4,.08,.45,0,y+1,10.2,mats.white,false);}
  box(7,2.4,7,0,62,0,mats.dark);cyl(1.1,1.1,8,0,67,0,mats.metal,16);
  // Pocket parks with layered trees, planters, benches and street lights.
  function tree(x,z,scale=1){cyl(.2*scale,.34*scale,3.5*scale,x,1.75*scale,z,mats.trunk,10);const crown=new T.Mesh(new T.SphereGeometry(1.75*scale,14,11),mats.leaf);crown.position.set(x,3.9*scale,z);crown.scale.set(1,1.22,.95);crown.castShadow=true;scene.add(crown);const top=new T.Mesh(new T.SphereGeometry(1.1*scale,12,9),mat(0x527b4c,1));top.position.set(x+.45*scale,5*scale,z);scene.add(top);}
  for(const [x,z] of [[-105,-105],[-105,105],[105,-105],[105,105],[-175,0],[175,0]]){box(25,.16,25,x,.02,z,mat(0x536f4c),false);for(let k=-1;k<=1;k++)tree(x+k*7,z+(k%2)*3,.82);box(4,.34,.55,x,.65,z+8,mats.wood,false);box(4,.12,.7,x,.9,z+8,mats.dark,false);}
  for(let p=-175;p<=175;p+=35)for(const s of [-1,1]){cyl(.09,.13,5,p,2.5,s*11,mats.dark,8);box(1.5,.12,.14,p+.65,4.85,s*11,mats.dark,false);const bulb=new T.Mesh(new T.SphereGeometry(.18,10,8),new T.MeshStandardMaterial({color:0xffd28a,emissive:0xffb84d,emissiveIntensity:.65}));bulb.position.set(p+1.35,4.78,s*11);scene.add(bulb);}
  // City furniture: signal poles, pedestrian crossings, bus shelters and safety bollards.
  const signalRed=new T.MeshStandardMaterial({color:0x3b1717,emissive:0x8e1717,emissiveIntensity:.55});
  const signalAmber=new T.MeshStandardMaterial({color:0x473313,emissive:0xb87818,emissiveIntensity:.45});
  const signalGreen=new T.MeshStandardMaterial({color:0x153c27,emissive:0x1b9c50,emissiveIntensity:.5});
  for(const [ix,iz] of [[-70,-70],[0,-70],[70,-70],[-70,0],[70,0],[-70,70],[0,70],[70,70]]){
    for(const side of [-1,1]){
      const sx=ix+side*12,sz=iz+side*12;
      cyl(.12,.16,5.8,sx,2.9,sz,mats.dark,10);
      box(1.45,.13,.13,sx+side*.62,5.55,sz,mats.dark,false);
      box(.42,.95,.38,sx+side*1.22,5.02,sz,mats.dark,false);
      for(let k=0;k<3;k++){const bulb=new T.Mesh(new T.SphereGeometry(.13,10,8),[signalRed,signalAmber,signalGreen][k]);bulb.position.set(sx+side*1.22,5.32-k*.29,sz+.2);scene.add(bulb);}
    }
    // Zebra crossing bars on both sides of the junction.
    for(let n=-4;n<=4;n++){box(.82,.025,4.8,ix+n*1.05,.065,iz-12.4,mats.white,false);box(4.8,.025,.82,ix-12.4,.065,iz+n*1.05,mats.white,false);}
  }
  for(const [x,z] of [[-35,-118],[35,-118],[118,-35],[118,35],[-118,35],[-118,-35]]){
    // Glass bus shelter with a bench and route sign.
    box(5.8,.12,2.3,x,.1,z,mats.concrete,false);
    for(const sx of [-2.55,2.55])for(const sz of [-.88,.88])box(.12,2.35,.12,x+sx,1.25,z+sz,mats.metal,false);
    box(5.1,2.05,.09,x,1.25,z-.88,mats.glassLite,false);
    box(5.4,.16,2.15,x,2.48,z,mats.dark,false);
    box(3.3,.16,.55,x,.72,z+.48,mats.wood,false);
    box(.13,1.4,.16,x-2.85,1,z,mats.dark,false);
    box(.9,1.05,.12,x-2.85,1.35,z-.12,mat(0xd2b477,.5),false);
  }
  for(const [x,z] of [[-20,-24],[20,-24],[-24,20],[24,20],[-90,12],[90,-12],[12,90],[-12,-90]]){
    // Street bins and fire hydrants add human-scale detail to sidewalks.
    cyl(.32,.38,.85,x,.53,z,mat(0x35434a,.9),12);
    cyl(.12,.12,.7,x+1.15,.45,z,mat(0xb8322d,.55),10);
    cyl(.23,.23,.16,x+1.15,.76,z,mat(0xb8322d,.55),10);
    box(.62,.13,.14,x+1.15,.53,z,mat(0xb8322d,.55),false);
  }
  // Tree-lined avenues outside the central blocks.
  for(let p=-210;p<=210;p+=35)for(const side of [-1,1]){
    if(Math.abs(p)<45)continue;
    tree(p,side*15,.72);tree(side*15,p,.72);
  }
  // Parked vehicles: recognizable proportions, glass cabin, bumpers, lights and wheels.
  const vehicles=[];
  function car(x,z,color=0xd8dce0,rot=0,emergency=false){
    const g=new T.Group();g.position.set(x,.18,z);g.rotation.y=rot;scene.add(g);g.userData={vehicle:true,emergency,speed:0,steer:0};vehicles.push(g);
    const paint=mat(color,.34,.38),rubber=mat(0x15191c,.9),rim=mat(0xaeb7bc,.3,.8);
    const add=(geo,m,px,py,pz)=>{const o=new T.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
    add(new T.BoxGeometry(2.25,.62,4.35),paint,0,.72,0);
    add(new T.BoxGeometry(1.8,.72,2.25),mats.glass,0,1.35,-.15);
    add(new T.BoxGeometry(2.3,.18,.25),mats.dark,0,.52,2.18);
    add(new T.BoxGeometry(2.3,.18,.25),mats.dark,0,.52,-2.18);
    for(const xx of [-1.14,1.14])for(const zz of [-1.35,1.35]){const w=add(new T.CylinderGeometry(.42,.42,.22,18),rubber,xx,.48,zz);w.rotation.z=Math.PI/2;const r=add(new T.CylinderGeometry(.22,.22,.235,14),rim,xx,.48,zz);r.rotation.z=Math.PI/2;}
    for(const xx of [-.72,.72]){add(new T.BoxGeometry(.48,.22,.08),mat(0xf7f1d9,.3),xx,.78,2.2);add(new T.BoxGeometry(.45,.2,.08),mat(0xc52f2b,.3),xx,.78,-2.2);}
    if(emergency){
      add(new T.BoxGeometry(1.05,.15,.28),mat(0xd92828,.25,.2),0,1.78,-.15);add(new T.BoxGeometry(.35,.12,.2),mat(0x2869dc,.2),-.4,1.78,-.15);
      add(new T.BoxGeometry(2.28,.24,2.7),mat(0xf4f3ee,.5),0,1.27,-.95);
      add(new T.BoxGeometry(2.3,.16,2.4),mat(0xd52e32,.45),0,.91,-.9);
      add(new T.BoxGeometry(.12,.62,.12),mats.white,-1.17,1.3,-.15);add(new T.BoxGeometry(.12,.62,.12),mats.white,1.17,1.3,-.15);
      add(new T.BoxGeometry(.7,.12,.08),mat(0x1c5a9b,.4),0,1.72,-.15);
    }
    return g;
  }
  car(31,-12,0xf0f0ed,.05);car(38,-12,0x242b31,.05);car(-32,15,0xc6cbd0,Math.PI);car(8,34,0xd7dadd,Math.PI/2);
  car(26,10,0xe7e9e6,Math.PI/2,true);
  // More parked traffic around the playable districts to give the streets scale.
  car(-102,-70,0x263d50,Math.PI/2);car(102,-70,0xb7b9bd,Math.PI/2);
  car(-70,102,0x8d3034,0);car(70,102,0xe4e2d9,0);
  car(170,32,0x263d50,Math.PI/2,true);
  districts.vehicles=vehicles;
  districts.obstacles=obstacles;
  return districts;
}
