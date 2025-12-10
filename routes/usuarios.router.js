import { Router } from "express";
import {
  registrarUsuario,
  loginUsuario,
  refrescarSesion,
} from "../controllers/usuarios.controller.js";
import {
  buscarLibros,
  comprarLibros,
  mostrarCatalogoPrivado,
} from "../controllers/libros.controller.js";
import { autenticarUsuario } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/registro", registrarUsuario);
router.post("/login", loginUsuario);
router.get("/:id/libros", autenticarUsuario, mostrarCatalogoPrivado);
router.get("/:id/libros/buscar", autenticarUsuario, buscarLibros);
router.post("/:id/libros/compras", autenticarUsuario, comprarLibros);
router.post("/:id/refrescar", refrescarSesion);

export default router;
