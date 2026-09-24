<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IncluCita - Clínica Médica Inclusiva | Tu Salud, Nuestra Prioridad</title>
  
  <!-- Tipografía moderna Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Bootstrap 5 & Iconos -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">

  <style>
    :root {
      --primary-teal: #0fa998;
      --primary-dark: #096359;
      --primary-soft: #e6f7f5;
      --accent-coral: #ff6b6b;
      --text-dark: #1e293b;
      --text-muted: #64748b;
      --bg-light: #f8fafc;
      --card-border: rgba(15, 169, 152, 0.15);
    }

    body.medical-landing {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--text-dark);
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    /* Top Bar */
    .top-announcement {
      background-color: #f1f5f9;
      font-size: 0.85rem;
      color: var(--text-muted);
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 0;
    }

    /* Navbar */
    .navbar-medical {
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      padding: 14px 0;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .brand-logo-circle {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary-teal), var(--primary-dark));
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(15, 169, 152, 0.3);
    }

    .brand-name {
      font-weight: 800;
      font-size: 1.45rem;
      color: var(--text-dark);
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-sub {
      font-size: 0.75rem;
      color: var(--primary-teal);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .nav-link-medical {
      font-weight: 600;
      color: #334155 !important;
      margin: 0 8px;
      font-size: 0.95rem;
      transition: color 0.2s ease;
    }

    .nav-link-medical:hover {
      color: var(--primary-teal) !important;
    }

    .btn-book-nav {
      background-color: var(--primary-teal);
      color: #ffffff !important;
      font-weight: 700;
      border-radius: 10px;
      padding: 10px 22px;
      font-size: 0.92rem;
      border: none;
      box-shadow: 0 4px 14px rgba(15, 169, 152, 0.35);
      transition: all 0.25s ease;
    }

    .btn-book-nav:hover {
      background-color: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15, 169, 152, 0.45);
    }

    /* Hero Section */
    .hero-section {
      padding: 60px 0 80px 0;
      position: relative;
      background: radial-gradient(circle at 85% 30%, rgba(15, 169, 152, 0.08) 0%, transparent 60%);
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-soft);
      color: var(--primary-dark);
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 18px;
      border-radius: 30px;
      border: 1px solid rgba(15, 169, 152, 0.25);
      margin-bottom: 24px;
    }

    .hero-title {
      font-size: 3.6rem;
      font-weight: 800;
      line-height: 1.12;
      color: #0f172a;
      letter-spacing: -1.5px;
      margin-bottom: 22px;
    }

    .hero-title span.accent-teal {
      color: var(--primary-teal);
      position: relative;
    }

    .hero-desc {
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--text-muted);
      max-width: 540px;
      margin-bottom: 34px;
    }

    .btn-primary-hero {
      background-color: var(--primary-teal);
      color: white;
      font-weight: 700;
      font-size: 1.05rem;
      padding: 15px 32px;
      border-radius: 12px;
      border: none;
      box-shadow: 0 8px 24px rgba(15, 169, 152, 0.35);
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .btn-primary-hero:hover {
      background-color: var(--primary-dark);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(15, 169, 152, 0.45);
    }

    .btn-secondary-hero {
      background-color: transparent;
      color: var(--text-dark);
      font-weight: 700;
      font-size: 1.05rem;
      padding: 14px 28px;
      border-radius: 12px;
      border: 1.5px solid #cbd5e1;
      transition: all 0.25s ease;
      text-decoration: none;
    }

    .btn-secondary-hero:hover {
      border-color: var(--primary-teal);
      color: var(--primary-teal);
      background: var(--primary-soft);
    }

    /* Stats strip */
    .hero-stats {
      margin-top: 48px;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-pill-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-soft);
      color: var(--primary-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-pill strong {
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      display: block;
      line-height: 1;
    }

    .stat-pill span {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Hero Image Composite */
    .hero-image-wrap {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .hero-bg-shape {
      position: absolute;
      width: 460px;
      height: 460px;
      background: linear-gradient(135deg, #0fa998 0%, #065f54 100%);
      border-radius: 50%;
      z-index: 1;
      opacity: 0.95;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
    }

    .hero-doctor-img {
      position: relative;
      z-index: 2;
      max-height: 520px;
      object-fit: contain;
      filter: drop-shadow(0 20px 30px rgba(0,0,0,0.15));
    }

    .hero-floating-card {
      position: absolute;
      bottom: 40px;
      right: 20px;
      background: #ffffff;
      border-radius: 16px;
      padding: 16px 22px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
      z-index: 3;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .floating-card-icon {
      width: 48px;
      height: 48px;
      background: var(--primary-soft);
      color: var(--primary-teal);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    /* Services Section */
    .services-section {
      padding: 80px 0;
      background-color: #ffffff;
    }

    .section-tag {
      color: var(--primary-teal);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1.2px;
      display: block;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 2.3rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .title-line {
      width: 48px;
      height: 4px;
      background: var(--primary-teal);
      border-radius: 4px;
      margin: 14px auto 35px auto;
    }

    .service-card {
      background: #ffffff;
      border: 1.5px solid #edf2f7;
      border-radius: 18px;
      padding: 32px 24px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 36px rgba(15, 169, 152, 0.12);
      border-color: var(--primary-teal);
    }

    .service-icon-box {
      width: 68px;
      height: 68px;
      background: var(--primary-soft);
      color: var(--primary-teal);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 20px auto;
      transition: transform 0.3s ease;
    }

    .service-card:hover .service-icon-box {
      transform: scale(1.1);
      background: var(--primary-teal);
      color: #ffffff;
    }

    .service-card h4 {
      font-weight: 700;
      font-size: 1.22rem;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .service-card p {
      font-size: 0.92rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .service-link {
      font-weight: 700;
      color: var(--primary-teal);
      text-decoration: none;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: gap 0.2s ease;
    }

    .service-card:hover .service-link {
      gap: 10px;
      color: var(--primary-dark);
    }

    /* Bottom 4 Promo Grid */
    .promo-section {
      padding: 40px 0 80px 0;
      background: #f8fafc;
    }

    .promo-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 28px 24px;
      border: 1px solid #e2e8f0;
      height: 100%;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .promo-card h5 {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .promo-price {
      font-size: 2.2rem;
      font-weight: 800;
      color: #f59e0b;
      line-height: 1;
      margin-bottom: 14px;
    }

    .feature-check-list {
      list-style: none;
      padding: 0;
      margin: 0 0 18px 0;
    }

    .feature-check-list li {
      font-size: 0.88rem;
      color: #334155;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feature-check-list li::before {
      content: "✓";
      color: var(--primary-teal);
      font-weight: 800;
    }

    /* Portales de Acceso Rápido (3 Roles) */
    .portals-section {
      background: linear-gradient(135deg, #096359 0%, #064039 100%);
      color: white;
      padding: 70px 0;
      border-radius: 28px;
      margin: 20px 0 60px 0;
    }

    .portal-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 26px 20px;
      backdrop-filter: blur(10px);
      text-align: center;
      transition: all 0.3s ease;
      height: 100%;
    }

    .portal-box:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-5px);
    }

    .portal-avatar-img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: 50%;
      background: white;
      padding: 4px;
      margin-bottom: 14px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
    }

    .btn-portal-go {
      background: white;
      color: var(--primary-dark) !important;
      font-weight: 700;
      border-radius: 10px;
      padding: 8px 20px;
      font-size: 0.9rem;
      border: none;
      display: inline-block;
      margin-top: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-portal-go:hover {
      background: var(--primary-soft);
      transform: scale(1.05);
    }

    /* Footer */
    .landing-footer {
      background-color: #0f172a;
      color: #94a3b8;
      padding: 40px 0 24px 0;
      font-size: 0.9rem;
    }

    .landing-footer a {
      color: #cbd5e1;
      text-decoration: none;
      transition: color 0.2s;
    }

    .landing-footer a:hover {
      color: var(--primary-teal);
    }

    @media (max-width: 991px) {
      .hero-title { font-size: 2.8rem; }
      .hero-section { text-align: center; }
      .hero-desc { margin: 0 auto 30px auto; }
      .hero-stats { justify-content: center; }
      .hero-image-wrap { margin-top: 40px; }
      .hero-bg-shape { width: 340px; height: 340px; right: 50%; transform: translate(50%, -50%); }
    }
  </style>
</head>

<body class="medical-landing">

  <!-- 1. Top Announcement Bar -->
  <div class="top-announcement d-none d-md-block">
    <div class="container d-flex justify-content-between align-items-center">
      <div>
        <span>💙 Tu Salud, Nuestra Prioridad</span>
        <span class="mx-2">•</span>
        <span>🕒 Atención inclusiva los 7 días de la semana</span>
      </div>
      
      <div class="d-flex align-items-center gap-3">
        <c:choose>
          <c:when test="${not empty sessionScope.usuarioLogueado}">
            <span class="text-success fw-bold small">
              👤 Conectado: <c:out value="${sessionScope.nombreCompleto}" /> (<c:out value="${sessionScope.rol}" />)
            </span>
            <a href="${pageContext.request.contextPath}/logout" class="btn btn-outline-danger btn-sm py-0 px-2" style="font-size:0.78rem;">Cerrar sesión</a>
          </c:when>
          <c:otherwise>
            <a href="IncluCita.html" class="text-secondary text-decoration-none fw-semibold">Portal Paciente</a>
            <a href="DoctorLogin.html" class="text-secondary text-decoration-none fw-semibold">Portal Médico</a>
            <a href="SecretariaLogin.html" class="text-secondary text-decoration-none fw-semibold">Administración</a>
          </c:otherwise>
        </c:choose>
      </div>
    </div>
  </div>

  <!-- 2. Navbar -->
  <nav class="navbar navbar-expand-lg navbar-medical">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2 text-decoration-none" href="pantallaPrincipal.jsp">
        <div class="brand-logo-circle">♡</div>
        <div>
          <div class="brand-name">IncluCita</div>
          <div class="brand-sub">Clínica & Citas Inclusivas</div>
        </div>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse justify-content-center" id="navMenu">
        <ul class="navbar-nav mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link nav-link-medical" href="pantallaPrincipal.jsp">Inicio</a></li>
          <li class="nav-item"><a class="nav-link nav-link-medical" href="#servicios">Especialidades</a></li>
          <li class="nav-item"><a class="nav-link nav-link-medical" href="#portales">Módulos</a></li>
          <li class="nav-item"><a class="nav-link nav-link-medical" href="#porque-nosotros">Nosotros</a></li>
        </ul>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-book-nav" onclick="location.href='IncluCita.html'">
          📅 Reservar Cita
        </button>
      </div>
    </div>
  </nav>

  <!-- 3. Hero Section (Inspirado 1:1 en VitalCare) -->
  <section class="hero-section">
    <div class="container">
      <div class="row align-items-center">
        
        <!-- Contenido Izquierdo -->
        <div class="col-lg-6 col-12">
          <div class="hero-badge">
            <span>🛡️</span> Atención de Confianza. Más Inclusiva.
          </div>

          <h1 class="hero-title">
            Tu Salud,<br>
            Nuestra <span class="accent-teal">Prioridad</span>
          </h1>

          <p class="hero-desc">
            Atención médica compasiva, especialistas calificados y tecnología inclusiva con asistencia por voz para que agendar tu cita sea simple y accesible para todos.
          </p>

          <div class="d-flex flex-wrap gap-3">
            <a href="IncluCita.html" class="btn-primary-hero">
              <span>📅</span> Reservar Cita
            </a>
            <a href="#servicios" class="btn-secondary-hero">
              Ver Especialidades
            </a>
          </div>

          <!-- Métricas de Impacto -->
          <div class="hero-stats">
            <div class="stat-pill">
              <div class="stat-pill-icon">👨‍⚕️</div>
              <div>
                <strong>15+</strong>
                <span>Médicos Especialistas</span>
              </div>
            </div>

            <div class="stat-pill">
              <div class="stat-pill-icon">😊</div>
              <div>
                <strong>10k+</strong>
                <span>Pacientes Atendidos</span>
              </div>
            </div>

            <div class="stat-pill">
              <div class="stat-pill-icon">🩺</div>
              <div>
                <strong>7+</strong>
                <span>Especialidades Activas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Imagen Derecha & Tarjeta Flotante -->
        <div class="col-lg-6 col-12 text-center hero-image-wrap">
          <div class="hero-bg-shape"></div>
          <img src="doctorpng.png" alt="Doctor Especialista IncluCita" class="hero-doctor-img img-fluid">

          <div class="hero-floating-card">
            <div class="floating-card-icon">🎧</div>
            <div class="text-start">
              <strong style="color:#0f172a; font-size:1.15rem; display:block; line-height:1;">24/7</strong>
              <small style="color:#64748b; font-weight:600;">Asistencia & Voz</small>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- 4. Sección Nuestros Servicios / Especialidades -->
  <section class="services-section" id="servicios">
    <div class="container">
      <div class="text-center mb-5">
        <span class="section-tag">Cuidado Especializado</span>
        <h2 class="section-title">Nuestras Especialidades</h2>
        <div class="title-line"></div>
        <p class="text-muted" style="max-width:600px; margin:0 auto;">
          Selecciona la especialidad de tu preferencia y reserva en menos de 2 minutos con validación oficial de DNI.
        </p>
      </div>

      <div class="row g-4">
        <!-- Cardiología -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="service-card">
            <div>
              <div class="service-icon-box">❤️</div>
              <h4>Cardiología</h4>
              <p>Diagnóstico cardiovascular integral, chequeo de presión y prevención cardíaca.</p>
            </div>
            <a href="IncluCita.html" class="service-link">Agendar Cita →</a>
          </div>
        </div>

        <!-- Medicina General -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="service-card">
            <div>
              <div class="service-icon-box">🩺</div>
              <h4>Medicina General</h4>
              <p>Atención médica primaria y preventiva para el cuidado integral de toda la familia.</p>
            </div>
            <a href="IncluCita.html" class="service-link">Agendar Cita →</a>
          </div>
        </div>

        <!-- Odontología -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="service-card">
            <div>
              <div class="service-icon-box">🦷</div>
              <h4>Odontología</h4>
              <p>Cuidado dental completo, profilaxis, prevención y tratamientos con especialistas.</p>
            </div>
            <a href="IncluCita.html" class="service-link">Agendar Cita →</a>
          </div>
        </div>

        <!-- Pediatría -->
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="service-card">
            <div>
              <div class="service-icon-box">👶</div>
              <h4>Pediatría</h4>
              <p>Atención pediátrica con calidez humana para el crecimiento y desarrollo infantil.</p>
            </div>
            <a href="IncluCita.html" class="service-link">Agendar Cita →</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. Sección de Acceso a Módulos (Pacientes, Médicos, Secretaria) -->
  <section class="container" id="portales">
    <div class="portals-section">
      <div class="container px-4">
        <div class="text-center mb-5">
          <h3 class="fw-bold" style="font-size:2.1rem;">Portales de Acceso al Sistema</h3>
          <p style="opacity:0.85;">Seleccione su perfil de ingreso según su rol</p>
        </div>

        <div class="row g-4 justify-content-center">
          <!-- Paciente -->
          <div class="col-12 col-md-4">
            <div class="portal-box">
              <img src="Usuario.png" alt="Portal Paciente" class="portal-avatar-img">
              <h4 class="fw-bold fs-5">Portal Paciente</h4>
              <p class="small text-white-50">Reserva de citas, consulta con DNI / SUNAT y emisión de tickets.</p>
              <a href="IncluCita.html" class="btn-portal-go">Acceder como Paciente →</a>
            </div>
          </div>

          <!-- Doctor -->
          <div class="col-12 col-md-4">
            <div class="portal-box">
              <img src="doctor.png" alt="Portal Médico" class="portal-avatar-img">
              <h4 class="fw-bold fs-5">Portal Médico</h4>
              <p class="small text-white-50">Control de agenda diaria, consulta de historial y diagnóstico clínico.</p>
              <a href="DoctorLogin.html" class="btn-portal-go">Acceder como Médico →</a>
            </div>
          </div>

          <!-- Secretaria -->
          <div class="col-12 col-md-4">
            <div class="portal-box">
              <img src="secretaria.png" alt="Portal Administrativo" class="portal-avatar-img">
              <h4 class="fw-bold fs-5">Secretaria / Admin</h4>
              <p class="small text-white-50">Administración de citas, reprogramaciones, médicos y dashboard.</p>
              <a href="SecretariaLogin.html" class="btn-portal-go">Acceder al Panel →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 6. Franja de Beneficios e Información Preventiva (4 Cuadros inferiores) -->
  <section class="promo-section" id="porque-nosotros">
    <div class="container">
      <div class="row g-4">

        <!-- Paquete Preventivo -->
        <div class="col-12 col-md-6 col-lg-3">
          <div class="promo-card">
            <div>
              <h5>Chequeo Preventivo</h5>
              <small class="text-muted d-block mb-2">Consulta general + Descarte</small>
              <div class="promo-price">S/ 49</div>
              <p class="small text-muted">Exámenes básicos de presión arterial, glucosa y evaluación médica integral.</p>
            </div>
            <a href="IncluCita.html" class="btn btn-outline-secondary btn-sm w-100 fw-bold">Ver Paquetes</a>
          </div>
        </div>

        <!-- Por qué elegirnos -->
        <div class="col-12 col-md-6 col-lg-3">
          <div class="promo-card">
            <div>
              <h5>¿Por qué IncluCita?</h5>
              <ul class="feature-check-list">
                <li>Médicos certificados</li>
                <li>Asistencia por voz</li>
                <li>Soporte Quechua / Español</li>
                <li>Validación SUNAT / RENIEC</li>
              </ul>
            </div>
            <a href="#servicios" class="btn btn-outline-secondary btn-sm w-100 fw-bold">Conocer Más</a>
          </div>
        </div>

        <!-- Cuidado hoy -->
        <div class="col-12 col-md-6 col-lg-3">
          <div class="promo-card">
            <div>
              <h5>Cuida tu salud hoy</h5>
              <p class="small text-muted">
                Un diagnóstico a tiempo previene complicaciones mayores. Agenda con tu médico en cualquier momento.
              </p>
            </div>
            <a href="IncluCita.html" class="btn btn-book-nav btn-sm w-100 text-center">Reservar Ahora</a>
          </div>
        </div>

        <!-- Emergencias y Contacto -->
        <div class="col-12 col-md-6 col-lg-3">
          <div class="promo-card">
            <div>
              <span class="badge bg-danger mb-2">Urgencias</span>
              <h5>Estamos para ti</h5>
              <p class="small text-muted">
                Línea médica directa para orientación ambulatoria y soporte de citas.
              </p>
              <strong class="text-primary fs-5 d-block mt-2">📞 (01) 234-5678</strong>
            </div>
            <a href="IncluCita.html" class="btn btn-outline-primary btn-sm w-100 fw-bold mt-3">Ayuda en Línea</a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- 7. Footer Oficial -->
  <footer class="landing-footer">
    <div class="container text-center">
      <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
        <span style="font-size:1.4rem; color:var(--primary-teal);">♡</span>
        <strong class="text-white fs-5">IncluCita</strong>
      </div>
      <p class="small mb-3" style="max-width:500px; margin:0 auto;">
        Plataforma médica inclusiva orientada a la accesibilidad universal, soporte bilingüe y gestión eficiente de la salud.
      </p>
      <hr style="border-color:#334155; max-width:800px; margin:20px auto;">
      <p class="small text-secondary mb-0">
        © 2026 IncluCita - Todos los derechos reservados. Desarrollado con Java EE, Jakarta Servlets, JSP y MySQL.
      </p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
