package com.inclucita.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * JavaBean que representa a un Usuario (Paciente, Doctor, Secretaria) en el sistema.
 */
public class Usuario implements Serializable {
    private static final long serialVersionUID = 1L;

    private int idUsuario;
    private String dni;
    private String username;
    private String password;
    private String nombreCompleto;
    private String telefono;
    private String email;
    private int idRol;
    private String nombreRol;
    private String estado;
    private Timestamp fechaRegistro;

    public Usuario() {
    }

    public Usuario(int idUsuario, String dni, String username, String password, String nombreCompleto,
                   String telefono, String email, int idRol, String estado) {
        this.idUsuario = idUsuario;
        this.dni = dni;
        this.username = username;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
        this.telefono = telefono;
        this.email = email;
        this.idRol = idRol;
        this.estado = estado;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public int getIdRol() {
        return idRol;
    }

    public void setIdRol(int idRol) {
        this.idRol = idRol;
    }

    public String getNombreRol() {
        return nombreRol;
    }

    public void setNombreRol(String nombreRol) {
        this.nombreRol = nombreRol;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Timestamp getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(Timestamp fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    @Override
    public String toString() {
        return "Usuario{" +
                "idUsuario=" + idUsuario +
                ", dni='" + dni + '\'' +
                ", nombreCompleto='" + nombreCompleto + '\'' +
                ", idRol=" + idRol +
                '}';
    }
}
