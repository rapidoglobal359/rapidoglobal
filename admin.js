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
  deleteDoc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ======================================================
// EMAILJS
// ======================================================

emailjs.init({
  publicKey: "OidIPytrvyMhoNBMi"
});

console.log("✅ EmailJS cargado correctamente");

// ======================================================
// VARIABLES
// ======================================================

const listaAdmin = document.getElementById("listaAdmin");

let todosLosUsuarios = [];
let cantidadUsuariosAnterior = 0;

let contextoAudio = null;

// ======================================================
// NORMALIZAR TEXTO
// ======================================================

function normalizarTexto(texto) {

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

}

// ======================================================
// SONIDO
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

    console.log(
      "No se pudo reproducir sonido:",
      error
    );

  }

}

// ======================================================
// CREAR PANEL DE USUARIOS
// ======================================================

function crearPanelUsuarios() {

  if (document.getElementById("panelUsuariosAdmin")) {
    return;
  }

  const panel = document.createElement("div");

  panel.id = "panelUsuariosAdmin";

  panel.style.margin = "30px 0";
  panel.style.padding = "25px";
  panel.style.background = "#f8faff";
  panel.style.borderRadius = "20px";
  panel.style.boxShadow = "0 10px 30px rgba(0,0,0,.12)";

  panel.innerHTML = `

    <h2 style="
      text-align:center;
      color:#003366;
      margin-bottom:20px;
    ">
      👥 Usuarios registrados
    </h2>

    <div style="
      background:linear-gradient(135deg,#003366,#0A84FF);
      color:white;
      border-radius:18px;
      padding:25px;
      text-align:center;
      margin-bottom:20px;
    ">

      <div style="
        font-size:18px;
        font-weight:bold;
      ">
        Total de clientes registrados
      </div>

      <div
        id="numeroUsuariosAdmin"
        style="
          font-size:48px;
          font-weight:bold;
          margin-top:5px;
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
        padding:15px;
        margin-bottom:12px;
        border:0;
        border-radius:12px;
        background:#003366;
        color:white;
        font-size:16px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      👥 Mostrar todos los usuarios
    </button>

    <input
      id="buscarUsuarioAdmin"
      type="text"
      placeholder="Nombre, correo o código RG"
      autocomplete="off"
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
        border:0;
        border-radius:12px;
        background:#0A84FF;
        color:white;
        font-size:16px;
        font-weight:bold;
        cursor:pointer;
      "
    >
      🔎 Buscar usuario
    </button>

    <div
      id="resultadoUsuariosAdmin"
      style="margin-top:20px;"
    >

      <p style="
        text-align:center;
        color:#777;
      ">
        Escribe un nombre, correo o código RG para buscar.
      </p>

    </div>

  `;

  const encabezados =
    document.querySelectorAll("h2");

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
      panel,
      tituloPrealertas
    );

  } else {

    listaAdmin.parentNode.insertBefore(
      panel,
      listaAdmin
    );

  }

  document
    .getElementById("btnMostrarUsuarios")
    .addEventListener(
      "click",
      mostrarTodosLosUsuarios
    );

  document
    .getElementById("btnBuscarUsuarioAdmin")
    .addEventListener(
      "click",
      buscarUsuarios
    );

  document
    .getElementById("buscarUsuarioAdmin")
    .addEventListener(
      "keydown",
      (evento) => {

        if (evento.key === "Enter") {
          buscarUsuarios();
        }

      }
    );

}

// ======================================================
// CARGAR TODOS LOS USUARIOS
// ======================================================

async function cargarUsuarios() {

  const resultado =
    document.getElementById(
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

    const snapshot =
      await getDocs(
        collection(db, "usuarios")
      );

    todosLosUsuarios = [];

    snapshot.forEach((documento) => {

      const datos =
        documento.data();

      todosLosUsuarios.push({

        id: documento.id,

        ...datos

      });

    });

    actualizarContador();

    console.log(
      "TOTAL USUARIOS:",
      todosLosUsuarios.length
    );

    if (resultado) {

      resultado.innerHTML = `

        <p style="
          text-align:center;
          color:#777;
        ">

          Hay
          <strong>
            ${todosLosUsuarios.length}
          </strong>
          usuarios registrados.

          <br><br>

          Usa el buscador o pulsa
          "Mostrar todos los usuarios".

        </p>

      `;

    }

  } catch (error) {

    console.error(
      "ERROR CARGANDO USUARIOS:",
      error
    );

    if (resultado) {

      resultado.innerHTML = `

        <p style="
          text-align:center;
          color:red;
        ">

          ❌ Error cargando usuarios.

          <br>

          ${error.message}

        </p>

      `;

    }

  }

}

// ======================================================
// ACTUALIZAR CONTADOR
// ======================================================

function actualizarContador() {

  const contador =
    document.getElementById(
      "numeroUsuariosAdmin"
    );

  if (contador) {

    contador.textContent =
      todosLosUsuarios.length;

  }

}

// ======================================================
// MOSTRAR TODOS LOS USUARIOS
// ======================================================

