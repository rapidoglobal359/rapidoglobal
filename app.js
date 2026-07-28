import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const btnRegistrar = document.getElementById("registrar");
console.log("app.js cargado");

const btnPrealerta = document.getElementById("prealerta");
const btnIniciarSesion = document.getElementById("iniciarSesion");
const btnCerrarSesion = document.getElementById("cerrarSesion");
const cuentaUsuario = document.getElementById("cuentaUsuario");

function generarCodigo(numero) {
    return "RG" + numero.toString().padStart(5, "0");
}
btnRegistrar.addEventListener("click", async () => {

    const nombre = document.getElementById("nombre").value.trim();
    const cedula = document.getElementById("cedula").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("password").value;

    if (!nombre || !correo || !telefono || !password) {
        alert("Complete todos los campos.");
        return;
    }

    try {

        const credencial = await createUserWithEmailAndPassword(
            auth,
            correo,
            password
        );

        const cantidad = await getDocs(collection(db, "usuarios"));

        const codigo = generarCodigo(cantidad.size + 1);

        console.log("Cédula:", cedula);

        await addDoc(collection(db, "usuarios"), {
            uid: credencial.user.uid,
            nombre: nombre,
            cedula: cedula,
            correo: correo,
            telefono: telefono,
            codigo: codigo,
            fechaRegistro: new Date()
        });

        alert(
            "Registro exitoso.\n\n" +
            "Su código de cliente es: " + codigo
        );

    } catch (error) {
        alert("Error: " + error.message);
    }

});



btnIniciarSesion.addEventListener("click", async () => {
console.log("Botón iniciar sesión presionado");
  
const correo = document.getElementById("loginCorreo").value.trim();
const password = document.getElementById("loginPassword").value;

try {

        await signInWithEmailAndPassword(
            auth,
            correo,
            password
        );

window.location.href = "cliente.html";
  
    } catch (error) {
        alert("Error al iniciar sesión: " + error.message);
    }

});


btnCerrarSesion.addEventListener("click", async () => {

    await signOut(auth);

    alert("Sesión cerrada");

});


onAuthStateChanged(auth, (usuario) => {

    if (usuario) {

        cuentaUsuario.innerHTML =
        "Usuario conectado: " + usuario.email;

    } else {

        cuentaUsuario.innerHTML =
        "No hay sesión iniciada";

    }

});
