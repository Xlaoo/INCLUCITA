package com.inclucita.controller;

import com.google.gson.Gson;
import com.inclucita.dao.CitaDAO;
import com.inclucita.dao.UsuarioDAO;
import com.inclucita.model.Cita;
import com.inclucita.model.ObservacionClinica;
import com.inclucita.model.Usuario;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Date;
import java.sql.Time;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet Controlador MVC para la gestión integral del ciclo de vida de Citas Médicas.
 */
@WebServlet(name = "CitaServlet", urlPatterns = {"/citas"})
public class CitaServlet extends HttpServlet {

    private CitaDAO citaDAO;
    private UsuarioDAO usuarioDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        citaDAO = new CitaDAO();
        usuarioDAO = new UsuarioDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String action = request.getParameter("action");
        if (action == null) action = "listar";

        switch (action) {
            case "ticket":
                mostrarTicket(request, response);
                break;
            case "doctor":
                listarCitasDoctor(request, response);
                break;
            case "paciente":
                listarCitasPaciente(request, response);
                break;
            case "detalle":
                obtenerDetalleCita(request, response);
                break;
            case "listar":
            default:
                listarTodasCitas(request, response);
                break;
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if (action == null) action = "reservar";

        switch (action) {
            case "reservar":
                procesarReserva(request, response);
                break;
            case "cancelar":
                procesarCancelacion(request, response);
                break;
            case "reprogramar":
                procesarReprogramacion(request, response);
                break;
            case "atender":
                procesarAtencionClinica(request, response);
                break;
            default:
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Acción desconocida");
                break;
        }
    }

    private void procesarReserva(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String dni = request.getParameter("dni");
        String nombre = request.getParameter("nombre");
        String telefono = request.getParameter("telefono");
        String idDoctorStr = request.getParameter("idDoctor");
        String fechaStr = request.getParameter("fecha");
        String horaStr = request.getParameter("hora");
        String motivo = request.getParameter("motivo");
        String format = request.getParameter("format");

        try {
            int idDoctor = Integer.parseInt(idDoctorStr);
            Date fecha = Date.valueOf(fechaStr);
            // Formatear hora (si viene "10:00" agregar ":00")
            if (horaStr.length() == 5) horaStr += ":00";
            Time hora = Time.valueOf(horaStr);

            // Obtener o registrar paciente
            int idPaciente = usuarioDAO.registrarPacienteSiNoExiste(dni, nombre, telefono);
            if (idPaciente <= 0) {
                Usuario u = usuarioDAO.buscarPorDni(dni);
                if (u != null) idPaciente = u.getIdUsuario();
            }

            Cita cita = new Cita();
            String codigo = "IC-" + (int)(Math.random() * 900000 + 100000);
            cita.setCodigoCita(codigo);
            cita.setIdPaciente(idPaciente);
            cita.setIdDoctor(idDoctor);
            cita.setFecha(fecha);
            cita.setHora(hora);
            cita.setEstado("PENDIENTE");
            cita.setMotivo(motivo != null ? motivo : "Consulta médica general");

            boolean ok = citaDAO.registrarCita(cita);

            if (ok) {
                Cita citaCompleta = citaDAO.buscarPorCodigo(codigo);
                if ("json".equalsIgnoreCase(format)) {
                    responderJson(response, true, "Cita agendada correctamente", citaCompleta);
                } else {
                    request.setAttribute("cita", citaCompleta);
                    request.getRequestDispatcher("/ticket.jsp").forward(request, response);
                }
            } else {
                if ("json".equalsIgnoreCase(format)) {
                    responderJson(response, false, "Error al registrar la cita en base de datos", null);
                } else {
                    request.setAttribute("error", "No se pudo agendar la cita");
                    request.getRequestDispatcher("/confirmar.jsp").forward(request, response);
                }
            }
        } catch (Exception e) {
            System.err.println("Error procesando reserva: " + e.getMessage());
            if ("json".equalsIgnoreCase(format)) {
                responderJson(response, false, "Error: " + e.getMessage(), null);
            } else {
                request.setAttribute("error", "Datos incompletos o inválidos: " + e.getMessage());
                request.getRequestDispatcher("/pantallaPrincipal.jsp").forward(request, response);
            }
        }
    }

