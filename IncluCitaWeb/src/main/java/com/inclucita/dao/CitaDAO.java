package com.inclucita.dao;

import com.inclucita.model.Cita;
import com.inclucita.model.ObservacionClinica;
import com.inclucita.util.ConexionBD;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) para la gestión integral de Citas Médicas y Observaciones Clínicas.
 */
public class CitaDAO {

    private static final String BASE_SELECT =
            "SELECT c.*, " +
            "       p.nombre_completo AS nombre_paciente, p.dni AS dni_paciente, p.telefono AS telefono_paciente, " +
            "       u_doc.nombre_completo AS nombre_doctor, d.consultorio AS consultorio_doctor, " +
            "       e.nombre AS especialidad_doctor, e.icono AS icono_especialidad " +
            "FROM citas c " +
            "INNER JOIN usuarios p ON c.id_paciente = p.id_usuario " +
            "INNER JOIN doctores d ON c.id_doctor = d.id_doctor " +
            "INNER JOIN usuarios u_doc ON d.id_usuario = u_doc.id_usuario " +
            "INNER JOIN especialidades e ON d.id_especialidad = e.id_especialidad ";

    /**
     * Registra una nueva cita médica.
     */
    public boolean registrarCita(Cita cita) {
        String sql = "INSERT INTO citas (codigo_cita, id_paciente, id_doctor, fecha, hora, estado, motivo) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            
            if (cita.getCodigoCita() == null || cita.getCodigoCita().isEmpty()) {
                cita.setCodigoCita("CITA-" + System.currentTimeMillis() % 1000000);
            }
            if (cita.getEstado() == null || cita.getEstado().isEmpty()) {
                cita.setEstado("PENDIENTE");
            }
            if (cita.getMotivo() == null || cita.getMotivo().isEmpty()) {
                cita.setMotivo("Consulta médica general");
            }

            ps.setString(1, cita.getCodigoCita());
            ps.setInt(2, cita.getIdPaciente());
            ps.setInt(3, cita.getIdDoctor());
            ps.setDate(4, cita.getFecha());
            ps.setTime(5, cita.getHora());
            ps.setString(6, cita.getEstado());
            ps.setString(7, cita.getMotivo());

            int filas = ps.executeUpdate();
            if (filas > 0) {
                rs = ps.getGeneratedKeys();
                if (rs.next()) {
                    cita.setIdCita(rs.getInt(1));
                }
                return true;
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.registrarCita: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return false;
    }

    /**
     * Lista todas las citas médicas (panel de Secretaria / Administración).
     */
    public List<Cita> listarTodas() {
        List<Cita> lista = new ArrayList<>();
        String sql = BASE_SELECT + "ORDER BY c.fecha DESC, c.hora DESC";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearCita(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.listarTodas: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    /**
     * Lista las citas de un paciente por su DNI.
     */
    public List<Cita> listarPorDni(String dni) {
        List<Cita> lista = new ArrayList<>();
        String sql = BASE_SELECT + "WHERE p.dni = ? ORDER BY c.fecha DESC, c.hora DESC";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setString(1, dni);
            rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearCita(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.listarPorDni: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    /**
     * Lista las citas de un doctor (para una fecha específica o todas si fecha es null).
     */
    public List<Cita> listarPorDoctorYFecha(int idDoctor, Date fecha) {
        List<Cita> lista = new ArrayList<>();
        String sql = BASE_SELECT + "WHERE c.id_doctor = ? ";
        if (fecha != null) {
            sql += "AND c.fecha = ? ";
        }
        sql += "ORDER BY c.hora ASC";

        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idDoctor);
            if (fecha != null) {
                ps.setDate(2, fecha);
            }
            rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearCita(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.listarPorDoctorYFecha: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return lista;
    }

    /**
     * Busca una cita médica por su código único (ej: CITA-2026-001).
     */
    public Cita buscarPorCodigo(String codigoCita) {
        String sql = BASE_SELECT + "WHERE c.codigo_cita = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setString(1, codigoCita);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearCita(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.buscarPorCodigo: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    /**
     * Busca una cita médica por su ID primario.
     */
    public Cita buscarPorId(int idCita) {
        String sql = BASE_SELECT + "WHERE c.id_cita = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idCita);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearCita(rs);
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.buscarPorId: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    /**
     * Actualiza el estado de una cita médica (PENDIENTE, ATENDIDA, CANCELADA, REPROGRAMADA).
     */
    public boolean actualizarEstado(int idCita, String nuevoEstado) {
        String sql = "UPDATE citas SET estado = ? WHERE id_cita = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setString(1, nuevoEstado);
            ps.setInt(2, idCita);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.actualizarEstado: " + e.getMessage());
            return false;
        } finally {
            ConexionBD.cerrar(conn, ps);
        }
    }

    /**
     * Reprograma fecha y hora de una cita médica.
     */
    public boolean reprogramarCita(int idCita, Date nuevaFecha, Time nuevaHora) {
        String sql = "UPDATE citas SET fecha = ?, hora = ?, estado = 'REPROGRAMADA' WHERE id_cita = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setDate(1, nuevaFecha);
            ps.setTime(2, nuevaHora);
            ps.setInt(3, idCita);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.reprogramarCita: " + e.getMessage());
            return false;
        } finally {
            ConexionBD.cerrar(conn, ps);
        }
    }

    /**
     * Registra o actualiza la observación clínica / diagnóstico de una cita.
     */
    public boolean guardarObservacion(ObservacionClinica obs) {
        String sql = "INSERT INTO observaciones_clinicas (id_cita, diagnostico, tratamiento, indicaciones) " +
                     "VALUES (?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE diagnostico = VALUES(diagnostico), tratamiento = VALUES(tratamiento), indicaciones = VALUES(indicaciones)";
        Connection conn = null;
        PreparedStatement ps = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, obs.getIdCita());
            ps.setString(2, obs.getDiagnostico());
            ps.setString(3, obs.getTratamiento());
            ps.setString(4, obs.getIndicaciones());
            int res = ps.executeUpdate();
            
            // Marcar cita como ATENDIDA
            if (res > 0) {
                actualizarEstado(obs.getIdCita(), "ATENDIDA");
                return true;
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.guardarObservacion: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps);
        }
        return false;
    }

    /**
     * Obtiene la observación clínica de una cita.
     */
    public ObservacionClinica obtenerObservacion(int idCita) {
        String sql = "SELECT * FROM observaciones_clinicas WHERE id_cita = ?";
        Connection conn = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            conn = ConexionBD.getConexion();
            ps = conn.prepareStatement(sql);
            ps.setInt(1, idCita);
            rs = ps.executeQuery();
            if (rs.next()) {
                ObservacionClinica o = new ObservacionClinica();
                o.setIdObservacion(rs.getInt("id_observacion"));
                o.setIdCita(rs.getInt("id_cita"));
                o.setDiagnostico(rs.getString("diagnostico"));
                o.setTratamiento(rs.getString("tratamiento"));
                o.setIndicaciones(rs.getString("indicaciones"));
                o.setFechaRegistro(rs.getTimestamp("fecha_registro"));
                return o;
            }
        } catch (SQLException e) {
            System.err.println("Error en CitaDAO.obtenerObservacion: " + e.getMessage());
        } finally {
            ConexionBD.cerrar(conn, ps, rs);
        }
        return null;
    }

    private Cita mapearCita(ResultSet rs) throws SQLException {
        Cita c = new Cita();
        c.setIdCita(rs.getInt("id_cita"));
        c.setCodigoCita(rs.getString("codigo_cita"));
        c.setIdPaciente(rs.getInt("id_paciente"));
        c.setIdDoctor(rs.getInt("id_doctor"));
        c.setFecha(rs.getDate("fecha"));
        c.setHora(rs.getTime("hora"));
        c.setEstado(rs.getString("estado"));
        c.setMotivo(rs.getString("motivo"));
        c.setFechaCreacion(rs.getTimestamp("fecha_creacion"));
        c.setNombrePaciente(rs.getString("nombre_paciente"));
        c.setDniPaciente(rs.getString("dni_paciente"));
        c.setTelefonoPaciente(rs.getString("telefono_paciente"));
        c.setNombreDoctor(rs.getString("nombre_doctor"));
        c.setConsultorioDoctor(rs.getString("consultorio_doctor"));
        c.setEspecialidadDoctor(rs.getString("especialidad_doctor"));
        c.setIconoEspecialidad(rs.getString("icono_especialidad"));
        return c;
    }
}
