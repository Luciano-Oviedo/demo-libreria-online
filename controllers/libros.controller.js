import { Op } from "sequelize";
import { sequelize } from "../models/config.js";
import Libro from "../models/libros.js";
import { ValidationAppError, InternalFlowError } from "../errors/errores.js";

/* FUNCION PARA INSERTAR LIBROS A NUESTRA DB: la temática de nuestra biblioteca será de ciencia ficción y tendrá 100 registros*/
const crearBiblioteca = async (req, res, next) => {
  try {
    // Peticionamos los libros a la Open Library API, filtrando por ciencia ficción, retornando autor, título e id de portada y limitando los resultados a 100
    const datos = await fetch(
      "https://openlibrary.org/search.json?subject=science+fiction&language=spa&fields=author_name,title,cover_i&limit=100"
    );
    const respuesta = await datos.json();
    const registros = respuesta.docs;

    /* Sincronizamos el modelo 'Libro' con nuestra base de datos, con la opción 'force:true' para 'reiniciar' nuestra base de datos
    y no estar creando registros duplicados cada vez que se invoque la función*/
    await Libro.sync({ force: true });
    console.log(
      "Modelo 'Libro' sincronizado con base de datos, tabla 'libros' recreada"
    );

    // Insertamos un registro a la base de datos por cada libro
    for (const registro of registros) {
      await Libro.create({
        titulo: registro.title,
        autor:
          registro.author_name && registro.author_name.length > 0
            ? registro.author_name[0]
            : undefined,
        cover_id: registro.cover_i || null,
      });
    }

    // Confirmamos la inserción en consola
    console.log(
      "Todos los registros se insertaron correctamente a la tabla 'libros'"
    );

    // Obtenemos la base de datos actualizada y ordenada alfabeticamente
    const librosData = await Libro.findAll({ order: [["titulo", "ASC"]] });
    const libros = librosData.map((libro) => {
      const obj = libro.toJSON();
      obj.thumbnail = obj.cover_id
        ? `https://covers.openlibrary.org/b/id/${obj.cover_id}-M.jpg`
        : null;
      return obj;
    });

    // Respondemos al cliente con el renderizado de los libros
    return res.status(200).render("home", { libros });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

// FUNCION PARA RENOVAR STOCK Y ASIGNAR PRECIOS: para poder hacer pruebas en la demo, el stock se renueva cada vez que un usuario se autentica
const asignarStockPrecios = async () => {
  try {
    // Obtenemos los registros de la base de datos
    const libros = await Libro.findAll();

    // Creamos un arreglo vacío para guardar nuestros libros actualizados
    const librosModificados = [];

    // Por cada libro, asignamos un stock aleatorio entre 10 y 30 unidades y un precio aleatorio entre 13.000 y 25.000CLP
    for (const libro of libros) {
      libro.cantidad_disponible = Math.round(Math.random() * 20) + 10;
      libro.precio = Math.round(Math.random() * 12000) + 13000;
      // Guardamos el registro modificado en el arreglo
      librosModificados.push(libro);
    }
    // Persistimos los cambios en la base de datos
    for (const libroModificado of librosModificados) {
      await libroModificado.save();
    }

    // Confirmamos la operación en consola
    console.log("Stock y precios asignados");
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    throw error;
  }
};

// FUNCION PARA RENDERIZAR CATALOGO A USUARIO AUTENTICADO
const mostrarCatalogoPrivado = async (req, res, next) => {
  try {
    // Obtenemos los registros de la base de datos
    const librosData = await Libro.findAll({ order: [["titulo", "ASC"]] });
    const libros = librosData.map((libro) => libro.toJSON());

    // Renderizamos los libros actualizados y ordenados alfabeticamente
    return res
      .status(200)
      .render("catalogo", { libros: libros, usuarioId: req.user.id });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

// FUNCION DE BUSQUEDA DE LIBROS
const buscarLibros = async (req, res, next) => {
  try {
    // Obtenemos el input de búsqueda del usuario desde el query param de la petición
    const inputUsuario = req.query.query;

    // Si el campo está vacío o no existe, renderizaramos todo el catálogo
    if (!inputUsuario || inputUsuario.trim() === "") {
      // Traer todos los libros ordenados
      const librosData = await Libro.findAll({ order: [["titulo", "ASC"]] });
      const libros = librosData.map((libro) => libro.toJSON());

      return res.status(200).render("catalogo", {
        libros,
        usuarioId: req.user.id,
      });
    }

    // Realizamos una consulta a la base de datos, para obtener todos los libros donde título o autor coincidan parcialmente con la búsqueda del usuario
    const inputUsuarioNormalizado = inputUsuario.trim();
    const resultados = await Libro.findAndCountAll({
      where: {
        [Op.or]: [
          { titulo: { [Op.iLike]: `%${inputUsuarioNormalizado}%` } },
          { autor: { [Op.iLike]: `%${inputUsuarioNormalizado}%` } },
        ],
      },
      order: [["titulo", "ASC"]],
    });

    // Si no hay resultados, renderizamos un mensaje informativo en la interfaz de usuario
    if (resultados.count === 0) {
      return res.status(404).render("catalogo", {
        mensaje: "No hay resultados para tu búsqueda",
        usuarioId: req.user.id,
        libros: [],
      });
    }
    // Renderizamos los resultados en la interfaz de usuario
    const libros = resultados.rows.map((libro) => libro.toJSON());
    return res
      .status(200)
      .render("catalogo", { libros: libros, usuarioId: req.user.id });
  } catch (error) {
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

// FUNCION DE COMPRA DE LIBROS
const comprarLibros = async (req, res, next) => {
  // Iniciamos la transacción
  const t = await sequelize.transaction();
  try {
    // Obtenemos la información del carrito del usuario desde el cuerpo de la petición
    const librosCarrito = req.body;

    // Validamos que el cliente alla enviado el array con la información del carrito de compras
    if (!Array.isArray(librosCarrito) || librosCarrito.length === 0) {
      throw new InternalFlowError(
        "No se recibió la información necesaria para procesar la compra"
      );
    }

    // Creamos un arreglo para ir guardando las instancias modificadas de nuestro modelo 'Libro'
    const librosModificados = [];

    // Por cada libro en el carrito de compras:

    // Validamos los datos enviados por el cliente
    for (const libro of librosCarrito) {
      if (
        !libro.id ||
        !libro.titulo ||
        !libro.cantidad ||
        typeof libro.id !== "number" ||
        typeof libro.cantidad !== "number" ||
        typeof libro.titulo !== "string"
      ) {
        throw new InternalFlowError(
          "No se recibió la información necesaria para procesar la compra"
        );
      }

      // Validamos que la cantidad sea positiva
      if (libro.cantidad <= 0) {
        throw new ValidationAppError(
          `Debes seleccionar una cantidad positiva para comprar el libro ${libro.titulo}`
        );
      }

      // Validamos que exista un registro asociado en la base de datos
      const registroDB = await Libro.findByPk(libro.id, { transaction: t });
      if (!registroDB) {
        throw new ValidationAppError(
          `Error en el procesamiento de tu compra: el libro '${libro.titulo}' no tiene un registro asociado en la base de datos`
        );
      }
      // Validamos que la compra no exceda el stock disponible
      if (registroDB.cantidad_disponible < libro.cantidad) {
        throw new ValidationAppError(
          `Error en el procesamiento de tu compra: la cantidad seleccionada para el libro '${libro.titulo}' excede el stock disponible`
        );
      }
      // Modificamos el stock para esa instancia del modelo
      registroDB.cantidad_disponible -= libro.cantidad;
      librosModificados.push(registroDB);
    }
    // Sincronizamos los cambios de stock en la instancia con su registro asociado en la base de datos
    for (const registro of librosModificados) {
      await registro.save({ transaction: t });
    }
    // Confirmamos la transacción
    await t.commit();
    // Enviamos respuesta al cliente
    return res.status(200).json({
      mensaje:
        "Tu compra se ha procesado correctamente, en unos minutos recibirás un email con las instrucciones de pago",
      stockActualizado: librosModificados.map((libro) => ({
        id: libro.id,
        cantidad_disponible: libro.cantidad_disponible,
      })),
    });
  } catch (error) {
    // Si sucede algún error durante el proceso, revertimos toda la transacción
    await t.rollback();
    // Enviamos los errores capturados al middleware global de errores
    return next(error);
  }
};

export {
  crearBiblioteca,
  asignarStockPrecios,
  mostrarCatalogoPrivado,
  comprarLibros,
  buscarLibros,
};
