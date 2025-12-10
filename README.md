# Demo de librería online full stack

Proyecto full stack que integra una arquitectura API REST en backend con una interfaz dinámica en frontend usando Node.js, Express, Sequelize y Handlebars. Permite gestionar un catálogo privado de libros con autenticación, carrito de compras y actualización de stock en tiempo real, aplicando buenas prácticas de manejo de sesiones, validación y transacciones en base de datos.

---

![Captura del proyecto](./assets/screenshot%20proyecto.jpeg)

## Objetivo

Construir una aplicación web que:

- Permita a usuarios autenticados explorar y buscar un catálogo privado de libros.

- Administre la disponibilidad de stock en base a compras registradas.

- Procese compras mediante transacciones seguras en base de datos.

- Refuerce la integración entre backend y frontend dinámico con SSR (server-side rendering).

## Funcionalidades

- Gestión de catálogo privado: listado y búsqueda de libros.

- Autenticación y autorización: acceso restringido mediante JWT y sesiones.

- Carrito de compras: selección libre de cantidades, agregación y eliminación dinámica.

- Validaciones completas: en frontend y backend, con control de stock y manejo de errores claros.

- Transacciones atómicas: la compra modifica el stock sólo si se cumple toda la validación.

- Interfaz responsiva: frontend construido con Bootstrap y Handlebars para un UX fluido.

- Manejo robusto de sesión: refresh tokens y control de expiración para experiencia continua.

## Tecnologías utilizadas

- Node.js · Express · Sequelize · PostgreSQL · Handlebars · JavaScript (ES6+) · Bootstrap · JWT · bcrypt · Git & GitHub

## Estructura

```
📦 demo_libreria
┣ 📂controllers         # Controladores con la lógica de negocio para libros y usuarios
┣ 📂errors              # Definición de clases y manejo centralizado de errores personalizados
┣ 📂middlewares         # Middlewares para autenticación, manejo de errores y seguridad
┣ 📂models              # Modelos Sequelize y configuración de base de datos
┣ 📂public              # Archivos estáticos públicos (JS cliente)
┃ ┗ 📂js                # Scripts frontend como autenticación y catálogo dinámico
┣ 📂routes              # Definición de rutas para recursos libros y usuarios
┣ 📂views               # Plantillas Handlebars para renderizado de vistas SSR
┃ ┣ 📂layouts           # Layouts base para vistas
┃ ┣ 📂partials          # Componentes parciales reutilizables (header, footer)
┃ ┗ 📜                   # Vistas principales (catalogo, error, home)
┣ 📜.env.demo           # Ejemplo de variables de entorno para configuración
┣ 📜app.js              # Punto de entrada y configuración principal del servidor Express
┣ 📜package.json        # Metadatos y dependencias del proyecto
┣ 📜README.md           # Documentación general del proyecto

```

## Cómo probar la aplicación

1. Puedes probar todas las funcionalidades desde la [🌐 Demo](https://luciano-oviedo.github.io/Web-informativa-de-ciberseguridad/).

Alternativamente, puedes:

1. Clonar el repositorio y ejecuta npm install para instalar dependencias.

2. Configurar las variables de entorno necesarias (base de datos, JWT, etc.).

3. Ejecutar el servidor con npm start.

4. Acceder a http://localhost:3000/api/libros y regístrate para probar la gestión de libros y compra.

5. Explorar el catálogo, agrega libros al carrito y finaliza compras para ver el stock actualizado.
