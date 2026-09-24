package com.inclucita.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Clase utilitaria para gestionar la conexión JDBC a la base de datos MySQL / MariaDB.
 */
public class ConexionBD {

    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String URL = getEnvOrProp("DB_URL", "jdbc:mysql://localhost:3306/inclucitadb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Lima&characterEncoding=UTF-8");
    private static final String USUARIO = getEnvOrProp("DB_USER", "root");
    private static final String PASSWORD = getEnvOrProp("DB_PASSWORD", ""); // Por defecto en XAMPP está en blanco

    private static String getEnvOrProp(String name, String defaultValue) {
        String val = System.getenv(name);
        if (val == null || val.trim().isEmpty()) {
            val = System.getProperty(name);
        }
        return (val != null && !val.trim().isEmpty()) ? val.trim() : defaultValue;
    }

    static {
        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            System.err.println("Error: No se encontró el driver JDBC de MySQL (" + DRIVER + "): " + e.getMessage());
        }
    }

    /**
     * Obtiene una conexión activa a la base de datos.
     * @return Connection objeto de conexión JDBC
     * @throws SQLException si falla la conexión
     */
    public static Connection getConexion() throws SQLException {
        try {
            return DriverManager.getConnection(URL, USUARIO, PASSWORD);
        } catch (SQLException e) {
            System.err.println("Error al conectar a la base de datos inclucitadb: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Cierra de forma segura los recursos JDBC para evitar fugas de memoria.
     */
    public static void cerrar(Connection conn, Statement stmt, ResultSet rs) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException ignored) {}
        }
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException ignored) {}
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException ignored) {}
        }
    }

    public static void cerrar(Connection conn, Statement stmt) {
        cerrar(conn, stmt, null);
    }
}
