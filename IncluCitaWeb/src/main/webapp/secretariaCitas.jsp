<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Gestión de Citas (JSP / Servlets)</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>

<body class="bootstrap-responsive">

<div class="secretaria-citas-page container-fluid px-2 px-sm-3">

  <div class="secretaria-citas-card">

    <div class="secretaria-citas-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 gap-sm-3">
      <div class="brand">
        <div class="logo">♡</div>
        <div>
          <div class="brand-title">IncluCita</div>
          <div class="brand-subtitle">Administración - Citas Médicas</div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a href="secretariaMenu.html" class="btn btn-outline-secondary btn-sm">← Menú</a>
        <a href="${pageContext.request.contextPath}/logout" class="btn btn-outline-danger btn-sm">Salir</a>
      </div>
    </div>

    <h1>Gestión de Citas Médicas</h1>
    <p class="citas-subtitle">Listado oficial de citas cargado dinámicamente mediante <strong>Servlets, DAO y JavaBeans</strong></p>

    <div class="table-responsive my-4">
      <table class="table table-hover align-middle">
        <thead class="table-primary">
          <tr>
            <th>Código</th>
            <th>Paciente</th>
            <th>DNI</th>
            <th>Especialidad</th>
            <th>Doctor</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty citas}">
              <c:forEach var="c" items="${citas}">
                <tr>
                  <td><strong class="text-primary"><c:out value="${c.codigoCita}" /></strong></td>
                  <td><c:out value="${c.nombrePaciente}" /></td>
                  <td><c:out value="${c.dniPaciente}" /></td>
                  <td><c:out value="${c.especialidadDoctor}" /></td>
                  <td><c:out value="${c.nombreDoctor}" /></td>
                  <td><c:out value="${c.fecha}" /></td>
                  <td><c:out value="${c.hora}" /></td>
                  <td>
                    <c:choose>
                      <c:when test="${c.estado == 'PENDIENTE'}">
                        <span class="badge bg-warning text-dark">PENDIENTE</span>
                      </c:when>
                      <c:when test="${c.estado == 'ATENDIDA'}">
                        <span class="badge bg-success">ATENDIDA</span>
                      </c:when>
                      <c:when test="${c.estado == 'CANCELADA'}">
                        <span class="badge bg-danger">CANCELADA</span>
                      </c:when>
                      <c:otherwise>
                        <span class="badge bg-info"><c:out value="${c.estado}" /></span>
                      </c:otherwise>
                    </c:choose>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <a href="${pageContext.request.contextPath}/citas?action=ticket&id=${c.idCita}" class="btn btn-outline-primary" title="Ver Comprobante">
                        🎟️
                      </a>
                      <button class="btn btn-outline-danger" onclick="cancelarCitaAjax(${c.idCita})" title="Cancelar cita">
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="9" class="text-center text-muted py-4">
                  No hay citas registradas en el sistema.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>

    <div class="citas-bottom d-flex justify-content-between align-items-center">
      <span id="citasInfo">Mostrando citas sincronizadas con la base de datos</span>
      <a href="${pageContext.request.contextPath}/citas?action=listar" class="btn btn-sm btn-outline-primary">
        🔄 Recargar Citas
      </a>
    </div>

  </div>

  <div class="secretaria-citas-footer">
    Panel de gestión administrativo de citas médicas - IncluCita
  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
function cancelarCitaAjax(idCita) {
    if (confirm("¿Está seguro de que desea cancelar esta cita?")) {
        fetch("${pageContext.request.contextPath}/citas", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "action=cancelar&idCita=" + idCita
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensaje);
            if (data.success) {
                window.location.reload();
            }
        })
        .catch(err => alert("Error: " + err));
    }
}
</script>
</body>
</html>
