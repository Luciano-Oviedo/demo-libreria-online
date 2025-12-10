import { Router } from "express";
import { crearBiblioteca } from "../controllers/libros.controller.js";

const router = Router();

router.get("/", crearBiblioteca);

export default router;