function mostrarTodosLosUsuarios() {

  if (todosLosUsuarios.length === 0) {

    const resultado =
      document.getElementById(
        "resultadoUsuariosAdmin"
      );

    resultado.innerHTML = `

      <p style="
        text-align:center;
        color:red;
      ">

        ❌ No hay usuarios registrados.

      </p>

    `;

    return;

  }

  pintarUsuarios(
    todosLosUsuarios
  );

}

// ======================================================
// BUSCAR USUARIO
// ======================================================

function buscarUsuarios() {

  const input =
    document.getElementById(
      "buscarUsuarioAdmin"
    );

  const resultado =
    document.getElementById(
      "resultadoUsuariosAdmin"
    );

  const textoOriginal =
    input.value.trim();

  if (!textoOriginal) {

    resultado.innerHTML = `

      <p style="
        text-align:center;
        color:#777;
      ">

        ✏️ Escribe un nombre,
        correo o código RG.

      </p>

    `;

    return;

  }

  const busqueda =
    normalizarTexto(
      textoOriginal
    );

  const encontrados =
    todosLosUsuarios.filter(
      (usuario) => {

        const nombre =
          normalizarTexto(
            usuario.nombre
          );

        const apellido =
          normalizarTexto(
            usuario.apellido
          );

        const nombreCompleto =
          normalizarTexto(
            `${usuario.nombre || ""} ${usuario.apellido || ""}`
          );

        const correo =
          normalizarTexto(
            usuario.correo ||
            usuario.email
          );

        const codigo =
          normalizarTexto(
            usuario.codigo
          );

        return (

          nombre.includes(busqueda) ||

          apellido.includes(busqueda) ||

          nombreCompleto.includes(busqueda) ||

          correo.includes(busqueda) ||

          codigo.includes(busqueda)

        );

      }
    );

  if (encontrados.length === 0) {

    resultado.innerHTML = `

      <div style="
        text-align:center;
        padding:20px;
      ">

        <div style="
          font-size:40px;
        ">
          ❌
        </div>

        <strong>
          No se encontraron usuarios
        </strong>

        <p style="color:#777;">
          Búsqueda:
          ${textoOriginal}
        </p>

      </div>

    `;

    return;

  }

  pintarUsuarios(
    encontrados
  );

}

// ======================================================
// PINTAR USUARIOS
// ======================================================

function pintarUsuarios(usuarios) {

  const resultado =
    document.getElementById(
      "resultadoUsuariosAdmin"
    );

  resultado.innerHTML = `

    <p style="
      text-align:center;
      color:#003366;
      font-weight:bold;
      margin-bottom:20px;
    ">

      👥
      ${usuarios.length}
      usuario(s) encontrado(s)

    </p>

  `;

  usuarios.forEach((usuario) => {

    const tarjeta =
      document.createElement("div");

    tarjeta.style.background =
      "#ffffff";

    tarjeta.style.border =
      "1px solid #ddd";

    tarjeta.style.borderRadius =
      "15px";

    tarjeta.style.padding =
      "18px";

    tarjeta.style.marginBottom =
      "15px";

    tarjeta.style.boxShadow =
      "0 5px 15px rgba(0,0,0,.08)";

    const nombre =
      usuario.nombre ||
      "Sin nombre";

    const apellido =
      usuario.apellido ||
      "";

    const correo =
      usuario.correo ||
      usuario.email ||
      "Sin correo";

    const codigo =
      usuario.codigo ||
      "Sin código";

    const telefono =
      usuario.telefono ||
      "Sin teléfono";

    tarjeta.innerHTML = `

      <h3 style="
        color:#003366;
        margin-top:0;
      ">

        👤
        ${nombre}
        ${apellido}

      </h3>

      <p>
        <strong>📦 Código RG:</strong>
        ${codigo}
      </p>

      <p>
        <strong>📧 Correo:</strong>
        ${correo}
      </p>

      <p>
        <strong>📱 Teléfono:</strong>
        ${telefono}
      </p>

    `;

    resultado.appendChild(
      tarjeta
    );

  });

}

// ======================================================
// ESCUCHAR NUEVOS USUARIOS EN TIEMPO REAL
// ======================================================

onSnapshot(
  collection(db, "usuarios"),

  async (snapshot) => {

    const cantidadActual =
      snapshot.size;

    if (
      cantidadUsuariosAnterior > 0 &&
      cantidadActual >
        cantidadUsuariosAnterior
    ) {

      const nuevos =
        cantidadActual -
        cantidadUsuariosAnterior;

      await reproducirSonido();

      alert(
        "🔔 ¡Nuevo cliente registrado!\n\n" +
        "Se registraron " +
        nuevos +
        " cliente(s) nuevo(s)."
      );

    }

    cantidadUsuariosAnterior =
      cantidadActual;

    todosLosUsuarios = [];

    snapshot.forEach((documento) => {

      todosLosUsuarios.push({

        id: documento.id,

        ...documento.data()

      });

    });

    actualizarContador();

  },

  (error) => {

    console.error(
      "ERROR EN TIEMPO REAL:",
      error
    );

  }

);

// ======================================================
// VARIABLES DEL TABLERO DE PREALERTAS
// ======================================================

let datosPrealertas = {};

let escuchaPrealertasActiva = false;


// ======================================================
// CREAR TABLERO DE 3 COLUMNAS
// ======================================================

