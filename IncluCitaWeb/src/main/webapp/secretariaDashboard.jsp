<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Dashboard Secretaria (JSP / Servlets)</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>

<body class="bootstrap-responsive">

<div class="dashboard-page container-fluid px-2 px-sm-3">

  <div class="dashboard-card">

    <div class="secretaria-menu-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 gap-sm-3">
      <div class="brand">
        <div class="logo">♡</div>
        <div>
          <div class="brand-title">IncluCita</div>
          <div class="brand-subtitle">Secretaria / Panel Administrativo</div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a href="secretariaMenu.html" class="btn btn-outline-secondary btn-sm">← Menú</a>
        <a href="${pageContext.request.contextPath}/citas?action=listar" class="btn btn-primary btn-sm">📋 Ver Todas las Citas</a>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-outline-danger btn-sm">Cerrar sesión</a>
      </div>
    </div>

    <h1>📊 Dashboard de Control de Citas</h1>
    <p class="dashboard-subtitle">Panorama general de la administración de citas, doctores y pacientes sincronizado con MySQL</p>

    <!-- KPIs generales -->
    <div class="dashboard-stats-grid">
      <div class="dashboard-stat stat-total">
        <div class="stat-icon">📋</div>
        <p class="stat-value" id="dashTotal">0</p>
        <p class="stat-label">Total de citas</p>
      </div>

      <div class="dashboard-stat stat-total">
        <div class="stat-icon">🧑‍🤝‍🧑</div>
        <p class="stat-value" id="dashPacientes">0</p>
        <p class="stat-label">Pacientes únicos</p>
      </div>

      <div class="dashboard-stat stat-total">
        <div class="stat-icon">👨‍⚕️</div>
        <p class="stat-value" id="dashDoctores">0</p>
        <p class="stat-label">Doctores activos</p>
      </div>

      <div class="dashboard-stat stat-atendidas">
        <div class="stat-icon">📈</div>
        <p class="stat-value" id="dashTasa">0%</p>
        <p class="stat-label">Tasa de atención</p>
      </div>
    </div>

    <!-- KPIs por estado -->
    <div class="dashboard-stats-grid">
      <div class="dashboard-stat stat-atendidas">
        <div class="stat-icon">✅</div>
        <p class="stat-value" id="dashAtendidas">0</p>
        <p class="stat-label">Atendidas</p>
      </div>

      <div class="dashboard-stat stat-pendientes">
        <div class="stat-icon">🕒</div>
        <p class="stat-value" id="dashPendientes">0</p>
        <p class="stat-label">Pendientes (próximas)</p>
      </div>

      <div class="dashboard-stat stat-noatendidas">
        <div class="stat-icon">⚠️</div>
        <p class="stat-value" id="dashNoAtendidas">0</p>
        <p class="stat-label">No atendidas</p>
      </div>

      <div class="dashboard-stat stat-canceladas">
        <div class="stat-icon">🚫</div>
        <p class="stat-value" id="dashCanceladas">0</p>
        <p class="stat-label">Canceladas</p>
      </div>
    </div>

    <!-- Panel de accesos directos -->
    <div class="d-flex flex-wrap gap-3 my-4">
      <a href="${pageContext.request.contextPath}/citas?action=listar" class="btn btn-outline-primary px-4 py-2">
        📅 Administrar Citas
      </a>
      <a href="secretariaRegistrarDoctor.html" class="btn btn-outline-success px-4 py-2">
        👨‍⚕️ Registrar Nuevo Médico
      </a>
      <a href="secretariaPacientes.html" class="btn btn-outline-secondary px-4 py-2">
        🧑‍🤝‍🧑 Directorio de Pacientes
      </a>
    </div>

    <!-- Panel de hoy -->
    <div class="dashboard-today-bar">
      <div class="today-item">
        <span class="today-icon">📅</span>
        <div>
          <strong id="dashHoyTotal">0</strong>
          <p>Citas hoy</p>
        </div>
      </div>
      <div class="today-item">
        <span class="today-icon">✅</span>
        <div>
          <strong id="dashHoyAtendidas">0</strong>
          <p>Atendidas hoy</p>
        </div>
      </div>
      <div class="today-item">
        <span class="today-icon">🕒</span>
        <div>
          <strong id="dashHoyPendientes">0</strong>
          <p>Por atender hoy</p>
        </div>
      </div>
    </div>

  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script src="script.js"></script>
<script>
// Sincronizar datos reales con el Servlet CitaServlet
document.addEventListener("DOMContentLoaded", function() {
    fetch("${pageContext.request.contextPath}/citas?action=listar&format=json")
      .then(res => res.json())
      .then(res => {
          if (res.success && res.data) {
              const citas = res.data;
              const total = citas.length;
              const atendidas = citas.filter(c => c.estado === 'ATENDIDA').length;
              const pendientes = citas.filter(c => c.estado === 'PENDIENTE').length;
              const canceladas = citas.filter(c => c.estado === 'CANCELADA').length;
              const pacientesUnicos = new Set(citas.map(c => c.dniPaciente)).size;

              if(document.getElementById("dashTotal")) document.getElementById("dashTotal").textContent = total;
              if(document.getElementById("dashAtendidas")) document.getElementById("dashAtendidas").textContent = atendidas;
              if(document.getElementById("dashPendientes")) document.getElementById("dashPendientes").textContent = pendientes;
              if(document.getElementById("dashCanceladas")) document.getElementById("dashCanceladas").textContent = canceladas;
              if(document.getElementById("dashPacientes")) document.getElementById("dashPacientes").textContent = pacientesUnicos;
              if(document.getElementById("dashTasa")) {
                  document.getElementById("dashTasa").textContent = total > 0 ? Math.round((atendidas / total) * 100) + "%" : "0%";
              }
          }
      })
      .catch(err => console.log("Nota: Usando datos de simulación local si el servidor aún no tiene conexión a MySQL.", err));
});
</script>
</body>
</html>
