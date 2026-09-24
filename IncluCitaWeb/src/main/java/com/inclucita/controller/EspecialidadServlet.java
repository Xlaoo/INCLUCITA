package com.inclucita.controller;

import com.google.gson.Gson;
import com.inclucita.dao.EspecialidadDAO;
import com.inclucita.model.Especialidad;

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
 * Servlet Controlador MVC para listar y consultar Especialidades Médicas.
 */
@WebServlet(name = "EspecialidadServlet", urlPatterns = {"/especialidades"})
public class EspecialidadServlet extends HttpServlet {

    private EspecialidadDAO especialidadDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        especialidadDAO = new EspecialidadDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        List<Especialidad> lista = especialidadDAO.listarTodas();

        String format = request.getParameter("format");
        if ("jsp".equalsIgnoreCase(format)) {
            request.setAttribute("especialidades", lista);
            request.getRequestDispatcher("/especialidad.jsp").forward(request, response);
        } else {
            response.setContentType("application/json;charset=UTF-8");
            PrintWriter out = response.getWriter();
            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("data", lista);
            out.print(gson.toJson(map));
        }
    }
}
