import { ValidationError, UniqueConstraintError } from "sequelize";
import {
  ValidationAppError,
  InternalFlowError,
  AuthError,
} from "../errors/errores.js";

export const errorHandler = (error, req, res, next) => {
  // Validación Sequelize
  if (error instanceof UniqueConstraintError) {
    // Solo manejar si la tabla es 'usuarios'
    if (error.parent?.table === "usuarios") {
      console.error("Error de validación:", error.message);
      return res.status(400).json({
        mensaje: `Error de validación: el nombre de usuario o correo ingresado ya está en uso`,
      });
    }
  }

  if (error instanceof ValidationError) {
    console.error("Error de validación:", error.message);
    return res.status(400).json({
      mensaje: "Error de validación",
      errores: error.errors.map((e) => e.message),
    });
  }

  // Validaciónes propias (errores controlados)
  if (error instanceof ValidationAppError) {
    console.error("Error de validación:", error.message);
    return res.status(error.status).json({
      mensaje: error.message,
    });
  }

  // Errores de autenticación
  if (error instanceof AuthError) {
    console.error("Error de autenticación:", error.message);
    if (error instanceof AuthError) {
      return res.status(401).render("error", { mensaje: error.message });
    }
  }

  // Errores en el flujo de la petición (frontend no envió algún parámetro obligatorio)
  if (error instanceof InternalFlowError) {
    console.error("Error en el flujo de la peticion:", error);
    return res.status(error.status).json({
      mensaje: error.message,
    });
  }

  // Errores inesperados
  console.error("Error inesperado:", error);
  return res.status(500).json({
    mensaje: "Error interno del servidor",
  });
};
