import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const f = document.getElementById("f");
const foto = document.getElementById("foto");
const preview = document.getElementById("preview");
const msg = document.getElementById("estadoMsg");
const submitBtn = document.getElementById("submitBtn");
const adminSearchInput = document.getElementById("adminSearchInput");
const adminList = document.getElementById("adminList");
const adminListMsg = document.getElementById("adminListMsg");

const state = { all: [] };

foto.addEventListener("change", () => {
  const file = foto.files?.[0];
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

function normalize(v) {
  return (v || "").toString().toLowerCase().trim();
}

function formatFecha(ts) {
  const d = ts?.toDate?.();
  if (!d) return "-";
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function adminCard(animal) {
  return `
    <article class="card" style="padding:12px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <img src="${animal.fotoUrl || "https://via.placeholder.com/120x80?text=Sin+foto"}" alt="${animal.nombre || "Sin nombre"}" style="width:110px;height:78px;object-fit:cover;border-radius:10px;border:1px solid #dbe6db">
        <div style="flex:1;min-width:180px">
          <strong>${animal.nombre || "Sin nombre"}</strong><br>
          <small>ID: ${animal.idFicha || "-"}</small><br>
          <small>Canil: ${animal.canil || "-"}</small><br>
          <small>Estado actual: <strong>${animal.estado || "disponible"}</strong></small><br>
          <small>Consultas de adopción: <strong>${animal.consultasAdopcion || 0}</strong></small><br>
          <small>Última consulta: <strong>${formatFecha(animal.ultimaConsultaAt)}</strong></small>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <select data-action="state" data-docid="${animal.docId}" style="min-width:150px">
          <option value="disponible" ${animal.estado === "disponible" ? "selected" : ""}>disponible</option>
          <option value="reservado" ${animal.estado === "reservado" ? "selected" : ""}>reservado</option>
          <option value="adoptado" ${animal.estado === "adoptado" ? "selected" : ""}>adoptado</option>
        </select>
        <button class="btn-adopt" style="max-width:210px" data-action="save-state" data-docid="${animal.docId}">Guardar estado</button>
        <button class="btn-adopt" style="max-width:210px;background:#3a7f4a" data-action="edit" data-docid="${animal.docId}">Editar ficha</button>
      </div>
    </article>
  `;
}

function renderAdminList() {
  const q = normalize(adminSearchInput.value);
  const items = q
    ? state.all.filter((a) => normalize(`${a.idFicha} ${a.nombre} ${a.canil}`).includes(q))
    : state.all;

  if (!items.length) {
    adminList.innerHTML = "";
    adminListMsg.style.display = "block";
    adminListMsg.textContent = q ? "No hay fichas para esa búsqueda." : "No hay fichas cargadas todavía.";
    return;
  }

  adminListMsg.style.display = "none";
  adminList.innerHTML = items.map(adminCard).join("");
}

async function loadAnimals() {
  const snap = await getDocs(collection(db, "albergue_animales"));
  state.all = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  state.all.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  renderAdminList();
}

f.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    submitBtn.disabled = true;
    msg.textContent = "Subiendo imagen...";
    const data = Object.fromEntries(new FormData(f).entries());
    ["castrado", "vacunado", "desparasitado", "destacado"].forEach((k) => data[k] = f.elements[k].checked);
    const file = foto.files?.[0];
    if (!file) throw new Error("Falta foto");
    const path = `albergue/${data.idFicha}/principal.jpg`;
    const sref = ref(storage, path);
    await uploadBytes(sref, file);
    msg.textContent = "Imagen subida";
    const fotoUrl = await getDownloadURL(sref);
    msg.textContent = "Guardando ficha...";

    await addDoc(collection(db, "albergue_animales"), {
      idFicha: data.idFicha,
      nombre: data.nombre,
      raza: (data.raza || "").trim(),
      canil: data.canil,
      sexo: data.sexo,
      edad: data.edad,
      tamano: data.tamano,
      descripcion: data.descripcion,
      castrado: data.castrado,
      vacunado: data.vacunado,
      desparasitado: data.desparasitado,
      estado: data.estado,
      destacado: data.destacado,
      fotoUrl,
      fechaCarga: serverTimestamp()
    });

    msg.textContent = "Ficha guardada correctamente";
    f.reset();
    preview.style.display = "none";
    await loadAnimals();
  } catch (err) {
    console.error(err);
    const texto = String(err?.message || err || "Error desconocido");
    msg.textContent = msg.textContent === "Subiendo imagen..."
      ? `Error al subir imagen: ${texto}`
      : `Error al guardar ficha: ${texto}`;
  } finally {
    submitBtn.disabled = false;
  }
});

adminSearchInput.addEventListener("input", renderAdminList);

adminList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const docId = btn.dataset.docid;
  const action = btn.dataset.action;
  const sel = adminList.querySelector(`select[data-docid="${docId}"]`);
  const item = state.all.find((a) => a.docId === docId);
  if (!item) return;

  if (action === "save-state") {
    const nextState = sel?.value || "disponible";
    try {
      btn.disabled = true;
      btn.textContent = "Guardando...";
      await updateDoc(doc(db, "albergue_animales", docId), { estado: nextState });
      item.estado = nextState;
      btn.textContent = "Guardar estado";
      renderAdminList();
    } catch (err) {
      console.error(err);
      btn.textContent = "Error al guardar";
    } finally {
      btn.disabled = false;
    }
  }

  if (action === "edit") {
    Object.entries({
      idFicha: item.idFicha,
      nombre: item.nombre,
      raza: item.raza,
      canil: item.canil,
      sexo: item.sexo,
      edad: item.edad,
      tamano: item.tamano,
      descripcion: item.descripcion,
      estado: item.estado || "disponible"
    }).forEach(([k, v]) => {
      if (f.elements[k]) f.elements[k].value = v || "";
    });
    ["castrado", "vacunado", "desparasitado", "destacado"].forEach((k) => {
      if (f.elements[k]) f.elements[k].checked = Boolean(item[k]);
    });
    msg.textContent = `Editando ficha ${item.idFicha || ""}. Si seleccionás foto y guardás, se crea una nueva ficha con esos datos.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

loadAnimals().catch(() => {
  adminListMsg.style.display = "block";
  adminListMsg.textContent = "No se pudieron cargar las fichas.";
});

// TODO Auth: antes de habilitar este panel públicamente, validar usuario logueado y email autorizado.
