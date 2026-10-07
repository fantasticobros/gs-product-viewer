const form=document.getElementById('unlock-form'), status=document.getElementById('gate-status'), button=document.getElementById('unlock');
form.addEventListener('submit',async event=>{
  event.preventDefault();button.disabled=true;status.textContent='Låser upp produktvisningen…';
  let url;
  try{
    const response=await fetch(new URL('model.enc',location.href));
    if(!response.ok)throw new Error('download');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(document.getElementById('password').value),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes.slice(0,16),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(16,28)},key,bytes.slice(28));
    url=URL.createObjectURL(new Blob([plain],{type:'application/octet-stream'}));
    window.unlockOriginal=async bytes=>{
      const originalKey=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes.slice(0,16),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
      return crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(16,28)},originalKey,bytes.slice(28));
    };
  }catch(error){status.textContent=error.message==='download'?'Kunde inte hämta modellen. Försök igen.':'Fel lösenord eller modellen kunde inte låsas upp.';button.disabled=false;return;}
  document.getElementById('password').value='';window.unlockedModelUrl=url;
  document.body.classList.remove('locked');document.getElementById('gate').hidden=true;
  try{await import('./app.js?v=4');}catch(error){document.getElementById('loading').textContent='Visningen kunde inte startas. Ladda om sidan och försök igen.';console.error(error);}
});
