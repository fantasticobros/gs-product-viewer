export async function loadOriginal({SplatMesh,root,preview,orbit,onSwap}){
  const panel=document.createElement('div');panel.className='model-progress';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
  const text=document.createElement('span'),bar=document.createElement('progress');bar.max=100;bar.value=0;bar.setAttribute('aria-label','Originalmodellens nedladdning');panel.append(text,bar);document.getElementById('viewer').after(panel);
  let candidate,dragging=false,lastEnd=0;
  orbit.addEventListener('start',()=>dragging=true);orbit.addEventListener('end',()=>{dragging=false;lastEnd=performance.now();});
  try{
    text.textContent='Laddar originalmodellen · 0 %';
    const manifestResponse=await fetch(new URL('grid-original.json',location.href));if(!manifestResponse.ok)throw Error('manifest');
    const manifest=await manifestResponse.json(),bytes=new Uint8Array(manifest.bytes);let offset=0;
    for(const part of manifest.parts){
      const response=await fetch(new URL(part.name,location.href));if(!response.ok)throw Error('download');
      const reader=response.body.getReader();let partBytes=0;
      while(true){const {done,value}=await reader.read();if(done)break;bytes.set(value,offset);offset+=value.length;partBytes+=value.length;const percent=Math.min(100,Math.floor(offset/manifest.bytes*100));bar.value=percent;text.textContent=`Laddar originalmodellen · ${percent} % · ${(offset/1e6).toFixed(0)} / ${(manifest.bytes/1e6).toFixed(0)} MB`;}
      if(partBytes!==part.size)throw Error('truncated');
    }
    if(offset!==manifest.bytes)throw Error('truncated');
    text.textContent='Originalmodellen hämtad · låser upp…';
    let plain=await window.unlockOriginal(bytes);delete window.unlockOriginal;
    if(manifest.gzip)plain=await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    text.textContent='Förbereder originalmodellen…';
    candidate=new SplatMesh({fileBytes:plain,fileName:'original.ply'});await candidate.initialized;
    text.textContent='Originalmodellen klar · väntar på avslutad rotation…';
    await new Promise(resolve=>{function idle(){if(!dragging&&performance.now()-lastEnd>350)resolve();else requestAnimationFrame(idle);}idle();});
    // One scene update preserves the camera and avoids rendering two overlapping models.
    root.remove(preview);root.add(candidate);onSwap(candidate);preview.dispose();
    bar.value=100;panel.dataset.complete='true';text.textContent='✓ Originalmodellen laddad';
  }catch(error){candidate?.dispose();delete window.unlockOriginal;text.textContent='Originalmodellen kunde inte laddas · snabbversionen visas';panel.dataset.error='true';console.error(error);}
}
