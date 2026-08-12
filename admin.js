console.log("ADMIN.JS CARGADO");
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const listaAdmin = document.getElementById("listaAdmin");
let cantidadUsuariosAnterior = 0;
let contextoAudio = null;

document.addEventListener("click", async () => {

  if (!contextoAudio) {
    contextoAudio = new AudioContext();
  }

  if (contextoAudio.state === "suspended") {
    await contextoAudio.resume();
  }

}, { once: true });
onSnapshot(collection(db, "usuarios"), (snapshot) => {

  const cantidadActual = snapshot.size;

  if (
    cantidadUsuariosAnterior > 0 &&
    cantidadActual > cantidadUsuariosAnterior
  ) {

    const nuevos = cantidadActual - cantidadUsuariosAnterior;
const contexto = new AudioContext();
const oscilador = contexto.createOscillator();
const ganancia = contexto.createGain();

oscilador.connect(ganancia);
ganancia.connect(contexto.destination);

oscilador.frequency.value = 880;
ganancia.gain.value = 0.3;

oscilador.start();
oscilador.stop(contexto.currentTime + 0.3);
    
    alert(
      "🔔 ¡Nuevo cliente registrado!\n\n" +
      "Se registraron " + nuevos + " cliente(s) nuevo(s)."
    );

  }

  cantidadUsuariosAnterior = cantidadActual;

});
async function buscarCliente(uid) {

  const usuarios = await getDocs(
    collection(db, "usuarios")
  );

  let cliente = null;

  usuarios.forEach((usuario) => {

    const datos = usuario.data();

    if (datos.uid === uid) {
      cliente = datos;
    }

  });

  return cliente;

}
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


    for (const doc of resultado.docs) {

  const datos = doc.data();

  const cliente = await buscarCliente(datos.uid);
      
      listaAdmin.innerHTML += `

  <div class="tarjeta-prealerta">

    <h3>📦 Tracking: ${datos.tracking}</h3>

    <p>
<strong>Nombre:</strong>
${cliente ? cliente.nombre : "Sin nombre"}
</p>

<p>
<strong>Código RG:</strong>
${cliente ? cliente.codigo : "Sin código"}
</p>

<p>
<strong>Correo:</strong>
${cliente ? cliente.correo : "Sin correo"}

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

}
    
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
