package com.inclucita.dao;

import com.inclucita.model.Usuario;
import com.inclucita.util.ConexionBD;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) para la entidad Usuario.
 */
public class UsuarioDAO {

    /**
     * Autentica un usuario por su nombre de usuario (o DNI) y contraseña.
     */
    public Usuario autenticar(String login, String password) {
        String sql = "SELECT u.*, r.nombre AS nombre_rol " +
                     "FROM usuarios u " +
                     "INNER JOIN roles r ON u.id_rol = r.id_rol " +
                     "WHERE (u.username = ? OR u.dni = ?) AND u.password = ? AND u.estado = 'ACTIVO'";
        
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setString(1, login);
            ps.setString(2, login);
            ps.setString(3, password);
            rs = ps.executeQuery();
            
            if (rs.next()) {
                return mapearUsuario(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en UsuarioDAO.autenticar: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    /**
     * Busca un usuario/paciente por su DNI.
     */
    public Usuario buscarPorDni(String dni) {
        String sql = "SELECT u.*, r.nombre AS nombre_rol " +
                     "FROM usuarios u " +
                     "INNER JOIN roles r ON u.id_rol = r.id_rol " +
                     "WHERE u.dni = ? AND u.estado = 'ACTIVO'";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setString(1, dni);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearUsuario(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en UsuarioDAO.buscarPorDni: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    /**
     * Registra un nuevo paciente rápido (por ejemplo, al ingresar su DNI y nombre).
     */
    public int registrarPacienteSiNoExiste(String dni, String nombreCompleto, String telefono) {
        Usuario existente = buscarPorDni(dni);
        if (existente != null) {
            return existente.getIdUsuario();
        }

        String sql = "INSERT INTO usuarios (dni, username, password, nombreCompleto, telefono, id_rol, estado) " +
                     "VALUES (?, ?, ?, ?, ?, 1, 'ACTIVO')";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(
                "INSERT INTO usuarios (dni, username, password, nombre_completo, telefono, id_rol, estado) VALUES (?, ?, ?, ?, ?, 1, 'ACTIVO')",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, dni);
            ps.setString(2, dni);
            ps.setString(3, dni); // Contraseña temporal por defecto
            ps.setString(4, (nombreCompleto != null && !nombreCompleto.isEmpty()) ? nombreCompleto : "Paciente DNI " + dni);
            ps.setString(5, telefono != null ? telefono : "");
            
            int filas = ps.executeUpdate();
            if (filas > 0) {
                rs = ps.getGeneratedKeys();
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            System.err.println("Error en UsuarioDAO.registrarPacienteSiNoExiste: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return -1;
    }

    /**
     * Mapea un ResultSet a un objeto JavaBean Usuario.
     */
    private Usuario mapearUsuario(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setIdUsuario(rs.getInt("id_usuario"));
        u.setDni(rs.getString("dni"));
        u.setUsername(rs.getString("username"));
        u.setPassword(rs.getString("password"));
        u.setNombreCompleto(rs.getString("nombre_completo"));
        u.setTelefono(rs.getString("telefono"));
        u.setEmail(rs.getString("email"));
        u.setIdRol(rs.getInt("id_rol"));
        u.setNombreRol(rs.getString("nombre_rol"));
        u.setEstado(rs.getString("estado"));
        u.setFechaRegistro(rs.getTimestamp("fecha_registro"));
        return u;
    }
}
