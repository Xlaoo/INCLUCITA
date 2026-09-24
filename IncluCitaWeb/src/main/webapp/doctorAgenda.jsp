<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Agenda Médica y Atención Clínica</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="modernClinic.css">
</head>

<body class="modern-clinic-body">

  <!-- 1. Barra de Navegación del Médico -->
  <header class="booking-navbar">
    <div class="container d-flex justify-content-between align-items-center">
      
      <!-- Marca -->
      <a class="d-flex align-items-center gap-2 text-decoration-none" href="doctorMenu.html">
        <div class="brand-logo-circle">👨‍⚕️</div>
        <div>
          <div class="brand-name">IncluCita</div>
          <div class="brand-sub">Portal del Médico Especialista</div>
        </div>
      </a>

      <!-- Acciones de Navegación -->
      <div class="d-flex align-items-center gap-2">
        <a href="doctorMenu.html" class="btn btn-outline-secondary btn-sm fw-bold px-3 py-2" style="border-radius:10px;">
          ← Menú del Doctor
        </a>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-danger btn-sm fw-bold px-3 py-2" style="border-radius:10px;">
          Cerrar sesión
        </a>
      </div>

    </div>
  </header>

  <!-- 2. Contenido Principal -->
  <main class="container my-4">
    
    <!-- Encabezado y Bienvenida -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <span class="welcome-badge">Módulo de Consulta Externa</span>
        <h1 class="welcome-title fs-2 mb-1">Agenda de Pacientes Asignados</h1>
        <p class="text-muted mb-0">Gestión de turnos médicos, historial clínico y diagnóstico del día.</p>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm fw-bold px-3 py-2" style="border-radius:10px;" onclick="window.location.reload()">
          🔄 Actualizar Lista
        </button>
      </div>
    </div>

    <!-- Tarjetas de Métricas Rápidas -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#e0f2fe; color:#0369a1;">
            📅
          </div>
          <div>
            <small class="text-muted fw-bold">PACIENTES CITADOS</small>
            <h3 class="fw-bold mb-0 text-dark">${citasDoctor != null ? citasDoctor.size() : 0}</h3>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#dcfce7; color:#15803d;">
            ✅
          </div>
          <div>
            <small class="text-muted fw-bold">CONSULTAS REALIZADAS</small>
            <h3 class="fw-bold mb-0 text-dark">
              <c:set var="atendidas" value="0" />
              <c:forEach var="item" items="${citasDoctor}">
                <c:if test="${item.estado == 'ATENDIDA'}"><c:set var="atendidas" value="${atendidas + 1}" /></c:if>
              </c:forEach>
              ${atendidas}
            </h3>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="stat-card-modern">
          <div class="stat-icon-wrap" style="background:#fef3c7; color:#b45309;">
            ⏳
          </div>
          <div>
            <small class="text-muted fw-bold">PENDIENTES EN ESPERA</small>
            <h3 class="fw-bold mb-0 text-dark">
              <c:set var="pendientes" value="0" />
              <c:forEach var="item" items="${citasDoctor}">
                <c:if test="${item.estado == 'PENDIENTE'}"><c:set var="pendientes" value="${pendientes + 1}" /></c:if>
              </c:forEach>
              ${pendientes}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Principal de Pacientes -->
    <div class="booking-main-card p-4">
      
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="fs-5 fw-bold text-dark mb-0">Listado Oficial de Turnos de Hoy</h2>
        <span class="badge bg-light text-dark border px-3 py-2 fw-semibold">Base de Datos: MySQL inclucitadb</span>
      </div>

      <div class="table-responsive">
        <table class="table clinic-table align-middle">
          <thead>
            <tr>
              <th>Hora Turno</th>
              <th>Código Cita</th>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Motivo Consulta</th>
              <th>Estado</th>
              <th class="text-center">Acción Clínica</th>
            </tr>
          </thead>
          <tbody>
            <c:choose>
              <c:when test="${not empty citasDoctor}">
                <c:forEach var="c" items="${citasDoctor}">
                  <tr>
                    <td>
                      <span class="fw-bold text-dark" style="font-size:1.05rem;">
                        <c:out value="${c.hora}" />
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-secondary font-monospace"><c:out value="${c.codigoCita}" /></span>
                    </td>
                    <td>
                      <strong class="text-dark"><c:out value="${c.nombrePaciente}" /></strong>
                    </td>
                    <td>
                      <span class="text-muted"><c:out value="${c.dniPaciente}" /></span>
                    </td>
                    <td>
                      <small class="text-secondary"><c:out value="${c.motivo}" /></small>
                    </td>
                    <td>
                      <c:choose>
                        <c:when test="${c.estado == 'ATENDIDA'}">
                          <span class="clinic-badge-atendida">✔ ATENDIDA</span>
                        </c:when>
                        <c:when test="${c.estado == 'CANCELADA'}">
                          <span class="clinic-badge-cancelada">✖ CANCELADA</span>
                        </c:when>
                        <c:otherwise>
                          <span class="clinic-badge-pendiente">⏳ PENDIENTE</span>
                        </c:otherwise>
                      </c:choose>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-clinic-primary btn-sm py-2 px-3" onclick="abrirModalAtencion(${c.idCita}, '${c.nombrePaciente}', '${c.codigoCita}')">
                        🩺 Atender / Diagnosticar
                      </button>
                    </td>
                  </tr>
                </c:forEach>
              </c:when>
              <c:otherwise>
                <tr>
                  <td colspan="7" class="text-center text-muted py-5">
                    <div style="font-size:2.5rem; margin-bottom:10px;">📋</div>
                    <strong>No hay citas agendadas para esta fecha en el sistema.</strong><br>
                    <small>Los pacientes reservados a través del portal aparecerán aquí en tiempo real.</small>
                  </td>
                </tr>
              </c:otherwise>
            </c:choose>
          </tbody>
        </table>
      </div>

    </div>

  </main>

  <!-- Modal para Atención Médica / Observación Clínica -->
  <div class="modal fade" id="modalAtencion" tabindex="-1" aria-labelledby="modalAtencionLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content modern-modal">
        
        <div class="modal-header modern-modal-header">
          <div class="d-flex align-items-center gap-2">
            <span style="font-size:24px;">🩺</span>
            <div>
              <h5 class="modal-title fw-bold mb-0" id="modalAtencionLabel">Registro de Atención Médica</h5>
              <small class="text-white-50">Historial y diagnóstico oficial del paciente</small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body p-4">
          <form id="formAtencion">
            <input type="hidden" id="modalIdCita" name="idCita">
            
            <div class="mb-3">
              <label class="form-label fw-bold text-dark small">Paciente Asignado:</label>
              <input type="text" id="modalPacienteNombre" class="form-control fw-semibold" style="background:#f8fafc;" readonly>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold text-dark small">Diagnóstico Clínico (*):</label>
              <textarea id="modalDiagnostico" class="form-control" rows="3" required placeholder="Escriba aquí los hallazgos médicos, signos vitales y diagnóstico definitivo..."></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold text-dark small">Tratamiento / Receta Médica:</label>
              <textarea id="modalTratamiento" class="form-control" rows="2" placeholder="Medicamentos, posología y días de tratamiento..."></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold text-dark small">Indicaciones y Recomendaciones:</label>
              <textarea id="modalIndicaciones" class="form-control" rows="2" placeholder="Reposo, controles y recomendaciones preventivas..."></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer bg-light p-3">
          <button type="button" class="btn btn-secondary fw-semibold px-4" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-success fw-bold px-4" onclick="guardarAtencionMedica()">
            💾 Guardar y Finalizar Consulta
          </button>
        </div>

      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
  <script>
  let modalAtencionInstance = null;

  function abrirModalAtencion(idCita, paciente, codigo) {
      document.getElementById("modalIdCita").value = idCita;
      document.getElementById("modalPacienteNombre").value = paciente + " (" + codigo + ")";
      document.getElementById("modalDiagnostico").value = "";
      document.getElementById("modalTratamiento").value = "";
      document.getElementById("modalIndicaciones").value = "";

      if (!modalAtencionInstance) {
          modalAtencionInstance = new bootstrap.Modal(document.getElementById('modalAtencion'));
      }
      modalAtencionInstance.show();
  }

  function guardarAtencionMedica() {
      const idCita = document.getElementById("modalIdCita").value;
      const diag = document.getElementById("modalDiagnostico").value.trim();
      const trat = document.getElementById("modalTratamiento").value.trim();
      const indic = document.getElementById("modalIndicaciones").value.trim();

      if (!diag) {
          alert("Por favor ingrese el diagnóstico del paciente.");
          return;
      }

      const params = new URLSearchParams();
      params.append("action", "atender");
      params.append("idCita", idCita);
      params.append("diagnostico", diag);
      params.append("tratamiento", trat);
      params.append("indicaciones", indic);

      fetch("${pageContext.request.contextPath}/citas", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
      })
      .then(res => res.json())
      .then(data => {
          alert(data.mensaje);
          if (data.success) {
              modalAtencionInstance.hide();
              window.location.reload();
          }
      })
      .catch(err => alert("Error: " + err));
  }
  </script>

</body>
</html>
