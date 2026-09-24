<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Agenda Médica (JSP / Servlets)</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>

<body class="bootstrap-responsive">

<div class="doctor-agenda-page container-fluid px-2 px-sm-3">

  <div class="doctor-agenda-card">

    <div class="doctor-agenda-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 gap-sm-3">
      <div class="brand">
        <div class="logo">♡</div>
        <div>
          <div class="brand-title">IncluCita</div>
          <div class="brand-subtitle">Panel del Médico</div>
        </div>
      </div>

      <div class="d-flex gap-2">
        <a href="doctorMenu.html" class="btn btn-outline-secondary btn-sm">← Volver al menú</a>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-outline-danger btn-sm">Cerrar sesión</a>
      </div>
    </div>

    <h1>📅 Agenda y Pacientes Asignados</h1>
    <p class="doctor-agenda-subtitle">
      Listado de pacientes agendados en base de datos para atención clínica
    </p>

    <!-- Tabla de Citas del Doctor -->
    <div class="table-responsive my-4">
      <table class="table table-hover align-middle">
        <thead class="table-info">
          <tr>
            <th>Hora</th>
            <th>Código Cita</th>
            <th>Paciente</th>
            <th>DNI</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Atención</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty citasDoctor}">
              <c:forEach var="c" items="${citasDoctor}">
                <tr>
                  <td><strong><c:out value="${c.hora}" /></strong></td>
                  <td><span class="badge bg-secondary"><c:out value="${c.codigoCita}" /></span></td>
                  <td><strong><c:out value="${c.nombrePaciente}" /></strong></td>
                  <td><c:out value="${c.dniPaciente}" /></td>
                  <td><c:out value="${c.motivo}" /></td>
                  <td>
                    <c:choose>
                      <c:when test="${c.estado == 'ATENDIDA'}">
                        <span class="badge bg-success">ATENDIDA</span>
                      </c:when>
                      <c:when test="${c.estado == 'CANCELADA'}">
                        <span class="badge bg-danger">CANCELADA</span>
                      </c:when>
                      <c:otherwise>
                        <span class="badge bg-warning text-dark">PENDIENTE</span>
                      </c:otherwise>
                    </c:choose>
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="abrirModalAtencion(${c.idCita}, '${c.nombrePaciente}', '${c.codigoCita}')">
                      🩺 Atender / Diagnosticar
                    </button>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="7" class="text-center text-muted py-4">
                  No hay citas agendadas para esta fecha.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>

  </div>

</div>

<!-- Modal para Atención Médica / Observación Clínica -->
<div class="modal fade" id="modalAtencion" tabindex="-1" aria-labelledby="modalAtencionLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title" id="modalAtencionLabel">Registro de Atención Médica</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="formAtencion">
          <input type="hidden" id="modalIdCita" name="idCita">
          <div class="mb-3">
            <label class="form-label">Paciente:</label>
            <input type="text" id="modalPacienteNombre" class="form-control" readonly>
          </div>
          <div class="mb-3">
            <label class="form-label">Diagnóstico Clínico (*):</label>
            <textarea id="modalDiagnostico" class="form-control" rows="3" required placeholder="Detalle los hallazgos y el diagnóstico..."></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Tratamiento / Receta Médica:</label>
            <textarea id="modalTratamiento" class="form-control" rows="2" placeholder="Medicamentos, dosis y duración..."></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Indicaciones Generales:</label>
            <textarea id="modalIndicaciones" class="form-control" rows="2" placeholder="Cuidados y recomendaciones adicionales..."></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-success" onclick="guardarAtencionMedica()">Guardar y Finalizar Cita</button>
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
