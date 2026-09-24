package com.inclucita.model;

import java.io.Serializable;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;

/**
 * JavaBean que representa una Cita Médica en el sistema.
 */
public class Cita implements Serializable {
    private static final long serialVersionUID = 1L;

    private int idCita;
    private String codigoCita;
    private int idPaciente;
    private int idDoctor;
    private Date fecha;
    private Time hora;
    private String estado; // PENDIENTE, ATENDIDA, CANCELADA, REPROGRAMADA
    private String motivo;
    private Timestamp fechaCreacion;

    // Campos de visualización (JOINs)
    private String nombrePaciente;
    private String dniPaciente;
    private String telefonoPaciente;
    private String nombreDoctor;
    private String consultorioDoctor;
    private String especialidadDoctor;
    private String iconoEspecialidad;

    public Cita() {
    }

    public Cita(int idCita, String codigoCita, int idPaciente, int idDoctor,
                Date fecha, Time hora, String estado, String motivo) {
        this.idCita = idCita;
        this.codigoCita = codigoCita;
        this.idPaciente = idPaciente;
        this.idDoctor = idDoctor;
        this.fecha = fecha;
        this.hora = hora;
        this.estado = estado;
        this.motivo = motivo;
    }

    public int getIdCita() {
        return idCita;
    }

    public void setIdCita(int idCita) {
        this.idCita = idCita;
    }

    public String getCodigoCita() {
        return codigoCita;
    }

    public void setCodigoCita(String codigoCita) {
        this.codigoCita = codigoCita;
    }

    public int getIdPaciente() {
        return idPaciente;
    }

    public void setIdPaciente(int idPaciente) {
        this.idPaciente = idPaciente;
    }

    public int getIdDoctor() {
        return idDoctor;
    }

    public void setIdDoctor(int idDoctor) {
        this.idDoctor = idDoctor;
    }

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public Time getHora() {
        return hora;
    }

    public void setHora(Time hora) {
        this.hora = hora;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Timestamp getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(Timestamp fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getNombrePaciente() {
        return nombrePaciente;
    }

    public void setNombrePaciente(String nombrePaciente) {
        this.nombrePaciente = nombrePaciente;
    }

    public String getDniPaciente() {
        return dniPaciente;
    }

    public void setDniPaciente(String dniPaciente) {
        this.dniPaciente = dniPaciente;
    }

    public String getTelefonoPaciente() {
        return telefonoPaciente;
    }

    public void setTelefonoPaciente(String telefonoPaciente) {
        this.telefonoPaciente = telefonoPaciente;
    }

    public String getNombreDoctor() {
        return nombreDoctor;
    }

    public void setNombreDoctor(String nombreDoctor) {
        this.nombreDoctor = nombreDoctor;
    }

    public String getConsultorioDoctor() {
        return consultorioDoctor;
    }

    public void setConsultorioDoctor(String consultorioDoctor) {
        this.consultorioDoctor = consultorioDoctor;
    }

    public String getEspecialidadDoctor() {
        return especialidadDoctor;
    }

    public void setEspecialidadDoctor(String especialidadDoctor) {
        this.especialidadDoctor = especialidadDoctor;
    }

    public String getIconoEspecialidad() {
        return iconoEspecialidad;
    }

    public void setIconoEspecialidad(String iconoEspecialidad) {
        this.iconoEspecialidad = iconoEspecialidad;
    }

    @Override
    public String toString() {
        return "Cita{" +
                "idCita=" + idCita +
                ", codigoCita='" + codigoCita + '\'' +
                ", fecha=" + fecha +
                ", hora=" + hora +
                ", estado='" + estado + '\'' +
                '}';
    }
}
