import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const state = { all: [], filtered: [] };
const els = Object.fromEntries(["cardsGrid","searchInput","edadFilter","tamanoFilter","sexoFilter","canilFilter","estadoFilter","ordenFilter","btnSorprendeme","btnTodos"].map(id=>[id,document.getElementById(id)]));

function uniqueBy(field){return [...new Set(state.all.map(a=>a[field]).filter(Boolean))].sort();}
function fillFilters(){["edad","tamano","sexo","canil"].forEach(f=>{els[`${f}Filter`].innerHTML=`<option value="">${f.charAt(0).toUpperCase()+f.slice(1)}</option>`;uniqueBy(f).forEach(v=>els[`${f}Filter`].append(new Option(v,v)));});}
function waUrl(a){const m=`Hola, quiero consultar por la adopción del animal ID ${a.idFicha} - ${a.nombre}.`;return `https://wa.me/549234565697?text=${encodeURIComponent(m)}`;}

function card(a){
  const adoptado=a.estado==="adoptado";
  const reservado=a.estado==="reservado";
  return `<article class="card ${adoptado?"adoptado":""}" id="card-${a.idFicha}"><div class="photo-wrap"><img class="photo" src="${a.fotoUrl||"https://via.placeholder.com/600x400?text=Sin+foto"}" alt="${a.nombre}"><span class="id-badge">ID: ${a.idFicha}</span>${adoptado?'<span class="state-badge state-adoptado">ADOPTADO 💚</span>':""}${reservado?'<span class="state-badge state-reservado">RESERVADO</span>':""}</div><div class="content"><h3 class="name">${a.nombre||"Sin nombre"}</h3>${(a.raza||"" ).trim()?`<p class="raza">✨ ${a.raza}</p>`:""}<div class="meta"><span>🏠 ${a.canil||"-"}</span><span>⚧ ${a.sexo||"-"}</span><span>🐾 ${a.edad||"-"}</span><span>📏 ${a.tamano||"-"}</span></div><p class="desc">${a.descripcion||""}</p><div class="chips">${a.castrado?'<span class="chip">✅ Castrado</span>':''}${a.vacunado?'<span class="chip">✅ Vacunado</span>':''}${a.desparasitado?'<span class="chip">✅ Desparasitado</span>':''}</div><button class="btn-adopt" ${adoptado?"disabled":""} onclick="${adoptado?"return false;":`window.open('${waUrl(a)}','_blank')`}">${adoptado?"Ya encontró familia":"💚 Quiero adoptar"}</button></div></article>`;
}

function apply(){let arr=[...state.all];const s=els.searchInput.value.toLowerCase().trim();if(s)arr=arr.filter(a=>`${a.nombre} ${a.idFicha} ${a.descripcion}`.toLowerCase().includes(s));["edad","tamano","sexo","canil","estado"].forEach(f=>{const v=els[`${f}Filter`].value;if(v)arr=arr.filter(a=>(a[f]||"")===v);});switch(els.ordenFilter.value){case"az":arr.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));break;case"disponibles":arr.sort((a,b)=>(a.estado!=="disponible")-(b.estado!=="disponible"));break;case"aleatorio":arr.sort(()=>Math.random()-0.5);break;default:arr.sort((a,b)=>(b.fechaCarga?.seconds||0)-(a.fechaCarga?.seconds||0));}
state.filtered=arr;els.cardsGrid.innerHTML=arr.length?arr.map(card).join(""):'<div class="empty">No hay resultados para esos filtros.</div>'}

function init(){
  onSnapshot(collection(db,"albergue_animales"),(snap)=>{
    state.all=snap.docs.map(d=>d.data());
    fillFilters();
    apply();
  },()=>{els.cardsGrid.innerHTML='<div class="empty">No se pudo cargar el albergue. Revisá la configuración Firebase.</div>'});
}
[els.searchInput,els.edadFilter,els.tamanoFilter,els.sexoFilter,els.canilFilter,els.estadoFilter,els.ordenFilter].forEach(el=>el.addEventListener("input",apply));
els.btnTodos.addEventListener("click",()=>{["edadFilter","tamanoFilter","sexoFilter","canilFilter","estadoFilter"].forEach(id=>els[id].value="");els.searchInput.value="";apply();});
els.btnSorprendeme.addEventListener("click",()=>{const d=state.filtered.filter(a=>a.estado==="disponible");if(!d.length)return;const pick=d[Math.floor(Math.random()*d.length)];document.getElementById(`card-${pick.idFicha}`)?.scrollIntoView({behavior:"smooth",block:"center"});});
init();
