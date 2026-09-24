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

        // Login de paciente por solo DNI
        if ("paciente_dni".equalsIgnoreCase(action) && dni != null && !dni.trim().isEmpty()) {
            usuario = usuarioDAO.buscarPorDni(dni.trim());
            if (usuario == null) {
                // Registrar paciente temporal si es nuevo
                String nombre = request.getParameter("nombre");
                String telefono = request.getParameter("telefono");
                int id = usuarioDAO.registrarPacienteSiNoExiste(dni.trim(), nombre, telefono);
                if (id > 0) {
                    usuario = usuarioDAO.buscarPorDni(dni.trim());
                }
            }
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
                    response.sendRedirect(request.getContextPath() + "/doctorMenu.jsp");
                } else if (usuario.getIdRol() == 3) { // Secretaria / Admin
                    response.sendRedirect(request.getContextPath() + "/secretariaDashboard.jsp");
                } else {
                    response.sendRedirect(request.getContextPath() + "/especialidad.jsp");
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
