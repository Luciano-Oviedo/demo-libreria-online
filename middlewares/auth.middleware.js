import Usuario from "../models/usuarios.js";
import { ValidationAppError, AuthError } from "../errors/errores.js";
import jwt from "jsonwebtoken";

const LLAVE_SECRETA = process.env.SECRET_KEY;

export const autenticarUsuario = async (req, res, next) => {
  try {
    // Extraemos el access token de las cookies
    const accessToken = req.cookies.accessToken;

    // Extraemos el id del usuario de la ruta protegida
    const idRuta = Number(req.params.id);

    // Validamos que el token exista
    if (!accessToken) {
      throw new AuthError("Token de acceso inválido");
    }

    // Validamos que el token no esté expirado
    let payload;
    try {
      payload = jwt.verify(accessToken, LLAVE_SECRETA);
    } catch (error) {
      throw new AuthError("Token de acceso expirado");
    }

    // Validamos que exista un usuario registrado con el id de la ruta
    const usuarioExistente = await Usuario.findByPk(idRuta);
    if (!usuarioExistente) {
      throw new AuthError("No existe un usuario asociado a este id");
    }

    // Validamos que el token corresponda al usuario
    if (
      payload.id !== usuarioExistente.id ||
      payload.correo !== usuarioExistente.correo
    ) {
      throw new AuthError("Usuario no autorizado para realizar esta operación");
    }

    // Guardamos el id del usuario en el objeto req para usar en controladores de rutas protegidas
    req.user = { id: usuarioExistente.id };

    // Pasamos a la siguiente función
    return next();
  } catch (error) {
    // Pasamos los errores capturados al middleware global de errores
    return next(error);
  }
};
