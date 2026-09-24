-- ==============================================================
-- BASE DE DATOS: IncluCitaDB
-- Plataforma de Citas Médicas Inclusiva
-- Sistema de Base de Datos Relacional (MySQL / MariaDB)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS inclucitadb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE inclucitadb;

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS observaciones_clinicas;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS doctores;
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla ROLES
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
) ENGINE=InnoDB;

-- 2. Tabla USUARIOS (Pacientes, Médicos, Secretarias)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    departamento VARCHAR(50) NULL,
    provincia VARCHAR(50) NULL,
    distrito VARCHAR(50) NULL,
    condicion VARCHAR(50) DEFAULT 'Sin condición especial',
    detalle_condicion VARCHAR(100) NULL,
    id_rol INT NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Tabla ESPECIALIDADES MÉDICAS
CREATE TABLE especialidades (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    icono VARCHAR(30) DEFAULT '💙',
    descripcion TEXT
) ENGINE=InnoDB;

-- 4. Tabla DOCTORES
CREATE TABLE doctores (
    id_doctor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_especialidad INT NOT NULL,
    consultorio VARCHAR(50) NOT NULL,
    horario_atencion VARCHAR(100) DEFAULT '08:00 - 14:00',
    foto VARCHAR(255) DEFAULT 'doctor.png',
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    CONSTRAINT fk_doctor_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
) ENGINE=InnoDB;

-- 5. Tabla CITAS MÉDICAS
CREATE TABLE citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    codigo_cita VARCHAR(25) NOT NULL UNIQUE,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('PENDIENTE', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA') DEFAULT 'PENDIENTE',
    motivo VARCHAR(255) DEFAULT 'Consulta médica presencial',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_paciente FOREIGN KEY (id_paciente) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_cita_doctor FOREIGN KEY (id_doctor) REFERENCES doctores(id_doctor)
) ENGINE=InnoDB;

-- 6. Tabla OBSERVACIONES CLÍNICAS (Historial y diagnóstico médico)
CREATE TABLE observaciones_clinicas (
    id_observacion INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL UNIQUE,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    indicaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_obs_cita FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================================================
-- INSERCIÓN DE DATOS INICIALES (SEMILLA / SEED DATA)
-- ==============================================================

-- Inserción de Roles
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
(1, 'PACIENTE', 'Usuario general que reserva y consulta citas médicas'),
(2, 'DOCTOR', 'Personal médico que atiende pacientes y gestiona agenda'),
(3, 'SECRETARIA', 'Personal administrativo que gestiona citas y doctores');

-- Inserción de Especialidades
INSERT INTO especialidades (id_especialidad, nombre, icono, descripcion) VALUES
(1, 'Medicina General', '💙', 'Atención médica integral primaria'),
(2, 'Pediatría', '👶', 'Atención médica especializada para infantes y niños'),
(3, 'Traumatología', '🦴', 'Diagnóstico y tratamiento de lesiones óseas y articulares'),
(4, 'Oftalmología', '👁️', 'Salud visual y patologías oculares'),
(5, 'Odontología', '🦷', 'Salud bucal, prevención y tratamientos dentales'),
(6, 'Cardiología', '❤️', 'Cuidado y diagnóstico del sistema cardiovascular'),
(7, 'Dermatología', '🧴', 'Cuidado y tratamiento de enfermedades de la piel');

-- Inserción de Usuarios Administrativos (Secretarias)
INSERT INTO usuarios (dni, username, password, nombre_completo, telefono, email, id_rol) VALUES
('00000001', 'secretaria', 'secretaria123', 'Lic. Carmen Rosa Salas', '987111222', 'secretaria@inclucita.com', 3),
('72527818', 'secretaria2', '123456', 'Recepcionista Turno Tarde', '987333444', 'recepcion@inclucita.com', 3);

-- Inserción de Usuarios Médicos
INSERT INTO usuarios (dni, username, password, nombre_completo, telefono, email, id_rol) VALUES
('10000001', 'dr.ramirez', 'doctor123', 'Dr. Luis Ramírez', '987654321', 'lramirez@inclucita.com', 2),
('10000002', 'dra.lopez', 'doctor123', 'Dra. María López', '912345678', 'mlopez@inclucita.com', 2),
('10000003', 'dr.mendoza', 'doctor123', 'Dr. Carlos Mendoza', '923456789', 'cmendoza@inclucita.com', 2),
('10000004', 'dra.torres', 'doctor123', 'Dra. Ana Torres', '934567890', 'atorres@inclucita.com', 2),
('10000005', 'dr.vargas', 'doctor123', 'Dr. José Vargas', '945678901', 'jvargas@inclucita.com', 2),
('10000006', 'dra.ruiz', 'doctor123', 'Dra. Patricia Ruiz', '956789012', 'pruiz@inclucita.com', 2),
('10000007', 'dra.castillo', 'doctor123', 'Dra. Rosa Castillo', '967890123', 'rcastillo@inclucita.com', 2);

-- Inserción de Doctores vinculados
INSERT INTO doctores (id_usuario, id_especialidad, consultorio, horario_atencion, foto) VALUES
(3, 1, 'Consultorio 1', '08:00 - 13:00', 'doctor.png'),
(4, 2, 'Consultorio 2', '09:00 - 14:00', 'Doctora.png'),
(5, 3, 'Consultorio 4', '08:00 - 13:00', 'doctor.png'),
(6, 4, 'Consultorio 5', '10:00 - 15:00', 'Doctora.png'),
(7, 5, 'Consultorio 6', '08:30 - 13:30', 'doctor.png'),
(8, 6, 'Consultorio 7', '09:00 - 14:00', 'Doctora.png'),
(9, 7, 'Consultorio 8', '08:00 - 12:00', 'Doctora.png');

-- Inserción de Pacientes de prueba
INSERT INTO usuarios (dni, username, password, nombre_completo, telefono, email, id_rol) VALUES
('12345678', '12345678', '12345678', 'Juan Carlos Pérez Gómez', '998877665', 'jperez@gmail.com', 1),
('87654321', '87654321', '87654321', 'María Elena Flores Ramos', '981234567', 'mflores@gmail.com', 1),
('74859612', '74859612', '74859612', 'Roberto Dávila Sánchez', '974125896', 'rdavila@gmail.com', 1);

-- Inserción de Citas de Prueba
INSERT INTO citas (codigo_cita, id_paciente, id_doctor, fecha, hora, estado, motivo) VALUES
('CITA-2026-001', 10, 1, CURDATE(), '09:00:00', 'PENDIENTE', 'Chequeo médico de rutina e hipertensión'),
('CITA-2026-002', 11, 2, CURDATE(), '10:30:00', 'PENDIENTE', 'Control pediátrico de desarrollo infantil'),
('CITA-2026-003', 12, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 'PENDIENTE', 'Dolor en la rodilla derecha tras caída');

-- Inserción de una Observación médica previa
INSERT INTO observaciones_clinicas (id_cita, diagnostico, tratamiento, indicaciones) VALUES
(1, 'Presión arterial ligeramente elevada (135/85 mmHg). Sin signos de alarma.', 'Dieta baja en sodio, actividad física moderada 30 minutos al día.', 'Volver a control en 15 días con registro diario de presión.');
