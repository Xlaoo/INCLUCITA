# 🏥 IncluCita - Plataforma Web Inclusiva de Citas Médicas

> **Proyecto Académico de Desarrollo Web Java EE / Jakarta EE**  
> Arquitectura **MVC (Modelo - Vista - Controlador)** con **Java Servlets, JSP, JavaBeans, JDBC, MySQL, Bootstrap 5 y Accesibilidad por Voz**.

---

## 📌 1. Presentación del Proyecto y Propósito
**IncluCita** es una plataforma web diseñada para democratizar y facilitar el acceso a los servicios de salud, eliminando las barreras que enfrentan pacientes de la tercera edad, personas con limitaciones visuales o motrices y personas quechuahablantes.

### 🌟 Características Clave
* **Accesibilidad e Inclusión**: Asistencia por voz integrada (**Web Speech API**) en español y quechua, teclado numérico asistido y alto contraste.
* **Arquitectura Robusta**: Implementación bajo el patrón **MVC** con **Jakarta Servlets 5.0**, **JSP 3.0**, **JavaBeans** y **MySQL**.
* **Gestión Multi-Rol**: Vistas y permisos personalizados para **Pacientes**, **Médicos** y **Personal Administrativo (Secretaria)**.

---

## 👥 2. Roles del Sistema y Matriz de Funcionalidades

| Rol | Vistas Principales | Funciones Principales |
| :--- | :--- | :--- |
| **👤 Paciente** | `IncluCita.html`, `especialidad.html`, `fecha.html`, `hora.html`, `confirmar.html`, `ticket.jsp` | - Ingreso de DNI mediante teclado numérico o dictado por voz.<br>- Selección de especialidad médica y médico tratante.<br>- Selección de fecha y franja horaria.<br>- Emisión y descarga de Comprobante / Ticket de Cita.<br>- Consulta y cancelación de citas médicas registradas. |
| **👨‍⚕️ Doctor** | `DoctorLogin.html`, `doctorMenu.html`, `doctorAgenda.jsp`, `doctorPacientesHoy.html` | - Autenticación médica por DNI.<br>- Consulta de agenda médica diaria y semanal sincronizada con base de datos.<br>- Registro de atención médica (diagnóstico clínico, receta y tratamiento).<br>- Historial de consultas médicas concluidas. |
| **👩‍💼 Secretaria** | `SecretariaLogin.html`, `secretariaDashboard.jsp`, `secretariaCitas.jsp`, `secretariaRegistrarDoctor.html` | - Administración y auditoría general de citas médicas.<br>- Cancelación y reprogramación de turnos.<br>- Alta, baja y asignación de consultorios a profesionales de la salud.<br>- Monitoreo del Dashboard estadístico de atenciones y métricas en tiempo real. |

---

## 🛠️ 3. Tecnologías Empleadas

* **Backend**: Java 17, Jakarta Servlet API 5.0, JSP 3.0, JSTL 2.0, Gson 2.10, JDBC.
* **Base de Datos**: MySQL 8.x / MariaDB (Script relacional en `database/database.sql`).
* **Frontend**: HTML5, CSS3 personalizado (`style.css`), JavaScript nativo (`script.js`), Bootstrap 5.3.8.
* **Herramientas de Construcción y Servidor**: Apache Maven, Apache Tomcat 10.x, Apache NetBeans.

---

## 📐 4. Diagramas de Arquitectura y Casos de Uso

Toda la especificación formal de casos de uso y diagramas de ingeniería se encuentra documentada en:
👉 [**DOCUMENTACION_TECNICA.md**](IncluCitaWeb/DOCUMENTACION_TECNICA.md)

### Resumen del Modelo Relacional de Datos (MySQL)
1. `roles`: Definición de perfiles (Paciente, Doctor, Secretaria).
2. `usuarios`: Credenciales, datos personales y rol asignado.
3. `especialidades`: Catálogo de especialidades médicas.
4. `doctores`: Vinculación de usuario médico con especialidad, consultorio y horario.
5. `citas`: Reserva de citas médicas con estados (`PENDIENTE`, `ATENDIDA`, `CANCELADA`, `REPROGRAMADA`).
6. `observaciones_clinicas`: Diagnóstico médico, recetas e indicaciones por cita.

---

## 🚀 5. Guía de Ejecución Rápida en NetBeans con Tomcat

1. **Configurar Base de Datos**:
   - Inicie **MySQL** en **XAMPP**.
   - Ingrese a `http://localhost/phpmyadmin`.
   - Cree la base de datos `inclucitadb` e importe el script:  
     `IncluCitaWeb/database/database.sql`.

2. **Abrir en NetBeans**:
   - Abra **Apache NetBeans**.
   - Menú **File → Open Project...** y seleccione la carpeta `IncluCitaWeb`.
   - Haga clic derecho en el proyecto → **Run** (F6).
   - La aplicación se desplegará en: `http://localhost:8080/IncluCitaWeb/`.

### 🔑 Credenciales para Pruebas:
* **Secretaria**: DNI `72527818` / Clave `123456`
* **Médico General**: DNI `10000001` (Dr. Luis Ramírez)
* **Médico Pediatra**: DNI `10000002` (Dra. María López)
* **Paciente**: DNI `12345678` (Juan Carlos Pérez)