function crearTableroPrealertas() {

  const contenedorAnterior =
    document.getElementById(
      "tableroPrealertasAdmin"
    );

  if (contenedorAnterior) {
    return;
  }

  if (!listaAdmin) {
    console.error(
      "No existe listaAdmin."
    );
    return;
  }

  const tablero =
    document.createElement("div");

  tablero.id =
    "tableroPrealertasAdmin";

  tablero.style.width =
    "100%";

  tablero.style.boxSizing =
    "border-box";

  tablero.style.marginTop =
    "20px";

  tablero.style.display =
    "grid";

  tablero.style.gridTemplateColumns =
    "repeat(3, minmax(280px, 1fr))";

  tablero.style.gap =
    "20px";

  tablero.innerHTML = `

    <!-- ========================================= -->
    <!-- PREALERTADOS -->
    <!-- ========================================= -->

    <div
      id="columnaPrealertados"
      style="
        background:#f4f6f8;
        border-radius:18px;
        padding:15px;
        min-height:300px;
        box-sizing:border-box;
      "
    >

      <div style="
        background:#003366;
        color:white;
        padding:16px;
        border-radius:14px;
        text-align:center;
        margin-bottom:15px;
      ">

        <div style="
          font-size:25px;
          margin-bottom:5px;
        ">
          📋
        </div>

        <div style="
          font-size:18px;
          font-weight:bold;
        ">
          PREALERTADOS
        </div>

        <div
          id="contadorPrealertados"
          style="
            font-size:14px;
            margin-top:5px;
          "
        >
          0 paquetes
        </div>

      </div>

      <div id="listaPrealertados"></div>

    </div>


    <!-- ========================================= -->
    <!-- RECIBIDO EN BODEGA -->
    <!-- ========================================= -->

    <div
      id="columnaBodega"
      style="
        background:#f4f6f8;
        border-radius:18px;
        padding:15px;
        min-height:300px;
        box-sizing:border-box;
      "
    >

      <div style="
        background:#0A84FF;
        color:white;
        padding:16px;
        border-radius:14px;
        text-align:center;
        margin-bottom:15px;
      ">

        <div style="
          font-size:25px;
          margin-bottom:5px;
        ">
          📦
        </div>

        <div style="
          font-size:18px;
          font-weight:bold;
        ">
          RECIBIDO EN BODEGA
        </div>

        <div
          id="contadorBodega"
          style="
            font-size:14px;
            margin-top:5px;
          "
        >
          0 paquetes
        </div>

      </div>

      <div id="listaBodega"></div>

    </div>


    <!-- ========================================= -->
    <!-- LLEGÓ A VENEZUELA -->
    <!-- ========================================= -->

    <div
      id="columnaVenezuela"
      style="
        background:#f4f6f8;
        border-radius:18px;
        padding:15px;
        min-height:300px;
        box-sizing:border-box;
      "
    >

      <div style="
        background:#28a745;
        color:white;
        padding:16px;
        border-radius:14px;
        text-align:center;
        margin-bottom:15px;
      ">

        <div style="
          font-size:25px;
          margin-bottom:5px;
        ">
          🚚
        </div>

        <div style="
          font-size:18px;
          font-weight:bold;
        ">
          LLEGÓ A VENEZUELA
        </div>

        <div
          id="contadorVenezuela"
          style="
            font-size:14px;
            margin-top:5px;
          "
        >
          0 paquetes
        </div>

      </div>

      <div id="listaVenezuela"></div>

    </div>

  `;

  listaAdmin.innerHTML = "";

  listaAdmin.appendChild(
    tablero
  );

  // ============================================
  // RESPONSIVE
  // ============================================

const estiloResponsive =
  document.createElement("style");

estiloResponsive.id =
  "estiloTableroPrealertas";

estiloResponsive.textContent = `

  /* ==========================================
     LAPTOP Y COMPUTADORAS
     3 columnas una al lado de la otra
     ========================================== */

  #tableroPrealertasAdmin {
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;
  }


  /* ==========================================
     TELÉFONO
     Mantener las 3 columnas lado a lado
     ========================================== */

  @media (max-width: 600px) {

    #tableroPrealertasAdmin {
      grid-template-columns:
        repeat(3, minmax(0, 1fr)) !important;

      gap: 6px !important;
    }

    #tableroPrealertasAdmin > div {
      padding: 7px !important;
      min-width: 0 !important;
    }

  }

`;

  
  document.head.appendChild(
    estiloResponsive
  );

}


// ======================================================
// CREAR TARJETA DE PAQUETE
// ======================================================