    private void mostrarTicket(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String codigo = request.getParameter("codigo");
        String idStr = request.getParameter("id");
        Cita cita = null;

        if (codigo != null && !codigo.trim().isEmpty()) {
            cita = citaDAO.buscarPorCodigo(codigo.trim());
        } else if (idStr != null && !idStr.trim().isEmpty()) {
            cita = citaDAO.buscarPorId(Integer.parseInt(idStr));
        }

        request.setAttribute("cita", cita);
        request.getRequestDispatcher("/ticket.jsp").forward(request, response);
    }

    private void listarTodasCitas(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        List<Cita> lista = citaDAO.listarTodas();
        String format = request.getParameter("format");
        if ("json".equalsIgnoreCase(format)) {
            responderJson(response, true, "Listado de citas", lista);
        } else {
            request.setAttribute("citas", lista);
            request.getRequestDispatcher("/secretariaDashboard.jsp").forward(request, response);
        }
    }

    private void listarCitasDoctor(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String idDoctorStr = request.getParameter("idDoctor");
        String fechaStr = request.getParameter("fecha");
        Date fecha = (fechaStr != null && !fechaStr.isEmpty()) ? Date.valueOf(fechaStr) : new Date(System.currentTimeMillis());

        int idDoctor = (idDoctorStr != null && !idDoctorStr.isEmpty()) ? Integer.parseInt(idDoctorStr) : 1;
        List<Cita> lista = citaDAO.listarPorDoctorYFecha(idDoctor, fecha);

        String format = request.getParameter("format");
        if ("json".equalsIgnoreCase(format)) {
            responderJson(response, true, "Citas del doctor", lista);
        } else {
            request.setAttribute("citasDoctor", lista);
            request.setAttribute("fechaSeleccionada", fecha);
            request.getRequestDispatcher("/doctorAgenda.jsp").forward(request, response);
        }
    }

    private void listarCitasPaciente(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String dni = request.getParameter("dni");
        List<Cita> lista = citaDAO.listarPorDni(dni);
        responderJson(response, true, "Citas del paciente", lista);
    }

    private void obtenerDetalleCita(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String idStr = request.getParameter("id");
        if (idStr != null) {
            Cita c = citaDAO.buscarPorId(Integer.parseInt(idStr));
            ObservacionClinica obs = citaDAO.obtenerObservacion(Integer.parseInt(idStr));
            Map<String, Object> data = new HashMap<>();
            data.put("cita", c);
            data.put("observacion", obs);
            responderJson(response, true, "Detalle obtenido", data);
        }
    }

    private void procesarCancelacion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String idStr = request.getParameter("idCita");
        boolean ok = false;
        if (idStr != null) {
            ok = citaDAO.actualizarEstado(Integer.parseInt(idStr), "CANCELADA");
        }
        responderJson(response, ok, ok ? "Cita cancelada con éxito" : "No se pudo cancelar la cita", null);
    }

    private void procesarReprogramacion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String idStr = request.getParameter("idCita");
        String fechaStr = request.getParameter("nuevaFecha");
        String horaStr = request.getParameter("nuevaHora");
        if (horaStr.length() == 5) horaStr += ":00";

        boolean ok = false;
        if (idStr != null && fechaStr != null && horaStr != null) {
            ok = citaDAO.reprogramarCita(Integer.parseInt(idStr), Date.valueOf(fechaStr), Time.valueOf(horaStr));
        }
        responderJson(response, ok, ok ? "Cita reprogramada con éxito" : "Error al reprogramar cita", null);
    }

    private void procesarAtencionClinica(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String idStr = request.getParameter("idCita");
        String diag = request.getParameter("diagnostico");
        String trat = request.getParameter("tratamiento");
        String indic = request.getParameter("indicaciones");

        boolean ok = false;
        if (idStr != null && diag != null) {
            ObservacionClinica obs = new ObservacionClinica();
            obs.setIdCita(Integer.parseInt(idStr));
            obs.setDiagnostico(diag);
            obs.setTratamiento(trat);
            obs.setIndicaciones(indic);
            ok = citaDAO.guardarObservacion(obs);
        }
        responderJson(response, ok, ok ? "Atención clínica registrada exitosamente" : "Error al registrar atención", null);
    }

    private void responderJson(HttpServletResponse response, boolean success, String mensaje, Object data) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        Map<String, Object> map = new HashMap<>();
        map.put("success", success);
        map.put("mensaje", mensaje);
        if (data != null) map.put("data", data);
        out.print(gson.toJson(map));
    }
}
