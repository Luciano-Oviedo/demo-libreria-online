import { sequelize } from "./config.js";
import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

const Usuario = sequelize.define(
  "usuario",
  {
    nombre: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Debes ingresar un nombre de usuario",
        },
      },
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Debes ingresar un correo electrónico",
        },
        isEmail: {
          msg: "Tu correo electrónico debe respetar el formato 'ejemplo@mail.com'",
        },
      },
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Debes ingresar una contraseña",
        },
        len: {
          args: [8, 30],
          msg: "Tu contraseña debe tener una extensión entre 8 y 30 caracteres",
        },
      },
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    // Encriptamos contraseña
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.contraseña) {
          usuario.contraseña = await bcrypt.hash(usuario.contraseña, 10);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed("contraseña")) {
          usuario.contraseña = await bcrypt.hash(usuario.contraseña, 10);
        }
      },
    },
  }
);

export default Usuario;
