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


// =====================================================
// VARIABLES PRINCIPALES
// =====================================================

const listaAdmin = document.getElementById("listaAdmin");

let cantidadUsuariosAnterior = 0;
let contextoAudio = null;
let cantidadUsuariosActual = 0;


// =====================================================
// ACTIVAR AUDIO
// =====================================================

document.addEventListener("click", async () => {

  if (!contextoAudio) {
    contextoAudio = new AudioContext();
  }

  if (contextoAudio.state === "suspended") {
    await contextoAudio.resume();
  }

}, { once: true });


// =====================================================
// REPRODUCIR SONIDO
// =====================================================

async function reproducirSonido() {

  if (!contextoAudio) {
    return;
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
}


// =====================================================
// CONTADOR DE USUARIOS EN TIEMPO REAL
// =====================================================

onSnapshot(
  collection(db, "usuarios"),
  (snapshot) => {

    const cantidadActual = snapshot.size;

    cantidadUsuariosActual = cantidadActual;


    // Actualizar contador si ya existe
    const contador =
      document.getElementById("contadorUsuarios");

    if (contador) {

      contador.textContent = cantidadActual;

    }


    // Avisar cuando aparezcan nuevos usuarios
    if (
      cantidadUsuariosAnterior > 0 &&
      cantidadActual > cantidadUsuariosAnterior
    ) {

      const nuevos =
        cantidadActual - cantidadUsuariosAnterior;


      if (contextoAudio) {

        reproducirSonido();

      }


      alert(
        "🔔 ¡Nuevo cliente registrado!\n\n" +
        "Se registraron " +
        nuevos +
        " cliente(s) nuevo(s)."
      );

    }


    cantidadUsuariosAnterior = cantidadActual;

  },
  (error) => {

    console.error(
      "Error escuchando usuarios:",
      error
    );

  }
);


// =====================================================
// CREAR SECCIÓN DE USUARIOS
// =====================================================

function crearSeccionUsuarios() {

  // Evitar duplicados
  if (
    document.getElementById(
      "seccionUsuariosAdmin"
    )
  ) {

    return;

  }


  const seccion =
    document.createElement("div");

  seccion.id =
    "seccionUsuariosAdmin";


  seccion.innerHTML = `

    <div style="
      margin: 25px 0;
      padding: 25px;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    ">

      <h2 style="
        color: #003366;
        text-align: center;
        margin-bottom: 20px;
      ">
        👥 Usuarios registrados
      </h2>


      <!-- CONTADOR -->

      <div style="
        text-align: center;
        background: linear-gradient(
          135deg,
          #003366,
          #0A84FF
        );
        color: white;
        padding: 20px;
        border-radius: 15px;
        margin-bottom: 20px;
      ">

        <div style="
          font-size: 16px;
          margin-bottom: 5px;
        ">
          Total de clientes registrados
        </div>


        <div
          id="contadorUsuarios"
          style="
            font-size: 42px;
            font-weight: bold;
          "
        >
          ${cantidadUsuariosActual}
        </div>

      </div>


      <!-- BOTÓN USUARIOS -->

      <button
        id="botonUsuarios"
        style="
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #003366;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 15px;
        "
      >
        👥 Ver usuarios registrados
      </button>


      <!-- PANEL DE BÚSQUEDA -->

      <div
        id="panelUsuarios"
        style="display:none;"
      >

        <input
          type="text"
          id="buscarUsuario"
          placeholder="🔎 Nombre, apellido, correo o código RG"
          style="
            width: 100%;
            box-sizing: border-box;
            padding: 14px;
            border: 1px solid #ccc;
            border-radius: 10px;
            font-size: 15px;
            margin-bottom: 10px;
          "
        >


        <button
          id="botonBuscarUsuario"
          style="
            width: 100%;
            padding: 13px;
            border: none;
            border-radius: 10px;
            background: #0A84FF;
            color: white;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 10px;
          "
        >
          🔎 Buscar usuario
        </button>


        <button
          id="botonMostrarTodos"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #003366;
            border-radius: 10px;
            background: white;
            color: #003366;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 20px;
          "
        >
          📋 Mostrar todos los usuarios
        </button>


        <div id="resultadoUsuarios">

          <p style="text-align:center;">
            Escribe un nombre, apellido,
            correo o código RG.
          </p>

        </div>

      </div>

    </div>

  `;


  // Colocar usuarios antes de las prealertas
  listaAdmin.parentNode.insertBefore(
    seccion,
    listaAdmin
  );


  // ===================================================
  // BOTÓN ABRIR / CERRAR
  // ===================================================

  document
    .getElementById("botonUsuarios")
    .addEventListener(
      "click",
      () => {

        const panel =
          document.getElementById(
            "panelUsuarios"
          );

        const boton =
          document.getElementById(
            "botonUsuarios"
          );


        if (
          panel.style.display === "none"
        ) {

          panel.style.display = "block";

          boton.textContent =
            "⬆️ Ocultar usuarios";

        } else {

          panel.style.display = "none";

          boton.textContent =
            "👥 Ver usuarios registrados";

        }

      }
    );


  // ===================================================
  // BOTÓN BUSCAR
  // ===================================================

  document
    .getElementById(
      "botonBuscarUsuario"
    )
    .addEventListener(
      "click",
      buscarUsuarios
    );


  // ===================================================
  // ENTER PARA BUSCAR
  // ===================================================

  document
    .getElementById(
      "buscarUsuario"
    )
    .addEventListener(
      "keydown",
      (evento) => {

        if (
          evento.key === "Enter"
        ) {

          buscarUsuarios();

        }

      }
    );


  // ===================================================
  // MOSTRAR TODOS
  // ===================================================

  document
    .getElementById(
      "botonMostrarTodos"
    )
    .addEventListener(
      "click",
      mostrarTodosLosUsuarios
    );

}


// =====================================================
// NORMALIZAR TEXTO PARA BUSQUEDA
// =====================================================

function normalizarTexto(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]/g,
      ""
    );

}


