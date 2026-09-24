package com.inclucita.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * JavaBean que representa la Observación Clínica (diagnóstico / tratamiento)
 * realizada por un médico para una cita específica.
 */
public class ObservacionClinica implements Serializable {
    private static final long serialVersionUID = 1L;

    private int idObservacion;
    private int idCita;
    private String diagnostico;
    private String tratamiento;
    private String indicaciones;
    private Timestamp fechaRegistro;

    public ObservacionClinica() {
    }

    public ObservacionClinica(int idObservacion, int idCita, String diagnostico,
                              String tratamiento, String indicaciones) {
        this.idObservacion = idObservacion;
        this.idCita = idCita;
        this.diagnostico = diagnostico;
        this.tratamiento = tratamiento;
        this.indicaciones = indicaciones;
    }

    public int getIdObservacion() {
        return idObservacion;
    }

    public void setIdObservacion(int idObservacion) {
        this.idObservacion = idObservacion;
    }

    public int getIdCita() {
        return idCita;
    }

    public void setIdCita(int idCita) {
        this.idCita = idCita;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public void setDiagnostico(String diagnostico) {
        this.diagnostico = diagnostico;
    }

    public String getTratamiento() {
        return tratamiento;
    }

    public void setTratamiento(String tratamiento) {
        this.tratamiento = tratamiento;
    }

    public String getIndicaciones() {
        return indicaciones;
    }

    public void setIndicaciones(String indicaciones) {
        this.indicaciones = indicaciones;
    }

    public Timestamp getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(Timestamp fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    @Override
    public String toString() {
        return "ObservacionClinica{" +
                "idObservacion=" + idObservacion +
                ", idCita=" + idCita +
                ", diagnostico='" + diagnostico + '\'' +
                '}';
    }
}
