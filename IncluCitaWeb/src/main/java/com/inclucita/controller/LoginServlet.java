package com.inclucita.controller;

import com.google.gson.Gson;
import com.inclucita.dao.DoctorDAO;
import com.inclucita.dao.UsuarioDAO;
import com.inclucita.model.Doctor;
import com.inclucita.model.Usuario;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Servlet Controlador para gestionar el inicio y cierre de sesión de usuarios (Doctor, Secretaria, Paciente).
 */
@WebServlet(name = "LoginServlet", urlPatterns = {"/login", "/logout"})
public class LoginServlet extends HttpServlet {

    private UsuarioDAO usuarioDAO;
    private DoctorDAO doctorDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        usuarioDAO = new UsuarioDAO();
        doctorDAO = new DoctorDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getServletPath();
        if ("/logout".equals(path)) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            response.sendRedirect(request.getContextPath() + "/pantallaPrincipal.jsp");
            return;
        }

        // Si consultan estado de sesión
        HttpSession session = request.getSession(false);
        Usuario user = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;
        
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        Map<String, Object> res = new HashMap<>();
        res.put("autenticado", user != null);
        res.put("usuario", user);
        out.print(gson.toJson(res));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        String username = request.getParameter("username");
        String password = request.getParameter("password");
        String dni = request.getParameter("dni");
        String format = request.getParameter("format"); // "json" o null para form redirect

        Usuario usuario = null;

        // Acción 1: Validar si el paciente ya está registrado en MySQL por su DNI
        if ("validar_paciente".equalsIgnoreCase(action)) {
            if (dni == null || !dni.trim().matches("\\d{8}")) {
                responderJson(response, false, "El DNI debe contener exactamente 8 dígitos numéricos.", null);
                return;
            }
            Usuario paciente = usuarioDAO.buscarPacientePorDni(dni.trim());
            if (paciente != null) {
                HttpSession session = request.getSession(true);
                session.setAttribute("usuarioLogueado", paciente);
                session.setAttribute("idUsuario", paciente.getIdUsuario());
                session.setAttribute("rol", "PACIENTE");
                session.setAttribute("nombreCompleto", paciente.getNombreCompleto());

                Map<String, Object> data = new HashMap<>();
                data.put("registrado", true);
                data.put("paciente", paciente);
                responderJson(response, true, "Paciente encontrado en IncluCita", data);
            } else {
                Map<String, Object> data = new HashMap<>();
                data.put("registrado", false);
                responderJson(response, false, "El DNI ingresado no se encuentra registrado en IncluCita.", data);
            }
            return;
        }

        // Acción 2: Registrar nuevo paciente en MySQL tras validación oficial
        if ("registrar_paciente".equalsIgnoreCase(action)) {
            String nombreCompleto = request.getParameter("nombreCompleto");
            String email = request.getParameter("email");
            String telefono = request.getParameter("telefono");
            String departamento = request.getParameter("departamento");
            String provincia = request.getParameter("provincia");
            String distrito = request.getParameter("distrito");
            String condicion = request.getParameter("condicion");
            String detalleCondicion = request.getParameter("detalleCondicion");

            if (dni == null || !dni.trim().matches("\\d{8}")) {
                responderJson(response, false, "El DNI debe contener exactamente 8 dígitos numéricos.", null);
                return;
            }
            if (nombreCompleto == null || nombreCompleto.trim().isEmpty()) {
                responderJson(response, false, "El nombre completo es requerido (verifique con la API de DNI).", null);
                return;
            }
            if (email == null || !email.trim().matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                responderJson(response, false, "Ingrese un correo electrónico válido.", null);
                return;
            }
            if (telefono == null || !telefono.trim().matches("^9\\d{8}$")) {
                responderJson(response, false, "Ingrese un número de celular válido de 9 dígitos.", null);
                return;
            }

            // Verificar nuevamente que no esté registrado
            if (usuarioDAO.buscarPorDni(dni.trim()) != null) {
                responderJson(response, false, "El DNI ya se encuentra registrado en IncluCita.", null);
                return;
            }

            Usuario p = new Usuario();
            p.setDni(dni.trim());
            p.setNombreCompleto(nombreCompleto.trim());
            p.setEmail(email.trim());
            p.setTelefono(telefono.trim());
            p.setDepartamento(departamento != null ? departamento.trim() : "");
            p.setProvincia(provincia != null ? provincia.trim() : "");
            p.setDistrito(distrito != null ? distrito.trim() : "");
            p.setCondicion(condicion != null && !condicion.trim().isEmpty() ? condicion.trim() : "Sin condición especial");
            p.setDetalleCondicion(detalleCondicion != null ? detalleCondicion.trim() : "");

            boolean registrado = usuarioDAO.registrarPaciente(p);
            if (registrado) {
                responderJson(response, true, "Registro realizado correctamente. Ahora puede ingresar con su DNI.", p);
            } else {
                responderJson(response, false, "No se pudo completar el registro en la base de datos.", null);
            }
            return;
        }

        // Login de paciente por DNI (compatibilidad)
        if ("paciente_dni".equalsIgnoreCase(action) && dni != null && !dni.trim().isEmpty()) {
            usuario = usuarioDAO.buscarPacientePorDni(dni.trim());
        } else {
            // Login con credenciales (Doctor / Secretaria)
            if (username != null && password != null) {
                usuario = usuarioDAO.autenticar(username.trim(), password.trim());
            }
        }

        if (usuario != null) {
            HttpSession session = request.getSession(true);
            session.setAttribute("usuarioLogueado", usuario);
            session.setAttribute("idUsuario", usuario.getIdUsuario());
            session.setAttribute("rol", usuario.getNombreRol());
            session.setAttribute("nombreCompleto", usuario.getNombreCompleto());

            // Si es doctor, asociar su idDoctor en sesión
            if (usuario.getIdRol() == 2) {
                Doctor doc = doctorDAO.buscarPorIdUsuario(usuario.getIdUsuario());
                if (doc != null) {
                    session.setAttribute("doctorLogueado", doc);
                    session.setAttribute("idDoctor", doc.getIdDoctor());
                }
            }

            if ("json".equalsIgnoreCase(format)) {
                responderJson(response, true, "Inicio de sesión exitoso", usuario);
            } else {
                // Redireccionar según el rol
                if (usuario.getIdRol() == 2) { // Doctor
                    response.sendRedirect(request.getContextPath() + "/doctorMenu.html");
                } else if (usuario.getIdRol() == 3) { // Secretaria / Admin
                    response.sendRedirect(request.getContextPath() + "/secretariaDashboard.jsp");
                } else {
                    response.sendRedirect(request.getContextPath() + "/especialidad.html");
                }
            }
        } else {
            if ("json".equalsIgnoreCase(format)) {
                responderJson(response, false, "Credenciales incorrectas o usuario no encontrado", null);
            } else {
                request.setAttribute("error", "Usuario o contraseña inválidos");
                request.getRequestDispatcher("/pantallaPrincipal.jsp").forward(request, response);
            }
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
