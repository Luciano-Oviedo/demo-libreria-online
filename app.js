// Importaciones
import express from "express";
import { sequelize } from "./models/config.js";
import cookieParser from "cookie-parser";
import { ExpressHandlebars } from "express-handlebars";
import routerUsuarios from "./routes/usuarios.router.js";
import routerLibros from "./routes/libros.router.js";
import { errorHandler } from "./middlewares/errores.middleware.js";
import Usuario from "./models/usuarios.js";

// Configuración del servidor
const app = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// Configuración del motor de vistas
const hbs = new ExpressHandlebars({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: "views/layouts",
  partialsDir: "views/partials",
});

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", "./views");

// Configuración de rutas
app.use("/api/usuarios", routerUsuarios);
app.use("/api/libros", routerLibros);

// Middleware global de errores
app.use(errorHandler);

// Inicialización del servidor
const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a la base de datos exitosa");

    await Usuario.sync({ force: true });

    app.listen(port, () => {
      console.log(`Servidor escuchando en puerto: ${port}`);
    });
  } catch (error) {
    console.error("Arranque fallido del servidor:", error);
  }
};

iniciarServidor();

export default app;
