import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const btnRegistrar = document.getElementById("registrar");
console.log("app.js cargado");

const btnPrealerta = document.getElementById("prealerta");

function generarCodigo(numero) {
    return "RG" + const btnRegistrar = document.getElementById("registrar");
console.log("app.js cargado");
.toString().padStart(5, "0");
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


btnPrealerta.addEventListener("click", async () => {

    const tracking = document.getElementById("tracking").value.trim();

    if (!tracking) {
        alert("Ingrese el número de tracking.");
        return;
    }

    try {

        await addDoc(collection(db, "prealertas"), {
            tracking: tracking,
            fecha: new Date()
        });

        alert("Prealerta registrada correctamente.");

        document.getElementById("tracking").value = "";

    } catch (error) {
        alert("Error al registrar la prealerta: " + error.message);
    }

});
