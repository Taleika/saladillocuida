import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const f=document.getElementById('f'),foto=document.getElementById('foto'),preview=document.getElementById('preview'),msg=document.getElementById('estadoMsg'),submitBtn=document.getElementById('submitBtn');
foto.addEventListener('change',()=>{const file=foto.files?.[0];if(!file)return;preview.src=URL.createObjectURL(file);preview.style.display='block';});
f.addEventListener('submit',async(e)=>{e.preventDefault();try{submitBtn.disabled=true;msg.textContent='Subiendo imagen...';const data=Object.fromEntries(new FormData(f).entries());['castrado','vacunado','desparasitado','destacado'].forEach(k=>data[k]=f.elements[k].checked);const file=foto.files?.[0];if(!file)throw new Error('Falta foto');const path=`albergue/${data.idFicha}/principal.jpg`;const sref=ref(storage,path);await uploadBytes(sref,file);msg.textContent='Imagen subida';const fotoUrl=await getDownloadURL(sref);msg.textContent='Guardando ficha...';await addDoc(collection(db,'albergue_animales'),{idFicha:data.idFicha,nombre:data.nombre,raza:(data.raza||'').trim(),canil:data.canil,sexo:data.sexo,edad:data.edad,tamano:data.tamano,descripcion:data.descripcion,castrado:data.castrado,vacunado:data.vacunado,desparasitado:data.desparasitado,estado:data.estado,destacado:data.destacado,fotoUrl});msg.textContent='Ficha guardada correctamente';f.reset();preview.style.display='none';}catch(err){console.error(err);const texto=String(err?.message||err||'Error desconocido');if(msg.textContent==='Subiendo imagen...'){msg.textContent=`Error al subir imagen: ${texto}`;}else{msg.textContent=`Error al guardar ficha: ${texto}`;}}finally{submitBtn.disabled=false;}});
// TODO Auth: antes de habilitar este panel públicamente, validar usuario logueado y email autorizado.
