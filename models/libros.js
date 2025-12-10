import { sequelize } from "./config.js";
import { DataTypes } from "sequelize";

const Libro = sequelize.define("libro", {
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  autor: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "desconocido",
    validate: {
      notEmpty: true,
    },
  },
  cantidad_disponible: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: true,
      min: 0,
    },
  },
  precio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: true,
      min: 0,
    },
  },
  cover_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default Libro;
