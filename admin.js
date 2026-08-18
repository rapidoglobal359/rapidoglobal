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


// ======================================================
// VARIABLES PRINCIPALES
// ======================================================

const listaAdmin = document.getElementById("listaAdmin");
const buscarPrincipal = document.getElementById("buscar");
const btnBuscarPrincipal = document.getElementById("btnBuscar");

let todosLosUsuarios = [];
let todasLasPrealertas = [];

let cantidadUsuariosAnterior = 0;
let contextoAudio = null;


// ======================================================
// SONIDO PARA NUEVO CLIENTE
// ======================================================

document.addEventListener("click", async () => {

  try {

    if (!contextoAudio) {
      contextoAudio = new AudioContext();
    }

    if (contextoAudio.state === "suspended") {
      await contextoAudio.resume();
    }

  } catch (error) {
    console.log("Audio no disponible:", error);
  }

}, { once: true });


async function reproducirSonido() {

  try {

    if (!contextoAudio) {
      contextoAudio = new AudioContext();
    }

    if (contextoAudio.state === "suspended") {
      await contextoAudio.resume();
    }

    const oscilador = contextoAudio.createOscillator();
    const ganancia = contextoAudio.createGain();

    oscilador.connect(ganancia);
    ganancia.connect(contextoAudio.destination);

    oscilador.frequency.value = 880;
    ganancia.gain.value = 0.3;

    oscilador.start();

    oscilador.stop(
      contextoAudio.currentTime + 0.3
    );

  } catch (error) {

    console.log("No se pudo reproducir sonido:", error);

  }

}


// ======================================================
// NORMALIZAR TEXTO PARA LAS BÚSQUEDAS
// ======================================================

function normalizarTexto(texto) {

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

}


// ======================================================
// CREAR SECCIÓN DE USUARIOS
// ======================================================

function crearSeccionUsuarios() {

  const seccion = document.createElement("section");

  seccion.id = "seccionUsuariosAdmin";

  seccion.style.marginTop = "35px";
  seccion.style.marginBottom = "35px";
  seccion.style.padding = "25px";
  seccion.style.background = "#f8faff";
  seccion.style.borderRadius = "20px";
  seccion.style.boxShadow = "0 8px 25px rgba(0,0,0,.10)";


  seccion.innerHTML = `

    <h2 style="
      text-align:center;
      color:#003366;
      margin-bottom:20px;
    ">
      👥 Usuarios registrados
    </h2>


    <div id="contadorUsuariosAdmin"
      style="
        background:linear-gradient(135deg,#003366,#0A84FF);
        color:white;
        border-radius:18px;
        padding:25px;
        text-align:center;
        margin-bottom:25px;
      "
    >

      <div style="
        font-size:18px;
        font-weight:bold;
        margin-bottom:8px;
      ">
        Total de clientes registrados
      </div>

      <div id="numeroUsuariosAdmin"
        style="
          font-size:48px;
          font-weight:bold;
        "
      >
        0
      </div>

    </div>


    <button
      id="btnMostrarUsuarios"
      type="button"
      style="
        width:100%;
        margin-bottom:15px;
        padding:15px;
        border:none;
        border-radius:12px;
        background:#003366;
        color:white;
        font-size:17px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      👥 Mostrar todos los usuarios
    </button>


    <input
      type="text"
      id="buscarUsuarioAdmin"
      placeholder="Buscar por nombre, correo o código RG"
      style="
        width:100%;
        box-sizing:border-box;
        padding:15px;
        border:1px solid #ccc;
        border-radius:12px;
        font-size:16px;
        margin-bottom:12px;
      "
    >


    <button
      id="btnBuscarUsuarioAdmin"
      type="button"
      style="
        width:100%;
        padding:15px;
        border:none;
        border-radius:12px;
        background:#0A84FF;
        color:white;
        font-size:17px;
        font-weight:bold;
        cursor:pointer;
        margin-bottom:20px;
      "
    >
      🔎 Buscar usuario
    </button>


    <div id="resultadoUsuariosAdmin">

      <p style="text-align:center;color:#777;">
        Escribe un nombre, correo o código RG para buscar.
      </p>

    </div>

  `;


  const encabezados = document.querySelectorAll("h2");

  let tituloPrealertas = null;

  encabezados.forEach((titulo) => {

    if (
      titulo.textContent.includes("Prealertas") ||
      titulo.textContent.includes("📦")
    ) {

      tituloPrealertas = titulo;

    }

  });


  if (tituloPrealertas) {

    tituloPrealertas.parentNode.insertBefore(
      seccion,
      tituloPrealertas
    );

  } else {

    listaAdmin.parentNode.insertBefore(
      seccion,
      listaAdmin
    );

  }


  document
    .getElementById("btnBuscarUsuarioAdmin")
    .addEventListener("click", buscarUsuarios);


  document
    .getElementById("btnMostrarUsuarios")
    .addEventListener("click", mostrarTodosLosUsuarios);


  document
    .getElementById("buscarUsuarioAdmin")
    .addEventListener("keydown", (evento) => {

      if (evento.key === "Enter") {
        buscarUsuarios();
      }

    });

}


// ======================================================
// CARGAR TODOS LOS USUARIOS
// ======================================================

async function cargarUsuarios() {

  const resultado = document.getElementById(
    "resultadoUsuariosAdmin"
  );

  if (resultado) {

    resultado.innerHTML = `
      <p style="text-align:center;">
        ⏳ Cargando usuarios...
      </p>
    `;

  }


  try {

    const snapshot = await getDocs(
      collection(db, "usuarios")
    );


    todosLosUsuarios = [];


    snapshot.forEach((documento) => {

      const datos = documento.data();

      todosLosUsuarios.push({

        id: documento.id,

        ...datos

      });

    });


    actualizarContador();


    if (resultado) {

      resultado.innerHTML = `
        <p style="
          text-align:center;
          color:#777;
        ">
          Hay ${todosLosUsuarios.length}
          usuarios registrados.
          Usa el buscador para encontrar uno.
        </p>
      `;

    }


    console.log(
      "Usuarios cargados:",
      todosLosUsuarios.length
    );


  } catch (error) {

    console.error(
      "Error cargando usuarios:",
      error
    );


    if (resultado) {

      resultado.innerHTML = `
        <p style="
          text-align:center;
          color:red;
        ">
          ❌ Error cargando usuarios.
        </p>
      `;

    }

  }

}


// ======================================================

// ======================================================
// AUTENTICACIÓN DEL ADMINISTRADOR
// ======================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {

      window.location.href = "index.html";

      return;

    }

    if (
      !usuario.email ||
      usuario.email.toLowerCase() !==
        "almeidaedwin81@gmail.com"
    ) {

      alert(
        "No tienes permisos para acceder al panel de administrador."
      );

      window.location.href = "cliente.html";

      return;

    }

    console.log(
      "Administrador autorizado."
    );

    crearSeccionUsuarios();

    await cargarUsuarios();

    await cargarPrealertas();

    console.log(
      "Panel de administrador cargado correctamente."
    );

  }
);