function crearTarjetaPrealerta(
  id,
  datos,
  cliente
) {

  const tarjeta =
    document.createElement("div");

  tarjeta.id =
    "tarjetaPaquete-" + id;

  tarjeta.className =
    "tarjeta-paquete-admin";

  tarjeta.style.background =
    "#ffffff";

  tarjeta.style.border =
    "1px solid #ddd";

  tarjeta.style.borderRadius =
    "15px";

  tarjeta.style.padding =
    "16px";

  tarjeta.style.marginBottom =
    "15px";

  tarjeta.style.boxShadow =
    "0 4px 12px rgba(0,0,0,.08)";

  tarjeta.style.boxSizing =
    "border-box";

  tarjeta.dataset.id =
    id;

  const nombre =
    cliente
      ? cliente.nombre || "Sin nombre"
      : "Sin nombre";

  const apellido =
    cliente
      ? cliente.apellido || ""
      : "";

  const codigo =
    cliente
      ? cliente.codigo || "Sin código"
      : "Sin código";

  const correo =
    cliente
      ? (
          cliente.correo ||
          cliente.email ||
          "Sin correo"
        )
      : (
          datos.correo ||
          "Sin correo"
        );

  const telefono =
    cliente
      ? cliente.telefono || "Sin teléfono"
      : "Sin teléfono";

  const tracking =
    datos.tracking ||
    "Sin tracking";

  const estado =
    datos.estado ||
    "Prealertado";

  tarjeta.innerHTML = `

    <div style="
      border-bottom:1px solid #eee;
      padding-bottom:10px;
      margin-bottom:12px;
    ">

      <div style="
        color:#003366;
        font-size:17px;
        font-weight:bold;
        word-break:break-word;
      ">

        📦 ${tracking}

      </div>

    </div>


    <p style="margin:8px 0;">

      <strong>👤 Cliente:</strong><br>

      ${nombre} ${apellido}

    </p>


    <p style="margin:8px 0;">

      <strong>🆔 Código RG:</strong><br>

      ${codigo}

    </p>


    <p style="margin:8px 0;">

      <strong>📧 Correo:</strong><br>

      <span style="
        word-break:break-word;
      ">
        ${correo}
      </span>

    </p>


    <p style="margin:8px 0;">

      <strong>📱 Teléfono:</strong><br>

      ${telefono}

    </p>


    <p style="margin:8px 0;">

      <strong>📋 Estado:</strong><br>

      <span
        id="estadoTexto-${id}"
        style="
          font-weight:bold;
          color:#003366;
        "
      >
        ${estado}
      </span>

    </p>


    <label style="
      display:block;
      margin-top:12px;
      font-weight:bold;
    ">

      🔄 Cambiar estado:

    </label>


    <select
      id="estado-${id}"
      style="
        width:100%;
        box-sizing:border-box;
        padding:11px;
        margin-top:7px;
        border-radius:10px;
        border:1px solid #ccc;
        font-size:15px;
      "
    >

      <option value="Prealertado"
        ${estado === "Prealertado" ? "selected" : ""}>
        Prealertado
      </option>

      <option value="Recibido en bodega"
        ${estado === "Recibido en bodega" ? "selected" : ""}>
        Recibido en bodega
      </option>

      <option value="En tránsito"
        ${estado === "En tránsito" ? "selected" : ""}>
        En tránsito
      </option>

      <option value="Llegó a Venezuela"
        ${estado === "Llegó a Venezuela" ? "selected" : ""}>
        Llegó a Venezuela
      </option>

      <option value="Entregado"
        ${estado === "Entregado" ? "selected" : ""}>
        Entregado
      </option>

    </select>


    <button
      type="button"
      id="btnEstado-${id}"
      style="
        width:100%;
        padding:12px;
        margin-top:10px;
        border:0;
        border-radius:10px;
        background:#003366;
        color:white;
        font-size:15px;
        font-weight:bold;
        cursor:pointer;
      "
    >

      💾 Guardar cambio

    </button>

  `;

  const boton =
    tarjeta.querySelector(
      "#btnEstado-" + id
    );

  if (boton) {

    boton.addEventListener(
      "click",
      async () => {

        await cambiarEstadoTarjeta(
          id
        );

      }
    );

  }

  return tarjeta;

}


// ======================================================
// OBTENER COLUMNA SEGÚN ESTADO
// ======================================================

function obtenerContenedorEstado(
  estado
) {

  if (
    estado === "Prealertado"
  ) {

    return document.getElementById(
      "listaPrealertados"
    );

  }

  if (
    estado === "Recibido en bodega"
  ) {

    return document.getElementById(
      "listaBodega"
    );

  }

  if (
    estado === "Llegó a Venezuela"
  ) {

    return document.getElementById(
      "listaVenezuela"
    );

  }

  /*
   * Los estados "En tránsito" y "Entregado"
   * se mantienen en el sistema.
   *
   * Para el tablero principal:
   *
   * - En tránsito permanece junto a los
   *   paquetes recibidos en bodega.
   *
   * - Entregado permanece junto a los
   *   paquetes que llegaron a Venezuela.
   */

  if (
    estado === "En tránsito"
  ) {

    return document.getElementById(
      "listaBodega"
    );

  }

  if (
    estado === "Entregado"
  ) {

    return document.getElementById(
      "listaVenezuela"
    );

  }

  return document.getElementById(
    "listaPrealertados"
  );

}


// ======================================================
// PINTAR UNA TARJETA EN SU COLUMNA
// ======================================================

