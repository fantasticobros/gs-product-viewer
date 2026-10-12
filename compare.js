import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SparkRenderer,SplatMesh,SplatEdit,SplatEditSdf,SplatEditSdfType} from '@sparkjsdev/spark';
const $=id=>document.getElementById(id),camera=new THREE.PerspectiveCamera(35,1,.01,100);
const scale=.15902833676530082,floor=-5.268843650817871*scale;
camera.position.set(-.65,-.10,.85);
const sides=['left','right'].map(name=>{
 const host=$(name+'-view'),scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0);host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',name==='left'?'Rotera Splatfacto-modellen':'Rotera LichtFeld-modellen');
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,-.64,0);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.035;controls.rotateSpeed=.7;controls.minDistance=.6;controls.maxDistance=4;controls.maxPolarAngle=Math.PI/2-.04;controls.autoRotateSpeed=1.6;
 scene.add(new SparkRenderer({renderer}));const root=new THREE.Group();scene.add(root);
 const mask=new SplatEdit({softEdge:.01}),box=new SplatEditSdf({type:SplatEditSdfType.BOX,opacity:0});box.position.set(0,1.825,0);box.scale.set(10,2.175,10);mask.add(box);scene.add(mask);
 const walls=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0,side:THREE.DoubleSide});const half=5.555556*scale;
 for(const sign of [-1,1]){const x=new THREE.Mesh(new THREE.PlaneGeometry(half*2,4),material);x.rotation.y=Math.PI/2;x.position.set(sign*half,floor-2,0);walls.add(x);const z=new THREE.Mesh(new THREE.PlaneGeometry(half*2,4),material);z.position.set(0,floor-2,sign*half);walls.add(z);}scene.add(walls);
 const side={name,host,scene,renderer,controls,root,box,walls,mesh:null,generation:0,abort:null};
 new ResizeObserver(()=>renderer.setSize(host.clientWidth,host.clientHeight)).observe(host);
 $(name+'-space').onchange=()=>align(side);
 $(name+'-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;side.generation++;side.abort?.abort();const generation=side.generation;$(name+'-status').textContent=`Läser ${file.name} lokalt…`;try{const mesh=new SplatMesh({fileBytes:await file.arrayBuffer(),fileName:file.name});await mesh.initialized;if(generation!==side.generation){mesh.dispose();return;}install(side,mesh);$(name+'-status').textContent=`${file.name} · lokalt laddad`;}catch(error){$(name+'-status').textContent='Filen kunde inte öppnas. Den tidigare modellen behålls.';console.error(error);}};
 return side;
});
function align(side){side.root.position.set(0,0,0);side.root.rotation.set(0,0,0);side.root.scale.setScalar(1);const space=$(side.name+'-space').value;if(space==='splatfacto')side.root.rotation.x=-Math.PI/2;else if(space==='lichtfeld'){side.root.rotation.x=Math.PI;side.root.scale.setScalar(scale);side.root.position.set(-3.1789145538141383e-8*scale,floor,4.3710073782676773e-7*scale);}}
function install(side,mesh){align(side);if(side.mesh){side.root.remove(side.mesh);side.mesh.dispose();}side.mesh=mesh;side.root.add(mesh);}
async function loadFull(side,manifestName){const generation=side.generation;side.abort=new AbortController();const signal=side.abort.signal,status=$(side.name+'-status');let candidate;
 try{const response=await fetch(manifestName,{signal});if(!response.ok)throw Error('manifest');const manifest=await response.json(),bytes=new Uint8Array(manifest.bytes);let offset=0;
 for(const part of manifest.parts){const response=await fetch(part.name,{signal});if(!response.ok)throw Error('download');const reader=response.body.getReader();let count=0;while(true){const {done,value}=await reader.read();if(done)break;bytes.set(value,offset);offset+=value.length;count+=value.length;status.textContent=`Originalmodell · ${Math.floor(offset/manifest.bytes*100)} %`; }if(count!==part.size)throw Error('truncated');}
 if(offset!==manifest.bytes)throw Error('truncated');status.textContent='Förbereder originalmodellen…';let plain=await window.decryptComparisonModel(bytes);if(manifest.gzip)plain=await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();candidate=new SplatMesh({fileBytes:plain,fileName:'original.ply'});await candidate.initialized;if(generation!==side.generation){candidate.dispose();return;}install(side,candidate);candidate=null;status.textContent='✓ Originalmodell laddad · 30 000 steg';
 }catch(error){candidate?.dispose();if(error.name!=='AbortError'&&generation===side.generation){status.textContent='Originalet kunde inte hämtas · snabbversionen behålls';console.error(error);}}
}
$('auto').onchange=()=>{sides[0].controls.autoRotate=$('auto').checked;};
$('clean').onchange=()=>sides.forEach(side=>{side.box.opacity=$('clean').checked?0:1;side.walls.visible=$('clean').checked;});
$('reset').onclick=()=>{sides.forEach(side=>{side.controls.reset();side.controls.target.set(0,-.64,0);});camera.position.set(-.65,-.10,.85);sides[0].controls.autoRotate=false;$('auto').checked=false;};
function frame(){requestAnimationFrame(frame);sides.forEach(side=>side.controls.update());for(const side of sides){camera.aspect=side.host.clientWidth/side.host.clientHeight;camera.updateProjectionMatrix();side.renderer.render(side.scene,camera);}}frame();
async function start(side,bytes,manifest){try{const mesh=new SplatMesh({fileBytes:bytes,fileName:'preview.spz'});await mesh.initialized;install(side,mesh);$(side.name+'-status').textContent='Snabbversion laddad · hämtar originalet…';void loadFull(side,manifest);}catch(error){$(side.name+'-status').textContent='Modellen kunde inte öppnas. Välj en lokal modell.';console.error(error);}}
void start(sides[0],window.comparisonPreview,'grid-original.json');delete window.comparisonPreview;
void(async()=>{try{const response=await fetch('lichtfeld-model.enc');if(!response.ok)throw Error('download');await start(sides[1],await window.decryptComparisonModel(new Uint8Array(await response.arrayBuffer())),'lichtfeld-original.json');}catch(error){$('right-status').textContent='LichtFeld-modellen kunde inte hämtas. Välj en lokal modell.';console.error(error);}})();
