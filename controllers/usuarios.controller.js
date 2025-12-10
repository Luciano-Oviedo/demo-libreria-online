import { Op } from "sequelize";
import {
  ValidationAppError,
  InternalFlowError,
  AuthError,
} from "../errors/errores.js";
import { asignarStockPrecios } from "./libros.controller.js";
import Usuario from "../models/usuarios.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Llave secreta para firmar tokens de autenticación
const LLAVE_SECRETA = process.env.SECRET_KEY;

// FUNCION DE REGISTRO DE USUARIOS
const registrarUsuario = async (req, res, next) => {
  try {
    // Capturamos los datos de registro del cuerpo de la petición
    const { nombre, correo, contraseña } = req.body;
    // Validamos que vengan todos los datos de registro
    if (
      nombre === undefined ||
      correo === undefined ||
      contraseña === undefined ||
      nombre === null ||
      correo === null ||
      contraseña === null
    ) {
      throw new InternalFlowError(
        "Falta un parámetro obligatorio en el cuerpo de la petición"
      );
    }

    // Normalizamos su correo electrónico
    const correoNormalizado = correo.trim().toLowerCase();

    /*Creamos al nuevo usuario y lo ingresamos a la DB, Sequelize valida internamente el tipo de datos, que no hayan campos vacíos o que se viole alguna restricción.
    La contraseña se encripta en la creación de la instancia*/
    await Usuario.create({
      nombre: nombre,
      correo: correoNormalizado,
      contraseña: contraseña,
    });

    // Devolvemos un mensaje de confirmación de la operación al cliente
    return res.status(201).json({
      mensaje: "Usuario registrado exitosamente, ahora puedes iniciar sesión",
    });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

//FUNCION DE LOGIN DE USUARIOS
const loginUsuario = async (req, res, next) => {
  try {
    // Capturamos los datos de inicio de sesión del cuerpo de la petición
    const { correo, contraseña } = req.body;

    // Validamos que estos datos estén presentes
    if (
      correo === undefined ||
      correo === null ||
      contraseña === undefined ||
      contraseña === null
    ) {
      throw new InternalFlowError(
        "Falta un parámetro obligatorio en el cuerpo de la petición"
      );
    }

    // Validamos que el usuario haya ingresado cadenas de texto válidas
    if (
      typeof correo !== "string" ||
      typeof contraseña !== "string" ||
      correo.trim() === "" ||
      contraseña.trim() === ""
    ) {
      throw new ValidationAppError(
        "Debes ingresar todos los campos requeridos"
      );
    }

    //Normalizamos el correo ingresado por el usuario
    const correoNormalizado = correo.trim().toLowerCase();

    // Validamos que exista un usuario registrado con esos datos en la base de datos
    const usuarioExistente = await Usuario.findOne({
      where: {
        correo: { [Op.eq]: correoNormalizado },
      },
    });

    if (!usuarioExistente) {
      throw new ValidationAppError(
        "Credenciales de ingreso inválidas, intenta nuevamente"
      );
    }
    const contraseñaValida = await bcrypt.compare(
      contraseña,
      usuarioExistente.contraseña
    );
    if (!contraseñaValida) {
      throw new ValidationAppError(
        "Credenciales de ingreso inválidas, intenta nuevamente"
      );
    }

    // Generamos tokens de autenticación para el usuario logeado
    const accessToken = jwt.sign(
      {
        id: usuarioExistente.id,
        correo: usuarioExistente.correo,
      },
      LLAVE_SECRETA,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      {
        id: usuarioExistente.id,
        correo: usuarioExistente.correo,
      },
      LLAVE_SECRETA,
      { expiresIn: "12h" }
    );

    // Guardamos el refresh token en la base de datos, para poder controlar rotación/revocación
    usuarioExistente.refresh_token = refreshToken;
    await usuarioExistente.save();

    // Renovamos stock de libros para que el usuario pueda hacer pruebas
    await asignarStockPrecios();

    // Guardamos los tokens en las cookies y enviamos respuesta al cliente
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 1000,
      })
      .json({
        mensaje: "Login exitoso",
        usuarioId: usuarioExistente.id,
      });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

// FUNCION PARA REFRESCAR SESION DE USUARIO
const refrescarSesion = async (req, res, next) => {
  try {
    // Extraemos el refreshToken desde las cookies
    const refreshToken = req.cookies.refreshToken;

    // Validamos que el token exista
    if (!refreshToken) {
      throw new AuthError("Usuario no autorizado para realizar esta operación");
    }

    // Buscamos un usuario en la base de datos cuyo atributo "refresh_token" coincida con el token de la petición
    const idRuta = Number(req.params.id);
    const usuarioValido = await Usuario.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.eq]: idRuta } },
          { refresh_token: { [Op.eq]: refreshToken } },
        ],
      },
    });

    // Si no hay coincidencias, lanzamos un error de autenticación
    if (!usuarioValido) {
      throw new AuthError("Token inválido o expirado");
    }

    // Validamos la integridad del token
    try {
      jwt.verify(refreshToken, LLAVE_SECRETA);
    } catch (error) {
      throw new AuthError("Token inválido o expirado");
    }

    // Generamos nuevos tokens de acceso y refresco
    const nuevoAccessToken = jwt.sign(
      {
        id: usuarioValido.id,
        correo: usuarioValido.correo,
      },
      LLAVE_SECRETA,
      { expiresIn: "15m" }
    );
    const nuevoRefreshToken = jwt.sign(
      {
        id: usuarioValido.id,
        correo: usuarioValido.correo,
      },
      LLAVE_SECRETA,
      { expiresIn: "12h" }
    );

    // Rotamos el token de refresco en la base de datos
    usuarioValido.refresh_token = nuevoRefreshToken;
    await usuarioValido.save();

    // Adjuntamos los nuevos tokens a las cookies y enviamos respuesta al cliente
    res
      .status(200)
      .cookie("accessToken", nuevoAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", nuevoRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 1000,
      })
      .json({ mensaje: "Tokens renovados exitosamente" });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

export { registrarUsuario, loginUsuario, refrescarSesion };
