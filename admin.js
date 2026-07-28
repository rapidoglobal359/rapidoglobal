import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const listaAdmin = document.getElementById("listaAdmin");

onAuthStateChanged(auth, async (usuario) => {

  if (!usuario) {
    window.location.href = "index.html";
    return;
  }

  if (usuario.email !== "AlmeidaEdwin81@gmail.com") {
    alert("No tienes permisos para acceder al panel de administrador.");
    window.location.href = "cliente.html";
    return;
  }

  listaAdmin.innerHTML = "<p>Cargando prealertas...</p>";

});
