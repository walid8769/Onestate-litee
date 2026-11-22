// Procedural contemporary architecture: rounded massing, glazed facades, metal frames and roof equipment.
const palettes = {
  tower: [0x9da8ad, 0x263d4a, 0x647780],
  apartment: [0xb7a995, 0x253d49, 0x6e6254],
  house: [0xd0c6b4, 0x344956, 0x8b765f],
  shop: [0xc4c0b6, 0x203b49, 0x8a744f],
  market: [0xaaaeb0, 0x243d48, 0x65767c],
  bank: [0xb9b7ae, 0x213946, 0x9a845b],
  office: [0xaab5b8, 0x1c3948, 0x7a8d92],
  restaurant: [0xc3b49e, 0x253d48, 0x966c4c],
  mall: [0xb4b9b9, 0x1e3c4b, 0x7e8d91],
  hotel: [0xb7b0a5, 0x1d3a49, 0x9a8059],
  police: [0x9ba8b0, 0x1a3447, 0x73828b],
  hospital: [0xd0d5d4, 0x244b5a, 0x75a9ad],
  firestation: [0xb9b8b0, 0x263e49, 0xa64d42],
  cityhall: [0xc2b9a8, 0x233e4b, 0xa18b63],
  factory: [0x899397, 0x263d46, 0x5f6a6e],
  warehouse: [0xa1a49f, 0x2d4148, 0x777c77]
};
export function createUrbanBuilding(T, key, width, height, depth) {
  const group = new T.Group();
  const palette = palettes[key] || palettes.apartment;
  const wall = new T.MeshStandardMaterial({color:palette[0], roughness:.82});
  const glass = new T.MeshPhysicalMaterial({color:palette[1], roughness:.16, metalness:.35, transmission:.08, transparent:true, opacity:.94, envMapIntensity:1.1});
  const metal = new T.MeshStandardMaterial({color:palette[2], roughness:.38, metalness:.72});
  const concrete = new T.MeshStandardMaterial({color:0x777b7b, roughness:.92});
  const trim = new T.MeshStandardMaterial({color:0xe0ddd4, roughness:.62, metalness:.18});
  const floors = Math.max(1, Math.floor(height / (key==='house'?3.15:3.25)));
  const floorH = height / floors;
  const shape = new T.Shape();
  const r = Math.min(.65, width*.08, depth*.08);
  shape.moveTo(-width/2+r, 0); shape.lineTo(width/2-r,0); shape.quadraticCurveTo(width/2,0,width/2,r);
  shape.lineTo(width/2,depth-r); shape.quadraticCurveTo(width/2,depth,width/2-r,depth);
  shape.lineTo(-width/2+r,depth); shape.quadraticCurveTo(-width/2,depth,-width/2,depth-r);
  shape.lineTo(-width/2,r); shape.quadraticCurveTo(-width/2,0,-width/2+r,0);
  const shellGeo = new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.12,bevelThickness:.12,curveSegments:5});
  // Shape is the footprint; rotate its extrusion upright.
  shellGeo.rotateX(-Math.PI/2);
  shellGeo.translate(0,height,depth/2);
  const shell = new T.Mesh(shellGeo,wall); shell.castShadow=true; shell.receiveShadow=true; group.add(shell);
  const floorGeo = new T.BoxGeometry(width+.25,.16,depth+.25);
  for(let f=0;f<=floors;f++){
    const slab=new T.Mesh(floorGeo, f===floors?metal:trim);
    slab.position.set(0,f*floorH,0); slab.castShadow=true; slab.receiveShadow=true; group.add(slab);
  }
  const winW = Math.min(2.0, Math.max(.9,width/(key==='tower'?5:4)-.45));
  const winH = Math.min(2.05, floorH*.62);
  const frontCols = Math.max(2,Math.floor((width-.9)/(winW+.52)));
  const sideCols = Math.max(2,Math.floor((depth-.9)/(winW+.52)));
  const glassGeo = new T.PlaneGeometry(winW,winH);
  const makeWindows=(count,cols,span,side=false)=>{
    const mesh=new T.InstancedMesh(glassGeo,glass,count*cols);
    const frameH=new T.InstancedMesh(new T.BoxGeometry(winW+.12,.075,.08),metal,count*cols*2);
    const frameV=new T.InstancedMesh(new T.BoxGeometry(.075,winH+.12,.08),metal,count*cols*2);
    const dummy=new T.Object3D(); let index=0,hi=0,vi=0;
    for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
      const x=-span/2+(c+.5)*span/cols;
      const y=f*floorH+floorH*.53;
      dummy.position.set(side?depth/2+.035:x,y,side?x:depth/2+.035);
      dummy.rotation.y=side?Math.PI/2:0; dummy.updateMatrix(); mesh.setMatrixAt(index++,dummy.matrix);
      for(const yy of [y-winH/2-.055,y+winH/2+.055]){
        dummy.position.set(side?depth/2+.075:x,yy,side?x:depth/2+.075);dummy.rotation.set(0,side?Math.PI/2:0,0);dummy.updateMatrix();frameH.setMatrixAt(hi++,dummy.matrix);
      }
      for(const xx of [x-winW/2-.055,x+winW/2+.055]){
        dummy.position.set(side?depth/2+.075:xx,y,side?x:depth/2+.075);dummy.rotation.set(0,side?Math.PI/2:0,0);dummy.updateMatrix();frameV.setMatrixAt(vi++,dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate=true;frameH.instanceMatrix.needsUpdate=true;frameV.instanceMatrix.needsUpdate=true;
    mesh.castShadow=false;group.add(mesh,frameH,frameV);
  };
  makeWindows(floors,frontCols,width-.8,false);
  // Rear glass is a mirrored front facade; side windows are rotated ninety degrees.
  const back = new T.Group(); back.position.z=-depth-.07; back.scale.z=-1; group.add(back);
  const sideWindowGeo=new T.PlaneGeometry(winW,winH);
  for(const side of [-1,1]){
    const mesh=new T.InstancedMesh(sideWindowGeo,glass, floors*sideCols);
    const dummy=new T.Object3D();let n=0;
    for(let f=0;f<floors;f++)for(let c=0;c<sideCols;c++){
      dummy.position.set(side*(width/2+.045),f*floorH+floorH*.53,-depth/2+(c+.5)*(depth-.8)/sideCols);
      dummy.rotation.y=side>0?Math.PI/2:-Math.PI/2;dummy.updateMatrix();mesh.setMatrixAt(n++,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
  }
  // Continuous balcony bands on selected residential/commercial floors.
  if(['tower','apartment','hotel','office','cityhall'].includes(key)){
    for(let f=1;f<floors;f+=key==='tower'?2:3){
      const balcony=new T.Mesh(new T.BoxGeometry(width+.55,.12,.72),concrete);
      balcony.position.set(0,f*floorH+.12,depth/2+.25);group.add(balcony);
      const rail=new T.Mesh(new T.BoxGeometry(width+.5,.055,.055),metal);
      rail.position.set(0,f*floorH+.95,depth/2+.57);group.add(rail);
      for(let x=-width/2;x<=width/2+.01;x+=1.1){
        const post=new T.Mesh(new T.CylinderGeometry(.025,.025,.82,6),metal);
        post.position.set(x,f*floorH+.54,depth/2+.57);group.add(post);
      }
    }
  }
  // Roof parapet, lift core, HVAC and antennae break the silhouette.
  const parapetH=.65;
  for(const [x,z,w,d] of [[0,depth/2,width,.16],[0,-depth/2,width,.16],[-width/2,0,.16,depth],[width/2,0,.16,depth]]){
    const p=new T.Mesh(new T.BoxGeometry(w,parapetH,d),wall);p.position.set(x,height+parapetH/2,z);group.add(p);
  }
  const roofUnit=new T.Mesh(new T.BoxGeometry(Math.min(3,width*.3),.85,Math.min(2.4,depth*.3)),metal);
  roofUnit.position.set(width*.18,height+.45,-depth*.12);group.add(roofUnit);
  const vent=new T.Mesh(new T.CylinderGeometry(.18,.18,1.25,10),metal);
  vent.position.set(-width*.2,height+.7,depth*.18);group.add(vent);
  if(key==='police'||key==='hospital'||key==='firestation'){
    const sign=new T.Mesh(new T.BoxGeometry(Math.min(width*.65,8),.72,.12),key==='hospital'?new T.MeshStandardMaterial({color:0x3c9d9b,emissive:0x123c3b}):new T.MeshStandardMaterial({color:key==='police'?0x183c62:0xa8322c,emissive:0x160707}));
    sign.position.set(0,height*.72,depth/2+.12);group.add(sign);
  }
  // Front entrance with recessed dark glazing and a canopy.
  const door=new T.Mesh(new T.PlaneGeometry(Math.min(2.1,width*.22),2.45),glass);
  door.position.set(0,1.25,depth/2+.09);group.add(door);
  const canopy=new T.Mesh(new T.BoxGeometry(Math.min(width*.55,6),.18,1.15),metal);
  canopy.position.set(0,2.55,depth/2+.55);group.add(canopy);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
}
