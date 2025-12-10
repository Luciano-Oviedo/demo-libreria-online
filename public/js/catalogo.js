document.addEventListener("DOMContentLoaded", () => {
  const cantidades = {};
  // Cargamos carrito desde localStorage o inicializamos vacío
  const carrito = JSON.parse(localStorage.getItem("carritoCompras")) || [];

  // Obtener usuarioId desde el botón de finalizar compra
  const usuarioId =
    document.getElementById("btnFinalizarCompra")?.dataset.usuarioid;

  if (!usuarioId) {
    console.error("ID de usuario no encontrado en el DOM");
    return; // No continuar sin usuarioId
  }

  const contadorCarrito = document.getElementById("contadorCarrito");
  const listaCarrito = document.getElementById("listaCarrito");
  const totalCarrito = document.getElementById("totalCarrito");
  const alertaCarrito = document.getElementById("alertaCarrito");
  const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");

  // Función genérica para hacer fetch con refresh automático
  async function fetchConRefresh(url, options = {}) {
    options.credentials = "include";

    let response = await fetch(url, options);

    if (response.status === 401) {
      // Intentamos refrescar token
      const refreshResponse = await fetch(
        `/api/usuarios/${usuarioId}/refrescar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!refreshResponse.ok) {
        // Si refrescar falló, recargar la página para que se muestre error.hbs desde backend SSR
        window.location.reload();
        return null;
      }

      // Refresh exitoso, reintentar la petición original
      response = await fetch(url, options);
    }

    // Si backend responde con HTML en vez de JSON (ejemplo: error.hbs),
    // asumimos que es un error renderizado y recargamos para mostrarlo.
    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("text/html") && !response.ok) {
      window.location.reload();
      return null;
    }

    return response;
  }

  // Evento para finalizar compra enviando carrito al backend
  if (btnFinalizarCompra) {
    btnFinalizarCompra.addEventListener("click", async (e) => {
      e.preventDefault();

      if (carrito.length === 0) {
        mostrarAlertaCompra("Tu carrito está vacío", "warning");
        return;
      }

      try {
        const response = await fetchConRefresh(
          `/api/usuarios/${usuarioId}/libros/compras`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              carrito.map(({ id, titulo, cantidad }) => ({
                id: Number(id),
                titulo,
                cantidad: Number(cantidad),
              }))
            ),
          }
        );

        if (!response) return; // ya recargó la página

        const data = await response.json();

        if (!response.ok) {
          mostrarAlertaCompra(
            data.message || data.mensaje || "Error al procesar la compra",
            "danger"
          );
          return;
        }

        mostrarAlertaCompra(
          data.mensaje || "Compra procesada con éxito",
          "success"
        );

        // Actualizar stock visible usando la respuesta del backend
        if (Array.isArray(data.stockActualizado)) {
          data.stockActualizado.forEach(({ id, cantidad_disponible }) => {
            const btnAgregar = document.querySelector(
              `.btnAgregarCarrito[data-id="${id}"]`
            );
            if (btnAgregar) {
              btnAgregar.dataset.stock = cantidad_disponible;

              const cardBody = btnAgregar.closest(".card-body");
              if (cardBody) {
                const stockLabel = cardBody.querySelector("p.mt-2.text-info");
                if (stockLabel) {
                  stockLabel.textContent = `Stock disponible: ${cantidad_disponible}`;
                }
              }
            }
          });
        }

        // Limpiar carrito y actualizar UI
        localStorage.removeItem("carritoCompras");
        carrito.length = 0;
        actualizarCarrito();
      } catch (error) {
        mostrarAlertaCompra(
          "Error al procesar la compra: " + error.message,
          "danger"
        );
      }
    });
  }

  // Inicializar cantidades en 1 para cada libro listado
  document.querySelectorAll(".cantidadSeleccionada").forEach((span) => {
    const id = span.dataset.id;
    cantidades[id] = 1;
  });

  // Botones para aumentar cantidad
  document.querySelectorAll(".btnSumar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      // quitamos la restricción de stock aquí para probar backend
      cantidades[id]++;
      document.querySelector(
        `.cantidadSeleccionada[data-id="${id}"]`
      ).textContent = cantidades[id];
    });
  });

  // Botones para disminuir cantidad
  document.querySelectorAll(".btnRestar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (cantidades[id] > 1) {
        cantidades[id]--;
        document.querySelector(
          `.cantidadSeleccionada[data-id="${id}"]`
        ).textContent = cantidades[id];
      }
    });
  });

  // Agregar libros al carrito
  document.querySelectorAll(".btnAgregarCarrito").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const titulo = btn.dataset.titulo;
      const precio = parseInt(btn.dataset.precio);
      const stock = parseInt(btn.dataset.stock);
      const cantidad = cantidades[id];

      const existente = carrito.find((item) => item.id === id);

      if (existente) {
        existente.cantidad += cantidad;
      } else {
        carrito.push({ id, titulo, precio, cantidad });
      }

      // Guardar carrito actualizado en localStorage
      localStorage.setItem("carritoCompras", JSON.stringify(carrito));

      actualizarCarrito();
      mostrarAlertaCompra("Libro agregado al carrito", "success");
    });
  });

  // Función para mostrar alerta con diferentes estilos bootstrap
  // tipos: 'success', 'danger', 'warning'
  function mostrarAlertaCompra(mensaje, tipo = "success") {
    alertaCarrito.textContent = mensaje;

    alertaCarrito.classList.remove(
      "alert-success",
      "alert-danger",
      "alert-warning"
    );
    alertaCarrito.classList.add(`alert-${tipo}`);

    alertaCarrito.classList.add("show");

    setTimeout(() => {
      alertaCarrito.classList.remove("show");
    }, 5000);
  }

  // Actualiza el contenido del carrito en el DOM
  function actualizarCarrito() {
    listaCarrito.innerHTML = "";
    let total = 0;
    let contador = 0;

    carrito.forEach((item) => {
      total += item.precio * item.cantidad;
      contador += item.cantidad;

      const li = document.createElement("li");
      li.classList.add(
        "list-group-item",
        "bg-dark",
        "text-white",
        "d-flex",
        "justify-content-between",
        "align-items-center"
      );

      li.innerHTML = `
        <div>
          <strong>${item.titulo}</strong><br>
          <span class="text-success">$${item.precio * item.cantidad}</span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm btnRestarCarrito" data-id="${
            item.id
          }">-</button>
          <span class="fw-bold">${item.cantidad}</span>
          <button class="btn btn-outline-secondary btn-sm btnSumarCarrito" data-id="${
            item.id
          }">+</button>
        </div>
      `;

      listaCarrito.appendChild(li);
    });

    totalCarrito.textContent = `$${total}`;
    contadorCarrito.textContent = contador;

    activarBotonesCarrito();
  }

  // Activa los botones + y - dentro del modal del carrito
  function activarBotonesCarrito() {
    document.querySelectorAll(".btnSumarCarrito").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = carrito.find((i) => i.id === id);
        item.cantidad++;
        localStorage.setItem("carritoCompras", JSON.stringify(carrito));
        actualizarCarrito();
      });
    });

    document.querySelectorAll(".btnRestarCarrito").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = carrito.find((i) => i.id === id);

        if (item.cantidad > 1) {
          item.cantidad--;
        } else {
          // Eliminar item si cantidad es 1 y se resta
          const index = carrito.findIndex((i) => i.id === id);
          carrito.splice(index, 1);
        }

        localStorage.setItem("carritoCompras", JSON.stringify(carrito));
        actualizarCarrito();
      });
    });
  }

  // Finalmente actualizamos la vista del carrito con los datos guardados
  actualizarCarrito();
});
