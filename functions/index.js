const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  getFirestore
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.cambiarCorreoCliente = onCall(
  async (request) => {

    // Verificar que quien ejecuta la función sea administrador.
    if (
      !request.auth ||
      !request.auth.token.email ||
      request.auth.token.email.toLowerCase() !==
        "almeidaedwin81@gmail.com"
    ) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permisos para realizar esta operación."
      );
    }

    const uid = request.data.uid;
    const nuevoCorreo =
      typeof request.data.nuevoCorreo === "string"
        ? request.data.nuevoCorreo.trim().toLowerCase()
        : "";

    if (!uid || !nuevoCorreo) {
      throw new HttpsError(
        "invalid-argument",
        "Falta el UID o el nuevo correo."
      );
    }

    const formatoCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(nuevoCorreo)) {
      throw new HttpsError(
        "invalid-argument",
        "El correo electrónico no tiene un formato válido."
      );
    }

    try {

      // Buscar el cliente en Firebase Authentication.
      const usuarioAuth =
        await getAuth().getUser(uid);

      const correoAnterior =
        usuarioAuth.email;

      // Buscar el registro del cliente en Firestore.
      const consulta =
        await db.collection("usuarios")
          .where("uid", "==", uid)
          .get();

      if (consulta.empty) {
        throw new HttpsError(
          "not-found",
          "No se encontró el registro del cliente en Firestore."
        );
      }

      if (consulta.size !== 1) {
        throw new HttpsError(
          "failed-precondition",
          "Se encontraron varios registros para este UID. No se realizó ningún cambio."
        );
      }

      // Actualizar primero el correo de Authentication.
      await getAuth().updateUser(uid, {
        email: nuevoCorreo
      });

      try {

        // Actualizar el correo en Firestore.
        const documento = consulta.docs[0];

        await documento.ref.update({
          correo: nuevoCorreo
        });

      } catch (errorFirestore) {

        // Si falla Firestore, intentar restaurar el correo anterior.
        await getAuth().updateUser(uid, {
          email: correoAnterior
        });

        throw errorFirestore;
      }

      return {
        correcto: true,
        mensaje: "Correo actualizado correctamente.",
        correoAnterior,
        nuevoCorreo
      };

    } catch (error) {

      console.error(
        "ERROR CAMBIANDO CORREO:",
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error.code === "auth/email-already-exists"
          ? "Ese correo ya está registrado en otra cuenta."
          : "No se pudo actualizar el correo: " + error.message
      );
    }
  }
);
