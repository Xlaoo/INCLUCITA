package com.inclucita.model;

import java.io.Serializable;

/**
 * JavaBean que representa la entidad Doctor en el sistema.
 */
public class Doctor implements Serializable {
    private static final long serialVersionUID = 1L;

    private int idDoctor;
    private int idUsuario;
    private int idEspecialidad;
    private String consultorio;
    private String horarioAtencion;
    private String foto;
    private String estado;

    // Campos complementarios (JOIN)
    private String nombreCompleto;
    private String telefono;
    private String email;
    private String nombreEspecialidad;
    private String iconoEspecialidad;

    public Doctor() {
    }

    public Doctor(int idDoctor, int idUsuario, int idEspecialidad, String consultorio,
                  String horarioAtencion, String foto, String estado) {
        this.idDoctor = idDoctor;
        this.idUsuario = idUsuario;
        this.idEspecialidad = idEspecialidad;
        this.consultorio = consultorio;
        this.horarioAtencion = horarioAtencion;
        this.foto = foto;
        this.estado = estado;
    }

    public int getIdDoctor() {
        return idDoctor;
    }

    public void setIdDoctor(int idDoctor) {
        this.idDoctor = idDoctor;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public int getIdEspecialidad() {
        return idEspecialidad;
    }

    public void setIdEspecialidad(int idEspecialidad) {
        this.idEspecialidad = idEspecialidad;
    }

    public String getConsultorio() {
        return consultorio;
    }

    public void setConsultorio(String consultorio) {
        this.consultorio = consultorio;
    }

    public String getHorarioAtencion() {
        return horarioAtencion;
    }

    public void setHorarioAtencion(String horarioAtencion) {
        this.horarioAtencion = horarioAtencion;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNombreEspecialidad() {
        return nombreEspecialidad;
    }

    public void setNombreEspecialidad(String nombreEspecialidad) {
        this.nombreEspecialidad = nombreEspecialidad;
    }

    public String getIconoEspecialidad() {
        return iconoEspecialidad;
    }

    public void setIconoEspecialidad(String iconoEspecialidad) {
        this.iconoEspecialidad = iconoEspecialidad;
    }

    @Override
    public String toString() {
        return "Doctor{" +
                "idDoctor=" + idDoctor +
                ", nombreCompleto='" + nombreCompleto + '\'' +
                ", especialidad='" + nombreEspecialidad + '\'' +
                ", consultorio='" + consultorio + '\'' +
                '}';
    }
}
