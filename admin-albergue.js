import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "saladillo-cuida.firebaseapp.com",
  projectId: "saladillo-cuida",
  storageBucket: "saladillo-cuida.firebasestorage.app",
  messagingSenderId: "728549842822",
  appId: "1:728549842822:web:e4fdf5e08d915e9461d607",
  measurementId: "G-61V3Y4CFVR"
};
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const storage = getStorage(app);
const f=document.getElementById('f'),foto=document.getElementById('foto'),preview=document.getElementById('preview'),msg=document.getElementById('estadoMsg'),submitBtn=document.getElementById('submitBtn');
foto.addEventListener('change',()=>{const file=foto.files?.[0];if(!file)return;preview.src=URL.createObjectURL(file);preview.style.display='block';});
f.addEventListener('submit',async(e)=>{e.preventDefault();try{msg.textContent='Guardando...';submitBtn.disabled=true;const data=Object.fromEntries(new FormData(f).entries());['castrado','vacunado','desparasitado','destacado'].forEach(k=>data[k]=f.elements[k].checked);const file=foto.files?.[0];if(!file)throw new Error('Falta foto');const path=`albergue/${data.idFicha}/principal.jpg`;const sref=ref(storage,path);await uploadBytes(sref,file);const fotoUrl=await getDownloadURL(sref);await addDoc(collection(db,'albergue_animales'),{idFicha:data.idFicha,nombre:data.nombre,canil:data.canil,sexo:data.sexo,edad:data.edad,tamano:data.tamano,descripcion:data.descripcion,castrado:data.castrado,vacunado:data.vacunado,desparasitado:data.desparasitado,estado:data.estado,destacado:data.destacado,fotoUrl});msg.textContent='Ficha guardada correctamente';f.reset();preview.style.display='none';}catch(err){console.error(err);msg.textContent='Error al guardar';}finally{submitBtn.disabled=false;}});
// TODO Auth: antes de habilitar este panel públicamente, validar usuario logueado y email autorizado.
