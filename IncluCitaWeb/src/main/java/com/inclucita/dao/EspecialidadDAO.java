package com.inclucita.dao;

import com.inclucita.model.Especialidad;
import com.inclucita.util.ConexionBD;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) para Especialidades Médicas.
 */
public class EspecialidadDAO {

    public List<Especialidad> listarTodas() {
        List<Especialidad> lista = new ArrayList<>();
        String sql = "SELECT * FROM especialidades ORDER BY nombre ASC";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();
            while (rs.next()) {
                Especialidad e = new Especialidad();
                e.setIdEspecialidad(rs.getInt("id_especialidad"));
                e.setNombre(rs.getString("nombre"));
                e.setIcono(rs.getString("icono"));
                e.setDescripcion(rs.getString("descripcion"));
                lista.add(e);
            }
        } catch (SQLException e) {
            System.err.println("Error en EspecialidadDAO.listarTodas: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    public Especialidad buscarPorId(int idEspecialidad) {
        String sql = "SELECT * FROM especialidades WHERE id_especialidad = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idEspecialidad);
            rs = ps.executeQuery();
            if (rs.next()) {
                Especialidad e = new Especialidad();
                e.setIdEspecialidad(rs.getInt("id_especialidad"));
                e.setNombre(rs.getString("nombre"));
                e.setIcono(rs.getString("icono"));
                e.setDescripcion(rs.getString("descripcion"));
                return e;
            }
        } catch (SQLException e) {
            System.err.println("Error en EspecialidadDAO.buscarPorId: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }
}