function colocarTarjetaEnColumna(
  id
) {

  const datos =
    datosPrealertas[id];

  if (!datos) {
    return;
  }

  const tarjetaActual =
    document.getElementById(
      "tarjetaPaquete-" + id
    );

  if (tarjetaActual) {
    tarjetaActual.remove();
  }

  const contenedor =
    obtenerContenedorEstado(
      datos.estado ||
      "Prealertado"
    );

  if (!contenedor) {
    return;
  }

  const tarjeta =
    crearTarjetaPrealerta(
      id,
      datos,
      datos.cliente || null
    );

  contenedor.appendChild(
    tarjeta
  );

}


// ======================================================
// ACTUALIZAR CONTADORES DEL TABLERO
// ======================================================

function actualizarContadoresTablero() {

  let prealertados = 0;
  let bodega = 0;
  let venezuela = 0;

  Object.values(
    datosPrealertas
  ).forEach((paquete) => {

    const estado =
      paquete.estado ||
      "Prealertado";

    if (
      estado === "Prealertado"
    ) {

      prealertados++;

    } else if (
      estado === "Recibido en bodega" ||
      estado === "En tránsito"
    ) {

      bodega++;

    } else if (
      estado === "Llegó a Venezuela" ||
      estado === "Entregado"
    ) {

      venezuela++;

    }

  });

  const contadorPrealertados =
    document.getElementById(
      "contadorPrealertados"
    );

  const contadorBodega =
    document.getElementById(
      "contadorBodega"
    );

  const contadorVenezuela =
    document.getElementById(
      "contadorVenezuela"
    );

  if (contadorPrealertados) {

    contadorPrealertados.textContent =
      prealertados +
      (
        prealertados === 1
          ? " paquete"
          : " paquetes"
      );

  }

  if (contadorBodega) {

    contadorBodega.textContent =
      bodega +
      (
        bodega === 1
          ? " paquete"
          : " paquetes"
      );

  }

  if (contadorVenezuela) {

    contadorVenezuela.textContent =
      venezuela +
      (
        venezuela === 1
          ? " paquete"
          : " paquetes"
      );

  }

}


// ======================================================
// ACTUALIZAR SOLO UNA TARJETA
// ======================================================

function actualizarTarjetaPaquete(
  id,
  datos
) {

  datosPrealertas[id] = datos;

  colocarTarjetaEnColumna(
    id
  );

  actualizarContadoresTablero();

}


// ======================================================
// CARGAR PREALERTAS
// ======================================================

async function cargarPrealertas() {

  crearTableroPrealertas();

  try {

    const usuariosSnapshot =
      await getDocs(
        collection(db, "usuarios")
      );

    const usuariosPorUid = {};

    usuariosSnapshot.forEach(
      (documento) => {

        const datos =
          documento.data();

        if (datos.uid) {

          usuariosPorUid[
            datos.uid
          ] = datos;

        }

      }
    );

    const prealertasSnapshot =
      await getDocs(
        collection(db, "prealertas")
      );

    datosPrealertas = {};

    if (
      prealertasSnapshot.empty
    ) {

      actualizarContadoresTablero();

      return;

    }

    prealertasSnapshot.forEach(
      (documento) => {

        const datos =
          documento.data();

        const cliente =
          usuariosPorUid[
            datos.uid
          ] || null;

        datosPrealertas[
          documento.id
        ] = {

          id: documento.id,

          ...datos,

          cliente: cliente

        };

      }
    );

    Object.keys(
      datosPrealertas
    ).forEach((id) => {

      colocarTarjetaEnColumna(
        id
      );

    });

    actualizarContadoresTablero();

    console.log(
      "📦 PREALERTAS CARGADAS:",
      Object.keys(
        datosPrealertas
      ).length
    );

    // ==================================================
    // ESCUCHA EN TIEMPO REAL
    // ==================================================

    if (
      !escuchaPrealertasActiva
    ) {

      escuchaPrealertasActiva =
        true;

      onSnapshot(
        collection(
          db,
          "prealertas"
        ),

        (snapshot) => {

          snapshot.docChanges()
            .forEach((cambio) => {

              const id =
                cambio.doc.id;

              if (
                cambio.type === "removed"
              ) {

                delete datosPrealertas[
                  id
                ];

                const tarjeta =
                  document.getElementById(
                    "tarjetaPaquete-" +
                    id
                  );

                if (tarjeta) {
                  tarjeta.remove();
                }

                return;

              }

              const datos =
                cambio.doc.data();

              const datosAnteriores =
                datosPrealertas[id] || {};

              const cliente =
                datosAnteriores.cliente ||
                null;

              datosPrealertas[id] = {

                id: id,

                ...datos,

                cliente: cliente

              };

              colocarTarjetaEnColumna(
                id
              );

            });

          actualizarContadoresTablero();

        },

        (error) => {

          console.error(
            "ERROR ESCUCHANDO PREALERTAS:",
            error
          );

        }

      );

    }

  } catch (error) {

    console.error(
      "ERROR CARGANDO PREALERTAS:",
      error
    );

    listaAdmin.innerHTML = `

      <p style="color:red;">

        ❌ Error cargando prealertas.

        <br>

        ${error.message}

      </p>

    `;

  }

}


// ======================================================
// CAMBIAR ESTADO DESDE TARJETA
// ======================================================