// =====================================================
// BUSCAR USUARIOS
// =====================================================

async function buscarUsuarios() {

  const textoOriginal =
    document
      .getElementById(
        "buscarUsuario"
      )
      .value
      .trim();


  const resultado =
    document.getElementById(
      "resultadoUsuarios"
    );


  if (!textoOriginal) {

    resultado.innerHTML = `

      <p style="
        text-align:center;
      ">

        Escribe un nombre, apellido,
        correo electrónico o código RG.

      </p>

    `;

    return;

  }


  resultado.innerHTML = `

    <p style="
      text-align:center;
    ">

      🔎 Buscando usuario...

    </p>

  `;


  try {

    const usuarios =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    const busqueda =
      normalizarTexto(
        textoOriginal
      );


    const encontrados = [];


    usuarios.forEach(
      (usuario) => {

        const datos =
          usuario.data();


        // ==========================================
        // DATOS DEL USUARIO
        // ==========================================

        const nombre =
          normalizarTexto(
            datos.nombre
          );


        const apellido =
          normalizarTexto(
            datos.apellido
          );


        const correo =
          normalizarTexto(
            datos.correo
          );


        const codigo =
          normalizarTexto(
            datos.codigo
          );


        const nombreCompleto =
          normalizarTexto(
            `${datos.nombre || ""} ${
              datos.apellido || ""
            }`
          );


        // ==========================================
        // COMPARACIÓN
        // ==========================================

        const coincide =
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
          );


        if (coincide) {

          encontrados.push({

            id: usuario.id,

            ...datos

          });

        }

      }
    );


    mostrarResultadosUsuarios(
      encontrados
    );


  } catch (error) {

    console.error(
      "Error buscando usuarios:",
      error
    );


    resultado.innerHTML = `

      <p style="
        color:red;
        text-align:center;
      ">

        ❌ Error buscando usuarios.

      </p>

    `;

  }

}


// =====================================================
// MOSTRAR TODOS LOS USUARIOS
// =====================================================

async function mostrarTodosLosUsuarios() {

  const resultado =
    document.getElementById(
      "resultadoUsuarios"
    );


  resultado.innerHTML = `

    <p style="
      text-align:center;
    ">

      📋 Cargando usuarios...

    </p>

  `;


  try {

    const usuarios =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    const lista = [];


    usuarios.forEach(
      (usuario) => {

        lista.push({

          id: usuario.id,

          ...usuario.data()

        });

      }
    );


    // Orden alfabético
    lista.sort(
      (a, b) => {

        const nombreA =
          String(
            a.nombre || ""
          ).toLowerCase();


        const nombreB =
          String(
            b.nombre || ""
          ).toLowerCase();


        return nombreA.localeCompare(
          nombreB
        );

      }
    );


    mostrarResultadosUsuarios(
      lista
    );


  } catch (error) {

    console.error(
      "Error cargando usuarios:",
      error
    );


    resultado.innerHTML = `

      <p style="
        color:red;
        text-align:center;
      ">

        ❌ Error cargando usuarios.

      </p>

    `;

  }

}


// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarResultadosUsuarios(
  usuarios
) {

  const resultado =
    document.getElementById(
      "resultadoUsuarios"
    );


  if (
    usuarios.length === 0
  ) {

    resultado.innerHTML = `

      <div style="
        padding:20px;
        text-align:center;
        background:#f8f8f8;
        border-radius:10px;
      ">

        ❌ No se encontraron usuarios.

      </div>

    `;

    return;

  }


  resultado.innerHTML = `

    <div style="
      text-align:center;
      margin-bottom:15px;
      font-weight:bold;
      color:#003366;
    ">

      👥 ${
        usuarios.length
      }
      usuario(s) encontrado(s)

    </div>

  `;


  usuarios.forEach(
    (usuario) => {

      resultado.innerHTML += `

        <div style="
          background:#f8faff;
          border-left:5px solid #0A84FF;
          padding:15px;
          margin-bottom:12px;
          border-radius:10px;
        ">

          <div style="
            font-size:18px;
            font-weight:bold;
            color:#003366;
            margin-bottom:8px;
          ">

            👤 ${
              usuario.nombre ||
              "Sin nombre"
            }

          </div>


          <div style="
            margin-bottom:5px;
          ">

            <strong>
              📧 Correo:
            </strong>

            ${
              usuario.correo ||
              "Sin correo"
            }

          </div>


          <div style="
            margin-bottom:5px;
          ">

            <strong>
              📦 Código RG:
            </strong>

            ${
              usuario.codigo ||
              "Sin código"
            }

          </div>


          ${
            usuario.uid
              ?
              `
                <div style="
                  font-size:12px;
                  color:#777;
                  margin-top:8px;
                  word-break:break-all;
                ">

                  UID:
                  ${usuario.uid}

                </div>
              `
              :
              ""
          }

        </div>

      `;

    }
  );

}


// =====================================================
// BUSCAR CLIENTE POR UID
// =====================================================

async function buscarCliente(
  uid
) {

  const usuarios =
    await getDocs(
      collection(
        db,
        "usuarios"
      )
    );


  let cliente = null;


  usuarios.forEach(
    (usuario) => {

      const datos =
        usuario.data();


      if (
        datos.uid === uid
      ) {

        cliente = datos;

      }

    }
  );


  return cliente;

}


// =====================================================
// AUTENTICACIÓN DEL ADMINISTRADOR
// =====================================================

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


    // Crear sección de usuarios
    crearSeccionUsuarios();


    // Cargar prealertas
    cargarPrealertas();


    console.log(
      "Administrador autorizado, cargando prealertas y usuarios"
    );

  }
);


// =====================================================
// CARGAR PREALERTAS
// =====================================================

async function cargarPrealertas() {

  listaAdmin.innerHTML =
    "<p>Cargando prealertas...</p>";


  try {

    const resultado =
      await getDocs(
        collection(
          db,
          "prealertas"
        )
      );


    if (
      resultado.empty
    ) {

      listaAdmin.innerHTML =
        "<p>No hay prealertas registradas.</p>";

      return;

    }


    listaAdmin.innerHTML =
      "";


    for (
      const documento
      of resultado.docs
    ) {

      const datos =
        documento.data();


      const cliente =
        await buscarCliente(
          datos.uid
        );


      listaAdmin.innerHTML += `

        <div class="tarjeta-prealerta">

          <h3>
            📦 Tracking:
            ${
              datos.tracking
            }
          </h3>


          <p>

            <strong>
              Nombre:
            </strong>

            ${
              cliente
                ? cliente.nombre
                : "Sin nombre"
            }

          </p>


          <p>

            <strong>
              Código RG:
            </strong>

            ${
              cliente
                ? cliente.codigo
                : "Sin código"
            }

          </p>


          <p>

            <strong>
              Correo:
            </strong>

            ${
              cliente
                ? cliente.correo
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

            <option
              value="Prealertado"
              ${
                datos.estado ===
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
                datos.estado ===
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
                datos.estado ===
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
                datos.estado ===
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
                datos.estado ===
                "Entregado"
                  ? "selected"
                  : ""
              }
            >
              Entregado
            </option>

          </select>


          <br>
          <br>


          <button
            onclick="
              cambiarEstado(
                '${documento.id}'
              )
            "
          >
            Guardar cambio
          </button>


        </div>


        <hr>

      `;

    }


  } catch (error) {

    console.error(
      "Error cargando prealertas:",
      error
    );


    listaAdmin.innerHTML =
      "<p>Error cargando prealertas.</p>";

  }

}


// =====================================================
// CAMBIAR ESTADO DE PREALERTA
// =====================================================

window.cambiarEstado =
  async function(id) {

    const elemento =
      document.getElementById(
        "estado-" + id
      );


    if (!elemento) {

      alert(
        "No se encontró el estado de la prealerta."
      );

      return;

    }


    const estadoNuevo =
