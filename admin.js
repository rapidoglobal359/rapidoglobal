console.log("ADMIN.JS CARGADO");

// ======================================================
// SECCIÓN 1/16
// IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ======================================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
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
// VARIABLES GENERALES
// ======================================================

const listaAdmin =
  document.getElementById("listaAdmin");

let todosLosUsuarios = [];

let cantidadUsuariosAnterior = 0;

let contextoAudio = null;


// ======================================================
// VARIABLES DEL TABLERO
// ======================================================

let datosPrealertas = {};

let escuchaPrealertasActiva = false;


// ======================================================
// MAPA DE USUARIOS
// ======================================================

let usuariosPorUid = {};


// ======================================================
// SECCIÓN 2/16
// FUNCIONES GENERALES
// ======================================================


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
// ESCUCHAR PRIMER CLICK PARA ACTIVAR AUDIO
// ======================================================

document.addEventListener(
  "click",
  async () => {

    try {

      if (!contextoAudio) {

        contextoAudio =
          new AudioContext();

      }

      if (
        contextoAudio.state ===
        "suspended"
      ) {

        await contextoAudio.resume();

      }

    } catch (error) {

      console.log(
        "Audio no disponible:",
        error
      );

    }

  },
  { once: true }
);


// ======================================================
// REPRODUCIR SONIDO
// ======================================================

async function reproducirSonido() {

  try {

    if (!contextoAudio) {

      contextoAudio =
        new AudioContext();

    }

    if (
      contextoAudio.state ===
      "suspended"
    ) {

      await contextoAudio.resume();

    }

    const oscilador =
      contextoAudio.createOscillator();

    const ganancia =
      contextoAudio.createGain();

    oscilador.connect(
      ganancia
    );

    ganancia.connect(
      contextoAudio.destination
    );

    oscilador.frequency.value =
      880;

    ganancia.gain.value =
      0.3;

    oscilador.start();

    oscilador.stop(
      contextoAudio.currentTime +
      0.3
    );

  } catch (error) {

    console.log(
      "No se pudo reproducir sonido:",
      error
    );

  }

}


// ======================================================
// OBTENER DATOS DEL CLIENTE
// ======================================================

function obtenerClienteDePaquete(
  paquete
) {

  if (!paquete) {
    return null;
  }

  if (
    paquete.uid &&
    usuariosPorUid[paquete.uid]
  ) {

    return usuariosPorUid[
      paquete.uid
    ];

  }

  if (
    paquete.cliente
  ) {

    return paquete.cliente;

  }

  return null;

}


// ======================================================
// OBTENER IDENTIFICADOR DEL CLIENTE
// ======================================================

function obtenerIdentificadorCliente(
  paquete
) {

  const cliente =
    obtenerClienteDePaquete(
      paquete
    );

  if (cliente) {

    if (cliente.uid) {
      return "uid:" + cliente.uid;
    }

    if (cliente.id) {
      return "doc:" + cliente.id;
    }

    const correo =
      cliente.correo ||
      cliente.email;

    if (correo) {
      return "correo:" +
        normalizarTexto(correo);
    }

    const codigo =
      cliente.codigo;

    if (codigo) {
      return "codigo:" +
        normalizarTexto(codigo);
    }

  }

  if (paquete.uid) {

    return "uid:" +
      paquete.uid;

  }

  const correo =
    paquete.correo;

  if (correo) {

    return "correo:" +
      normalizarTexto(correo);

  }

  return "sin-cliente";

}


// ======================================================
// NOMBRE PARA AGRUPACIÓN
// ======================================================

function obtenerNombreCliente(
  paquete
) {

  const cliente =
    obtenerClienteDePaquete(
      paquete
    );

  if (cliente) {

    const nombre =
      cliente.nombre ||
      "";

    const apellido =
      cliente.apellido ||
      "";

    const nombreCompleto =
      `${nombre} ${apellido}`.trim();

    if (nombreCompleto) {

      return nombreCompleto;

    }

  }

  return (
    paquete.nombre ||
    "Cliente sin nombre"
  );

}


// ======================================================
// OBTENER ESTADO VISUAL
// ======================================================

function obtenerEstadoVisual(
  estado
) {

  if (
    estado ===
    "En tránsito"
  ) {

    return "Recibido en bodega";

  }

  if (
    estado ===
    "Entregado"
  ) {

    return "Llegó a Venezuela";

  }

  if (
    estado ===
    "Recibido en bodega"
  ) {

    return "Recibido en bodega";

  }

  if (
    estado ===
    "Llegó a Venezuela"
  ) {

    return "Llegó a Venezuela";

  }

  return "Prealertado";

}


// ======================================================
// SECCIÓN 3/16
// PANEL DE USUARIOS
// ======================================================


// ======================================================
// CREAR PANEL DE USUARIOS
// ======================================================

