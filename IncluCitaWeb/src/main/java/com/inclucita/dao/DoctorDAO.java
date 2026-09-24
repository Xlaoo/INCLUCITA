package com.inclucita.dao;

import com.inclucita.model.Doctor;
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
 * Data Access Object (DAO) para la gestión de Doctores.
 */
public class DoctorDAO {

    private static final String BASE_SELECT =
            "SELECT d.*, u.nombre_completo, u.telefono, u.email, " +
            "       e.nombre AS nombre_especialidad, e.icono AS icono_especialidad " +
            "FROM doctores d " +
            "INNER JOIN usuarios u ON d.id_usuario = u.id_usuario " +
            "INNER JOIN especialidades e ON d.id_especialidad = e.id_especialidad ";

    public List<Doctor> listarTodos() {
        List<Doctor> lista = new ArrayList<>();
        String sql = BASE_SELECT + "WHERE d.estado = 'ACTIVO' ORDER BY u.nombre_completo ASC";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearDoctor(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.listarTodos: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    public List<Doctor> listarPorEspecialidad(int idEspecialidad) {
        List<Doctor> lista = new ArrayList<>();
        String sql = BASE_SELECT + "WHERE d.id_especialidad = ? AND d.estado = 'ACTIVO' ORDER BY u.nombre_completo ASC";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idEspecialidad);
            rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearDoctor(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.listarPorEspecialidad: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    public Doctor buscarPorId(int idDoctor) {
        String sql = BASE_SELECT + "WHERE d.id_doctor = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idDoctor);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearDoctor(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.buscarPorId: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    public Doctor buscarPorIdUsuario(int idUsuario) {
        String sql = BASE_SELECT + "WHERE d.id_usuario = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idUsuario);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearDoctor(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.buscarPorIdUsuario: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    /**
     * Registra un nuevo doctor creando su usuario y registro de médico en una sola transacción.
     */
    public boolean registrarDoctor(Usuario usuario, Doctor doctor) {
        Connection conn = null;
        PreparedStatement psUsuario = null;
        PreparedStatement psDoctor = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            conn.setAutoCommit(false); // Iniciar Transacción

            // 1. Insertar usuario con rol DOCTOR (id_rol = 2)
            String sqlUser = "INSERT INTO usuarios (dni, username, password, nombre_completo, telefono, email, id_rol, estado) " +
                             "VALUES (?, ?, ?, ?, ?, ?, 2, 'ACTIVO')";
            psUsuario = conn.prepareStatement(sqlUser, Statement.RETURN_GENERATED_KEYS);
            psUsuario.setString(1, usuario.getDni());
            psUsuario.setString(2, usuario.getUsername());
            psUsuario.setString(3, usuario.getPassword());
            psUsuario.setString(4, usuario.getNombreCompleto());
            psUsuario.setString(5, usuario.getTelefono());
            psUsuario.setString(6, usuario.getEmail());
            psUsuario.executeUpdate();

            rs = psUsuario.getGeneratedKeys();
            int idUsuarioGenerado = -1;
            if (rs.next()) {
                idUsuarioGenerado = rs.getInt(1);
            } else {
                conn.rollback();
                return false;
            }

            // 2. Insertar doctor
            String sqlDoc = "INSERT INTO doctores (id_usuario, id_especialidad, consultorio, horario_atencion, foto, estado) " +
                            "VALUES (?, ?, ?, ?, ?, 'ACTIVO')";
            psDoctor = conn.prepareStatement(sqlDoc);
            psDoctor.setInt(1, idUsuarioGenerado);
            psDoctor.setInt(2, doctor.getIdEspecialidad());
            psDoctor.setString(3, doctor.getConsultorio());
            psDoctor.setString(4, doctor.getHorarioAtencion() != null ? doctor.getHorarioAtencion() : "08:00 - 14:00");
            psDoctor.setString(5, doctor.getFoto() != null ? doctor.getFoto() : "doctor.png");
            psDoctor.executeUpdate();

            conn.commit(); // Confirmar Transacción
            return true;
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.registrarDoctor: " + e.getMessage());
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ignored) {}
            }
            return false;
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (psUsuario != null) try { psUsuario.close(); } catch (SQLException ignored) {}
            if (psDoctor != null) try { psDoctor.close(); } catch (SQLException ignored) {}
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
        }
    }

    /**
     * Desactiva / elimina lógicamente a un doctor.
     */
    public boolean eliminarDoctor(int idDoctor) {
        String sql = "UPDATE doctores SET estado = 'INACTIVO' WHERE id_doctor = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idDoctor);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error en DoctorDAO.eliminarDoctor: " + e.getMessage());
            return false;
        } finally {
            ConexionBD.cerrar(conn, ps);
        }
    }

    private Doctor mapearDoctor(ResultSet rs) throws SQLException {
        Doctor d = new Doctor();
        d.setIdDoctor(rs.getInt("id_doctor"));
        d.setIdUsuario(rs.getInt("id_usuario"));
        d.setIdEspecialidad(rs.getInt("id_especialidad"));
        d.setConsultorio(rs.getString("consultorio"));
        d.setHorarioAtencion(rs.getString("horario_atencion"));
        d.setFoto(rs.getString("foto"));
        d.setEstado(rs.getString("estado"));
        d.setNombreCompleto(rs.getString("nombre_completo"));
        d.setTelefono(rs.getString("telefono"));
        d.setEmail(rs.getString("email"));
        d.setNombreEspecialidad(rs.getString("nombre_especialidad"));
        d.setIconoEspecialidad(rs.getString("icono_especialidad"));
        return d;
    }
}
