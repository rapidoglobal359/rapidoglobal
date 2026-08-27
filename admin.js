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
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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
// CARGAR PREALERTAS
// ======================================================

async function cargarPrealertas() {

  listaAdmin.innerHTML = `
    <p>
      Cargando prealertas...
    </p>
  `;


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


    if (prealertasSnapshot.empty) {

      listaAdmin.innerHTML = `
        <p>
          No hay prealertas registradas.
        </p>
      `;

      return;

    }


    listaAdmin.innerHTML = "";


    prealertasSnapshot.forEach(
      (documento) => {

        const datos =
          documento.data();


        const cliente =
          usuariosPorUid[
            datos.uid
          ] || null;


        const tarjeta =
          document.createElement("div");


        tarjeta.className =
          "tarjeta-prealerta";


        tarjeta.innerHTML = `

          <h3>
            📦 Tracking:
            ${datos.tracking || "Sin tracking"}
          </h3>


          <p>

            <strong>
              Nombre:
            </strong>

            ${
              cliente
                ? cliente.nombre || "Sin nombre"
                : "Sin nombre"
            }

          </p>


          <p>

            <strong>
              Código RG:
            </strong>

            ${
              cliente
                ? cliente.codigo || "Sin código"
                : "Sin código"
            }

          </p>


          <p>

            <strong>
              Correo:
            </strong>

            ${
              cliente
                ? (
                    cliente.correo ||
                    cliente.email ||
                    "Sin correo"
                  )
                : "Sin correo"
            }

          </p>


          <p>

            <strong>
              Estado actual:
            </strong>

            ${
              datos.estado ||
              "Prealertado"
            }

          </p>


          <select
            id="estado-${documento.id}"
          >

            <option value="Prealertado">
              Prealertado
            </option>

            <option value="Recibido en bodega">
              Recibido en bodega
            </option>

            <option value="En tránsito">
              En tránsito
            </option>

            <option value="Llegó a Venezuela">
              Llegó a Venezuela
            </option>

            <option value="Entregado">
              Entregado
            </option>

          </select>


          <br><br>


          <button
            onclick="cambiarEstado('${documento.id}')"
          >

            Guardar cambio

          </button>

        `;


        listaAdmin.appendChild(
          tarjeta
        );

      }
    );


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
// CAMBIAR ESTADO DE PREALERTA
// ======================================================

window.cambiarEstado = async function(id) {

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


    alert(
      "Estado actualizado correctamente."
    );


    cargarPrealertas();


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

};


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
    document.getElementById("scannerContainer");

  const resultado =
    document.getElementById("resultadoEscaneo");

  if (!contenedor) {
    console.error("No existe scannerContainer");
    return;
  }

  contenedor.style.display = "block";

  resultado.textContent =
    "📷 Preparando cámara...";

  // Cerrar escáner anterior
  if (escanerQR) {
    try {
      await escanerQR.stop();
      await escanerQR.clear();
    } catch (error) {
      console.log("Escáner anterior cerrado.");
    }
  }

  escanerQR =
    new Html5Qrcode("reader");

  escaneando = true;

  try {

    // ==================================================
    // CONFIGURACIÓN PARA CÓDIGOS DE BARRAS
    // ==================================================

    await escanerQR.start(

      {
        facingMode: "environment"
      },

      {
  fps: 40,

  qrbox: function(viewfinderWidth, viewfinderHeight) {

    return {
      width: Math.floor(viewfinderWidth * 0.90),
      height: Math.min(
        220,
        Math.floor(viewfinderHeight * 0.35)
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

        // Mostrar tracking
        resultado.textContent =
          "✅ Tracking leído: " +
          codigoEscaneado;

        // Sonido
        if (typeof reproducirSonido === "function") {
          await reproducirSonido();
        }

        // Detener cámara
        await detenerEscaner();

        // Mostrar tracking
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

  const consultaTracking = query(
    collection(db, "prealertas"),
    where("tracking", "==", codigoEscaneado)
  );

  const snapshotTracking =
    await getDocs(consultaTracking);

  if (snapshotTracking.empty) {

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

  let nombreCliente = "No disponible";
let codigoCliente = "No disponible";
let correoCliente = paquete.correo || "No disponible";

if (paquete.uid) {

  const consultaCliente = query(
    collection(db, "usuarios"),
    where("uid", "==", paquete.uid)
  );

  const snapshotCliente =
    await getDocs(consultaCliente);

  if (!snapshotCliente.empty) {

    const datosCliente =
      snapshotCliente.docs[0].data();

    nombreCliente =
      datosCliente.nombre || "No disponible";

    codigoCliente =
      datosCliente.codigo || "No disponible";

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

  resultado.innerHTML = `

  <div style="
    background:#f8faff;
    padding:20px;
    border-radius:15px;
    border:2px solid #003366;
  ">

    <h3 style="color:#003366;">
      📦 Paquete encontrado
    </h3>

    <p>
  <strong>📦 Tracking:</strong><br>
  ${paquete.tracking || codigoEscaneado}
</p>

<p>
  <strong>👤 Cliente:</strong><br>
  ${nombreCliente}
</p>

<p>
  <strong>🆔 Código del cliente:</strong><br>
  ${codigoCliente}
</p>

<p>
  <strong>📧 Correo:</strong><br>
  ${correoCliente}
</p>

<p>
  <strong>📋 Estado actual:</strong><br>
  ${paquete.estado || "Prealertado"}
</p>    

    <label>
      <strong>🔄 Cambiar estado:</strong>
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

      <option value="Prealertado"
        ${paquete.estado === "Prealertado" ? "selected" : ""}>
        Prealertado
      </option>

      <option value="Recibido en bodega"
        ${paquete.estado === "Recibido en bodega" ? "selected" : ""}>
        Recibido en bodega
      </option>

      <option value="En tránsito"
        ${paquete.estado === "En tránsito" ? "selected" : ""}>
        En tránsito
      </option>

      <option value="Llegó a Venezuela"
        ${paquete.estado === "Llegó a Venezuela" ? "selected" : ""}>
        Llegó a Venezuela
      </option>

      <option value="Entregado"
        ${paquete.estado === "Entregado" ? "selected" : ""}>
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

document
  .getElementById("btnGuardarEstadoEscaneado")
  .addEventListener("click", async () => {

    const selector =
      document.getElementById(
        "estadoEscaneado-" + documento.id
      );

    const nuevoEstado =
      selector.value;

    try {

      const referencia =
        doc(
          db,
          "prealertas",
          documento.id
        );

      await updateDoc(
        referencia,
        {
          estado: nuevoEstado
        }
      );

      alert(
        "✅ ESTADO ACTUALIZADO\n\n" +
        "Tracking: " +
        (paquete.tracking || codigoEscaneado) +
        "\n\nNuevo estado: " +
        nuevoEstado
      );

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
            <strong>Tracking:</strong><br>
            ${paquete.tracking || codigoEscaneado}
          </p>

          <p>
            <strong>Nuevo estado:</strong><br>
            ${nuevoEstado}
          </p>

        </div>

      `;

    } catch (error) {

      console.error(
        "ERROR ACTUALIZANDO ESTADO:",
        error
      );

      alert(
        "❌ ERROR ACTUALIZANDO ESTADO\n\n" +
        error.message
      );

    }

  });
  

  

} catch (error) {

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

        // No mostramos errores mientras busca.
        // Es normal que aparezcan mientras la cámara está activa.

      }

    );

    resultado.textContent =
      "📷 Apunta la cámara al código de barras del paquete.";

  } catch (error) {

    console.error(
      "ERROR ABRIENDO CÁMARA:",
      error
    );

    resultado.innerHTML =
      "❌ No se pudo abrir la cámara.<br><br>" +
      error.message;

    escaneando = false;

  }

}


// ======================================================
// CERRAR ESCÁNER
// ======================================================

async function detenerEscaner() {

  escaneando = false;

  if (escanerQR) {

    try {

      await escanerQR.stop();

      await escanerQR.clear();

    } catch (error) {

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
    contenedor.style.display = "block";
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


