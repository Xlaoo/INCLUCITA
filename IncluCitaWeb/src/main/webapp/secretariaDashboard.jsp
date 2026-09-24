<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Dashboard Administrativo y Métricas Clínicas</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="modernClinic.css">
</head>

<body class="modern-clinic-body">

  <!-- 1. Barra de Navegación -->
  <header class="booking-navbar">
    <div class="container d-flex justify-content-between align-items-center">
      
      <!-- Marca -->
      <a class="d-flex align-items-center gap-2 text-decoration-none" href="secretariaMenu.html">
        <div class="brand-logo-circle">👩‍💼</div>
        <div>
          <div class="brand-name">IncluCita</div>
          <div class="brand-sub">Dashboard Administrativo</div>
        </div>
      </a>

      <!-- Acciones de Navegación -->
      <div class="d-flex align-items-center gap-2">
        <a href="secretariaMenu.html" class="btn btn-outline-secondary btn-sm fw-bold px-3 py-2" style="border-radius:10px;">
          ← Menú Secretaria
        </a>
        <a href="${pageContext.request.contextPath}/citas?action=listar" class="btn btn-clinic-primary btn-sm py-2 px-3">
          📋 Gestionar Citas
        </a>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-danger btn-sm fw-bold px-3 py-2" style="border-radius:10px;">
          Cerrar sesión
        </a>
      </div>

    </div>
  </header>

  <!-- 2. Contenido Principal -->
  <main class="container my-5">
    
    <!-- Encabezado de Sección -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <span class="welcome-badge">Monitoreo Clínico en Vivo</span>
        <h1 class="welcome-title fs-2 mb-1">Métricas de Citas y Pacientes</h1>
        <p class="text-muted mb-0">Estado integral de atención médica y gestión de cupos en tiempo real con MySQL.</p>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm fw-bold px-3 py-2" style="border-radius:10px;" onclick="window.location.reload()">
          🔄 Sincronizar Métricas
        </button>
      </div>
    </div>

    <!-- Primera Fila de KPIs -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#e0f2fe; color:#0369a1;">
            📋
          </div>
          <div>
            <small class="text-muted fw-bold">TOTAL CITAS</small>
            <h3 class="fw-bold mb-0 text-dark" id="dashTotal">0</h3>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#f0fdf4; color:#15803d;">
            🧑‍🤝‍🧑
          </div>
          <div>
            <small class="text-muted fw-bold">PACIENTES ÚNICOS</small>
            <h3 class="fw-bold mb-0 text-dark" id="dashPacientes">0</h3>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#fef3c7; color:#b45309;">
            👨‍⚕️
          </div>
          <div>
            <small class="text-muted fw-bold">DOCTORES ACTIVOS</small>
            <h3 class="fw-bold mb-0 text-dark" id="dashDoctores">7</h3>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#f3e8ff; color:#7e22ce;">
            📈
          </div>
          <div>
            <small class="text-muted fw-bold">TASA EFICIENCIA</small>
            <h3 class="fw-bold mb-0 text-dark" id="dashTasa">0%</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Segunda Fila de KPIs por Estado -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern border-start border-4 border-success">
          <div>
            <span class="clinic-badge-atendida mb-2">✔ ATENDIDAS</span>
            <h3 class="fw-bold mb-0 text-dark" id="dashAtendidas">0</h3>
            <small class="text-muted">Consultas concluidas</small>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern border-start border-4 border-warning">
          <div>
            <span class="clinic-badge-pendiente mb-2">⏳ PENDIENTES</span>
            <h3 class="fw-bold mb-0 text-dark" id="dashPendientes">0</h3>
            <small class="text-muted">Por atender en agenda</small>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern border-start border-4 border-info">
          <div>
            <span class="badge bg-info text-dark mb-2 px-3 py-2">⚠️ NO ATENDIDAS</span>
            <h3 class="fw-bold mb-0 text-dark" id="dashNoAtendidas">0</h3>
            <small class="text-muted">Pacientes ausentes</small>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="stat-card-modern border-start border-4 border-danger">
          <div>
            <span class="clinic-badge-cancelada mb-2">✖ CANCELADAS</span>
            <h3 class="fw-bold mb-0 text-dark" id="dashCanceladas">0</h3>
            <small class="text-muted">Citas anuladas</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Accesos Rápidos Administrativos -->
    <div class="booking-main-card p-4">
      <h3 class="fs-5 fw-bold text-dark mb-3">Acciones Rápidas del Puesto de Admisión</h3>
      
      <div class="d-flex flex-wrap gap-3">
        <a href="${pageContext.request.contextPath}/citas?action=listar" class="btn btn-clinic-primary">
          📅 Ver y Editar Citas en Vivo
        </a>
        <a href="secretariaRegistrarDoctor.html" class="btn btn-clinic-secondary">
          👨‍⚕️ Registrar Nuevo Médico
        </a>
        <a href="secretariaPacientes.html" class="btn btn-clinic-secondary">
          👥 Padrón de Pacientes
        </a>
        <a href="secretariaEnviarCitas.html" class="btn btn-clinic-secondary">
          📤 Enviar Listados a Doctores
        </a>
      </div>
    </div>

  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
  <script src="script.js"></script>
  <script>
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