async function cambiarEstadoTarjeta(
  id
) {

  const selector =
    document.getElementById(
      "estado-" + id
    );

  if (!selector) {

    alert(
      "No se encontró el selector."
    );

    return;

  }

  const estadoNuevo =
    selector.value;

  const paquete =
    datosPrealertas[id];

  if (!paquete) {

    alert(
      "No se encontró la información del paquete."
    );

    return;

  }

  const estadoAnterior =
    paquete.estado ||
    "Prealertado";

  if (
    estadoNuevo === estadoAnterior
  ) {

    alert(
      "El paquete ya tiene ese estado."
    );

    return;

  }

  try {

    const referencia =
      doc(
        db,
        "prealertas",
        id
      );

    await updateDoc(
      referencia,
      {
        estado: estadoNuevo
      }
    );

    /*
     * NO llamamos cargarPrealertas().
     *
     * Firestore actualizará automáticamente
     * la tarjeta mediante onSnapshot.
     *
     * De esta manera la página NO se recarga
     * y el administrador conserva su posición.
     */

    console.log(
      "✅ ESTADO CAMBIADO:",
      paquete.tracking,
      estadoAnterior,
      "→",
      estadoNuevo
    );

  } catch (error) {

    console.error(
      "ERROR ACTUALIZANDO ESTADO:",
      error
    );

    alert(
      "Error actualizando estado: " +
      error.message
    );

  }

}

// ======================================================
// AUTENTICACIÓN DEL ADMINISTRADOR
// ======================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {

      window.location.href =
        "index.html";

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


      window.location.href =
        "cliente.html";

      return;

    }


    console.log(
      "Administrador autorizado."
    );


    crearPanelUsuarios();


    await cargarUsuarios();


    await cargarPrealertas();


    console.log(
      "PANEL ADMINISTRADOR CARGADO CORRECTAMENTE"
    );

  }
);


// ======================================================
// ESCÁNER DE CÓDIGOS DE BARRAS - TRACKING
// ======================================================

let escanerQR = null;
let escaneando = false;


// ======================================================
// ABRIR ESCÁNER
// ======================================================

