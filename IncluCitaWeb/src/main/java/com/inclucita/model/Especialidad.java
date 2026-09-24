package com.inclucita.model;

import java.io.Serializable;

/**
 * JavaBean que representa una Especialidad Médica en el sistema.
 */
public class Especialidad implements Serializable {
    private static final long serialVersionUID = 1L;

    private int idEspecialidad;
    private String nombre;
    private String icono;
    private String descripcion;

    public Especialidad() {
    }

    public Especialidad(int idEspecialidad, String nombre, String icono, String descripcion) {
        this.idEspecialidad = idEspecialidad;
        this.nombre = nombre;
        this.icono = icono;
        this.descripcion = descripcion;
    }

    public int getIdEspecialidad() {
        return idEspecialidad;
    }

    public void setIdEspecialidad(int idEspecialidad) {
        this.idEspecialidad = idEspecialidad;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getIcono() {
        return icono;
    }

    public void setIcono(String icono) {
        this.icono = icono;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    @Override
    public String toString() {
        return "Especialidad{" +
                "idEspecialidad=" + idEspecialidad +
                ", nombre='" + nombre + '\'' +
                ", icono='" + icono + '\'' +
                '}';
    }
}
