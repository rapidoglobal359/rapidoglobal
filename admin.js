console.log("ADMIN.JS CARGADO");
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const listaAdmin = document.getElementById("listaAdmin");


onAuthStateChanged(auth, async (usuario) => {

  if (!usuario) {
    window.location.href = "index.html";
    return;
  }


  if (usuario.email.toLowerCase() !== "almeidaedwin81@gmail.com") {

    alert("No tienes permisos para acceder al panel de administrador.");

    window.location.href = "cliente.html";

    return;

  }


  cargarPrealertas();
  console.log("Administrador autorizado, cargando prealertas");

  
});



async function cargarPrealertas() {


  listaAdmin.innerHTML =
  "<p>Cargando prealertas...</p>";


  try {


    const resultado = await getDocs(
      collection(db, "prealertas")
    );


    if (resultado.empty) {


      listaAdmin.innerHTML =
      "<p>No hay prealertas registradas.</p>";


      return;

    }


    listaAdmin.innerHTML = "";


    resultado.forEach((doc) => {

  const datos = doc.data();

  listaAdmin.innerHTML += `

  <div class="tarjeta-prealerta">

    <h3>📦 Tracking: ${datos.tracking}</h3>

    <p>
<strong>Correo:</strong>
${datos.correo || "Sin correo registrado"}
</p>
    <p>
    <strong>Estado actual:</strong>
    ${datos.estado || "Prealertado"}
    </p>

    <select id="estado-${doc.id}">
      <option value="Prealertado">Prealertado</option>
      <option value="Recibido en bodega">Recibido en bodega</option>
      <option value="En tránsito">En tránsito</option>
      <option value="Llegó a Venezuela">Llegó a Venezuela</option>
      <option value="Entregado">Entregado</option>
    </select>

    <br><br>

    <button onclick="cambiarEstado('${doc.id}')">
      Guardar cambio
    </button>

  </div>

  <hr>

  `;

});
    
  } catch(error) {


    console.log(error);

    listaAdmin.innerHTML =
    "<p>Error cargando prealertas.</p>";

  }


}

window.cambiarEstado = async function(id) {

  const estadoNuevo = document.getElementById("estado-" + id).value;

  try {

    const referencia = doc(db, "prealertas", id);

    await updateDoc(referencia, {
      estado: estadoNuevo
    });

    alert("Estado actualizado correctamente.");

    cargarPrealertas();

  } catch(error) {

    console.log(error);

    alert("Error actualizando estado: " + error.message);

  }

};