function crearPanelUsuarios() {

  if (
    document.getElementById(
      "panelUsuariosAdmin"
    )
  ) {

    return;

  }

  const panel =
    document.createElement("div");

  panel.id =
    "panelUsuariosAdmin";

  panel.style.margin =
    "30px 0";

  panel.style.padding =
    "25px";

  panel.style.background =
    "#f8faff";

  panel.style.borderRadius =
    "20px";

  panel.style.boxShadow =
    "0 10px 30px rgba(0,0,0,.12)";

  panel.innerHTML = `

    <h2 style="
      text-align:center;
      color:#003366;
      margin-bottom:20px;
    ">
      👥 Usuarios registrados
    </h2>

    <div style="
      background:linear-gradient(
        135deg,
        #003366,
        #0A84FF
      );
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
      style="
        margin-top:20px;
      "
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

  let tituloPrealertas =
    null;


  encabezados.forEach(
    (titulo) => {

      if (
        titulo.textContent.includes(
          "Prealertas"
        ) ||
        titulo.textContent.includes(
          "📦"
        )
      ) {

        tituloPrealertas =
          titulo;

      }

    }
  );


  if (
    tituloPrealertas
  ) {

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
    .getElementById(
      "btnMostrarUsuarios"
    )
    .addEventListener(
      "click",
      mostrarTodosLosUsuarios
    );


  document
    .getElementById(
      "btnBuscarUsuarioAdmin"
    )
    .addEventListener(
      "click",
      buscarUsuarios
    );


  document
    .getElementById(
      "buscarUsuarioAdmin"
    )
    .addEventListener(
      "keydown",
      (evento) => {

        if (
          evento.key ===
          "Enter"
        ) {

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

      <p style="
        text-align:center;
      ">
        ⏳ Cargando usuarios...
      </p>

    `;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    todosLosUsuarios = [];

    usuariosPorUid = {};


    snapshot.forEach(
      (documento) => {

        const datos =
          documento.data();


        const usuario = {

          id:
            documento.id,

          ...datos

        };


        todosLosUsuarios.push(
          usuario
        );


        /*
         * Guardamos el usuario por el UID
         * que tenga el documento.
         */

        if (datos.uid) {

          usuariosPorUid[
            datos.uid
          ] = usuario;

        }


        /*
         * También guardamos por el ID
         * del documento.
         *
         * Esto permite encontrar al cliente
         * aunque no tenga un campo uid.
         */

        usuariosPorUid[
          documento.id
        ] = usuario;

      }
    );


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
// ACTUALIZAR CONTADOR DE USUARIOS
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

  if (
    todosLosUsuarios.length ===
    0
  ) {

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

          nombre.includes(
            busqueda
          ) ||

          apellido.includes(
            busqueda
          ) ||

          nombreCompleto.includes(
            busqueda
          ) ||

          correo.includes(
            busqueda
          ) ||

          codigo.includes(
            busqueda
          )

        );

      }
    );


  if (
    encontrados.length ===
    0
  ) {

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

        <p style="
          color:#777;
        ">

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

function pintarUsuarios(
  usuarios
) {

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


  usuarios.forEach(
    (usuario) => {

      const tarjeta =
        document.createElement(
          "div"
        );


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
          <strong>
            📦 Código RG:
          </strong>
          ${codigo}
        </p>

        <p>
          <strong>
            📧 Correo:
          </strong>
          ${correo}
        </p>

        <p>
          <strong>
            📱 Teléfono:
          </strong>
          ${telefono}
        </p>

      `;


      resultado.appendChild(
        tarjeta
      );

    }
  );

}


// ======================================================
// SECCIÓN 4/16
// USUARIOS EN TIEMPO REAL Y BUSCADOR PRINCIPAL
// ======================================================


// ======================================================
// ESCUCHAR NUEVOS USUARIOS EN TIEMPO REAL
// ======================================================

onSnapshot(
  collection(
    db,
    "usuarios"
  ),

  async (snapshot) => {

    const cantidadActual =
      snapshot.size;


    if (
      cantidadUsuariosAnterior >
        0 &&
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

    usuariosPorUid = {};


    snapshot.forEach(
      (documento) => {

        const datos =
          documento.data();


        const usuario = {

          id:
            documento.id,

          ...datos

        };


        todosLosUsuarios.push(
          usuario
        );


        if (datos.uid) {

          usuariosPorUid[
            datos.uid
          ] = usuario;

        }


        /*
         * También usamos el ID del documento
         * como posible UID.
         */

        usuariosPorUid[
          documento.id
        ] = usuario;

      }
    );


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
// BUSCADOR PRINCIPAL
// CÓDIGO, CORREO O TRACKING
// ======================================================

function buscarPrincipal() {

  const input =
    document.getElementById(
      "buscar"
    );


  const textoOriginal =
    input.value.trim();


  if (!textoOriginal) {

    alert(
      "✏️ Escribe un código RG, correo o tracking."
    );

    return;

  }


  const busqueda =
    normalizarTexto(
      textoOriginal
    );


  const paquetesEncontrados =
    Object.values(
      datosPrealertas
    ).filter(
      (paquete) => {

        const tracking =
          normalizarTexto(
            paquete.tracking
          );


        const correo =
          normalizarTexto(
            paquete.correo ||
            (
              paquete.cliente &&
              (
                paquete.cliente.correo ||
                paquete.cliente.email
              )
            )
          );


        const cliente =
          obtenerClienteDePaquete(
            paquete
          );


        const codigo =
          normalizarTexto(
            cliente &&
            cliente.codigo
          );


        const nombre =
          normalizarTexto(
            obtenerNombreCliente(
              paquete
            )
          );


        return (

          tracking.includes(
            busqueda
          ) ||

          correo.includes(
            busqueda
          ) ||

          codigo.includes(
            busqueda
          ) ||

          nombre.includes(
            busqueda
          )

        );

      }
    );


  if (
    paquetesEncontrados.length ===
    0
  ) {

    alert(
      "❌ No se encontró ningún paquete con:\n\n" +
      textoOriginal
    );

    return;

  }


  /*
   * La tarjeta ahora es una tarjeta agrupada
   * por cliente y estado.
   *
   * Por eso primero intentamos encontrar
   * específicamente la fila del tracking.
   */

  const paquete =
    paquetesEncontrados[0];


  const tracking =
    paquete.tracking ||
    "";


  const fila =
    document.querySelector(
      `[data-tracking="${CSS.escape(tracking)}"]`
    );


  if (fila) {

    fila.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });


    fila.style.outline =
      "4px solid #0A84FF";


    fila.style.borderRadius =
      "10px";


    setTimeout(
      () => {

        fila.style.outline =
          "";

      },
      3000
    );


    return;

  }


  /*
   * Respaldo:
   * si todavía no existe la fila en pantalla,
   * buscamos la tarjeta agrupada.
   */

  const identificador =
    obtenerIdentificadorCliente(
      paquete
    );


  const estadoVisual =
    obtenerEstadoVisual(
      paquete.estado
    );


  const idTarjeta =
    "tarjetaCliente-" +
    normalizarTexto(
      identificador
    ) +
    "-" +
    normalizarTexto(
      estadoVisual
    );


  const tarjeta =
    document.getElementById(
      idTarjeta
    );


  if (tarjeta) {

    tarjeta.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });


    tarjeta.style.outline =
      "4px solid #0A84FF";


    setTimeout(
      () => {

        tarjeta.style.outline =
          "";

      },
      3000
    );

  }

}


// ======================================================
// BOTÓN BUSCAR PRINCIPAL
// ======================================================

const btnBuscarPrincipal =
  document.getElementById(
    "btnBuscar"
  );


if (btnBuscarPrincipal) {

  btnBuscarPrincipal.addEventListener(
    "click",
    buscarPrincipal
  );

}


// ======================================================
// FIN DE PARTE 1/4
// ======================================================
// CONTINUAR DIRECTAMENTE CON LA PARTE 2/4
// ======================================================

// ======================================================
// SECCIÓN 5/16
// CREAR TABLERO DE PREALERTAS
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


  // ====================================================
  // RESPONSIVE
  // ====================================================

  const estiloResponsive =
    document.createElement(
      "style"
    );


  estiloResponsive.id =
    "estiloTableroPrealertas";


  estiloResponsive.textContent = `

    #tableroPrealertasAdmin {
      grid-template-columns:
        repeat(3, minmax(0, 1fr)) !important;
    }


    @media (max-width: 600px) {

      #tableroPrealertasAdmin {
        grid-template-columns:
          repeat(3, minmax(0, 1fr)) !important;

        gap:6px !important;
      }


      #tableroPrealertasAdmin > div {
        padding:7px !important;
        min-width:0 !important;
      }


      #tableroPrealertasAdmin
      > div > div:first-child {

        padding:10px 5px !important;

      }


      #tableroPrealertasAdmin
      > div > div:first-child
      div {

        font-size:11px !important;

      }


      #tableroPrealertasAdmin
      > div > div:first-child
      div:first-child {

        font-size:18px !important;

      }

    }

  `;


  const estiloExistente =
    document.getElementById(
      "estiloTableroPrealertas"
    );


  if (!estiloExistente) {

    document.head.appendChild(
      estiloResponsive
    );

  }

}


// ======================================================
// SECCIÓN 6/16
// OBTENER COLUMNA SEGÚN ESTADO
// ======================================================

function obtenerContenedorEstado(
  estado
) {

  const estadoVisual =
    obtenerEstadoVisual(
      estado
    );


  if (
    estadoVisual ===
    "Prealertado"
  ) {

    return document.getElementById(
      "listaPrealertados"
    );

  }


  if (
    estadoVisual ===
    "Recibido en bodega"
  ) {

    return document.getElementById(
      "listaBodega"
    );

  }


  if (
    estadoVisual ===
    "Llegó a Venezuela"
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
// OBTENER CONTENEDOR POR ESTADO VISUAL
// ======================================================

function obtenerContenedorEstadoVisual(
  estadoVisual
) {

  if (
    estadoVisual ===
    "Prealertado"
  ) {

    return document.getElementById(
      "listaPrealertados"
    );

  }


  if (
    estadoVisual ===
    "Recibido en bodega"
  ) {

    return document.getElementById(
      "listaBodega"
    );

  }


  if (
    estadoVisual ===
    "Llegó a Venezuela"
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
// GENERAR ID SEGURO PARA TARJETA DE CLIENTE
// ======================================================

function generarIdTarjetaCliente(
  paquete
) {

  const identificador =
    obtenerIdentificadorCliente(
      paquete
    );


  const estadoVisual =
    obtenerEstadoVisual(
      paquete.estado
    );


  return (
    "tarjetaCliente-" +
    normalizarTexto(
      identificador
    ) +
    "-" +
    normalizarTexto(
      estadoVisual
    )
  );

}


// ======================================================
// SECCIÓN 7/16
// CREAR FILA INDIVIDUAL DE TRACKING
// ======================================================

function crearFilaTracking(
  id,
  datos,
  cliente
) {

  const fila =
    document.createElement("div");


  fila.id =
    "filaTracking-" + id;


  fila.className =
    "fila-tracking-admin";


  fila.dataset.id =
    id;


  fila.dataset.tracking =
    datos.tracking ||
    "";


  fila.style.background =
    "#ffffff";


  fila.style.border =
    "1px solid #ddd";


  fila.style.borderRadius =
    "12px";


  fila.style.padding =
    "12px";


  fila.style.marginTop =
    "10px";


  fila.style.boxSizing =
    "border-box";


  const tracking =
    datos.tracking ||
    "Sin tracking";


  const estadoOriginal =
    datos.estado ||
    "Prealertado";


  const estadoVisual =
    obtenerEstadoVisual(
      estadoOriginal
    );


  const correo =
    cliente
      ? (
          cliente.correo ||
          cliente.email ||
          datos.correo ||
          "Sin correo"
        )
      : (
          datos.correo ||
          "Sin correo"
        );


  const telefono =
    cliente
      ? (
          cliente.telefono ||
          "Sin teléfono"
        )
      : (
          datos.telefono ||
          "Sin teléfono"
        );


  fila.innerHTML = `

    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:8px;
    ">

      <div style="
        color:#003366;
        font-size:16px;
        font-weight:bold;
        word-break:break-all;
      ">

        📦 ${tracking}

      </div>

      <div style="
        background:#eef4ff;
        color:#003366;
        border-radius:8px;
        padding:5px 8px;
        font-size:11px;
        font-weight:bold;
      ">

        ${estadoVisual}

      </div>

    </div>


    <div style="
      font-size:13px;
      color:#555;
      margin-bottom:8px;
    ">

      <div>
        📧 ${correo}
      </div>

      <div style="
        margin-top:3px;
      ">
        📱 ${telefono}
      </div>

    </div>


    <div style="
      font-weight:bold;
      margin-top:8px;
    ">

      🔄 Cambiar estado:

    </div>


    <select
      id="estado-${id}"
      style="
        width:100%;
        box-sizing:border-box;
        padding:10px;
        margin-top:6px;
        border-radius:9px;
        border:1px solid #ccc;
        font-size:14px;
      "
    >

      <option
        value="Prealertado"
        ${
          estadoVisual ===
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
          estadoVisual ===
          "Recibido en bodega"
            ? "selected"
            : ""
        }
      >
        Recibido en bodega
      </option>

      <option
        value="Llegó a Venezuela"
        ${
          estadoVisual ===
          "Llegó a Venezuela"
            ? "selected"
            : ""
        }
      >
        Llegó a Venezuela
      </option>

    </select>


    <button
      type="button"
      id="btnEstado-${id}"
      style="
        width:100%;
        padding:10px;
        margin-top:8px;
        border:0;
        border-radius:9px;
        background:#003366;
        color:white;
        font-size:14px;
        font-weight:bold;
        cursor:pointer;
      "
    >

      💾 Guardar cambio

    </button>


    <button
      type="button"
      id="btnVerEntrega-${id}"
      style="
        width:100%;
        padding:10px;
        margin-top:8px;
        border:0;
        border-radius:9px;
        background:#198754;
        color:white;
        font-size:14px;
        font-weight:bold;
        cursor:pointer;
      "
    >

      📍 Ver datos de entrega

    </button>


    <button
      type="button"
      id="btnEliminar-${id}"
      style="
        width:100%;
        padding:10px;
        margin-top:8px;
        border:0;
        border-radius:9px;
        background:#dc3545;
        color:white;
        font-size:14px;
        font-weight:bold;
        cursor:pointer;
      "
    >

      🗑️ Eliminar prealerta

    </button>

  `;


  // ====================================================
  // BOTÓN CAMBIAR ESTADO
  // ====================================================

  const botonEstado =
    fila.querySelector(
      "#btnEstado-" + id
    );


  if (botonEstado) {

    botonEstado.addEventListener(
      "click",
      async () => {

        await cambiarEstadoTarjeta(
          id
        );

      }
    );

  }


  // ====================================================
  // BOTÓN DATOS DE ENTREGA
  // ====================================================

  const botonVerEntrega =
    fila.querySelector(
      "#btnVerEntrega-" + id
    );


  if (botonVerEntrega) {

    botonVerEntrega.addEventListener(
      "click",
      async () => {

        const prealerta =
          datosPrealertas[id];


        if (!prealerta) {

          alert(
            "❌ No se encontraron los datos de esta prealerta."
          );

          return;

        }


        await verDatosEntrega(
          prealerta.uid
        );

      }
    );

  }


  // ====================================================
  // BOTÓN ELIMINAR
  // ====================================================

  const botonEliminar =
    fila.querySelector(
      "#btnEliminar-" + id
    );


  if (botonEliminar) {

    botonEliminar.addEventListener(
      "click",
      async () => {

        await eliminarPrealerta(
          id
        );

      }
    );

  }


  return fila;

}


// ======================================================
// SECCIÓN 8/16
// CREAR TARJETA AGRUPADA POR CLIENTE
// ======================================================

function crearTarjetaCliente(
  grupo
) {

  const primerPaquete =
    grupo.paquetes[0];


  if (!primerPaquete) {
    return null;
  }


  const cliente =
    obtenerClienteDePaquete(
      primerPaquete
    );


  const nombre =
    cliente
      ? (
          `${cliente.nombre || ""} ${cliente.apellido || ""}`
            .trim() ||
          "Cliente sin nombre"
        )
      : obtenerNombreCliente(
          primerPaquete
        );


  const codigo =
    cliente
      ? (
          cliente.codigo ||
          "Sin código"
        )
      : "Sin código";


  const correo =
    cliente
      ? (
          cliente.correo ||
          cliente.email ||
          "Sin correo"
        )
      : (
          primerPaquete.correo ||
          "Sin correo"
        );


  const telefono =
    cliente
      ? (
          cliente.telefono ||
          "Sin teléfono"
        )
      : "Sin teléfono";


  const estadoVisual =
    grupo.estadoVisual;


  const tarjeta =
    document.createElement(
      "div"
    );


  tarjeta.id =
    generarIdTarjetaCliente(
      primerPaquete
    );


  tarjeta.className =
    "tarjeta-cliente-admin";


  tarjeta.style.background =
    "#ffffff";


  tarjeta.style.border =
    "1px solid #d8d8d8";


  tarjeta.style.borderRadius =
    "16px";


  tarjeta.style.padding =
    "14px";


  tarjeta.style.marginBottom =
    "15px";


  tarjeta.style.boxShadow =
    "0 5px 15px rgba(0,0,0,.08)";


  tarjeta.style.boxSizing =
    "border-box";


  tarjeta.dataset.cliente =
    obtenerIdentificadorCliente(
      primerPaquete
    );


  tarjeta.dataset.estado =
    estadoVisual;


  tarjeta.innerHTML = `

    <div style="
      border-bottom:1px solid #eee;
      padding-bottom:12px;
      margin-bottom:10px;
    ">

      <div style="
        color:#003366;
        font-size:18px;
        font-weight:bold;
        word-break:break-word;
      ">

        👤 ${nombre}

      </div>


      <div style="
        margin-top:5px;
        font-size:13px;
        color:#555;
      ">

        🆔 Código RG:
        <strong>
          ${codigo}
        </strong>

      </div>


      <div style="
        margin-top:3px;
        font-size:13px;
        color:#555;
        word-break:break-word;
      ">

        📧 ${correo}

      </div>


      <div style="
        margin-top:3px;
        font-size:13px;
        color:#555;
      ">

        📱 ${telefono}

      </div>

    </div>


    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:8px;
    ">

      <strong style="
        color:#003366;
      ">

        📦 Paquetes:
        ${grupo.paquetes.length}

      </strong>


      <span style="
        background:#eef4ff;
        color:#003366;
        padding:6px 9px;
        border-radius:8px;
        font-size:11px;
        font-weight:bold;
      ">

        ${estadoVisual}

      </span>

    </div>


    <div
      id="trackings-${normalizarTexto(
        obtenerIdentificadorCliente(
          primerPaquete
        )
      )}-${normalizarTexto(
        estadoVisual
      )}"
    ></div>

  `;


  const contenedorTrackings =
    tarjeta.querySelector(
      `#trackings-${normalizarTexto(
        obtenerIdentificadorCliente(
          primerPaquete
        )
      )}-${normalizarTexto(
        estadoVisual
      )}`
    );


  grupo.paquetes.forEach(
    (paquete) => {

      const fila =
        crearFilaTracking(
          paquete.id,
          paquete,
          obtenerClienteDePaquete(
            paquete
          )
        );


      if (
        fila &&
        contenedorTrackings
      ) {

        contenedorTrackings.appendChild(
          fila
        );

      }

    }
  );


  return tarjeta;

}


// ======================================================
// FIN DE PARTE 2/4
// ======================================================
// CONTINUAR DIRECTAMENTE CON LA PARTE 3/4
// ======================================================

// ======================================================
// SECCIÓN 9/16
// AGRUPAR TRACKINGS POR CLIENTE Y ESTADO
// ======================================================

function agruparPaquetesPorClienteYEstado() {

  const grupos = {};

  Object.values(
    datosPrealertas
  ).forEach((paquete) => {

    const estadoVisual =
      obtenerEstadoVisual(
        paquete.estado
      );

    const identificadorCliente =
      obtenerIdentificadorCliente(
        paquete
      );

    const clave =
      identificadorCliente +
      "||" +
      estadoVisual;

    if (!grupos[clave]) {

      grupos[clave] = {

        identificadorCliente:
          identificadorCliente,

        estadoVisual:
          estadoVisual,

        paquetes: []

      };

    }

    grupos[clave].paquetes.push(
      paquete
    );

  });

  return grupos;

}


// ======================================================
// ORDENAR TRACKINGS DENTRO DE CADA CLIENTE
// ======================================================

function ordenarPaquetesGrupo(
  paquetes
) {

  return paquetes.sort(
    (a, b) => {

      const trackingA =
        String(
          a.tracking || ""
        ).toLowerCase();

      const trackingB =
        String(
          b.tracking || ""
        ).toLowerCase();

      return trackingA.localeCompare(
        trackingB
      );

    }
  );

}


// ======================================================
// PINTAR TODO EL TABLERO AGRUPADO
// ======================================================

function pintarTableroAgrupado() {

  const columnas = {

    "Prealertado":
      document.getElementById(
        "listaPrealertados"
      ),

    "Recibido en bodega":
      document.getElementById(
        "listaBodega"
      ),

    "Llegó a Venezuela":
      document.getElementById(
        "listaVenezuela"
      )

  };


  Object.values(
    columnas
  ).forEach(
    (columna) => {

      if (columna) {

        columna.innerHTML = "";

      }

    }
  );


  const grupos =
    agruparPaquetesPorClienteYEstado();


  const gruposOrdenados =
    Object.values(
      grupos
    ).sort(
      (a, b) => {

        const nombreA =
          obtenerNombreCliente(
            a.paquetes[0]
          ).toLowerCase();

        const nombreB =
          obtenerNombreCliente(
            b.paquetes[0]
          ).toLowerCase();

        return nombreA.localeCompare(
          nombreB
        );

      }
    );


  gruposOrdenados.forEach(
    (grupo) => {

      grupo.paquetes =
        ordenarPaquetesGrupo(
          grupo.paquetes
        );


      const columna =
        columnas[
          grupo.estadoVisual
        ];


      if (!columna) {
        return;
      }


      const tarjeta =
        crearTarjetaCliente(
          grupo
        );


      if (tarjeta) {

        columna.appendChild(
          tarjeta
        );

      }

    }
  );


  actualizarContadoresTablero();

}


// ======================================================
// SECCIÓN 10/16
// ACTUALIZAR CONTADORES DEL TABLERO
// ======================================================

function actualizarContadoresTablero() {

  let prealertados = 0;

  let bodega = 0;

  let venezuela = 0;


  Object.values(
    datosPrealertas
  ).forEach(
    (paquete) => {

      const estadoVisual =
        obtenerEstadoVisual(
          paquete.estado
        );


      if (
        estadoVisual ===
        "Prealertado"
      ) {

        prealertados++;

      }


      else if (
        estadoVisual ===
        "Recibido en bodega"
      ) {

        bodega++;

      }


      else if (
        estadoVisual ===
        "Llegó a Venezuela"
      ) {

        venezuela++;

      }

    }
  );


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


  if (
    contadorPrealertados
  ) {

    contadorPrealertados.textContent =
      prealertados +
      (
        prealertados === 1
          ? " paquete"
          : " paquetes"
      );

  }


  if (
    contadorBodega
  ) {

    contadorBodega.textContent =
      bodega +
      (
        bodega === 1
          ? " paquete"
          : " paquetes"
      );

  }


  if (
    contadorVenezuela
  ) {

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
// ACTUALIZAR UNA PARTE DEL TABLERO
// ======================================================

function actualizarTableroCompleto() {

  pintarTableroAgrupado();

}


// ======================================================
// SECCIÓN 11/16
// CONSULTAR DATOS DE ENTREGA
// ======================================================

async function verDatosEntrega(
  uid
) {

  try {

    if (!uid) {

      alert(
        "❌ No se encontró el UID del cliente."
      );

      return;

    }


    const referencia =
      doc(
        db,
        "datosEntrega",
        uid
      );


    const resultado =
      await getDoc(
        referencia
      );


    if (
      !resultado.exists()
    ) {

      alert(
        "📍 Este cliente todavía no tiene datos de entrega guardados."
      );

      return;

    }


    const datosEntrega =
      resultado.data();


    const empresa =
      datosEntrega.empresaEnvio ||
      "No especificada";


    const tipoEntrega =
      datosEntrega.tipoEntrega ||
      "No especificado";


    const telefono =
      datosEntrega.telefono ||
      "No especificado";


    const personaRecibe =
      datosEntrega.personaRecibe ||
      "No especificada";


    const observaciones =
      datosEntrega.observaciones ||
      "Ninguna";


    let mensaje =
      "📍 DATOS DE ENTREGA\n\n" +

      "🚚 Empresa de envío: " +
      empresa +
      "\n\n" +

      "📦 Tipo de entrega: " +
      tipoEntrega +
      "\n\n";


    // ==================================================
    // ENTREGA A DOMICILIO
    // ==================================================

    if (
      tipoEntrega
        .toLowerCase()
        .includes("domicilio")
    ) {

      mensaje +=

        "📍 Estado: " +

        (
          datosEntrega.estadoDomicilio ||
          datosEntrega.estado ||
          "No especificado"
        ) +

        "\n\n" +

        "🏙️ Ciudad/Municipio: " +

        (
          datosEntrega.ciudadDomicilio ||
          datosEntrega.municipio ||
          datosEntrega.ciudad ||
          "No especificada"
        ) +

        "\n\n" +

        "🏘️ Barrio/Urbanización: " +

        (
          datosEntrega.barrioUrbanizacion ||
          "No especificado"
        ) +

        "\n\n" +

        "🛣️ Calle/Avenida: " +

        (
          datosEntrega.calleAvenida ||
          "No especificada"
        ) +

        "\n\n" +

        "🏠 Número de casa: " +

        (
          datosEntrega.numeroCasa ||
          "No especificado"
        ) +

        "\n\n" +

        "🏠 Dirección: " +

        (
          datosEntrega.direccionDomicilio ||
          datosEntrega.direccion ||
          "No especificada"
        ) +

        "\n\n" +

        "📮 Código postal: " +

        (
          datosEntrega.codigoPostal ||
          "No especificado"
        ) +

        "\n\n" +

        "📌 Punto de referencia: " +

        (
          datosEntrega.puntoReferencia ||
          "No especificado"
        ) +

        "\n\n";

    }


    // ==================================================
    // ENTREGA EN OFICINA
    // ==================================================

    else {

      mensaje +=

        "📍 Estado: " +

        (
          datosEntrega.estado ||
          "No especificado"
        ) +

        "\n\n" +

        "🏙️ Ciudad: " +

        (
          datosEntrega.ciudad ||
          "No especificada"
        ) +

        "\n\n" +

        "🏢 Oficina: " +

        (
          datosEntrega.oficina ||
          "No especificada"
        ) +

        "\n\n" +

        "🏠 Dirección de oficina: " +

        (
          datosEntrega.direccionOficina ||
          datosEntrega.direccion ||
          "No especificada"
        ) +

        "\n\n";

    }


    mensaje +=

      "📱 Teléfono: " +

      telefono +

      "\n\n" +

      "👤 Persona que recibe: " +

      personaRecibe +

      "\n\n" +

      "📝 Observaciones: " +

      observaciones;


    alert(
      mensaje
    );


  } catch (error) {

    console.error(
      "❌ Error al consultar los datos de entrega:",
      error
    );


    alert(
      "❌ No se pudieron consultar los datos de entrega."
    );

  }

}


// ======================================================
// SECCIÓN 12/16
// ELIMINAR Y CAMBIAR ESTADO
// ======================================================


// ======================================================
// ELIMINAR PREALERTA
// ======================================================

async function eliminarPrealerta(
  id
) {

  if (
    !confirm(
      "¿Seguro que quieres eliminar esta prealerta?"
    )
  ) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "prealertas",
        id
      )
    );


    console.log(
      "🗑️ PREALERTA ELIMINADA:",
      id
    );


    /*
     * El onSnapshot eliminará automáticamente
     * el registro del objeto local y volverá
     * a pintar el tablero agrupado.
     */

  } catch (error) {

    console.error(
      "ERROR ELIMINANDO PREALERTA:",
      error
    );


    alert(
      "❌ Error eliminando la prealerta:\n\n" +
      error.message
    );

  }

}


// ======================================================
// CAMBIAR ESTADO DESDE UNA FILA
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
      "❌ No se encontró el selector."
    );

    return;

  }


  const estadoNuevo =
    selector.value;


  /*
   * Seguridad adicional:
   * solamente permitimos los tres estados
   * nuevos desde la interfaz.
   */

  const estadosPermitidos = [

    "Prealertado",

    "Recibido en bodega",

    "Llegó a Venezuela"

  ];


  if (
    !estadosPermitidos.includes(
      estadoNuevo
    )
  ) {

    alert(
      "❌ Estado no permitido."
    );

    return;

  }


  const paquete =
    datosPrealertas[id];


  if (!paquete) {

    alert(
      "❌ No se encontró la información del paquete."
    );

    return;

  }


  const estadoAnterior =
    paquete.estado ||
    "Prealertado";


  const estadoAnteriorVisual =
    obtenerEstadoVisual(
      estadoAnterior
    );


  if (
    estadoNuevo ===
    estadoAnteriorVisual
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
        estado:
          estadoNuevo
      }
    );


    /*
     * No usamos cargarPrealertas().
     *
     * El listener onSnapshot detectará
     * únicamente el cambio de este documento.
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
      "❌ Error actualizando estado:\n\n" +
      error.message
    );

  }

}


// ======================================================
// ACTUALIZAR DATOS LOCALES DE UN PAQUETE
// ======================================================

function actualizarDatosPaqueteLocal(
  id,
  nuevosDatos
) {

  if (
    !datosPrealertas[id]
  ) {

    datosPrealertas[id] = {

      id:
        id,

      ...nuevosDatos

    };

    return;

  }


  datosPrealertas[id] = {

    ...datosPrealertas[id],

    ...nuevosDatos

  };

}


// ======================================================
// FIN DE PARTE 3/4
// ======================================================
// CONTINUAR DIRECTAMENTE CON LA PARTE 4/4
// ======================================================

// ======================================================
// SECCIÓN 13/16
// CARGAR PREALERTAS Y ESCUCHA EN TIEMPO REAL
// ======================================================


// ======================================================
// CARGAR PREALERTAS
// ======================================================

async function cargarPrealertas() {

  crearTableroPrealertas();


  try {

    // ==================================================
    // CARGAR USUARIOS
    // ==================================================

    const usuariosSnapshot =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    usuariosPorUid = {};


    usuariosSnapshot.forEach(
      (documento) => {

        const datos =
          documento.data();


        const usuario = {

          id:
            documento.id,

          ...datos

        };


        /*
         * Primera posibilidad:
         * el documento tiene un campo uid.
         */

        if (datos.uid) {

          usuariosPorUid[
            datos.uid
          ] = usuario;

        }


        /*
         * Segunda posibilidad:
         * el ID del documento es el UID.
         */

        usuariosPorUid[
          documento.id
        ] = usuario;

      }
    );


    console.log(
      "👥 USUARIOS DISPONIBLES PARA PREALERTAS:",
      Object.keys(
        usuariosPorUid
      ).length
    );


    // ==================================================
    // CARGAR PREALERTAS
    // ==================================================

    const prealertasSnapshot =
      await getDocs(
        collection(
          db,
          "prealertas"
        )
      );


    datosPrealertas = {};


    prealertasSnapshot.forEach(
      (documento) => {

        const datos =
          documento.data();


        const cliente =
          obtenerClienteDePaquete(
            datos
          );


        datosPrealertas[
          documento.id
        ] = {

          id:
            documento.id,

          ...datos,

          cliente:
            cliente

        };

      }
    );


    // ==================================================
    // PINTAR TABLERO AGRUPADO
    // ==================================================

    pintarTableroAgrupado();


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

          let huboCambios =
            false;


          snapshot.docChanges()
            .forEach(
              (cambio) => {

                const id =
                  cambio.doc.id;


                // ========================================
                // DOCUMENTO ELIMINADO
                // ========================================

                if (
                  cambio.type ===
                  "removed"
                ) {

                  if (
                    datosPrealertas[id]
                  ) {

                    delete datosPrealertas[
                      id
                    ];

                    huboCambios =
                      true;

                  }

                  return;

                }


                // ========================================
                // DOCUMENTO NUEVO O MODIFICADO
                // ========================================

                const datos =
                  cambio.doc.data();


                const cliente =
                  obtenerClienteDePaquete(
                    datos
                  );


                /*
                 * Si el paquete ya estaba cargado,
                 * conservamos el cliente que ya conocemos
                 * en caso de que no pueda resolverse
                 * inmediatamente.
                 */

                const clienteAnterior =
                  datosPrealertas[id]
                    ? datosPrealertas[id].cliente
                    : null;


                datosPrealertas[id] = {

                  id:
                    id,

                  ...datos,

                  cliente:
                    cliente ||
                    clienteAnterior ||
                    null

                };


                huboCambios =
                  true;

              }
            );


          if (huboCambios) {

            /*
             * Volvemos a pintar el tablero agrupado.
             *
             * Esto no recarga la página.
             * Solamente actualiza el contenido
             * del tablero.
             */

            pintarTableroAgrupado();

          }

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


    if (listaAdmin) {

      listaAdmin.innerHTML = `

        <p style="
          color:red;
          text-align:center;
        ">

          ❌ Error cargando prealertas.

          <br><br>

          ${error.message}

        </p>

      `;

    }

  }

}


// ======================================================
// SECCIÓN 14/16
// AUTENTICACIÓN DEL ADMINISTRADOR
// ======================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    // ==================================================
    // NO HAY USUARIO
    // ==================================================

    if (!usuario) {

      window.location.href =
        "index.html";

      return;

    }


    // ==================================================
    // COMPROBAR CORREO DEL ADMINISTRADOR
    // ==================================================

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


    // ==================================================
    // CREAR PANEL DE USUARIOS
    // ==================================================

    crearPanelUsuarios();


    // ==================================================
    // CARGAR USUARIOS
    // ==================================================

    await cargarUsuarios();


    // ==================================================
    // CARGAR PREALERTAS
    // ==================================================

    await cargarPrealertas();


    console.log(
      "PANEL ADMINISTRADOR CARGADO CORRECTAMENTE"
    );

  }
);


// ======================================================
// SECCIÓN 15/16
// ESCÁNER DE CÓDIGOS DE BARRAS
// ======================================================


// ======================================================
// VARIABLES DEL ESCÁNER
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


  if (resultado) {

    resultado.textContent =
      "📷 Preparando cámara...";

  }


  // ==================================================
  // CERRAR ESCÁNER ANTERIOR
  // ==================================================

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


  escaneando =
    true;


  try {

    // ==================================================
    // CONFIGURACIÓN DE CÁMARA
    // ==================================================

    await escanerQR.start(

      {
        facingMode:
          "environment"
      },

      {

        fps:
          40,


        qrbox:
          function(
            viewfinderWidth,
            viewfinderHeight
          ) {

            return {

              width:
                Math.floor(
                  viewfinderWidth *
                  0.90
                ),

              height:
                Math.min(
                  220,
                  Math.floor(
                    viewfinderHeight *
                    0.35
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


        escaneando =
          false;


        console.log(
          "TRACKING ESCANEADO:",
          codigoEscaneado
        );


        // ==============================================
        // MOSTRAR TRACKING
        // ==============================================

        if (resultado) {

          resultado.textContent =
            "✅ Tracking leído: " +
            codigoEscaneado;

        }


        // ==============================================
        // SONIDO
        // ==============================================

        await reproducirSonido();


        // ==============================================
        // DETENER CÁMARA
        // ==============================================

        await detenerEscaner();


        // ==============================================
        // AVISO
        // ==============================================

        alert(
          "📦 TRACKING ESCANEADO:\n\n" +
          codigoEscaneado
        );


        // ==============================================
        // BUSCAR TRACKING
        // ==============================================

        try {

          if (resultado) {

            resultado.textContent =
              "🔎 Buscando paquete...";

          }


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

            if (resultado) {

              resultado.innerHTML =
                "❌ No se encontró ningún paquete con el tracking:<br><br>" +

                "<strong>" +

                codigoEscaneado +

                "</strong>";

            }


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


          const idPaquete =
            documento.id;


          // ==================================================
          // BUSCAR CLIENTE
          // ==================================================

          let cliente =
            null;


          if (
            paquete.uid &&
            usuariosPorUid[
              paquete.uid
            ]
          ) {

            cliente =
              usuariosPorUid[
                paquete.uid
              ];

          }


          /*
           * Si no está en memoria, hacemos
           * una consulta directa a usuarios.
           */

          if (
            !cliente &&
            paquete.uid
          ) {

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

              cliente =
                {

                  id:
                    snapshotCliente
                      .docs[0]
                      .id,

                  ...snapshotCliente
                    .docs[0]
                    .data()

                };


              usuariosPorUid[
                paquete.uid
              ] =
                cliente;

            }

          }


          /*
           * Último respaldo:
           * buscar por correo.
           */

          if (
            !cliente &&
            paquete.correo
          ) {

            const consultaCorreo =
              query(

                collection(
                  db,
                  "usuarios"
                ),

                where(
                  "correo",
                  "==",
                  paquete.correo
                )

              );


            const snapshotCorreo =
              await getDocs(
                consultaCorreo
              );


            if (
              !snapshotCorreo.empty
            ) {

              cliente =
                {

                  id:
                    snapshotCorreo
                      .docs[0]
                      .id,

                  ...snapshotCorreo
                    .docs[0]
                    .data()

                };

            }

          }


          const nombreCliente =
            cliente
              ? (
                  `${cliente.nombre || ""} ${cliente.apellido || ""}`
                    .trim() ||
                  "No disponible"
                )
              : "No disponible";


          const codigoCliente =
            cliente
              ? (
                  cliente.codigo ||
                  "No disponible"
                )
              : "No disponible";


          const correoCliente =
            cliente
              ? (
                  cliente.correo ||
                  cliente.email ||
                  paquete.correo ||
                  "No disponible"
                )
              : (
                  paquete.correo ||
                  "No disponible"
                );


          console.log(
            "📦 PAQUETE ENCONTRADO:",
            paquete
          );


          // ==================================================
          // ESTADO VISUAL ACTUAL
          // ==================================================

          const estadoActual =
            paquete.estado ||
            "Prealertado";


          const estadoVisualActual =
            obtenerEstadoVisual(
              estadoActual
            );


          // ==================================================
          // MOSTRAR INFORMACIÓN
          // ==================================================

          if (resultado) {

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

                  ${estadoVisualActual}

                </p>


                <label>

                  <strong>
                    🔄 Cambiar estado:
                  </strong>

                </label>


                <select
                  id="estadoEscaneado-${idPaquete}"
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
                      estadoVisualActual ===
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
                      estadoVisualActual ===
                      "Recibido en bodega"
                        ? "selected"
                        : ""
                    }
                  >
                    Recibido en bodega
                  </option>


                  <option
                    value="Llegó a Venezuela"
                    ${
                      estadoVisualActual ===
                      "Llegó a Venezuela"
                        ? "selected"
                        : ""
                    }
                  >
                    Llegó a Venezuela
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

          }


          // ==================================================
          // BOTÓN GUARDAR ESTADO DEL ESCÁNER
          // ==================================================

          const botonGuardar =
            document.getElementById(
              "btnGuardarEstadoEscaneado"
            );


          if (botonGuardar) {

            botonGuardar.addEventListener(
              "click",
              async () => {

                const selector =
                  document.getElementById(
                    "estadoEscaneado-" +
                    idPaquete
                  );


                if (!selector) {

                  alert(
                    "❌ No se encontró el selector de estado."
                  );

                  return;

                }


                const nuevoEstado =
                  selector.value;


                const estadosPermitidos = [

                  "Prealertado",

                  "Recibido en bodega",

                  "Llegó a Venezuela"

                ];


                if (
                  !estadosPermitidos.includes(
                    nuevoEstado
                  )
                ) {

                  alert(
                    "❌ Estado no permitido."
                  );

                  return;

                }


                const estadoAnterior =
                  paquete.estado ||
                  "Prealertado";


                const estadoAnteriorVisual =
                  obtenerEstadoVisual(
                    estadoAnterior
                  );


                if (
                  nuevoEstado ===
                  estadoAnteriorVisual
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
                      idPaquete
                    );


                  // ==========================================
                  // GUARDAR SOLO ESTE TRACKING
                  // ==========================================

                  await updateDoc(
                    referencia,
                    {
                      estado:
                        nuevoEstado
                    }
                  );


                  // ==========================================
                  // ACTUALIZAR MEMORIA LOCAL
                  // ==========================================

                  actualizarDatosPaqueteLocal(
                    idPaquete,
                    {
                      estado:
                        nuevoEstado
                    }
                  );


                  // ==========================================
                  // EMAIL AL RECIBIR EN BODEGA
                  // ==========================================

                  if (
                    nuevoEstado ===
                    "Recibido en bodega"
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


                  // ==========================================
                  // EL LISTENER ACTUALIZARÁ EL TABLERO
                  // ==========================================

                  if (
                    resultado
                  ) {

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

                  }


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

          }


        } catch (
          error
        ) {

          console.error(
            "ERROR BUSCANDO TRACKING:",
            error
          );


          if (resultado) {

            resultado.innerHTML =
              "❌ Error buscando el paquete.<br><br>" +
              error.message;

          }


          alert(

            "❌ ERROR BUSCANDO PAQUETE\n\n" +

            error.message

          );

        }

      },


      (errorMessage) => {

        /*
         * No mostramos errores mientras
         * la cámara está buscando.
         */

      }

    );


    if (resultado) {

      resultado.textContent =
        "📷 Apunta la cámara al código de barras del paquete.";

    }


  } catch (error) {

    console.error(
      "ERROR ABRIENDO CÁMARA:",
      error
    );


    if (resultado) {

      resultado.innerHTML =
        "❌ No se pudo abrir la cámara.<br><br>" +
        error.message;

    }


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

    } catch (
      error
    ) {

      console.log(
        "Error deteniendo escáner:",
        error
      );

    }


    try {

      await escanerQR.clear();

    } catch (
      error
    ) {

      console.log(
        "Error limpiando escáner:",
        error
      );

    }

  }


  escanerQR =
    null;


  const contenedor =
    document.getElementById(
      "scannerContainer"
    );


  if (contenedor) {

    /*
     * Lo dejamos visible para que el administrador
     * pueda ver el resultado del escaneo.
     */

    contenedor.style.display =
      "block";

  }

}


// ======================================================
// SECCIÓN 16/16
// BOTONES Y FINAL DEL ARCHIVO
// ======================================================


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
// BOTÓN BUSCAR PRINCIPAL
// ======================================================

const btnBuscarPrincipal =
  document.getElementById(
    "btnBuscar"
  );


if (btnBuscarPrincipal) {

  btnBuscarPrincipal.addEventListener(
    "click",
    buscarPrincipal
  );

}


// ======================================================
// PERMITIR BUSCAR CON ENTER
// ======================================================

const inputBuscarPrincipal =
  document.getElementById(
    "buscar"
  );


if (inputBuscarPrincipal) {

  inputBuscarPrincipal.addEventListener(
    "keydown",
    (evento) => {

      if (
        evento.key ===
        "Enter"
      ) {

        buscarPrincipal();

      }

    }
  );

}


// ======================================================
// FIN DE ADMIN.JS
// ======================================================

console.log(
  "✅ ADMIN.JS COMPLETO CARGADO"
);

console.log(
  "✅ TABLERO AGRUPADO POR CLIENTE ACTIVADO"
);

console.log(
  "✅ 3 ESTADOS VISUALES ACTIVADOS"
);

console.log(
  "✅ ESCÁNER DE TRACKING ACTIVADO"
);

console.log(
  "✅ TIEMPO REAL DE PREALERTAS ACTIVADO"
);





