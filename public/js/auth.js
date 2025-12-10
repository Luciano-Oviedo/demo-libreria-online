document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[action^='/api/usuarios/']");

  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const errorBox = form.querySelector(".alert");
      errorBox.classList.add("d-none");
      errorBox.textContent = "";

      const url = form.action;
      const method = form.method;

      const formData = new FormData(form);
      const plainData = Object.fromEntries(formData.entries());
      const jsonData = JSON.stringify(plainData);

      let response;
      try {
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: jsonData,
        });
      } catch (error) {
        errorBox.textContent = "Error de conexión con el servidor.";
        errorBox.classList.remove("d-none");
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        errorBox.textContent = json.mensaje || "Error inesperado.";
        errorBox.classList.remove("d-none");
        return;
      }

      if (url.includes("/registro")) {
        // Mostrar mensaje de éxito en el mismo home
        errorBox.classList.remove("d-none");
        errorBox.classList.add("alert-success");
        errorBox.textContent =
          json.mensaje || "Registro exitoso. Ya puedes iniciar sesión.";
        return; // No redirigir
      }

      if (url.includes("/login")) {
        // Login sí redirige
        window.location.href = `/api/usuarios/${json.usuarioId}/libros`;
      }
    });
  });
});