async function abrirEscaner() {

  const contenedor =
    document.getElementById(
      "scannerContainer"
    );


  const resultado =
    document.getElementById(
      "resultadoEscaneo"
    );


  if (!contenedor) {

    console.error(
      "No existe scannerContainer"
    );

    return;

  }


  contenedor.style.display =
    "block";


  resultado.textContent =
    "📷 Preparando cámara...";


  // ====================================================
  // CERRAR ESCÁNER ANTERIOR
  // ====================================================

  if (escanerQR) {

    try {

      await escanerQR.stop();

      await escanerQR.clear();

    } catch (error) {

      console.log(
        "Escáner anterior cerrado."
      );

    }

  }


  escanerQR =
    new Html5Qrcode(
      "reader"
    );


  escaneando = true;


  try {

    // ==================================================
    // CONFIGURACIÓN PARA CÓDIGOS DE BARRAS
    // ==================================================

    await escanerQR.start(

      {
        facingMode:
          "environment"
      },

      {

        fps: 40,


        qrbox:
          function(
            viewfinderWidth,
            viewfinderHeight
          ) {

            return {

              width:
                Math.floor(
                  viewfinderWidth * 0.90
                ),

              height:
                Math.min(
                  220,
                  Math.floor(
                    viewfinderHeight * 0.35
                  )
                )

            };

          },


        formatsToSupport: [

          Html5QrcodeSupportedFormats.CODE_128,

          Html5QrcodeSupportedFormats.CODE_39,

          Html5QrcodeSupportedFormats.CODE_93,

          Html5QrcodeSupportedFormats.CODABAR,

          Html5QrcodeSupportedFormats.ITF,

          Html5QrcodeSupportedFormats.EAN_13,

          Html5QrcodeSupportedFormats.EAN_8,

          Html5QrcodeSupportedFormats.UPC_A,

          Html5QrcodeSupportedFormats.UPC_E

        ]

      },


      async (codigoEscaneado) => {

        if (!escaneando) {

          return;

        }


        escaneando = false;


        console.log(
          "TRACKING ESCANEADO:",
          codigoEscaneado
        );


        // ==============================================
        // MOSTRAR TRACKING
        // ==============================================

        resultado.textContent =
          "✅ Tracking leído: " +
          codigoEscaneado;


        // ==============================================
        // SONIDO
        // ==============================================

        if (
          typeof reproducirSonido ===
          "function"
        ) {

          await reproducirSonido();

        }


        // ==============================================
        // DETENER CÁMARA
        // ==============================================

        await detenerEscaner();


        // ==============================================
        // MOSTRAR TRACKING
        // ==============================================

        alert(
          "📦 TRACKING ESCANEADO:\n\n" +
          codigoEscaneado
        );


        // ==================================================
        // BUSCAR TRACKING EN FIRESTORE
        // ==================================================

        try {

          resultado.textContent =
            "🔎 Buscando paquete...";


          const consultaTracking =
            query(
              collection(
                db,
                "prealertas"
              ),

              where(
                "tracking",
                "==",
                codigoEscaneado
              )
            );


          const snapshotTracking =
            await getDocs(
              consultaTracking
            );


          if (
            snapshotTracking.empty
          ) {

            resultado.innerHTML =
              "❌ No se encontró ningún paquete con el tracking:<br><br>" +

              "<strong>" +

              codigoEscaneado +

              "</strong>";


            alert(
              "❌ PAQUETE NO ENCONTRADO\n\n" +

              "Tracking: " +

              codigoEscaneado
            );


            return;

          }


          const documento =
            snapshotTracking.docs[0];


          const paquete =
            documento.data();


          // ==================================================
          // BUSCAR CLIENTE
          // ==================================================

          let nombreCliente =
            "No disponible";


          let codigoCliente =
            "No disponible";


          let correoCliente =
            paquete.correo ||
            "No disponible";


          if (paquete.uid) {

            const consultaCliente =
              query(

                collection(
                  db,
                  "usuarios"
                ),

                where(
                  "uid",
                  "==",
                  paquete.uid
                )

              );


            const snapshotCliente =
              await getDocs(
                consultaCliente
              );


            if (
              !snapshotCliente.empty
            ) {

              const datosCliente =
                snapshotCliente
                  .docs[0]
                  .data();


              nombreCliente =
                datosCliente.nombre ||
                "No disponible";


              codigoCliente =
                datosCliente.codigo ||
                "No disponible";


              correoCliente =
                datosCliente.correo ||
                paquete.correo ||
                "No disponible";

            }

          }


          console.log(
            "📦 PAQUETE ENCONTRADO:",
            paquete
          );


          // ==================================================
          // MOSTRAR INFORMACIÓN DEL PAQUETE
          // ==================================================

          resultado.innerHTML = `

            <div style="
              background:#f8faff;
              padding:20px;
              border-radius:15px;
              border:2px solid #003366;
            ">

              <h3 style="
                color:#003366;
              ">
                📦 Paquete encontrado
              </h3>


              <p>

                <strong>
                  📦 Tracking:
                </strong>

                <br>

                ${
                  paquete.tracking ||
                  codigoEscaneado
                }

              </p>


              <p>

                <strong>
                  👤 Cliente:
                </strong>

                <br>

                ${nombreCliente}

              </p>


              <p>

                <strong>
                  🆔 Código del cliente:
                </strong>

                <br>

                ${codigoCliente}

              </p>


              <p>

                <strong>
                  📧 Correo:
                </strong>

                <br>

                ${correoCliente}

              </p>


              <p>

                <strong>
                  📋 Estado actual:
                </strong>

                <br>

                ${
                  paquete.estado ||
                  "Prealertado"
                }

              </p>


              <label>

                <strong>
                  🔄 Cambiar estado:
                </strong>

              </label>


              <select
                id="estadoEscaneado-${documento.id}"
                style="
                  width:100%;
                  padding:12px;
                  margin-top:8px;
                  border-radius:10px;
                  border:1px solid #ccc;
                  font-size:16px;
                "
              >

                <option
                  value="Prealertado"
                  ${
                    paquete.estado ===
                    "Prealertado"
                      ? "selected"
                      : ""
                  }
                >
                  Prealertado
                </option>


                <option
                  value="Recibido en bodega"
                  ${
                    paquete.estado ===
                    "Recibido en bodega"
                      ? "selected"
                      : ""
                  }
                >
                  Recibido en bodega
                </option>


                <option
                  value="En tránsito"
                  ${
                    paquete.estado ===
                    "En tránsito"
                      ? "selected"
                      : ""
                  }
                >
                  En tránsito
                </option>


                <option
                  value="Llegó a Venezuela"
                  ${
                    paquete.estado ===
                    "Llegó a Venezuela"
                      ? "selected"
                      : ""
                  }
                >
                  Llegó a Venezuela
                </option>


                <option
                  value="Entregado"
                  ${
                    paquete.estado ===
                    "Entregado"
                      ? "selected"
                      : ""
                  }
                >
                  Entregado
                </option>

              </select>


              <button
                type="button"
                id="btnGuardarEstadoEscaneado"
                style="
                  width:100%;
                  padding:14px;
                  margin-top:15px;
                  border:0;
                  border-radius:10px;
                  background:#003366;
                  color:white;
                  font-size:16px;
                  font-weight:bold;
                  cursor:pointer;
                "
              >

                💾 Guardar cambio

              </button>

            </div>

          `;


          // ==================================================
          // BOTÓN GUARDAR ESTADO DEL ESCÁNER
          // ==================================================

          document
            .getElementById(
              "btnGuardarEstadoEscaneado"
            )
            .addEventListener(
              "click",
              async () => {

                const selector =
                  document.getElementById(
                    "estadoEscaneado-" +
                    documento.id
                  );


                if (!selector) {

                  alert(
                    "No se encontró el selector de estado."
                  );

                  return;

                }


                const nuevoEstado =
                  selector.value;


                try {

                  const referencia =
                    doc(
                      db,
                      "prealertas",
                      documento.id
                    );


                  // ==================================================
                  // GUARDAR ESTADO EN FIRESTORE
                  // ==================================================

                  await updateDoc(
                    referencia,
                    {
                      estado:
                        nuevoEstado
                    }
                  );


                  // ==================================================
                  // ACTUALIZAR DATOS LOCALES
                  // ==================================================

                  if (
                    datosPrealertas[
                      documento.id
                    ]
                  ) {

                    datosPrealertas[
                      documento.id
                    ].estado =
                      nuevoEstado;

                  }


                  // ==================================================
                  // ENVIAR CORREO AL CLIENTE
                  // ==================================================

                  if (

                    nuevoEstado ===
                      "Recibido en bodega"

                    ||

                    nuevoEstado ===
                      "En tránsito"

                  ) {

                    try {

                      await emailjs.send(

                        "service_pvubcrq",

                        "template_1r3aqf9",

                        {

                          to_email:
                            correoCliente,

                          email:
                            correoCliente,

                          nombre:
                            nombreCliente,

                          tracking:
                            paquete.tracking ||
                            codigoEscaneado,

                          estado:
                            nuevoEstado

                        }

                      );


                      console.log(
                        "📧 CORREO ENVIADO A:",
                        correoCliente
                      );


                    } catch (
                      errorCorreo
                    ) {

                      console.error(
                        "❌ ERROR ENVIANDO CORREO:",
                        errorCorreo
                      );


                      alert(

                        "⚠️ El estado se actualizó correctamente,\n" +

                        "pero no se pudo enviar el correo al cliente.\n\n" +

                        (

                          errorCorreo.text ||

                          errorCorreo.message ||

                          "Error desconocido"

                        )

                      );

                    }

                  }


                  // ==================================================
                  // MOVER TARJETA INMEDIATAMENTE
                  // ==================================================

                  if (
                    datosPrealertas[
                      documento.id
                    ]
                  ) {

                    colocarTarjetaEnColumna(
                      documento.id
                    );

                    actualizarContadoresTablero();

                  }


                  // ==================================================
                  // AVISO DE ACTUALIZACIÓN
                  // ==================================================

                  alert(

                    "✅ ESTADO ACTUALIZADO\n\n" +

                    "Tracking: " +

                    (
                      paquete.tracking ||
                      codigoEscaneado
                    ) +

                    "\n\nNuevo estado: " +

                    nuevoEstado

                  );


                  // ==================================================
                  // MOSTRAR RESULTADO DEL ESCANEO
                  // ==================================================

                  resultado.innerHTML = `

                    <div style="
                      background:#f0fff4;
                      padding:20px;
                      border-radius:15px;
                      border:2px solid #28a745;
                      text-align:center;
                    ">

                      <h3>
                        ✅ Estado actualizado
                      </h3>


                      <p>

                        <strong>
                          Tracking:
                        </strong>

                        <br>

                        ${
                          paquete.tracking ||
                          codigoEscaneado
                        }

                      </p>


                      <p>

                        <strong>
                          Nuevo estado:
                        </strong>

                        <br>

                        ${nuevoEstado}

                      </p>

                    </div>

                  `;


                } catch (
                  error
                ) {

                  console.error(
                    "ERROR ACTUALIZANDO ESTADO:",
                    error
                  );


                  alert(

                    "❌ ERROR ACTUALIZANDO ESTADO\n\n" +

                    error.message

                  );

                }

              }

            );


        } catch (
          error
        ) {

          console.error(
            "ERROR BUSCANDO TRACKING:",
            error
          );


          resultado.innerHTML =
            "❌ Error buscando el paquete.<br><br>" +

            error.message;


          alert(

            "❌ ERROR BUSCANDO PAQUETE\n\n" +

            error.message

          );

        }

      },


      (errorMessage) => {

        /*
         * No mostramos errores mientras busca.
         *
         * Es normal que aparezcan mientras
         * la cámara está activa.
         */

      }

    );


    resultado.textContent =
      "📷 Apunta la cámara al código de barras del paquete.";


  } catch (
    error
  ) {

    console.error(
      "ERROR ABRIENDO CÁMARA:",
      error
    );


    resultado.innerHTML =
      "❌ No se pudo abrir la cámara.<br><br>" +

      error.message;


    escaneando =
      false;

  }

}


// ======================================================
// CERRAR ESCÁNER
// ======================================================

async function detenerEscaner() {

  escaneando =
    false;


  if (escanerQR) {

    try {

      await escanerQR.stop();


      await escanerQR.clear();


    } catch (
      error
    ) {

      console.log(
        "Error cerrando escáner:",
        error
      );

    }

  }


  const contenedor =
    document.getElementById(
      "scannerContainer"
    );


  if (contenedor) {

    contenedor.style.display =
      "block";

  }

}


// ======================================================
// BOTÓN ESCANEAR
// ======================================================

const btnEscanear =
  document.getElementById(
    "btnEscanear"
  );


if (btnEscanear) {

  btnEscanear.addEventListener(
    "click",
    abrirEscaner
  );

}


// ======================================================
// BOTÓN CERRAR ESCÁNER
// ======================================================

const btnCerrarScanner =
  document.getElementById(
    "btnCerrarScanner"
  );


if (btnCerrarScanner) {

  btnCerrarScanner.addEventListener(
    "click",
    detenerEscaner
  );

}


// ======================================================
// FIN DE ADMIN.JS
// ======================================================

console.log(
  "✅ ADMIN.JS COMPLETO CARGADO"
);
