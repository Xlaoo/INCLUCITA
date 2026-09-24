package com.inclucita.controller;

import com.google.gson.Gson;
import com.inclucita.dao.DoctorDAO;
import com.inclucita.dao.EspecialidadDAO;
import com.inclucita.model.Doctor;
import com.inclucita.model.Usuario;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet Controlador MVC para la administración del personal médico (Doctores).
 */
@WebServlet(name = "DoctorServlet", urlPatterns = {"/doctores"})
public class DoctorServlet extends HttpServlet {

    private DoctorDAO doctorDAO;
    private EspecialidadDAO especialidadDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        doctorDAO = new DoctorDAO();
        especialidadDAO = new EspecialidadDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String idEspecialidadStr = request.getParameter("idEspecialidad");
        String idDoctorStr = request.getParameter("idDoctor");

        if (idDoctorStr != null && !idDoctorStr.isEmpty()) {
            Doctor doc = doctorDAO.buscarPorId(Integer.parseInt(idDoctorStr));
            responderJson(response, doc != null, doc != null ? "Doctor encontrado" : "No encontrado", doc);
            return;
        }

        List<Doctor> doctores;
        if (idEspecialidadStr != null && !idEspecialidadStr.isEmpty()) {
            doctores = doctorDAO.listarPorEspecialidad(Integer.parseInt(idEspecialidadStr));
        } else {
            doctores = doctorDAO.listarTodos();
        }

        String format = request.getParameter("format");
        if ("jsp".equalsIgnoreCase(format)) {
            request.setAttribute("doctores", doctores);
            request.setAttribute("especialidades", especialidadDAO.listarTodas());
            request.getRequestDispatcher("/secretariaPacientesDoctor.jsp").forward(request, response);
        } else {
            responderJson(response, true, "Listado de doctores", doctores);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if ("eliminar".equalsIgnoreCase(action)) {
            String idDoctorStr = request.getParameter("idDoctor");
            boolean ok = false;
            if (idDoctorStr != null) {
                ok = doctorDAO.eliminarDoctor(Integer.parseInt(idDoctorStr));
            }
            responderJson(response, ok, ok ? "Doctor retirado del sistema" : "Error al retirar doctor", null);
            return;
        }

        // Registrar nuevo doctor
        String dni = request.getParameter("dni");
        String nombre = request.getParameter("nombre");
        String telefono = request.getParameter("telefono");
        String email = request.getParameter("email");
        String username = request.getParameter("username");
        String password = request.getParameter("password");
        String idEspecialidadStr = request.getParameter("idEspecialidad");
        String consultorio = request.getParameter("consultorio");
        String horario = request.getParameter("horario");
        String foto = request.getParameter("foto");

        try {
            Usuario u = new Usuario();
            u.setDni(dni);
            u.setUsername(username != null ? username : dni);
            u.setPassword(password != null ? password : "123");
            u.setNombreCompleto(nombre);
            u.setTelefono(telefono);
            u.setEmail(email);

            Doctor d = new Doctor();
            d.setIdEspecialidad(Integer.parseInt(idEspecialidadStr));
            d.setConsultorio(consultorio);
            d.setHorarioAtencion(horario != null ? horario : "08:00 - 14:00");
            d.setFoto(foto != null ? foto : "doctor.png");

            boolean ok = doctorDAO.registrarDoctor(u, d);
            responderJson(response, ok, ok ? "Doctor registrado exitosamente" : "No se pudo registrar el doctor", null);
        } catch (Exception e) {
            responderJson(response, false, "Error en los datos del doctor: " + e.getMessage(), null);
        }
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
