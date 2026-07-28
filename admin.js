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


  if (usuario.email !== "AlmeidaEdwin81@gmail.com") {

    alert("No tienes permisos para acceder al panel de administrador.");

    window.location.href = "cliente.html";

    return;

  }


  cargarPrealertas();


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
        ${datos.correo}
        </p>


        <p>
        <strong>Estado:</strong>
        ${datos.estado || "Prealertado"}
        </p>


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
