# Cómo abrir IncluCita en Apache NetBeans con Tomcat

Este proyecto ya viene reorganizado como una **aplicación web Maven** (WAR), que es la
estructura que NetBeans reconoce automáticamente y puede ejecutar directamente en un
servidor Tomcat, sin necesidad de configurar nada manualmente.

## Requisitos previos
1. Tener **Apache NetBeans** instalado (con el plugin "Java Web and EE" habilitado).
2. Tener **Apache Tomcat** descargado (cualquier versión 10.x recomendada).
3. Registrar Tomcat en NetBeans (si no lo has hecho antes):
   - Menú **Tools → Servers → Add Server...**
   - Elegir **Apache Tomcat**, indicar la carpeta donde lo descomprimiste.

## Pasos para abrir el proyecto
1. Descomprime el archivo `IncluCitaWeb.zip` que te entregué.
2. En NetBeans: **File → Open Project...**
3. Selecciona la carpeta `IncluCitaWeb` (la que contiene el archivo `pom.xml`).
4. NetBeans la reconocerá automáticamente como proyecto **Maven / Web Application**.
5. Clic derecho sobre el proyecto → **Properties → Run** y verifica que el
   **Server** apunte a tu Tomcat registrado. Si aparece en blanco, selecciónalo ahí mismo.
6. Clic derecho sobre el proyecto → **Run** (o el botón ▶ verde).
   NetBeans compilará el WAR, lo desplegará en Tomcat y abrirá el navegador
   automáticamente en algo como:
   `http://localhost:8080/IncluCitaWeb/`

## Estructura del proyecto
```
IncluCitaWeb/
├── pom.xml                        ← define el proyecto como WAR (Maven)
└── src/main/webapp/               ← aquí vive TODO tu frontend original
    ├── WEB-INF/web.xml            ← define la página de inicio (pantallaPrincipal.html)
    ├── pantallaPrincipal.html     ← página de bienvenida
    ├── IncluCita.html
    ├── DoctorLogin.html
    ├── SecretariaLogin.html
    ├── script.js
    ├── style.css
    └── ... (todos los demás .html, .png, carpetas de imágenes, etc.)
```

Todos tus archivos HTML, CSS, JS e imágenes se copiaron **tal cual** dentro de
`src/main/webapp/`, así que el proyecto funciona exactamente igual que en VS Code
(es solo HTML/CSS/JS estático) — la única diferencia es que ahora Tomcat lo sirve
como aplicación web dentro de NetBeans.

## Nota importante
Este proyecto, tal como estaba en VS Code, es **100% frontend estático**
(no tiene backend Java, servlets ni base de datos). Tomcat aquí solo cumple el
rol de servidor que entrega los archivos HTML/CSS/JS — no hay lógica de servidor
que ejecutar. Si más adelante quieres agregar un backend en Java (servlets, JSP,
Spring, conexión a base de datos, etc.), esta misma estructura Maven ya está lista
para that: solo tendrías que crear clases dentro de `src/main/java/`.
