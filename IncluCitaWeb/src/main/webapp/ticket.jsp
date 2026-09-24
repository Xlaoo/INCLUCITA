<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<jsp:useBean id="cita" class="com.inclucita.model.Cita" scope="request" />
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IncluCita - Comprobante de Cita</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>

<body class="bootstrap-responsive">

<div class="app container-fluid px-2 px-sm-3">

    <section id="screen-ticket" class="screen active">
      <div class="top">
        <div class="brand">
          <div class="logo">♡</div>
          <div>
            <div class="brand-title">IncluCita</div>
            <div class="brand-subtitle">Plataforma de citas médica inclusiva</div>
          </div>
        </div>
      </div>

      <div class="content">

        <button class="back-btn" onclick="window.location.href='pantallaPrincipal.jsp'">
          ← Volver al inicio
        </button>

        <h2>Vista previa del comprobante</h2>

        <div class="d-flex gap-2 justify-content-center my-3">
          <button class="print-btn" onclick="window.print()">
            🖨️ Imprimir comprobante
          </button>
        </div>

        <div class="ticket-preview">
          <div class="ticket ticket-modern" id="printArea">

            <div class="ticket-header">
              <div class="ticket-logo">♡</div>
              <div>
                <strong style="font-size:18px;">IncluCita</strong><br>
                <small>Plataforma de citas médica inclusiva</small>
              </div>
            </div>

            <c:if test="${not empty cita.codigoCita}">
              <div class="text-center my-2 p-1 bg-light rounded border">
                <small class="text-muted">CÓDIGO DE ATENCIÓN:</small>
                <h4 class="text-primary fw-bold mb-0"><c:out value="${cita.codigoCita}" /></h4>
              </div>
            </c:if>

            <div class="ticket-body">
              <div class="ticket-column">
                <p><strong>Paciente:</strong><br>
                  <span id="ticketPatient">
                    <c:choose>
                      <c:when test="${not empty cita.nombrePaciente}"><c:out value="${cita.nombrePaciente}" /></c:when>
                      <c:otherwise>Cargando...</c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>DNI:</strong><br>
                  <span id="ticketDni">
                    <c:choose>
                      <c:when test="${not empty cita.dniPaciente}"><c:out value="${cita.dniPaciente}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>Especialidad:</strong><br>
                  <span id="ticketSpecialty">
                    <c:choose>
                      <c:when test="${not empty cita.especialidadDoctor}"><c:out value="${cita.especialidadDoctor}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>Médico:</strong><br>
                  <span id="ticketDoctor">
                    <c:choose>
                      <c:when test="${not empty cita.nombreDoctor}"><c:out value="${cita.nombreDoctor}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
              </div>

              <div class="ticket-column ticket-right">
                <p><strong>Consultorio:</strong><br>
                  <span id="ticketConsultorio">
                    <c:choose>
                      <c:when test="${not empty cita.consultorioDoctor}"><c:out value="${cita.consultorioDoctor}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>Fecha:</strong><br>
                  <span id="ticketDate">
                    <c:choose>
                      <c:when test="${not empty cita.fecha}"><c:out value="${cita.fecha}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>Hora:</strong><br>
                  <span id="ticketTime">
                    <c:choose>
                      <c:when test="${not empty cita.hora}"><c:out value="${cita.hora}" /></c:when>
                      <c:otherwise></c:otherwise>
                    </c:choose>
                  </span>
                </p>
                <p><strong>Estado:</strong><br>
                  <span class="badge bg-success">
                    <c:out value="${not empty cita.estado ? cita.estado : 'CONFIRMADA'}" />
                  </span>
                </p>
              </div>
            </div>

            <hr>

            <p style="text-align:center;">
              <strong>💙 ¡Gracias por confiar en IncluCita!</strong>
            </p>

          </div>
        </div>

      </div>

      <div class="footer-note">
        Guarde o imprima su comprobante para presentarlo en ventanilla o consultorio.
      </div>

    </section>

</div>

<div id="toast" class="toast"></div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script src="script.js"></script>

</body>
</html>
