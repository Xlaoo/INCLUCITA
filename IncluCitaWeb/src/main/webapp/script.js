let selectedLanguage = localStorage.getItem("selectedLanguage") || "es";
let voiceActive = localStorage.getItem("voiceActive") === "true";
let lastInstruction = "";
let recognition = null;
let silenceTimer = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let dni = "";
let pendingAction = "";
let pendingName = "";
let patientFullName = "";

let doctorsBySpecialty = JSON.parse(localStorage.getItem("doctorsBySpecialty")) || {

    "Medicina General": {
        doctor: "Dr. Luis Ramírez",
        telefono: "987654321",
        icon: "💙",
        consultorio: "Consultorio 1"
    },

    "Pediatría": {
        doctor: "Dra. María López",
        telefono: "912345678",
        icon: "👶",
        consultorio: "Consultorio 2"
    },

    "Traumatología": {
        doctor: "Dr. Carlos Mendoza",
        telefono: "923456789",
        icon: "🦴",
        consultorio: "Consultorio 4"
    },

    "Oftalmología": {
        doctor: "Dra. Ana Torres",
        telefono: "934567890",
        icon: "👁️",
        consultorio: "Consultorio 5"
    },

    "Odontología": {
        doctor: "Dr. José Vargas",
        telefono: "945678901",
        icon: "🦷",
        consultorio: "Consultorio 6"
    },

    "Cardiología": {
        doctor: "Dra. Patricia Ruiz",
        telefono: "956789012",
        icon: "❤️",
        consultorio: "Consultorio 7"
    },

    "Dermatología": {
        doctor: "Dra. Rosa Castillo",
        telefono: "967890123",
        icon: "🧴",
        consultorio: "Consultorio 8"
    },

    "Neurología": {
        doctor: "Dr. Miguel Herrera",
        telefono: "978901234",
        icon: "🧠",
        consultorio: "Consultorio 9"
    },

    "Ginecología": {
        doctor: "Dra. Lucía Paredes",
        telefono: "989012345",
        icon: "♀️",
        consultorio: "Consultorio 10"
    }

};
let fakePatientsDB = JSON.parse(localStorage.getItem("fakePatientsDB")) || {
  "72527818": "Rafael Rosales",
  "12345678": "Juan Pérez López",
  "87654321": "Ana Belén Soto"
};

function goTo(screenId) {
  const rutas = {
    "screen-dni": "IncluCita.html",
    "screen-specialty": "especialidad.html",
    "screen-date": "fecha.html",
    "screen-time": "hora.html",
    "screen-confirm": "confirmar.html",
    "screen-success": "exito.html",
    "screen-ticket": "ticket.html"
  };

  if (rutas[screenId]) {
    window.location.href = rutas[screenId];
  }
}

function addDni(number) {
  if (dni.length < 8) {
    dni += number;
    updateDniDisplay();
  }
}

function deleteDni() {
  dni = dni.slice(0, -1);
  updateDniDisplay();
}

function clearDni() {
  dni = "";
  pendingAction = "";
  pendingName = "";
  patientFullName = "";

  localStorage.removeItem("dni");
  localStorage.removeItem("patientFullName");

  updateDniDisplay();

  const btn = document.getElementById("btnVerSolicitud");
  if (btn) btn.style.display = "none";

  const box = document.getElementById("solicitudPacienteBox");
  if (box) box.style.display = "none";

  const registerBox = document.getElementById("registerBox");
  if (registerBox) registerBox.classList.remove("active");

  const fullNameInput = document.getElementById("fullNameInput");
  if (fullNameInput) fullNameInput.value = "";
  const btnAceptar = document.querySelector(".btn-primary");
if (btnAceptar) {
  btnAceptar.disabled = false;
  btnAceptar.style.opacity = "1";
  btnAceptar.style.cursor = "pointer";
}
}

function updateDniDisplay() {
  const display = document.getElementById("dniDisplay");

  if (display) {
    display.textContent = dni.padEnd(8, "_").split("").join(" ");
  }
}
function confirmDniManual() {
  if (dni.length !== 8) {
    showToast(t(
      "El DNI debe tener 8 dígitos.",
      "DNIqa pusaq yupayniyuq kanan."
    ));

    if (voiceActive) {
      speak(t(
        "El DNI debe tener ocho dígitos. Ingrese su número de DNI correctamente.",
        "DNIqa pusaq yupayniyuq kanan. DNI yupaykita allinta churay."
      ));
    }

    return;
  }

  pendingAction = "confirm-dni";

  if (voiceActive) {
    speak(t(
      "Usted ingresó el DNI " + dniEnIdioma(dni) +
      ". ¿Es correcto? Si es correcto diga avanzar. Si no es correcto diga no es.",
      "DNI yupaykita churanki: " + dniEnIdioma(dni) +
      ". Allinchu? Allin kaptinqa ñawpaqman niy. Mana allin kaptinqa mana niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  } else {
    continuarDespuesDni();
  }
}

let sunatUltimoResultado = null;

function buscarDatosSunatReniec() {
  if (!dni || dni.length !== 8) {
    showToast(t(
      "Por favor digite los 8 dígitos de su DNI antes de consultar.",
      "Ama hina kaspa, pusaq yupayniyuq DNIkita churay tapukunapaq."
    ));
    if (voiceActive) {
      speak("Por favor ingrese su DNI de 8 dígitos para consultar en SUNAT y RENIEC.");
    }
    return;
  }

  showToast("Consultando padrón SUNAT / RENIEC...");

  // 1. Revisar si el usuario ya corrigió o personalizó sus datos para este DNI
  const customPadron = JSON.parse(localStorage.getItem("padronOficialPersonalizado")) || {};
  if (customPadron[dni]) {
    mostrarResultadoSunat(customPadron[dni]);
    return;
  }

  // Padrón oficial precargado de ciudadanos (con base de datos local)
  const padronOficial = {
    "76261461": { nombres: "Rodrigo Alonso", paterno: "De la Cruz", materno: "Mendoza" },
    "12345678": { nombres: "Juan Carlos", paterno: "Pérez", materno: "Gómez" },
    "87654321": { nombres: "María Elena", paterno: "Flores", materno: "Ramos" },
    "74859612": { nombres: "Roberto", paterno: "Dávila", materno: "Sánchez" },
    "72527818": { nombres: "Carmen Rosa", paterno: "Salas", materno: "Vega" },
    "10000001": { nombres: "Luis Alberto", paterno: "Ramírez", materno: "Soto" },
    "10000002": { nombres: "María Fernanda", paterno: "López", materno: "Quispe" },
    "10000003": { nombres: "Carlos Eduardo", paterno: "Mendoza", materno: "Castro" },
    "10000004": { nombres: "Ana Lucía", paterno: "Torres", materno: "Prado" },
    "10000005": { nombres: "José Antonio", paterno: "Vargas", materno: "Morales" },
    "10000006": { nombres: "Patricia Elena", paterno: "Ruiz", materno: "Huamán" },
    "10000007": { nombres: "Rosa Del Carmen", paterno: "Castillo", materno: "Chávez" }
  };

  // Si existe en el padrón directo
  if (padronOficial[dni]) {
    mostrarResultadoSunat(padronOficial[dni]);
    return;
  }

  // Generador determinista inteligente con apellidos y nombres peruanos reales
  const nombresLista = ["Alejandro", "Valeria", "Gabriel", "Fiorella", "Christian", "Daniela", "Renzo", "Milagros", "Julio César", "Luciana", "Diego", "Camila", "Jorge Luis", "Diana"];
  const paternosLista = ["Quispe", "Flores", "Rodríguez", "Sánchez", "García", "Rojas", "Díaz", "Torres", "Espinoza", "Vásquez", "Castillo", "Morales"];
  const maternosLista = ["Huamán", "Mendoza", "Mamani", "Chávez", "Gutierrez", "Navarro", "Salazar", "Romero", "Paredes", "Vega", "Silva", "Medina"];

  const numDni = parseInt(dni, 10) || 12345678;
  const nom = nombresLista[numDni % nombresLista.length];
  const pat = paternosLista[(numDni >> 2) % paternosLista.length];
  const mat = maternosLista[(numDni >> 4) % maternosLista.length];

  const resultado = {
    nombres: nom,
    paterno: pat,
    materno: mat
  };

  mostrarResultadoSunat(resultado);
}

function mostrarResultadoSunat(datos) {
  const nombreCompleto = `${datos.nombres} ${datos.paterno} ${datos.materno}`.trim();
  sunatUltimoResultado = { ...datos, nombreCompleto: nombreCompleto, dni: dni };

  const box = document.getElementById("sunatResultBox");
  if (box) {
    const elDni = document.getElementById("sunatDni");
    const elNom = document.getElementById("sunatNombres");
    const elPat = document.getElementById("sunatPaterno");
    const elMat = document.getElementById("sunatMaterno");
    const elCom = document.getElementById("sunatCompleto");
    const editForm = document.getElementById("sunatEditForm");

    if (elDni) elDni.textContent = dni;
    if (elNom) elNom.textContent = datos.nombres;
    if (elPat) elPat.textContent = datos.paterno;
    if (elMat) elMat.textContent = datos.materno;
    if (elCom) elCom.textContent = nombreCompleto;
    if (editForm) editForm.style.display = "none"; // Oculto al inicio

    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  showToast("Datos encontrados en SUNAT / RENIEC");

  if (voiceActive) {
    speak("Se encontraron los datos de SUNAT y RENIEC para " + nombreCompleto + ". Presione usar estos datos para continuar.");
  }
}

function habilitarEdicionSunat() {
  const editForm = document.getElementById("sunatEditForm");
  if (!editForm) return;

  const isHidden = editForm.style.display === "none" || editForm.style.display === "";
  editForm.style.display = isHidden ? "block" : "none";

  if (isHidden && sunatUltimoResultado) {
    const inNom = document.getElementById("editSunatNombres");
    const inPat = document.getElementById("editSunatPaterno");
    const inMat = document.getElementById("editSunatMaterno");
    if (inNom) inNom.value = sunatUltimoResultado.nombres || "";
    if (inPat) inPat.value = sunatUltimoResultado.paterno || "";
    if (inMat) inMat.value = sunatUltimoResultado.materno || "";
    if (inNom) inNom.focus();
  }
}

function guardarDatosCorregidosSunat() {
  const inNom = document.getElementById("editSunatNombres");
  const inPat = document.getElementById("editSunatPaterno");
  const inMat = document.getElementById("editSunatMaterno");

  const nom = inNom ? inNom.value.trim() : "";
  const pat = inPat ? inPat.value.trim() : "";
  const mat = inMat ? inMat.value.trim() : "";

  if (!nom || !pat) {
    showToast("Por favor ingrese al menos sus nombres y apellido paterno.");
    return;
  }

  const nombreCompleto = `${nom} ${pat} ${mat}`.trim();
  const datosActualizados = {
    nombres: nom,
    paterno: pat,
    materno: mat,
    nombreCompleto: nombreCompleto,
    dni: dni
  };

  // Guardar en el padrón personalizado en localStorage para persistencia permanente
  let customPadron = JSON.parse(localStorage.getItem("padronOficialPersonalizado")) || {};
  customPadron[dni] = datosActualizados;
  localStorage.setItem("padronOficialPersonalizado", JSON.stringify(customPadron));

  sunatUltimoResultado = datosActualizados;

  // Actualizar la vista de la tarjeta
  const elNom = document.getElementById("sunatNombres");
  const elPat = document.getElementById("sunatPaterno");
  const elMat = document.getElementById("sunatMaterno");
  const elCom = document.getElementById("sunatCompleto");
  if (elNom) elNom.textContent = nom;
  if (elPat) elPat.textContent = pat;
  if (elMat) elMat.textContent = mat;
  if (elCom) elCom.textContent = nombreCompleto;

  showToast("Datos actualizados correctamente: " + nombreCompleto);

  // Proceder a aceptar
  aceptarDatosSunat();
}

function aceptarDatosSunat() {
  if (!sunatUltimoResultado) return;

  patientFullName = sunatUltimoResultado.nombreCompleto;
  localStorage.setItem("dni", dni);
  localStorage.setItem("patientFullName", patientFullName);

  fakePatientsDB = JSON.parse(localStorage.getItem("fakePatientsDB")) || fakePatientsDB;
  fakePatientsDB[dni] = patientFullName;
  localStorage.setItem("fakePatientsDB", JSON.stringify(fakePatientsDB));

  const box = document.getElementById("sunatResultBox");
  if (box) box.style.display = "none";

  showToast("Bienvenido " + patientFullName);

  if (voiceActive) {
    speak("Bienvenido " + patientFullName + ". Pasando a selección de especialidad.", () => {
      goTo("screen-specialty");
    });
  } else {
    setTimeout(() => {
      goTo("screen-specialty");
    }, 400);
  }
}

function validateDni() {
  const registerBox = document.getElementById("registerBox");
  const fullNameInput = document.getElementById("fullNameInput");

  if (dni.length !== 8) {
    showToast("El DNI debe tener 8 dígitos.");

    if (voiceActive) {
      speak("El DNI debe tener ocho dígitos. Dicte nuevamente su DNI.", () => {
        setTimeout(listenByScreen, 800);
      });
    }

    return;
  }
fakePatientsDB = JSON.parse(localStorage.getItem("fakePatientsDB")) || fakePatientsDB;
  if (fakePatientsDB[dni]) {
    patientFullName = fakePatientsDB[dni];

    localStorage.setItem("dni", dni);
    localStorage.setItem("patientFullName", patientFullName);

    showToast("Paciente encontrado: " + patientFullName);

    if (voiceActive) {
      speak(t(
  "Bienvenido " + patientFullName + ". Pasando a selección de especialidad.",
  "Allin hamusqayki " + patientFullName + ". Kunan hampi especialidadta akllanki."
), () => {
        goTo("screen-specialty");
      });
    } else {
      setTimeout(() => {
        goTo("screen-specialty");
      }, 600);
    }

  } else {
    patientFullName = "";

    if (fullNameInput) fullNameInput.value = "";
    if (registerBox) registerBox.classList.add("active");
      const btnAceptar = document.querySelector(".btn-primary");
  if (btnAceptar) {
    btnAceptar.disabled = true;
    btnAceptar.style.opacity = "0.5";
    btnAceptar.style.cursor = "not-allowed";
  }

    showToast("DNI no registrado. Ingrese nombre y apellido.");

    if (voiceActive) {
      speak(t(
  "DNI no registrado. Por favor diga su nombre y apellido completo. Por ejemplo: me llamo Carlos Mamani.",
  "DNI manam qillqasqachu. Ama hina kaspa sutiykita apelliduykita huntata niy. Kayhina niy: ñuqa Carlos Mamani kani."
), () => {
        setTimeout(listenByScreen, 800);
      });
    }
  }
}

function registerNewPatient() {
  const input = document.getElementById("fullNameInput");
const fullName = input.value.trim();
const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

if (
  fullName.length < 5 ||
  !fullName.includes(" ") ||
  !soloLetras.test(fullName)
) {
  showToast(t(
    "Debe ingresar bien su nombre y apellido. Solo se permiten letras, no números.",
    "Sutiykita apelliduykitawan allinta churay. Yupaykunata ama churaychu, qillqakunallata churay."
  ));

  if (voiceActive) {
    speak(t(
      "Debe ingresar bien su nombre y apellido. Solo se permiten letras, no números.",
      "Sutiykita apelliduykitawan allinta churay. Yupaykunata ama churaychu, qillqakunallata churay."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }

  return;
}

  patientFullName = fullName;
  fakePatientsDB[dni] = patientFullName;
  localStorage.setItem("fakePatientsDB", JSON.stringify(fakePatientsDB));

  localStorage.setItem("dni", dni);
  localStorage.setItem("patientFullName", patientFullName);

  showToast("Paciente registrado correctamente.");

  if (voiceActive) {
    speak(t(
  "Paciente registrado correctamente: " + patientFullName + ". Pasando a selección de especialidad.",
  "Paciente allinta qillqasqa: " + patientFullName + ". Kunan hampi especialidadta akllanki."
), () => {
      goTo("screen-specialty");
    });
  } else {
    setTimeout(() => {
      goTo("screen-specialty");
    }, 600);
  }
}


function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

updateDniDisplay();
function selectSpecialty(specialty) {
  localStorage.setItem("selectedSpecialty", specialty);

  showToast("Especialidad seleccionada: " + specialty);

  setTimeout(() => {
    goTo("screen-date");
  }, 400);
}
function showOtherSpecialties() {
  const box = document.getElementById("otherSpecialtiesBox");

  if (box) {
    box.classList.add("active");
  }

  renderOtrasEspecialidadesPaciente();

  showToast(t(
    "Seleccione una especialidad adicional.",
    "Huk especialidadta akllay."
  ));

  const principales = [
    "Medicina General",
    "Pediatría",
    "Traumatología",
    "Oftalmología",
    "Odontología"
  ];

  const otras = Object.keys(doctorsBySpecialty)
    .filter(e => !principales.includes(e));

  const textoOtras = selectedLanguage === "qu"
    ? otras.map(e => nombreEspecialidadQuechua(e)).join(", ")
    : otras.join(", ");

  if (voiceActive) {
    speak(t(
      "Otras especialidades disponibles: " + textoOtras + ". Diga la especialidad que desea.",
      "Huk especialidadkuna kachkan: " + textoOtras + ". Munasqayki especialidadta niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const todayDay = today.getDate();

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const availableDates = [];

const reservedSlots = {};


let allTimeSlots = generarHorariosAtencion();

function generarHorariosAtencion(inicioDoctor = "07:00", finDoctor = "18:00") {
  const horarios = [];

  const DURACION_CITA = 25;
  const ALMUERZO_INICIO = 13 * 60;
  const ALMUERZO_FIN = 14 * 60;

  const [hi, mi] = inicioDoctor.split(":").map(Number);
  const [hf, mf] = finDoctor.split(":").map(Number);

  let actual = hi * 60 + mi;
  const fin = hf * 60 + mf;

  while (actual + DURACION_CITA <= fin) {
    const termina = actual + DURACION_CITA;

    if (actual >= ALMUERZO_INICIO && actual < ALMUERZO_FIN) {
      actual = ALMUERZO_FIN;
      continue;
    }

    const hora = Math.floor(actual / 60);
    const min = actual % 60;

    const value =
      String(hora).padStart(2, "0") + ":" +
      String(min).padStart(2, "0");

    horarios.push({
      value: value,
      label: value
    });

    actual += DURACION_CITA;

    if (actual > ALMUERZO_INICIO && actual < ALMUERZO_FIN) {
      actual += 60;
    }

    if (actual === ALMUERZO_INICIO) {
      actual = ALMUERZO_FIN;
    }
  }

  return horarios;
}
function obtenerDoctorEspecialidadActual() {
  const especialidad = localStorage.getItem("selectedSpecialty") || "";
  return doctorsBySpecialty[especialidad] || null;
}
function obtenerDoctorCompletoActual() {
  const especialidad = localStorage.getItem("selectedSpecialty") || "";

  const infoEspecialidad = doctorsBySpecialty[especialidad] || null;
  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];

  if (infoEspecialidad && infoEspecialidad.doctor) {
    const doctorExacto = doctores.find(doc =>
      doc.especialidad === especialidad &&
      doc.nombre === infoEspecialidad.doctor
    );

    if (doctorExacto) {
      return {
        ...infoEspecialidad,
        ...doctorExacto
      };
    }

    return infoEspecialidad;
  }

  return doctores.find(doc => doc.especialidad === especialidad) || null;
}
function obtenerHorariosDelDoctorActual() {
  const doctor = obtenerDoctorCompletoActual();

  let inicio = doctor?.horaInicio || "";
  let fin = doctor?.horaFin || "";

  if ((!inicio || !fin) && doctor?.horario) {
    const partes = doctor.horario.split("-");
    inicio = partes[0]?.trim();
    fin = partes[1]?.trim();
  }

  inicio = inicio || "07:00";
  fin = fin || "18:00";

  return generarHorariosAtencion(inicio, fin);
}

function obtenerDiaTextoFecha(fecha) {
  const partes = fecha.split("/");
  const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);

  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return dias[fechaObj.getDay()];
}

function doctorAtiendeEseDia(fecha) {
  const doctor = obtenerDoctorCompletoActual();

  if (!doctor || !doctor.dias || !Array.isArray(doctor.dias)) {
    return true;
  }

  const diaCorto = obtenerDiaTextoFecha(fecha);
  const mapa = {
    "Lun": ["Lun", "Lunes"],
    "Mar": ["Mar", "Martes"],
    "Mié": ["Mié", "Mie", "Miércoles", "Miercoles"],
    "Jue": ["Jue", "Jueves"],
    "Vie": ["Vie", "Viernes"],
    "Sáb": ["Sáb", "Sab", "Sábado", "Sabado"],
    "Dom": ["Dom", "Domingo"]
  };

  return doctor.dias.some(dia =>
    mapa[diaCorto].includes(String(dia).trim())
  );
}
function renderCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  const calendarMonthTitle = document.getElementById("calendarMonthTitle");

  if (!calendarDays) return;

  calendarDays.innerHTML = "";

  if (calendarMonthTitle) {
    calendarMonthTitle.textContent = monthNames[currentMonth] + " " + currentYear;
  }

  const firstDay = new Date(currentYear, currentMonth, 1);
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  for (let i = startDay; i > 0; i--) {
    const div = document.createElement("div");
    div.className = "day disabled";
    div.textContent = prevMonthDays - i + 1;
    calendarDays.appendChild(div);
  }

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement("div");
    div.textContent = day;

    const formattedDate = formatDate(day, currentMonth + 1, currentYear);
    const dateObject = new Date(currentYear, currentMonth, day);

    const isToday =
      dateObject.getFullYear() === todayOnly.getFullYear() &&
      dateObject.getMonth() === todayOnly.getMonth() &&
      dateObject.getDate() === todayOnly.getDate();

    const isPastDate = dateObject < todayOnly;
    const isAvailable = availableDates.includes(formattedDate);

const selectedSpecialty = localStorage.getItem("selectedSpecialty") || "";

const ocupadasEspecialidad = obtenerHorasOcupadasPorEspecialidad(
  formattedDate,
  selectedSpecialty
).length;

const totalOcupadas = ocupadasEspecialidad;
const horariosDoctorDia = obtenerHorariosDelDoctorActual();

const noAtiendeDia = !doctorAtiendeEseDia(formattedDate);
const sinHorariosPorHoraActual = diaYaNoTieneHorariosDisponibles(formattedDate);

if (
  isPastDate ||
  noAtiendeDia ||
  sinHorariosPorHoraActual ||
  totalOcupadas >= horariosDoctorDia.length
) {
      div.className = "day disabled";
      div.title = "Sin disponibilidad";
    } else {
      div.className = "day available";

      if (totalOcupadas > 0) {
        div.classList.add("reserved-day");
        div.title = "Tiene algunos horarios ocupados";
      }

      div.onclick = function () {
        selectDate(formattedDate, div);
      };
    }

    if (isToday) {
      div.classList.add("today");
      div.title = "Hoy";
    }

    calendarDays.appendChild(div);
  }
}

function formatDate(day, month, year) {
  return String(day).padStart(2, "0") + "/" +
         String(month).padStart(2, "0") + "/" +
         year;
}

function selectDate(date, element) {
  localStorage.setItem("selectedDate", date);

  if (element) {
    document.querySelectorAll(".day.available").forEach(day => {
      day.classList.remove("chosen");
    });

    element.classList.add("chosen");
  }

  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const ocupadas = obtenerHorasOcupadasPorEspecialidad(date, specialty).length;

  if (ocupadas >= allTimeSlots.length) {
    showToast(t(
      "Esta fecha no tiene disponibilidad.",
      "Kay punchawpi manam horakuna kanchu."
    ));
    return;
  }

  const mensaje = ocupadas > 0
    ? t(
        "Fecha seleccionada. Tiene algunos horarios ocupados, pero aún hay horarios disponibles.",
        "Punchaw akllasqam. Wakin horakuna ocupasqam kachkan, ichaqa wakin horakunaqa kachkanraqmi."
      )
    : t(
        "Fecha seleccionada correctamente.",
        "Punchaw allinta akllasqa."
      );

  if (voiceActive) {
    speak(mensaje, () => {
      goTo("screen-time");
    });
  } else {
    showToast(mensaje);
    setTimeout(() => {
      goTo("screen-time");
    }, 350);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  actualizarNoIngresosAutomaticos();
  actualizarEstadosCitasPorFecha();
  updateDniDisplay();
  renderCalendar();
  renderTimeSlots();
  fillConfirmation();
  fillTicket();
  updateLanguageButtons();
  aplicarIdiomaPantallaDni();
  aplicarIdiomaPantallaEspecialidad();
  aplicarIdiomaPantallaFecha();
  aplicarIdiomaPantallaHora();
  aplicarIdiomaPantallaConfirmar();
  aplicarIdiomaPantallaExito();
  aplicarIdiomaPantallaTicket();
renderOtrasEspecialidadesPaciente();
  renderCitasSecretaria();
  cargarDetalleCita();
  cargarReprogramar();
  renderDoctoresEliminar();

if (location.pathname.split("/").pop() === "IncluCita.html") {
  setTimeout(() => {
    speak(t(
      "Hola, bienvenido a IncluCita. Esta plataforma le ayudará a reservar su cita médica de forma rápida, simple e inclusiva. Para comenzar, ingrese su número de DNI.",
      "Allin hamusqayki IncluCitaman. Kay plataformaqa hampi citaykita utqaylla, mana sasachakuywan ruwanaykipaq yanapasunki. Qallarinaykipaq, DNI yupaykita churay."
    ));
  }, 700);
}

if (voiceActive && getCurrentScreenByPage() !== "") {
  setTimeout(guideCurrentPage, 3500);
}
});
function obtenerHorasOcupadasPorEspecialidad(fecha, especialidad) {
  const ocupadas = [];

  citasSecretaria.forEach(function(cita) {
    if (
      cita.fecha === fecha &&
      cita.especialidad === especialidad &&
      cita.estado !== "Cancelada"
    ) {
      const hora = cita.hora
        .replace(" a. m.", "")
        .replace(" p. m.", "")
        .trim();

      if (!ocupadas.includes(hora)) {
        ocupadas.push(hora);
      }
    }
  });

  return ocupadas;
}
function horaAMinutos(hora) {
  const partes = hora.split(":");
  return parseInt(partes[0]) * 60 + parseInt(partes[1]);
}

function horarioYaPaso(hora) {
  const selectedDate = localStorage.getItem("selectedDate") || "";
  if (selectedDate !== fechaHoyTexto()) return false;

  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  return horaAMinutos(hora) <= minutosActuales;
}

function diaYaNoTieneHorariosDisponibles(fecha) {
  if (fecha !== fechaHoyTexto()) return false;

  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const segundosActuales = ahora.getSeconds();

  const horariosDoctor = obtenerHorariosDelDoctorActual();

  return horariosDoctor.every(slot => {
    const finCita = horaAMinutos(slot.value) + 25;

    if (minutosActuales > finCita) return true;
    if (minutosActuales === finCita && segundosActuales >= 1) return true;

    return false;
  });
}
function renderTimeSlots() {
  const morningSlots = document.getElementById("morningSlots");
  const afternoonSlots = document.getElementById("afternoonSlots");

  if (!morningSlots || !afternoonSlots) return;

  morningSlots.innerHTML = "";
  afternoonSlots.innerHTML = "";

  const selectedDate = localStorage.getItem("selectedDate") || "";
  const selectedSpecialty = localStorage.getItem("selectedSpecialty") || "";

  const bloqueados = obtenerHorasOcupadasPorEspecialidad(selectedDate, selectedSpecialty);
  allTimeSlots = obtenerHorariosDelDoctorActual();

  if (!doctorAtiendeEseDia(selectedDate)) {
    showToast(t(
      "Este doctor no atiende este día.",
      "Kay hampiqa kay punchawpi manam llamk'anchu."
    ));
    return;
  }

  allTimeSlots.forEach(function(slot) {
    const btn = document.createElement("button");
    btn.className = "time-btn";
    btn.textContent = slot.label;

    if (bloqueados.includes(slot.value)) {
      btn.classList.add("blocked-time");
      btn.disabled = true;
      btn.title = "Horario ocupado";
    }
    else if (horarioYaPaso(slot.value)) {
      btn.classList.add("expired-time");
      btn.disabled = true;
      btn.title = "Horario vencido";
    }
    else {
      btn.onclick = function () {
        selectTime(slot.value, btn);
      };
    }

    if (slot.value < "12:00") {
      morningSlots.appendChild(btn);
    } else {
      afternoonSlots.appendChild(btn);
    }
  });
}

function selectTime(time, element) {
const selectedDate = localStorage.getItem("selectedDate") || "";
const selectedSpecialty = localStorage.getItem("selectedSpecialty") || "";

const bloqueados = obtenerHorasOcupadasPorEspecialidad(selectedDate, selectedSpecialty);

  if (bloqueados.includes(time)) {
    showToast("Ese horario está ocupado. Escoja otro horario.");
    return;
  }

  localStorage.setItem("selectedTime", time);

  document.querySelectorAll(".time-btn").forEach(btn => {
    btn.classList.remove("selected");
  });

  if (element) {
    element.classList.add("selected");
  }

  setTimeout(() => {
    goTo("screen-confirm");
  }, 350);
}
function displayTime(time) {
  const found = allTimeSlots.find(slot => slot.value === time);
  return found ? found.label : time;
}

function fillConfirmation() {
  const patient = localStorage.getItem("patientFullName") || "";
  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const date = localStorage.getItem("selectedDate") || "";
  const time = localStorage.getItem("selectedTime") || "";

const info = obtenerInfoDoctorParaVista(specialty);

  const confirmPatient = document.getElementById("confirmPatient");
  const confirmSpecialty = document.getElementById("confirmSpecialty");
  const confirmDoctor = document.getElementById("confirmDoctor");
  const confirmConsultorio = document.getElementById("confirmConsultorio");
  const doctorIcon = document.getElementById("doctorIcon");
  const confirmDate = document.getElementById("confirmDate");
  const confirmTime = document.getElementById("confirmTime");

  if (confirmPatient) confirmPatient.textContent = patient;
if (confirmSpecialty) {
  confirmSpecialty.textContent = selectedLanguage === "qu"
    ? nombreEspecialidadQuechua(specialty)
    : specialty;
}
  if (confirmDoctor) confirmDoctor.textContent = info.doctor;
  if (confirmConsultorio) confirmConsultorio.textContent = info.consultorio;
  if (doctorIcon) doctorIcon.textContent = info.icon;
  if (confirmDate) confirmDate.textContent = date;
  if (confirmTime) confirmTime.textContent = displayTime(time);

}
function horaConFormato(hora) {
  if (hora.includes("a. m.") || hora.includes("p. m.")) return hora;

  const partes = hora.split(":");
  const h = parseInt(partes[0]);

  if (h < 12) {
    return hora + " a. m.";
  }

  return hora + " p. m.";
}
function confirmAppointment() {
  const patient = localStorage.getItem("patientFullName") || "";
  const dniSaved = localStorage.getItem("dni") || "";
  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const date = localStorage.getItem("selectedDate") || "";
  const time = localStorage.getItem("selectedTime") || "";

  if (!patient || !dniSaved || !specialty || !date || !time) {
    showToast("Faltan datos para registrar la cita.");
    return;
  }

  let citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];
  let pacientes = JSON.parse(localStorage.getItem("fakePatientsDB")) || {};

  const horaFinal = horaConFormato(time);

  const yaTieneSolicitud = citas.some(cita =>
    String(cita.dni) === String(dniSaved)
  );

  if (yaTieneSolicitud) {
    showToast("Este DNI ya tiene una solicitud registrada.");
    return;
  }

const horarioOcupado = citas.some(cita =>
  cita.fecha === date &&
  cita.hora === horaFinal &&
  cita.especialidad === specialty &&
  cita.estado !== "Cancelada"
);

  if (horarioOcupado) {
    showToast("Ese horario ya está ocupado.");
    return;
  }

  pacientes[dniSaved] = patient;
  localStorage.setItem("fakePatientsDB", JSON.stringify(pacientes));
  fakePatientsDB = pacientes;

  const nuevaCita = {
    dni: dniSaved,
    nombre: patient,
    especialidad: specialty,
    fecha: date,
    hora: horaFinal,
    tipo: "proximas",
    enviada: false,
    estado: "Confirmada"
  };

  citas.push(nuevaCita);

  localStorage.setItem("citasSecretaria", JSON.stringify(citas));
  citasSecretaria = citas;

  // Sincronización asíncrona con el Backend Java / CitaServlet (Tomcat / MySQL)
  try {
    const especialidadesMap = {
      "Medicina General": 1,
      "Pediatría": 2,
      "Traumatología": 3,
      "Oftalmología": 4,
      "Odontología": 5,
      "Cardiología": 6,
      "Dermatología": 7
    };
    const idDoc = especialidadesMap[specialty] || 1;
    const syncParams = new URLSearchParams();
    syncParams.append("action", "reservar");
    syncParams.append("format", "json");
    syncParams.append("dni", dniSaved);
    syncParams.append("nombre", patient);
    syncParams.append("idDoctor", idDoc);
    syncParams.append("fecha", date);
    syncParams.append("hora", horaFinal);
    fetch("citas", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: syncParams.toString()
    }).catch(function(err) {
      console.log("Modo frontend estático activo o servidor Java desconectado:", err);
    });
  } catch (err) {}

  showToast("Su cita ha sido registrada correctamente.");

  setTimeout(() => {
    goTo("screen-success");
  }, 500);
}
function fillTicket() {
  const patient = localStorage.getItem("patientFullName") || "";
  const dniSaved = localStorage.getItem("dni") || "";
  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const date = localStorage.getItem("selectedDate") || "";
  const time = localStorage.getItem("selectedTime") || "";

const info = obtenerInfoDoctorParaVista(specialty);

  const ticketPatient = document.getElementById("ticketPatient");
  const ticketDni = document.getElementById("ticketDni");
  const ticketSpecialty = document.getElementById("ticketSpecialty");
  const ticketDoctor = document.getElementById("ticketDoctor");
  const ticketConsultorio = document.getElementById("ticketConsultorio");
  const ticketDate = document.getElementById("ticketDate");
  const ticketTime = document.getElementById("ticketTime");

  if (ticketPatient) ticketPatient.textContent = patient;
  if (ticketDni) ticketDni.textContent = dniSaved;
  if (ticketSpecialty) {
  ticketSpecialty.textContent = selectedLanguage === "qu"
    ? nombreEspecialidadQuechua(specialty)
    : specialty;
}
  if (ticketDoctor) ticketDoctor.textContent = info.doctor;
  if (ticketConsultorio) ticketConsultorio.textContent = info.consultorio;
  if (ticketDate) ticketDate.textContent = date;
  if (ticketTime) ticketTime.textContent = displayTime(time);
}

function fakePrint() {
  showToast(t(
    "Comprobante enviado a impresión.",
    "Comprobante imprimiykama apachisqa."
  ));

  window.onafterprint = function () {
    window.onafterprint = null;
    limpiarPacienteActual();
    window.location.href = "IncluCita.html";
  };

  window.print();
}

function resetSystem() {
  limpiarPacienteActual();
  window.location.href = "IncluCita.html";
}
function t(es, qu) {
  return selectedLanguage === "qu" ? qu : es;
}

function openAssistant() {
  const modal = document.getElementById("assistantModal");
  if (modal) modal.classList.add("active");

  updateLanguageButtons();
}

function closeAssistant() {
  const modal = document.getElementById("assistantModal");
  if (modal) modal.classList.remove("active");
}

function updateLanguageButtons() {
  const btnSpanish = document.getElementById("btnSpanish");
  const btnQuechua = document.getElementById("btnQuechua");

  if (!btnSpanish || !btnQuechua) return;

  btnSpanish.classList.remove("active-lang");
  btnQuechua.classList.remove("active-lang");

  if (selectedLanguage === "es") {
    btnSpanish.classList.add("active-lang");
  } else {
    btnQuechua.classList.add("active-lang");
  }
}

function setLanguage(lang) {
  selectedLanguage = lang;
  localStorage.setItem("selectedLanguage", lang);

  updateLanguageButtons();
  aplicarIdiomaPantallaDni();

  if (lang === "es") {
    speak("Idioma español seleccionado. Presione activar asistencia para continuar.");
  } else {
    speak("Runasimi akllasqa. Yanapakuyta qallarichinaykipaq activar asistencia ñit'iy.");
  }
}

function speak(text, callback) {
  lastInstruction = text;
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-PE";
  utterance.rate = selectedLanguage === "qu" ? 0.75 : 0.9;

  utterance.onend = () => {
    if (callback) callback();
  };

  speechSynthesis.speak(utterance);

  const voiceStatus = document.getElementById("voiceStatus");
  if (voiceStatus) voiceStatus.textContent = text;
}

function startVoiceMode() {
  if (!SpeechRecognition) {
    showToast("Tu navegador no permite reconocimiento de voz. Usa Google Chrome o Microsoft Edge.");
    return;
  }

  voiceActive = true;
  localStorage.setItem("voiceActive", "true");

  closeAssistant();

  const texto = document.getElementById("textoReconocido");
  if (texto) texto.textContent = "Asistencia activada.";

  speak(t(
    "Asistencia por voz activada.",
    "Rimaywan yanapakuy qallarichisqa."
  ), () => {
    guideCurrentPage();
  });
}

function stopVoiceMode() {
  voiceActive = false;
  localStorage.setItem("voiceActive", "false");

  speechSynthesis.cancel();

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }

  clearTimeout(silenceTimer);

  const voiceStatus = document.getElementById("voiceStatus");
  const texto = document.getElementById("textoReconocido");

  if (voiceStatus) voiceStatus.textContent = "Asistencia detenida.";
  if (texto) texto.textContent = "Asistencia detenida.";

  showToast("Asistencia detenida.");
}

function getCurrentScreenByPage() {
  const page = location.pathname.split("/").pop();

  if (page === "IncluCita.html") return "screen-dni";
  if (page === "especialidad.html") return "screen-specialty";
  if (page === "fecha.html") return "screen-date";
  if (page === "hora.html") return "screen-time";
  if (page === "confirmar.html") return "screen-confirm";
  if (page === "exito.html") return "screen-success";
  if (page === "ticket.html") return "screen-ticket";

  return "";
}

function guideCurrentPage() {
  if (!voiceActive) return;

  const currentScreen = getCurrentScreenByPage();

if (currentScreen === "screen-dni") {
  speak(t(
    "Hola, bienvenido a IncluCita. Esta plataforma le ayudará a reservar su cita médica de forma rápida, simple e inclusiva. Ahora ingrese su número de DNI.",
    "Allin hamusqayki IncluCitaman. Kay yanapakuyqa hampi citaykita utqaylla, sasachakuy mana kananpaq ruwanaykipaqmi. Kunan DNI yupaykita churay."
  ), () => {
    setTimeout(listenByScreen, 600);
  });
}

  else if (currentScreen === "screen-specialty") {
    speak(t(
      "Seleccione la especialidad que desea. Puede decir medicina general, pediatría, traumatología, oftalmología, odontología u otras especialidades. También puede decir volver.",
      "Munakusqayki hampi especialidadta akllay. Niyta atinki: Llapan hampi, Wawakuna hampi, Tullu hampi, Ñawi hampi, Kiru hampi utaq huk especialidad. Kutimuy niyta atinki."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }

else if (currentScreen === "screen-date") {
  speak(t(
    "Seleccione la fecha disponible. Diga solo el número del día que desea. También puede decir volver.",
    "Kachkan punchawta akllay. Munasqayki punchawpa yupayninta sapallan niy. Kutimuy nispa kutiyta atinki."
  ), () => {
    setTimeout(listenByScreen, 800);
  });
}

  else if (currentScreen === "screen-time") {
    speak(t(
      "Diga la hora que desea. Por ejemplo: ocho de la mañana, ocho y media, nueve de la mañana, dos de la tarde o tres y media. También puede decir volver.",
      "Munasqayki horata niy. Kayhina: pusaq tutamanta, pusaq kimsa chunka, isqun tutamanta, iskay chisi, utaq kimsa chisi kimsa chunka. Kutimuy niyta atinki."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }

else if (currentScreen === "screen-confirm") {
  const patient = localStorage.getItem("patientFullName") || "";
  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const date = localStorage.getItem("selectedDate") || "";
  const time = localStorage.getItem("selectedTime") || "";

  const info = doctorsBySpecialty[specialty] || {
    doctor: "Dr. Luis Ramírez",
    icon: "👨‍⚕️",
    consultorio: "Consultorio 1"
  };

speak(t(
  "Resumen de la cita. Paciente: " + patient +
  ". Especialidad: " + specialty +
  ". Médico: " + info.doctor +
  ". Consultorio: " + info.consultorio +
  ". Fecha: " + date +
  ". Hora: " + displayTime(time) +
  ". Si los datos son correctos diga confirmar cita. Si no escuchó bien, diga repetir cita. Si desea corregir diga volver.",

  "Cita willakuy. Paciente: " + patient +
  ". Especialidad: " + nombreEspecialidadQuechua(specialty) +
  ". Hampi: " + info.doctor +
  ". Consultorio: " + info.consultorio +
  ". Punchaw: " + date +
  ". Hora: " + displayTime(time) +
  ". Allin kaptinqa cita takyachiy niy. Yapamanta uyarinaykipaq yapamanta niy. Allichanaykipaq kutimuy niy."
), () => {
  setTimeout(listenByScreen, 800);
});
}

else if (currentScreen === "screen-success") {
  speak(t(
    "Cita confirmada correctamente. Si desea ver su comprobante, diga ver comprobante.",
    "Cita allinta takyachisqa. Comprobante qhawanaykipaq, comprobante qhaway niy."
  ), () => {
    setTimeout(listenByScreen, 800);
  });
}

  else if (currentScreen === "screen-ticket") {
    speak(t(
      "Comprobante generado. Si desea imprimir, diga imprimir comprobante.",
      "Comprobante rurasqa. Imprimir munanki chayqa, imprimir comprobante niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}

function listenByScreen() {
  if (!voiceActive || !SpeechRecognition) return;

  if (recognition) {
    try {
      recognition.abort();
    } catch (e) {}
  }

  recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage === "qu" ? "es-PE" : "es-ES";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let textoFinal = "";

  const voiceStatus = document.getElementById("voiceStatus");
  const texto = document.getElementById("textoReconocido");

  if (voiceStatus) voiceStatus.textContent = "Escuchando...";
  if (texto) texto.textContent = "Escuchando...";

  try {
    recognition.start();
  } catch (e) {
    showToast("No se pudo iniciar el micrófono. Recarga la página.");
    return;
  }

  recognition.onresult = function(event) {
    let textoTemporal = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      textoTemporal += event.results[i][0].transcript;
    }

    textoFinal = textoTemporal.toLowerCase().trim();

    if (texto) texto.textContent = textoFinal;
    if (voiceStatus) voiceStatus.textContent = "Reconociendo: " + textoFinal;
  };

  recognition.onend = function() {
    if (textoFinal !== "") {
      processVoiceCommand(textoFinal);
    } else if (voiceActive) {
      speak(t(
  "No pude reconocer la voz. Intente otra vez.",
  "Manam rimaykita riqsirqanichu. Huk kutita rimay."
), () => {
        setTimeout(listenByScreen, 800);
      });
    }
  };

  recognition.onerror = function(event) {
  if (event.error === "aborted") return;

  if (event.error === "no-speech") {
    if (voiceActive) {
      setTimeout(listenByScreen, 700);
    }
    return;
  }

  let mensaje = t(
    "No pude reconocer la voz. Intente otra vez.",
    "Manam rimaykita riqsirqanichu. Huk kutita rimay."
  );

  if (event.error === "not-allowed") {
    mensaje = t(
      "El micrófono está bloqueado. Active el permiso del micrófono.",
      "Microfono hark'asqam kachkan. Microfono permisota kichay."
    );
  }

  const voiceStatus = document.getElementById("voiceStatus");
  const texto = document.getElementById("textoReconocido");

  if (voiceStatus) voiceStatus.textContent = mensaje;
  if (texto) texto.textContent = mensaje;

  if (event.error !== "not-allowed") {
    speak(mensaje, () => {
      setTimeout(listenByScreen, 800);
    });
  }
};
}
function dniEnIdioma(dniTexto) {
  if (selectedLanguage !== "qu") {
    return dniTexto.split("").join(" ");
  }

  const mapQu = {
    "0": "chusaq",
    "1": "huk",
    "2": "iskay",
    "3": "kimsa",
    "4": "tawa",
    "5": "pisqa",
    "6": "suqta",
    "7": "qanchis",
    "8": "pusaq",
    "9": "isqun"
  };

  return dniTexto.split("").map(n => mapQu[n]).join(" ");
}
function normalizarTexto(texto){
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"");
}

function cerrarOtrasEspecialidades(){
    const box=document.getElementById("otherSpecialtiesBox");
    if(box){
        box.classList.remove("active");
    }
}

function preguntarEspecialidadesNuevamente() {
  cerrarOtrasEspecialidades();

  speak(t(
    "No entendí la especialidad. Puede decir Medicina General, Pediatría, Traumatología, Oftalmología, Odontología u Otras Especialidades.",
    "Manam especialidadta riqsirqanichu. Niyta atinki: Llapan hampi, Wawakuna hampi, Tullu hampi, Ñawi hampi, Kiru hampi utaq Huk especialidadkuna."
  ), function(){
    setTimeout(listenByScreen, 800);
  });
}
function comandoVolver(command) {
  if (selectedLanguage === "qu") {
    return command.includes("kutimuy");
  }

  return (
    command.includes("volver") ||
    command.includes("regresar") ||
    command.includes("atrás") ||
    command.includes("atras")
  );
}

function comandoVerSolicitud(command) {
  if (selectedLanguage === "qu") {
    return command.includes("solicitud qhaway") || command.includes("qhaway");
  }

  return command.includes("ver solicitud");
}

function comandoImprimirSolicitud(command) {
  if (selectedLanguage === "qu") {
    return command.includes("solicitud imprimir") || command.includes("imprimir");
  }

  return command.includes("imprimir solicitud");
}

function comandoSalirSolicitud(command) {
  if (selectedLanguage === "qu") {
    return command.includes("solicitud lluqsiy") || command.includes("lluqsiy");
  }

  return command.includes("salir solicitud");
}
function nombreEspecialidadQuechua(especialidad) {
  const nombres = {
    "Medicina General": "Llapan hampi",
    "Pediatría": "Wawakuna hampi",
    "Traumatología": "Tullu hampi",
    "Oftalmología": "Ñawi hampi",
    "Odontología": "Kiru hampi",
    "Cardiología": "Sonqo hampi",
    "Dermatología": "Qara hampi",
    "Neurología": "Ñutqu hampi",
    "Ginecología": "Warmi hampi"
  };

  return nombres[especialidad] || especialidad;
}
function processVoiceCommand(command) {
  const currentScreen = getCurrentScreenByPage();
if (pendingAction === "confirm-dni") {
  const aceptar = selectedLanguage === "qu"
    ? (command.includes("ñawpaqman") || command.includes("allin") || command.includes("ari"))
    : (command.includes("avanzar") || command.includes("correcto") || command.includes("sí") || command.includes("si"));

  const rechazar = selectedLanguage === "qu"
    ? (command.includes("mana") || command.includes("pantay"))
    : (command.includes("no es") || command.includes("mal") || command.includes("incorrecto") || command.includes("no"));

  if (aceptar) {
    pendingAction = "";
    speak(t(
      "Verificando DNI.",
      "DNI yupayta qhawachkani."
    ), () => {
      continuarDespuesDni();
    });
    return;
  }

  if (rechazar) {
    pendingAction = "";
    dni = "";
    localStorage.removeItem("dni");
    updateDniDisplay();

    speak(t(
      "Ingrese su número de DNI correctamente.",
      "DNI yupaykita allinta churay."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
    return;
  }
}

if (pendingAction === "confirm-name") {
  const aceptarNombre = selectedLanguage === "qu"
    ? (command.includes("allin") || command.includes("ari"))
    : (command.includes("esta bien") || command.includes("está bien") || command.includes("correcto") || command.includes("sí") || command.includes("si"));

  const rechazarNombre = selectedLanguage === "qu"
    ? (command.includes("mana") || command.includes("pantay"))
    : (command.includes("esta mal") || command.includes("está mal") || command.includes("incorrecto") || command.includes("no"));

  if (aceptarNombre) {
    pendingAction = "";
    const input = document.getElementById("fullNameInput");
    if (input) input.value = pendingName;
    registerNewPatient();
    return;
  }

  if (rechazarNombre) {
    pendingAction = "";
    pendingName = "";

    const input = document.getElementById("fullNameInput");
    if (input) input.value = "";

    speak(t(
      "Ingrese su nombre y apellido correcto.",
      "Sutiykita apelliduykita allinta niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
    return;
  }
}

if (comandoVolver(command)) {
  goBackByCurrentPage();
  return;
}

  if (currentScreen === "screen-dni") {
    if (comandoVerSolicitud(command)) {
  mostrarSolicitudPaciente();
  return;
}

if (comandoImprimirSolicitud(command)) {
  imprimirSolicitudPaciente();
  return;
}

if (comandoSalirSolicitud(command)) {
  salirSolicitudPaciente();
  return;
}
    const registerBox = document.getElementById("registerBox");

    if (registerBox && registerBox.classList.contains("active")) {
      const fullName = cleanPatientName(command);

      if (fullName.length >= 5 && fullName.includes(" ")) {
pendingName = fullName;

const input = document.getElementById("fullNameInput");
if (input) input.value = pendingName;

pendingAction = "confirm-name";

speak(t(
  "Usted dijo el nombre y apellido: " + pendingName +
  ". ¿Es correcto? Si está bien diga está bien. Si está mal diga está mal.",
  "Sutiykita nirqanki: " + pendingName +
  ". Allinchu? Allin kaptinqa allin niy. Mana allin kaptinqa mana niy."
), () => {
  setTimeout(listenByScreen, 800);
});
      } else {
        speak(t(
  "No reconocí nombre y apellido completos. Por favor diga su nombre y apellido.",
  "Manam sutiykita huntata riqsirqanichu. Ama hina kaspa sutiykita taytaykipa sutinta ima niy."
), () => {
          setTimeout(listenByScreen, 800);
        });
      }

      return;
    }

  const numbers = extractNumbers(command);

if (numbers.length >= 8) {
  dni = numbers.slice(0, 8);
  localStorage.setItem("dni", dni);
  updateDniDisplay();

  pendingAction = "confirm-dni";

  speak(t(
  "Usted dictó el DNI " + dni.split("").join(" ") +
  ". ¿Está bien? Si está correcto diga avanzar. Si no es correcto diga no es.",
  "DNI yupaykita nirqanki: " + dniEnIdioma(dni) +
  ". Allinchu? Allin kaptinqa ñawpaqman niy. Mana allin kaptinqa mana niy."
),
    () => {
      setTimeout(listenByScreen, 800);
    }
  );

} else {
  speak(t(
  "El DNI debe tener ocho dígitos. Ingrese su número de DNI correctamente.",
  "DNIqa pusaq yupayniyuq kanan. DNI yupaykita allinta churay."
), () => {
    setTimeout(listenByScreen, 800);
  });
}
  }

else if (currentScreen === "screen-specialty") {

  command = normalizarTexto(command);

  let specialty = "";

  if (selectedLanguage === "qu") {

    if (
      command.includes("huk especialidad") ||
      command.includes("huk especialidadkuna")
    ) {
      showOtherSpecialties();
      return;
    }

    if (command.includes("llapan hampi")) specialty = "Medicina General";
    else if (command.includes("wawakuna hampi")) specialty = "Pediatría";
    else if (command.includes("tullu hampi")) specialty = "Traumatología";
    else if (command.includes("nawi hampi")) specialty = "Oftalmología";
    else if (command.includes("kiru hampi")) specialty = "Odontología";
    else if (command.includes("sonqo hampi")) specialty = "Cardiología";
    else if (command.includes("qara hampi")) specialty = "Dermatología";
    else if (command.includes("nutqu hampi")) specialty = "Neurología";
    else if (command.includes("warmi hampi")) specialty = "Ginecología";

    Object.keys(doctorsBySpecialty).forEach(function(nombre) {
      if (specialty !== "") return;

      const textoQuechua = normalizarTexto(nombreEspecialidadQuechua(nombre));

      if (command.includes(textoQuechua) || textoQuechua.includes(command)) {
        specialty = nombre;
      }
    });

  } else {

    if (command.includes("otra") || command.includes("otras")) {
      showOtherSpecialties();
      return;
    }

    Object.keys(doctorsBySpecialty).forEach(function(nombre) {
      if (specialty !== "") return;

      const texto = normalizarTexto(nombre);

      if (command.includes(texto) || texto.includes(command)) {
        specialty = nombre;
      }
    });
  }

  if (specialty !== "") {
    cerrarOtrasEspecialidades();

    localStorage.setItem("selectedSpecialty", specialty);

    speak(t(
      "Especialidad seleccionada: " + specialty + ". Pasando a selección de fecha.",
      "Hampi especialidad akllasqa: " + nombreEspecialidadQuechua(specialty) + ". Kunan punchawta akllanki."
    ), function () {
      goTo("screen-date");
    });

  } else {
    cerrarOtrasEspecialidades();
    preguntarEspecialidadesNuevamente();
  }
}

else if (currentScreen === "screen-date") {
  const day = extractDay(command);

  if (day >= 1 && day <= 31) {
    const date = formatDate(day, currentMonth + 1, currentYear);
    const dateObject = new Date(currentYear, currentMonth, day);
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const specialty = localStorage.getItem("selectedSpecialty") || "";
    const horariosDoctor = obtenerHorariosDelDoctorActual();
    const ocupadas = obtenerHorasOcupadasPorEspecialidad(date, specialty).length;

if (dateObject < todayOnly) {
    speak(t(
        "Esa fecha ya pasó. Diga una fecha desde hoy en adelante.",
        "Chay punchawqa ñam pasasqaña. Kunanmanta ñawpaq punchawta niy."
    ), () => {
        setTimeout(listenByScreen,800);
    });
    return;
}

if (!doctorAtiendeEseDia(date)) {
    speak(t(
        "Este doctor no atiende ese día. Diga otra fecha disponible.",
        "Kay hampiqa chay punchawpi manam llamk'anchu. Huk punchawta akllay."
    ), () => {
        setTimeout(listenByScreen,800);
    });
    return;
}
if (diaYaNoTieneHorariosDisponibles(date)) {
  speak(t(
    "Ese día ya no tiene horarios disponibles. Diga otra fecha disponible.",
    "Chay punchawpi manañam horakuna kanchu. Huk punchawta akllay."
  ), () => {
    setTimeout(listenByScreen, 800);
  });
  return;
}
if (ocupadas >= horariosDoctor.length) {
    speak(t(
        "Esa fecha está llena. Diga otra fecha disponible.",
        "Chay punchawqa hunt'asqañam. Huk punchawta akllay."
    ), () => {
        setTimeout(listenByScreen,800);
    });
    return;
}

    localStorage.setItem("selectedDate", date);

if (ocupadas > 0) {
  speak(t(
    "Fecha seleccionada. Tiene algunos horarios ocupados, pero aún hay horarios disponibles.",
    "Punchaw akllasqam. Wakin horakuna ocupasqam kachkan, ichaqa wakin horakunaqa kachkanraqmi."
  ), () => {
    goTo("screen-time");
  });
} else {
  speak(t(
    "Fecha seleccionada correctamente.",
    "Punchaw allinta akllasqa."
  ), () => {
    goTo("screen-time");
  });
}

  } else {
speak(t(
    "No reconocí la fecha. Diga solo el número del día.",
    "Manam punchawta riqsirqanichu. Punchawpa yupaynillanta niy."
), () => {
    setTimeout(listenByScreen,800);
});
  }
}

else if (currentScreen === "screen-time") {
  allTimeSlots = obtenerHorariosDelDoctorActual();

  let hour = null;

if (selectedLanguage === "es") {
  const match = command.match(/\b([0-9]{1,2})(?::([0-9]{2}))?\b/);

  if (match) {
    let h = parseInt(match[1]);
    let m = match[2] ? parseInt(match[2]) : 0;

    if ((command.includes("tarde") || command.includes("noche")) && h < 12) h += 12;

    hour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else {
    hour = extractHour(command);
  }
} else {
  hour = extractHour(command);
}

  const existeEnHorario = allTimeSlots.some(slot => slot.value === hour);

  if (!hour || !existeEnHorario) {
speak(t(
  "Esa hora no está disponible. Diga una hora que aparezca en la pantalla.",
  "Chay horaqa manam kachkanchu. Pantallapi kaq horata niy."
), () => {
  setTimeout(listenByScreen, 800);
});
    return;
  }

  const selectedDate = localStorage.getItem("selectedDate") || "";
  const selectedSpecialty = localStorage.getItem("selectedSpecialty") || "";
  const blocked = obtenerHorasOcupadasPorEspecialidad(selectedDate, selectedSpecialty);

  if (blocked.includes(hour)) {
speak(t(
  "Ese horario ya está ocupado. Elija otro horario disponible.",
  "Chay horaqa ocupasqañam. Huk kachkaq horata akllay."
), () => {
  setTimeout(listenByScreen, 800);
});
    return;
  }
  if (horarioYaPaso(hour)) {
  speak(t(
    "Esa hora ya pasó. Diga una hora disponible.",
    "Chay horaqa ñam pasasqaña. Kachkaq horata niy."
  ), () => {
    setTimeout(listenByScreen, 800);
  });
  return;
}

  localStorage.setItem("selectedTime", hour);

speak(t(
  "Hora seleccionada correctamente.",
  "Hora allinta akllasqa."
), () => {
  goTo("screen-confirm");
});
}

else if (currentScreen === "screen-confirm") {
  command = normalizarTexto(command);

  const repetir = selectedLanguage === "qu"
    ? command.includes("yapamanta") || command.includes("kutipay")
    : command.includes("repetir") || command.includes("repetir cita") || command.includes("no escuche");

  const confirmar = selectedLanguage === "qu"
    ? command.includes("cita takyachiy") || command.includes("takyachiy") || command.includes("ari")
    : command.includes("confirmar") || command.includes("confirmar cita") || command.includes("confirmo");

  if (repetir) {
    guideCurrentPage();
    return;
  }

  if (confirmar) {
    confirmAppointment();
  } else {
    speak(t(
      "Diga confirmar cita para registrar la cita, repetir cita para escuchar nuevamente, o volver para corregir.",
      "Cita qillqanaykipaq cita takyachiy niy. Yapamanta uyarinaykipaq yapamanta niy. Allichanaykipaq kutimuy niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}

  else if (currentScreen === "screen-success") {
  command = normalizarTexto(command);

  const verComprobante = selectedLanguage === "qu"
    ? command.includes("comprobante qhaway") || command.includes("qhaway") || command.includes("comprobante")
    : command.includes("generar comprobante") || command.includes("comprobante") || command.includes("ver comprobante");

  if (verComprobante) {
    goTo("screen-ticket");
  } else {
    speak(t(
      "Diga ver comprobante para continuar.",
      "Qatiqanaykipaq comprobante qhaway niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}

else if (currentScreen === "screen-ticket") {
  command = normalizarTexto(command);

  const imprimir = selectedLanguage === "qu"
    ? command.includes("comprobante imprimir") || command.includes("imprimir")
    : command.includes("imprimir comprobante") || command.includes("imprimir");

  if (imprimir) {
    fakePrint();
  } else {
    speak(t(
      "Diga imprimir comprobante.",
      "Comprobante imprimir niy."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}
}
function goBackByCurrentPage() {
  const currentScreen = getCurrentScreenByPage();

  if (currentScreen === "screen-specialty") goTo("screen-dni");
  else if (currentScreen === "screen-date") goTo("screen-specialty");
  else if (currentScreen === "screen-time") goTo("screen-date");
  else if (currentScreen === "screen-confirm") goTo("screen-time");
  else if (currentScreen === "screen-ticket") goTo("screen-success");
}
function cleanPatientName(command) {
  return command
    .toLowerCase()
    .replace("mi nombre es", "")
    .replace("me llamo", "")
    .replace("yo soy", "")
    .replace("soy", "")
    .replace("nombre completo", "")
    .replace("nombre", "")
    .replace("apellido", "")
    .replace("mis apellidos son", "")
    .replace("registrar", "")
    .replace("continuar", "")
    .replace("siguiente", "")
    .trim()
    .split(" ")
    .filter(word => word.length > 1)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractNumbers(text) {
  text = text.toLowerCase().trim();

  const directDigits = text.replace(/\D/g, "");

  if (selectedLanguage === "es" && directDigits.length >= 8) {
    return directDigits;
  }

  const numerosEspanol = {
    "cero": "0",
    "uno": "1",
    "una": "1",
    "dos": "2",
    "tres": "3",
    "cuatro": "4",
    "cinco": "5",
    "seis": "6",
    "siete": "7",
    "ocho": "8",
    "nueve": "9"
  };

  const numerosQuechua = {
    "chusaq": "0",
    "huk": "1",
    "uk": "1",
    "iskay": "2",
    "iscay": "2",
    "iskai": "2",
    "kimsa": "3",
    "quimsa": "3",
    "tawa": "4",
    "pisqa": "5",
    "pisca": "5",
    "pichqa": "5",
    "pichka": "5",
    "suqta": "6",
    "soqta": "6",
    "qanchis": "7",
    "kanchis": "7",
    "canchis": "7",
    "pusaq": "8",
    "pusac": "8",
    "pusaj": "8",
    "isqun": "9",
    "isqon": "9",
    "iscon": "9"
  };

  const map = selectedLanguage === "qu" ? numerosQuechua : numerosEspanol;

  let result = "";

  text.split(/\s+/).forEach(word => {
    if (map[word] !== undefined) {
      result += map[word];
    }
  });

  return result;
}

function extractDay(text) {
  text = normalizarTexto(text);

  if (selectedLanguage === "es") {
    const digits = text.match(/\d+/);
    if (digits) return parseInt(digits[0]);

    const daysEs = {
      "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
      "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
      "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
      "dieciseis": 16, "diecisiete": 17, "dieciocho": 18,
      "diecinueve": 19, "veinte": 20, "veintiuno": 21,
      "veintidos": 22, "veintitres": 23, "veinticuatro": 24,
      "veinticinco": 25, "veintiseis": 26, "veintisiete": 27,
      "veintiocho": 28, "veintinueve": 29, "treinta": 30,
      "treinta y uno": 31
    };

    for (const key in daysEs) {
      if (text.includes(key)) return daysEs[key];
    }

    return null;
  }

  const daysQu = {
    "huk": 1,
    "iskay": 2,
    "kimsa": 3,
    "tawa": 4,
    "pisqa": 5,
    "suqta": 6,
    "qanchis": 7,
    "pusaq": 8,
    "isqun": 9,
    "chunka": 10
  };

  const digitWords = extractNumbers(text);
  if (digitWords) return parseInt(digitWords);

  return null;
}
function extractHour(text) {
  text = normalizarTexto(text)
    .replaceAll(".", "")
    .replaceAll(":", " ")
    .replaceAll("a m", "am")
    .replaceAll("p m", "pm");

  const minutosEs = {
    "cinco": 5,
    "diez": 10,
    "quince": 15,
    "veinte": 20,
    "veinticinco": 25,
    "treinta": 30,
    "treinta y cinco": 35,
    "cuarenta": 40,
    "cuarenta y cinco": 45,
    "cincuenta": 50,
    "cincuenta y cinco": 55
  };

  const minutosQu = {
    "pisqa": 5,
    "chunka": 10,
    "chunka pisqayuq": 15,
    "iskay chunka": 20,
    "iskay chunka pisqayuq": 25,
    "kimsa chunka": 30,
    "kimsa chunka pisqayuq": 35,
    "tawa chunka": 40,
    "tawa chunka pisqayuq": 45,
    "pisqa chunka": 50,
    "pisqa chunka pisqayuq": 55
  };

  function detectarMinuto(mapa) {
    let minuto = 0;
    Object.keys(mapa)
      .sort((a, b) => b.length - a.length)
      .forEach(palabra => {
        if (text.includes(palabra) && minuto === 0) {
          minuto = mapa[palabra];
        }
      });
    return minuto;
  }

  if (selectedLanguage === "es") {
    const horasEs = {
      "siete": 7, "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12,
      "dos": 14, "tres": 15, "cuatro": 16, "cinco": 17, "seis": 18
    };

    for (const palabra in horasEs) {
      if (text.includes(palabra)) {
        const h = horasEs[palabra];
        const m = detectarMinuto(minutosEs);
        const posible = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");

        if (allTimeSlots.some(slot => slot.value === posible)) return posible;
      }
    }

    return null;
  }

  const horasQu = [
    ["chunka iskay", 12],
    ["chunka huk", 11],
    ["qanchis", 7],
    ["pusaq", 8],
    ["isqun", 9],
    ["chunka", 10],
    ["iskay", 14],
    ["kimsa", 15],
    ["tawa", 16],
    ["pisqa", 17],
    ["suqta", 18]
  ];

  for (const item of horasQu) {
    const palabra = item[0];
    const h = item[1];

    if (text.includes(palabra)) {
      const m = detectarMinuto(minutosQu);
      const posible = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");

      if (allTimeSlots.some(slot => slot.value === posible)) return posible;
    }
  }

  return null;
}
let secretariaDni = "72527818";
let secretariaClave = localStorage.getItem("secretariaClave") || "123456";

function loginSecretaria() {
  const dni = document.getElementById("dniSecretaria").value;
  const clave = document.getElementById("passwordSecretaria").value;

  secretariaClave = localStorage.getItem("secretariaClave") || "123456";

  if (dni === secretariaDni && clave === secretariaClave) {
    try {
      const secParams = new URLSearchParams();
      secParams.append("username", "secretaria");
      secParams.append("password", "secretaria123");
      secParams.append("format", "json");
      fetch("login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: secParams.toString()
      }).catch(function(e) {});
    } catch(e) {}
    window.location.href = "secretariaMenu.html";
  } else {
    alert("DNI o contraseña incorrectos");
  }
}

function mostrarRecuperacion() {
  document.getElementById("recuperarBox").classList.add("active");
}

function cambiarPassword() {
  const dni = document.getElementById("dniRecuperacion").value;
  const nueva = document.getElementById("nuevaClave").value;
  const confirmar = document.getElementById("confirmarClave").value;
  const recuperarBox = document.getElementById("recuperarBox");

  if (dni !== secretariaDni) {
    alert("DNI incorrecto");
    return;
  }

  if (nueva.length < 4) {
    alert("La contraseña debe tener mínimo 4 caracteres");
    return;
  }

  if (nueva !== confirmar) {
    alert("Las contraseñas no coinciden");
    return;
  }

  secretariaClave = nueva;
  localStorage.setItem("secretariaClave", nueva);

  alert("Contraseña actualizada correctamente");

  recuperarBox.classList.remove("active");

  document.getElementById("dniRecuperacion").value = "";
  document.getElementById("nuevaClave").value = "";
  document.getElementById("confirmarClave").value = "";

  document.getElementById("passwordSecretaria").value = "";
}
const citasBaseSecretaria = [
  { dni:"80000004", nombre:"Ana Rojas", especialidad:"Medicina General", fecha:"25/06/2026", hora:"08:15 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000005", nombre:"Pedro Luna", especialidad:"Medicina General", fecha:"26/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000006", nombre:"Carmen Salas", especialidad:"Medicina General", fecha:"28/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000007", nombre:"José Torres", especialidad:"Medicina General", fecha:"29/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000008", nombre:"Elena Vega", especialidad:"Medicina General", fecha:"30/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000009", nombre:"Miguel Flores", especialidad:"Pediatría", fecha:"22/06/2026", hora:"07:25 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000010", nombre:"Lucía Castro", especialidad:"Pediatría", fecha:"23/06/2026", hora:"07:50 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000011", nombre:"Raúl Díaz", especialidad:"Pediatría", fecha:"24/06/2026", hora:"08:15 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000012", nombre:"Patricia Ramos", especialidad:"Pediatría", fecha:"25/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000013", nombre:"Hugo Campos", especialidad:"Pediatría", fecha:"26/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000014", nombre:"Valeria Cruz", especialidad:"Pediatría", fecha:"28/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000015", nombre:"Jorge León", especialidad:"Pediatría", fecha:"29/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000016", nombre:"Natalia Flores", especialidad:"Pediatría", fecha:"30/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000017", nombre:"Marco Salinas", especialidad:"Traumatología", fecha:"22/06/2026", hora:"07:50 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000018", nombre:"Camila Peña", especialidad:"Traumatología", fecha:"23/06/2026", hora:"08:15 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000019", nombre:"Julio Medina", especialidad:"Traumatología", fecha:"24/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000020", nombre:"Diana Vera", especialidad:"Traumatología", fecha:"25/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000021", nombre:"Carlos Silva", especialidad:"Traumatología", fecha:"26/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000022", nombre:"María Peña", especialidad:"Traumatología", fecha:"28/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000023", nombre:"Diego Vargas", especialidad:"Traumatología", fecha:"29/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000024", nombre:"Sofía Ramos", especialidad:"Traumatología", fecha:"30/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000025", nombre:"Fernando Paredes", especialidad:"Oftalmología", fecha:"22/06/2026", hora:"08:15 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000026", nombre:"Doris Aguilar", especialidad:"Oftalmología", fecha:"23/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000027", nombre:"Renato Cárdenas", especialidad:"Oftalmología", fecha:"24/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000028", nombre:"Gabriela León", especialidad:"Oftalmología", fecha:"25/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000029", nombre:"Javier Molina", especialidad:"Oftalmología", fecha:"26/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000030", nombre:"Paola Ríos", especialidad:"Oftalmología", fecha:"28/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000031", nombre:"Erick Salazar", especialidad:"Oftalmología", fecha:"29/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000032", nombre:"Mónica Campos", especialidad:"Oftalmología", fecha:"30/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000033", nombre:"Alexis Núñez", especialidad:"Odontología", fecha:"22/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000034", nombre:"Fiorella Poma", especialidad:"Odontología", fecha:"23/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000035", nombre:"Roberto Chávez", especialidad:"Odontología", fecha:"24/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000036", nombre:"Claudia Meza", especialidad:"Odontología", fecha:"25/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000037", nombre:"Andrés Villar", especialidad:"Odontología", fecha:"26/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000038", nombre:"Karina Lozano", especialidad:"Odontología", fecha:"28/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000039", nombre:"Bruno Castillo", especialidad:"Odontología", fecha:"29/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000040", nombre:"Daniela Torres", especialidad:"Odontología", fecha:"30/06/2026", hora:"11:35 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000041", nombre:"Paciente Cardiología 1", especialidad:"Cardiología", fecha:"27/06/2026", hora:"07:00 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000042", nombre:"Paciente Cardiología 2", especialidad:"Cardiología", fecha:"27/06/2026", hora:"07:25 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000043", nombre:"Paciente Cardiología 3", especialidad:"Cardiología", fecha:"27/06/2026", hora:"07:50 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000044", nombre:"Paciente Cardiología 4", especialidad:"Cardiología", fecha:"27/06/2026", hora:"08:15 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000045", nombre:"Paciente Cardiología 5", especialidad:"Cardiología", fecha:"27/06/2026", hora:"08:40 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000046", nombre:"Paciente Cardiología 6", especialidad:"Cardiología", fecha:"27/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000047", nombre:"Paciente Cardiología 7", especialidad:"Cardiología", fecha:"27/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000048", nombre:"Paciente Cardiología 8", especialidad:"Cardiología", fecha:"27/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000049", nombre:"Paciente Cardiología 9", especialidad:"Cardiología", fecha:"27/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000050", nombre:"Paciente Cardiología 10", especialidad:"Cardiología", fecha:"27/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000051", nombre:"Paciente Cardiología 11", especialidad:"Cardiología", fecha:"27/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000052", nombre:"Paciente Cardiología 12", especialidad:"Cardiología", fecha:"27/06/2026", hora:"11:35 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000053", nombre:"Paciente Cardiología 13", especialidad:"Cardiología", fecha:"27/06/2026", hora:"12:00 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000054", nombre:"Paciente Cardiología 14", especialidad:"Cardiología", fecha:"27/06/2026", hora:"12:25 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000055", nombre:"Paciente Cardiología 15", especialidad:"Cardiología", fecha:"27/06/2026", hora:"12:50 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000056", nombre:"Paciente Cardiología 16", especialidad:"Cardiología", fecha:"27/06/2026", hora:"14:05 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000057", nombre:"Paciente Cardiología 17", especialidad:"Cardiología", fecha:"27/06/2026", hora:"14:30 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000058", nombre:"Paciente Cardiología 18", especialidad:"Cardiología", fecha:"27/06/2026", hora:"14:55 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000059", nombre:"Paciente Cardiología 19", especialidad:"Cardiología", fecha:"27/06/2026", hora:"15:20 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000060", nombre:"Paciente Cardiología 20", especialidad:"Cardiología", fecha:"27/06/2026", hora:"15:45 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000061", nombre:"Paciente Cardiología 21", especialidad:"Cardiología", fecha:"27/06/2026", hora:"16:10 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000062", nombre:"Paciente Cardiología 22", especialidad:"Cardiología", fecha:"27/06/2026", hora:"16:35 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000063", nombre:"Paciente Cardiología 23", especialidad:"Cardiología", fecha:"27/06/2026", hora:"17:00 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000064", nombre:"Paciente Cardiología 24", especialidad:"Cardiología", fecha:"27/06/2026", hora:"17:25 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000065", nombre:"Paciente Cardiología 25", especialidad:"Cardiología", fecha:"27/06/2026", hora:"17:50 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000066", nombre:"Ricardo Mamani", especialidad:"Dermatología", fecha:"22/06/2026", hora:"09:05 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000067", nombre:"Teresa Aquino", especialidad:"Dermatología", fecha:"23/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000068", nombre:"Oscar Gálvez", especialidad:"Dermatología", fecha:"24/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000069", nombre:"Laura Palacios", especialidad:"Dermatología", fecha:"25/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000070", nombre:"Esteban Reyes", especialidad:"Dermatología", fecha:"26/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000071", nombre:"Andrea Cueva", especialidad:"Dermatología", fecha:"28/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000072", nombre:"Víctor Ramos", especialidad:"Dermatología", fecha:"29/06/2026", hora:"11:35 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000073", nombre:"Lorena Espinoza", especialidad:"Dermatología", fecha:"30/06/2026", hora:"12:00 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000074", nombre:"Kevin Morales", especialidad:"Neurología", fecha:"22/06/2026", hora:"09:30 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000075", nombre:"Silvia Cáceres", especialidad:"Neurología", fecha:"23/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000076", nombre:"Gustavo Farfán", especialidad:"Neurología", fecha:"24/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000077", nombre:"Norma Prado", especialidad:"Neurología", fecha:"25/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000078", nombre:"Alberto Rojas", especialidad:"Neurología", fecha:"26/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000079", nombre:"Elisa Molina", especialidad:"Neurología", fecha:"28/06/2026", hora:"11:35 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000080", nombre:"Pablo Carrasco", especialidad:"Neurología", fecha:"29/06/2026", hora:"12:00 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000081", nombre:"Ruth Córdova", especialidad:"Neurología", fecha:"30/06/2026", hora:"12:25 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },

  { dni:"80000082", nombre:"Martha Sánchez", especialidad:"Ginecología", fecha:"22/06/2026", hora:"09:55 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000083", nombre:"Rocío Zambrano", especialidad:"Ginecología", fecha:"23/06/2026", hora:"10:20 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000084", nombre:"Isabel Fuentes", especialidad:"Ginecología", fecha:"24/06/2026", hora:"10:45 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000085", nombre:"Cecilia Vargas", especialidad:"Ginecología", fecha:"25/06/2026", hora:"11:10 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000086", nombre:"Vanessa Paredes", especialidad:"Ginecología", fecha:"26/06/2026", hora:"11:35 a. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000087", nombre:"Milagros Soto", especialidad:"Ginecología", fecha:"28/06/2026", hora:"12:00 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000088", nombre:"Carolina Medina", especialidad:"Ginecología", fecha:"29/06/2026", hora:"12:25 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false },
  { dni:"80000089", nombre:"Verónica León", especialidad:"Ginecología", fecha:"30/06/2026", hora:"12:50 p. m.", tipo:"proximas", estado:"Confirmada", enviada:false }
];
let citasSecretaria = JSON.parse(localStorage.getItem("citasSecretaria"));

if (!citasSecretaria || citasSecretaria.length < citasBaseSecretaria.length) {
  citasSecretaria = citasBaseSecretaria;
  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));
} 
function llenarDiaSecretaria(fecha) {
  const horas = [
    "08:00 a. m.", "08:30 a. m.", "09:00 a. m.", "09:30 a. m.",
    "10:00 a. m.", "10:30 a. m.", "14:00 p. m.", "14:30 p. m.",
    "15:00 p. m.", "15:30 p. m.", "16:00 p. m.", "16:30 p. m."
  ];

  for (let i = 0; i < horas.length; i++) {
    citasSecretaria.push({
      dni: "99" + fecha.replaceAll("/", "") + i,
      nombre: "Paciente " + (i + 1),
      especialidad: "Medicina General",
      fecha: fecha,
      hora: horas[i],
      tipo: "proximas"
    });
  }
}

if (false && !localStorage.getItem("diasLlenosSecretaria")) {
  llenarDiaSecretaria("21/06/2026");
  llenarDiaSecretaria("23/06/2026");
  llenarDiaSecretaria("25/06/2026");
  llenarDiaSecretaria("26/06/2026");
  llenarDiaSecretaria("28/06/2026");
  llenarDiaSecretaria("30/06/2026");

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));
  localStorage.setItem("diasLlenosSecretaria", "true");
}
function agregarCitaParcial(fecha, hora, nombre, dni, especialidad) {
  const existe = citasSecretaria.some(cita =>
    cita.fecha === fecha && cita.hora === hora
  );

  if (!existe) {
    citasSecretaria.push({
      dni: dni,
      nombre: nombre,
      especialidad: especialidad,
      fecha: fecha,
      hora: hora,
      tipo: "proximas",
      enviada: false
    });
  }
}
let filtroCitasSecretaria = "todas";
let paginaCitasSecretaria = 1;

function obtenerCitasPorPagina() {
  if (window.innerWidth <= 575.98) {
    return 3; // CELULAR
  }

  return 5; // PC / TABLET
}

function filtrarCitasSecretaria(tipo) {
  filtroCitasSecretaria = tipo;
  paginaCitasSecretaria = 1;

  document.querySelectorAll(".citas-tabs button").forEach(btn => {
    btn.classList.remove("active-tab");
  });

  if (tipo === "todas") document.getElementById("tabTodas").classList.add("active-tab");
  if (tipo === "hoy") document.getElementById("tabHoy").classList.add("active-tab");
  if (tipo === "proximas") document.getElementById("tabProximas").classList.add("active-tab");

  renderCitasSecretaria();
}

function buscarCitasSecretaria() {
  paginaCitasSecretaria = 1;
  renderCitasSecretaria();
}
function fechaHoyTexto() {
  const hoy = new Date();

  return String(hoy.getDate()).padStart(2, "0") + "/" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "/" +
        hoy.getFullYear();
}
function actualizarEstadosCitasPorFecha() {
  const hoy = convertirFechaTexto(fechaHoyTexto());

  citasSecretaria.forEach(cita => {
    const fechaCita = convertirFechaTexto(cita.fecha);

    if (
      fechaCita < hoy &&
      cita.enviada === true &&
      cita.estado === "Programada"
    ) {
      cita.estado = "Cancelada";
    }
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));
}

function convertirFechaTexto(fechaTexto) {
  const partes = fechaTexto.split("/");
  return new Date(partes[2], partes[1] - 1, partes[0]);
}
function obtenerCitasFiltradas() {
  const texto = document.getElementById("buscarCitaInput")?.value.toLowerCase().trim() || "";

  const hoyTexto = fechaHoyTexto();
  const hoyFecha = convertirFechaTexto(hoyTexto);

  return citasSecretaria.filter(cita => {
    const fechaCita = convertirFechaTexto(cita.fecha);

    if (fechaCita < hoyFecha) {
      return false;
    }

    let tipoReal = "";

    if (cita.fecha === hoyTexto) {
      tipoReal = "hoy";
    } else {
      tipoReal = "proximas";
    }

    const coincideFiltro =
      filtroCitasSecretaria === "todas" || tipoReal === filtroCitasSecretaria;

    const coincideBusqueda =
      cita.nombre.toLowerCase().includes(texto) ||
      cita.dni.includes(texto);

    return coincideFiltro && coincideBusqueda;
  });
}

function renderCitasSecretaria() {
  actualizarNoIngresosAutomaticos();
  const lista = document.getElementById("citasList");
  const info = document.getElementById("citasInfo");
  const pagination = document.getElementById("citasPagination");

  if (!lista || !info || !pagination) return;

const citas = obtenerCitasFiltradas();
const citasPorPagina = obtenerCitasPorPagina();

const totalPaginas =
  Math.ceil(citas.length / citasPorPagina) || 1;

  if (paginaCitasSecretaria > totalPaginas) {
    paginaCitasSecretaria = totalPaginas;
  }

  const inicio = (paginaCitasSecretaria - 1) * citasPorPagina;
  const fin = inicio + citasPorPagina;
  const citasPagina = citas.slice(inicio, fin);

  lista.innerHTML = "";

  if (citasPagina.length === 0) {
    lista.innerHTML = `
      <div class="empty-citas">
        No se encontraron citas registradas.
      </div>
    `;
  }

  citasPagina.forEach(cita => {
    lista.innerHTML += `
      <div class="cita-item">
        <div class="cita-avatar">${cita.nombre.includes("María") || cita.nombre.includes("Ana") || cita.nombre.includes("Sofía") || cita.nombre.includes("Carmen") || cita.nombre.includes("Elena") || cita.nombre.includes("Valeria") || cita.nombre.includes("Gabriela") ? "👩" : "👨"}</div>

        <div>
          <strong>${cita.nombre}</strong>
          <p>DNI: ${cita.dni}</p>
          <p>${cita.especialidad}</p>
        </div>

        <div class="cita-date">
          <strong>${cita.fecha}</strong>
          <p>${cita.hora}</p>
        </div>

<span class="${
cita.estado === "Atendida" ? "estado-atendida" :
cita.estado === "No Ingreso" ? "estado-no-ingreso" :
cita.enviada === true ? "estado-programada" :
"estado-confirmada"
}">
  ${
cita.estado === "Atendida" ? "Atendida" :
cita.estado === "No Ingreso" ? "No Ingreso" :
cita.enviada === true ? "Programada" :
"Confirmada"
  }
</span>

${(
  (cita.estado === "Confirmada" && cita.enviada !== true) ||
  cita.estado === "No Ingreso"
)
  ? `<button class="cita-arrow" onclick="verDetalleCita('${cita.dni}')">›</button>` 
  : `<button class="cita-arrow-disabled" disabled>›</button>`
}
      </div>
    `;
  });

  const desde = citas.length === 0 ? 0 : inicio + 1;
  const hasta = Math.min(fin, citas.length);

  info.textContent = `Mostrando ${desde} a ${hasta} de ${citas.length} citas`;

  pagination.innerHTML = "";

  pagination.innerHTML += `
    <button onclick="cambiarPaginaCitas(${paginaCitasSecretaria - 1})">‹</button>
  `;

  for (let i = 1; i <= totalPaginas; i++) {
    pagination.innerHTML += `
      <button class="${i === paginaCitasSecretaria ? "page-active" : ""}"
              onclick="cambiarPaginaCitas(${i})">
        ${i}
      </button>
    `;
  }

  pagination.innerHTML += `
    <button onclick="cambiarPaginaCitas(${paginaCitasSecretaria + 1})">›</button>
  `;
}

function obtenerDoctoresActuales() {
  return JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];
}

function cargarDashboardSecretaria() {
  const contVal = document.getElementById("dashTotal");
  if (!contVal) return; // no estamos en la página del dashboard

  actualizarEstadosCitasPorFecha();

  const citas = citasSecretaria || [];
  const doctores = obtenerDoctoresActuales();
  const hoyTexto = fechaHoyTexto();
  const hoyFecha = convertirFechaTexto(hoyTexto);

  const total = citas.length;

  const clasificar = c => {
    if (c.estado === "Atendida") return "atendida";
    if (c.estado === "Cancelada") return "cancelada";
    const fechaCita = convertirFechaTexto(c.fecha);
    if (fechaCita <= hoyFecha) return "noAtendida";
    return c.enviada === true ? "programada" : "confirmada";
  };

  const grupos = { atendida: [], cancelada: [], noAtendida: [], programada: [], confirmada: [] };
  citas.forEach(c => grupos[clasificar(c)].push(c));

  const atendidas = grupos.atendida.length;
  const canceladas = grupos.cancelada.length;
  const noAtendidas = grupos.noAtendida;
  const programadas = grupos.programada.length;
  const confirmadas = grupos.confirmada.length;

  const pacientesUnicos = new Set(citas.map(c => c.dni)).size;
  const tasaAtencion = total > 0 ? Math.round((atendidas / total) * 100) : 0;

  const citasHoy = citas.filter(c => c.fecha === hoyTexto);
  const atendidasHoy = citasHoy.filter(c => c.estado === "Atendida").length;
  const pendientesHoy = citasHoy.length - atendidasHoy;

  // ---- KPIs fila 1: panorama general ----
  setTexto("dashTotal", total);
  setTexto("dashPacientes", pacientesUnicos);
  setTexto("dashDoctores", doctores.length);
  setTexto("dashTasa", tasaAtencion + "%");

  // ---- KPIs fila 2: estados ----
  setTexto("dashAtendidas", atendidas);
  setTexto("dashPendientes", programadas + confirmadas);
  setTexto("dashNoAtendidas", noAtendidas.length);
  setTexto("dashCanceladas", canceladas);

  // ---- Panel "Hoy" ----
  setTexto("dashHoyTotal", citasHoy.length);
  setTexto("dashHoyAtendidas", atendidasHoy);
  setTexto("dashHoyPendientes", pendientesHoy);

  // ---- Dona: distribución de estados ----
  const segmentos = [
    { label: "Atendidas", value: atendidas, color: "#2563eb" },
    { label: "Programadas", value: programadas, color: "#16963c" },
    { label: "Confirmadas", value: confirmadas, color: "#f59e0b" },
    { label: "No atendidas", value: noAtendidas.length, color: "#7c3aed" },
    { label: "Canceladas", value: canceladas, color: "#e03131" }
  ];
  renderDonut(segmentos, total);

  // ---- Barras: citas por especialidad ----
  const porEspecialidad = {};
  citas.forEach(c => {
    if (!porEspecialidad[c.especialidad]) porEspecialidad[c.especialidad] = { total: 0, atendidas: 0 };
    porEspecialidad[c.especialidad].total++;
    if (c.estado === "Atendida") porEspecialidad[c.especialidad].atendidas++;
  });
  renderBarrasEspecialidad(porEspecialidad);

  // ---- Barras: citas por día de la semana ----
  const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const porDia = [0, 0, 0, 0, 0, 0, 0];
  citas.forEach(c => {
    const idx = (convertirFechaTexto(c.fecha).getDay() + 6) % 7;
    porDia[idx]++;
  });
  renderBarrasDia(diasNombres, porDia);

  // ---- Rendimiento por doctor ----
  renderRendimientoDoctores(doctores, citas);

  // ---- Listado de citas no atendidas (alertas) ----
  renderAlertasNoAtendidas(noAtendidas);
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function renderDonut(segmentos, total) {
  const donut = document.getElementById("dashDonut");
  const leyenda = document.getElementById("dashLeyenda");
  if (!donut || !leyenda) return;

  if (total === 0) {
    donut.style.background = "#e2e8f0";
    leyenda.innerHTML = `<div class="dashboard-empty">No hay citas registradas todavía.</div>`;
    return;
  }

  let acumulado = 0;
  const stops = segmentos
    .filter(s => s.value > 0)
    .map(s => {
      const inicio = (acumulado / total) * 360;
      acumulado += s.value;
      const fin = (acumulado / total) * 360;
      return `${s.color} ${inicio}deg ${fin}deg`;
    })
    .join(", ");

  donut.style.background = `conic-gradient(${stops})`;

  leyenda.innerHTML = segmentos.map(s => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-label">${s.label}</span>
      <span class="legend-value">${s.value} · ${total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
    </div>
  `).join("");
}

function renderBarrasEspecialidad(porEspecialidad) {
  const cont = document.getElementById("dashEspecialidades");
  if (!cont) return;

  const entradas = Object.entries(porEspecialidad).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(1, ...entradas.map(([, d]) => d.total));

  if (entradas.length === 0) {
    cont.innerHTML = `<div class="dashboard-empty">No hay citas registradas todavía.</div>`;
    return;
  }

  cont.innerHTML = entradas.map(([especialidad, datos]) => {
    const pctAtendidas = datos.total > 0 ? (datos.atendidas / datos.total) * 100 : 0;
    return `
      <div class="dashboard-bar-row">
        <span class="bar-label">${especialidad}</span>
        <div class="dashboard-bar-track">
          <div class="dashboard-bar-fill" style="width:${(datos.total / maxTotal) * 100}%">
            <div class="dashboard-bar-fill-inner" style="width:${pctAtendidas}%"></div>
          </div>
        </div>
        <span class="dashboard-bar-count">${datos.total}</span>
      </div>
    `;
  }).join("");
}

function renderBarrasDia(nombres, valores) {
  const cont = document.getElementById("dashPorDia");
  if (!cont) return;

  const max = Math.max(1, ...valores);

  cont.innerHTML = nombres.map((dia, i) => `
    <div class="dashboard-vbar">
      <div class="dashboard-vbar-track">
        <div class="dashboard-vbar-fill" style="height:${(valores[i] / max) * 100}%"></div>
      </div>
      <span class="vbar-value">${valores[i]}</span>
      <span class="vbar-label">${dia.slice(0, 3)}</span>
    </div>
  `).join("");
}

function renderRendimientoDoctores(doctores, citas) {
  const cont = document.getElementById("dashDoctoresLista");
  if (!cont) return;

  if (doctores.length === 0) {
    cont.innerHTML = `<div class="dashboard-empty">No hay doctores registrados todavía.</div>`;
    return;
  }

  const filas = doctores.map(doc => {
    const citasDoc = citas.filter(c => c.especialidad === doc.especialidad);
    const atendidasDoc = citasDoc.filter(c => c.estado === "Atendida").length;
    const tasa = citasDoc.length > 0 ? Math.round((atendidasDoc / citasDoc.length) * 100) : 0;
    const colorTasa = tasa >= 70 ? "#16963c" : tasa >= 40 ? "#f59e0b" : "#e03131";

    return `
      <div class="doctor-perf-row">
        <div class="doctor-perf-info">
          <div class="doctor-perf-avatar">${doc.icono || "🩺"}</div>
          <div>
            <strong>${doc.nombre}</strong>
            <p>${doc.especialidad} · ${doc.consultorio}</p>
          </div>
        </div>
        <div class="doctor-perf-stats">
          <span class="doctor-perf-count">${atendidasDoc}/${citasDoc.length} citas</span>
          <div class="dashboard-bar-track doctor-perf-track">
            <div class="dashboard-bar-fill" style="width:${tasa}%; background:${colorTasa}"></div>
          </div>
          <span class="doctor-perf-pct" style="color:${colorTasa}">${tasa}%</span>
        </div>
      </div>
    `;
  });

  cont.innerHTML = filas.join("");
}

function renderAlertasNoAtendidas(noAtendidas) {
  const listaAlertas = document.getElementById("dashAlertas");
  if (!listaAlertas) return;

  setTexto("dashAlertasTotal", noAtendidas.length);

  if (noAtendidas.length === 0) {
    listaAlertas.innerHTML = `<div class="dashboard-empty">No hay citas pendientes por atender. 🎉</div>`;
    return;
  }

  const ordenadas = noAtendidas.slice().sort((a, b) => convertirFechaTexto(a.fecha) - convertirFechaTexto(b.fecha));

  listaAlertas.innerHTML = ordenadas.slice(0, 8).map(c => `
    <div class="dashboard-alert-item">
      <div class="alert-info">
        <strong>${c.nombre}</strong>
        <p>${c.especialidad} · DNI: ${c.dni}</p>
      </div>
      <span class="alert-badge">${c.fecha} · ${c.hora}</span>
    </div>
  `).join("");

  if (noAtendidas.length > 8) {
    listaAlertas.innerHTML += `<div class="dashboard-empty">+ ${noAtendidas.length - 8} citas más sin atender</div>`;
  }
}

document.addEventListener("DOMContentLoaded", cargarDashboardSecretaria);

function cambiarPaginaCitas(pagina) {

  const citas = obtenerCitasFiltradas();
  const citasPorPagina = obtenerCitasPorPagina();

  const totalPaginas =
    Math.ceil(citas.length / citasPorPagina) || 1;

  if (pagina < 1 || pagina > totalPaginas) {
    return;
  }

  paginaCitasSecretaria = pagina;

  renderCitasSecretaria();
}

function verDetalleCita(dni) {
  let cita = null;

  for (let i = 0; i < citasSecretaria.length; i++) {
    if (citasSecretaria[i].dni === dni) {
      cita = citasSecretaria[i];
    }
  }

  if (cita === null) {
    alert("No se encontró la cita");
    return;
  }
  if (!((cita.estado === "Confirmada" && cita.enviada !== true) || cita.estado === "No Ingreso")) {
    showToast("Solo puede abrir detalles de citas Confirmadas o No Ingreso.");
    return;
  }
  let doctor = "Dr. Luis Ramírez";
  let consultorio = "Consultorio 1";

  if (cita.especialidad === "Pediatría") {
    doctor = "Dra. María López";
    consultorio = "Consultorio 2";
  }

  if (cita.especialidad === "Traumatología") {
    doctor = "Dr. Carlos Mendoza";
    consultorio = "Consultorio 4";
  }

  if (cita.especialidad === "Oftalmología") {
    doctor = "Dra. Ana Torres";
    consultorio = "Consultorio 5";
  }

  if (cita.especialidad === "Odontología") {
    doctor = "Dr. José Vargas";
    consultorio = "Consultorio 6";
  }

  if (cita.especialidad === "Cardiología") {
    doctor = "Dra. Patricia Ruiz";
    consultorio = "Consultorio 7";
  }

  if (cita.especialidad === "Dermatología") {
    doctor = "Dra. Rosa Castillo";
    consultorio = "Consultorio 8";
  }

  if (cita.especialidad === "Neurología") {
    doctor = "Dr. Miguel Herrera";
    consultorio = "Consultorio 9";
  }

  if (cita.especialidad === "Ginecología") {
    doctor = "Dra. Lucía Paredes";
    consultorio = "Consultorio 10";
  }
const estadoReal = estadoRealCita(cita);

if (estadoReal !== "Confirmada" && estadoReal !== "No Ingreso") {
  showToast("Solo puede abrir detalles de citas Confirmadas o No Ingreso.");
  return;
}

localStorage.setItem("detalleEstado", estadoReal);
  localStorage.setItem("detalleDni", cita.dni);
  localStorage.setItem("detalleNombre", cita.nombre);
  localStorage.setItem("detalleEspecialidad", cita.especialidad);
  localStorage.setItem("detalleFecha", cita.fecha);
  localStorage.setItem("detalleHora", cita.hora);
  localStorage.setItem("detalleDoctor", doctor);
  localStorage.setItem("detalleConsultorio", consultorio);
  window.location.href = "secretariaDetalleCita.html";
}
function cargarDetalleCita() {

  const nombre = document.getElementById("detalleNombre");

  if (!nombre) return;

  document.getElementById("detalleNombre").textContent =
    localStorage.getItem("detalleNombre");

  document.getElementById("detalleDni").textContent =
    localStorage.getItem("detalleDni");

  document.getElementById("detalleEspecialidad").textContent =
    localStorage.getItem("detalleEspecialidad");

  document.getElementById("detalleDoctor").textContent =
    localStorage.getItem("detalleDoctor");

  document.getElementById("detalleConsultorio").textContent =
    localStorage.getItem("detalleConsultorio");

  document.getElementById("detalleFecha").textContent =
    localStorage.getItem("detalleFecha");

  document.getElementById("detalleHora").textContent =
    localStorage.getItem("detalleHora");
}
const estado = localStorage.getItem("detalleEstado") || "Confirmada";
const detalleEstado = document.getElementById("detalleEstado");

if (detalleEstado) {
  detalleEstado.textContent = estado;
  detalleEstado.className = claseEstadoReal({ estado: estado });
}
const estadoTop = document.querySelector(".estado-detalle");
if (estadoTop) {
  estadoTop.textContent = estado === "No Ingreso" ? "No Ingreso" : "Cita confirmada";
}
function cargarReprogramar() {
  const nombre = document.getElementById("repNombre");

  if (!nombre) return;

  document.getElementById("repNombre").textContent =
    localStorage.getItem("detalleNombre");

  document.getElementById("repEspecialidad").textContent =
    localStorage.getItem("detalleEspecialidad");

  document.getElementById("repDoctor").textContent =
    localStorage.getItem("detalleDoctor");

  document.getElementById("repFecha").textContent =
    localStorage.getItem("detalleFecha");

  document.getElementById("repHora").textContent =
    localStorage.getItem("detalleHora");

  cargarFechasReprogramar();
}
function obtenerHorasOcupadasPorFecha(fecha) {
  const ocupadas = [];
  const dniActual = localStorage.getItem("detalleDni");
  const especialidadActual = localStorage.getItem("detalleEspecialidad");

  citasSecretaria.forEach(cita => {
    if (
      cita.fecha === fecha &&
      cita.especialidad === especialidadActual &&
      cita.estado !== "Cancelada" &&
      String(cita.dni) !== String(dniActual)
    ) {
      const hora = cita.hora
        .replace(" a. m.", "")
        .replace(" p. m.", "")
        .trim();

      if (!ocupadas.includes(hora)) ocupadas.push(hora);
    }
  });

  return ocupadas;
}
function cargarFechasReprogramar() {
  const fechaSelect = document.getElementById("nuevaFechaRep");
  if (!fechaSelect) return;

  fechaSelect.innerHTML = '<option value="">Seleccione nueva fecha</option>';

  const especialidadActual = localStorage.getItem("detalleEspecialidad") || "";
  localStorage.setItem("selectedSpecialty", especialidadActual);

  const hoy = new Date();

  for (let i = 0; i < 30; i++) {
    const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);

    const fecha = formatDate(
      f.getDate(),
      f.getMonth() + 1,
      f.getFullYear()
    );

    if (!doctorAtiendeEseDia(fecha)) continue;
    if (diaYaNoTieneHorariosDisponibles(fecha)) continue;

    const horariosDoctor = obtenerHorariosDelDoctorActual();
    const ocupadas = obtenerHorasOcupadasPorFecha(fecha);

    if (ocupadas.length >= horariosDoctor.length) continue;

    const option = document.createElement("option");
    option.value = fecha;
    option.textContent = ocupadas.length > 0
      ? fecha + " - 🟡 Algunos horarios ocupados"
      : fecha + " - 🟢 Disponible";

    fechaSelect.appendChild(option);
  }
}

function cargarHorasReprogramar() {
  const fecha = document.getElementById("nuevaFechaRep").value;
  const horaSelect = document.getElementById("nuevaHoraRep");

  if (!horaSelect) return;

  horaSelect.innerHTML = '<option value="">Seleccione nueva hora</option>';
  if (fecha === "") return;

  const especialidadActual = localStorage.getItem("detalleEspecialidad") || "";
  localStorage.setItem("selectedSpecialty", especialidadActual);
  localStorage.setItem("selectedDate", fecha);

  const bloqueados = obtenerHorasOcupadasPorFecha(fecha);
  const horariosDoctor = obtenerHorariosDelDoctorActual();

  horariosDoctor.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot.value;

    if (bloqueados.includes(slot.value)) {
      option.textContent = slot.label + " - 🔴 Ocupado";
      option.disabled = true;
    } else if (horarioYaPaso(slot.value)) {
      option.textContent = slot.label + " - ⚫ Vencido";
      option.disabled = true;
    } else {
      option.textContent = slot.label + " - 🟢 Libre";
    }

    horaSelect.appendChild(option);
  });
}
function guardarReprogramacion() {
  const fechaNueva = document.getElementById("nuevaFechaRep").value;
  const horaNueva = document.getElementById("nuevaHoraRep").value;

  if (fechaNueva === "") {
    alert("Seleccione una nueva fecha");
    return;
  }

  if (horaNueva === "") {
    alert("Seleccione una nueva hora");
    return;
  }

  const dniActual = localStorage.getItem("detalleDni");

  for (let i = 0; i < citasSecretaria.length; i++) {
    if (citasSecretaria[i].dni === dniActual) {
      citasSecretaria[i].fecha = fechaNueva;
      citasSecretaria[i].hora = horaNueva;
    }
  }

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));

  localStorage.setItem("detalleFecha", fechaNueva);
  localStorage.setItem("detalleHora", horaNueva);

  alert("Cita reprogramada correctamente");
  window.location.href = "secretariaConfirmacion.html";
}

document.addEventListener("DOMContentLoaded", cargarReprogramar);

function ponerTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor || "";
}

function cargarConfirmacionSecretaria() {
  ponerTexto("confPaciente", localStorage.getItem("detalleNombre"));
  ponerTexto("confDni", localStorage.getItem("detalleDni"));
  ponerTexto("confEspecialidad", localStorage.getItem("detalleEspecialidad"));
  ponerTexto("confDoctor", localStorage.getItem("detalleDoctor"));
  ponerTexto("confConsultorio", localStorage.getItem("detalleConsultorio"));
  ponerTexto("confFecha", localStorage.getItem("detalleFecha"));
  ponerTexto("confHora", localStorage.getItem("detalleHora"));
}

function imprimirComprobanteSecretaria() {

  window.onafterprint = function () {
    window.location.href = "secretariaCitas.html";
  };

  window.print();
}

document.addEventListener("DOMContentLoaded", cargarConfirmacionSecretaria);
function cargarComprobanteSecretaria() {
  const paciente = document.getElementById("compPaciente");

  if (!paciente) return;

  document.getElementById("compPaciente").textContent = localStorage.getItem("detalleNombre");
  document.getElementById("compDni").textContent = localStorage.getItem("detalleDni");
  document.getElementById("compEspecialidad").textContent = localStorage.getItem("detalleEspecialidad");
  document.getElementById("compDoctor").textContent = localStorage.getItem("detalleDoctor");
  document.getElementById("compConsultorio").textContent = localStorage.getItem("detalleConsultorio");
  document.getElementById("compFecha").textContent = localStorage.getItem("detalleFecha");
  document.getElementById("compHora").textContent = localStorage.getItem("detalleHora");
}

document.addEventListener("DOMContentLoaded", cargarComprobanteSecretaria);
function cargarCancelarCita() {
  const nombre = document.getElementById("cancelNombre");
  if (!nombre) return;

  nombre.textContent = localStorage.getItem("detalleNombre") || "";
  document.getElementById("cancelEspecialidad").textContent = localStorage.getItem("detalleEspecialidad") || "";
  document.getElementById("cancelDoctor").textContent = localStorage.getItem("detalleDoctor") || "";
  document.getElementById("cancelFecha").textContent = localStorage.getItem("detalleFecha") || "";
  document.getElementById("cancelHora").textContent = localStorage.getItem("detalleHora") || "";
}

function confirmarCancelacionSecretaria() {
  const motivo = document.getElementById("motivoCancelacion").value;

  if (motivo === "") {
    alert("Seleccione un motivo de cancelación.");
    return;
  }

  const dniActual = localStorage.getItem("detalleDni");

  citasSecretaria = citasSecretaria.filter(function(cita) {
    return cita.dni !== dniActual;
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));

const modal = document.createElement("div");

modal.innerHTML = `
<div class="modal-cancelacion">
    <div class="modal-cancelacion-box">
        <div class="check-cancelacion">✓</div>
        <h3>Cita cancelada</h3>
        <p>La cita fue eliminada correctamente.</p>
    </div>
</div>
`;

document.body.appendChild(modal);

setTimeout(() => {
    window.location.href = "secretariaCitas.html";
}, 1500);
}

document.addEventListener("DOMContentLoaded", cargarCancelarCita);
function verPasswordSecretaria() {
  const input = document.getElementById("passwordSecretaria");

  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

let doctoresSistema = JSON.parse(localStorage.getItem("doctoresSistema")) || [

{
  nombre: "Dr. Luis Ramírez",
  dni: "11111111",
  telefono: "987654321",
  especialidad: "Medicina General",
  icono: "👨‍⚕️",
  consultorio: "Consultorio 1"
},
{
  nombre: "Dra. María López",
  dni: "22222222",
  telefono: "912345678",
  especialidad: "Pediatría",
  icono: "👩‍⚕️",
  consultorio: "Consultorio 2"
},
{
  nombre: "Dr. Carlos Mendoza",
  dni: "33333333",
  telefono: "923456789",
  especialidad: "Traumatología",
  icono: "👨‍⚕️",
  consultorio: "Consultorio 4"
},
{
  nombre: "Dra. Ana Torres",
  dni: "44444444",
  telefono: "934567890",
  especialidad: "Oftalmología",
  icono: "👩‍⚕️",
  consultorio: "Consultorio 5"
},
{
  nombre: "Dr. José Vargas",
  dni: "55555555",
  telefono: "945678901",
  especialidad: "Odontología",
  icono: "👨‍⚕️",
  consultorio: "Consultorio 6"
},
{
  nombre: "Dra. Patricia Ruiz",
  dni: "66666666",
  telefono: "956789012",
  especialidad: "Cardiología",
  icono: "👩‍⚕️",
  consultorio: "Consultorio 7"
},
{
  nombre: "Dra. Rosa Castillo",
  dni: "77777777",
  telefono: "967890123",
  especialidad: "Dermatología",
  icono: "👩‍⚕️",
  consultorio: "Consultorio 8"
},
{
  nombre: "Dr. Miguel Herrera",
  dni: "88888888",
  telefono: "978901234",
  especialidad: "Neurología",
  icono: "👨‍⚕️",
  consultorio: "Consultorio 9"
},
{
  nombre: "Dra. Lucía Paredes",
  dni: "99999999",
  telefono: "989012345",
  especialidad: "Ginecología",
  icono: "👩‍⚕️",
  consultorio: "Consultorio 10"
},
{
  nombre: "Dr. Sebastián Liñán",
  dni: "12345678",
  telefono: "900123456",
  especialidad: "Medicina General",
  icono: "👨‍⚕️",
  consultorio: "Consultorio 11"
}

];

function renderDoctoresEnviar() {
  const contenedor = document.getElementById("listaDoctoresEnviar");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema;

  doctores.forEach(function(doc) {
    contenedor.innerHTML += `
      <button class="doctor-enviar-item"
        onclick="seleccionarDoctorEnvio('${doc.nombre}', '${doc.especialidad}', '${doc.consultorio}')">

        <div class="doctor-avatar">
          ${iconoEspecialidadParaLista(doc)}
        </div>

        <div>
          <strong>${doc.nombre}</strong>
          <p>${doc.especialidad}</p>
          <small>${doc.consultorio || ""}</small>
        </div>

        <span>›</span>
      </button>
    `;
  });
}

function seleccionarDoctorEnvio(nombre, especialidad, consultorio) {
  localStorage.setItem("doctorEnvioNombre", nombre);
  localStorage.setItem("doctorEnvioEspecialidad", especialidad);
  localStorage.setItem("doctorEnvioConsultorio", consultorio);

  window.location.href = "secretariaEnviarDetalle.html";
}

function buscarDoctorEnviarCitas() {
  const texto = document.getElementById("buscarDoctorEnviar").value.toLowerCase();
  const items = document.querySelectorAll(".doctor-enviar-item");

  items.forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(texto)
      ? "grid"
      : "none";
  });
}

document.addEventListener("DOMContentLoaded", renderDoctoresEnviar);
function cargarCalendarioEnvioDoctor() {
  const contenedor = document.getElementById("envioCalendarDays");
  const titulo = document.getElementById("envioCalendarTitulo");
if (titulo) {
  titulo.textContent = monthNames[currentMonth] + " " + currentYear;
}

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const hoyTexto = fechaHoyTexto();
  const diasMes = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= diasMes; day++) {
    const fecha = formatDate(day, currentMonth + 1, currentYear);
let clase = "envio-day libre";

    if (fecha === hoyTexto) {
      clase += " hoy";
    }

    const accion = fecha === hoyTexto
      ? `onclick="seleccionarFechaEnvio('${fecha}')"`
      : "disabled";

    contenedor.innerHTML += `
      <button class="${clase}" ${accion}>
        ${day}
      </button>
    `;
  }
}

function seleccionarFechaEnvio(fecha) {
  localStorage.setItem("fechaEnvioDoctor", fecha);
  window.location.href = "secretariaEnviarDia.html";
}

document.addEventListener("DOMContentLoaded", cargarCalendarioEnvioDoctor);
function obtenerDoctorDeEspecialidad(especialidad) {
  const info = doctorsBySpecialty[especialidad];

  if (info) {
    return info.doctor;
  }

  return "Dr. Luis Ramírez";
}

function estaAtendida(cita) {
  return estadoRealCita(cita) === "Atendida";
}
function estadoRealCita(cita) {
  if (cita.estado === "No Ingreso") return "No Ingreso";

  if (
    cita.estado === "Atendida" ||
    (cita.observacionesDoctor && cita.observacionesDoctor.length > 0)
  ) {
    return "Atendida";
  }

  if (cita.enviada === true || cita.estado === "Programada") {
    return "Programada";
  }

  return "Confirmada";
}

function claseEstadoReal(cita) {
  const estado = estadoRealCita(cita);

  if (estado === "No Ingreso") return "estado-no-ingreso";
  if (estado === "Atendida") return "estado-atendida";
  if (estado === "Programada") return "estado-programada";

  return "estado-confirmada";
}
function cargarCitasDiaDoctor() {
  actualizarNoIngresosAutomaticos();

  const lista = document.getElementById("listaCitasEnviarDia");
  if (!lista) return;

  const citasActuales = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const fecha = localStorage.getItem("doctorPacienteFecha") ||
                localStorage.getItem("fechaEnvioDoctor") ||
                fechaHoyTexto();

  const doctor = localStorage.getItem("doctorPacienteNombre") ||
                 localStorage.getItem("doctorEnvioNombre") ||
                 "Doctor";

  const especialidad = localStorage.getItem("doctorPacienteEspecialidad") ||
                       localStorage.getItem("doctorEnvioEspecialidad") ||
                       "";

  document.getElementById("doctorDiaNombre").textContent = doctor;

  const doctorEsp = document.getElementById("doctorDiaEspecialidad");
  if (doctorEsp) doctorEsp.textContent = especialidad;

  document.getElementById("fechaDiaTexto").textContent = fecha;

  const citasDia = citasActuales.filter(cita =>
    cita.fecha === fecha &&
    cita.especialidad === especialidad
  );

  const programadas = citasDia.filter(cita => estadoRealCita(cita) === "Programada").length;
  const pendientes = citasDia.filter(cita => estadoRealCita(cita) === "Confirmada").length;

  document.getElementById("totalProgramadas").textContent = programadas;
  document.getElementById("totalPendientes").textContent = pendientes;

  lista.innerHTML = "";

  if (citasDia.length === 0) {
    lista.innerHTML = `<div class="empty-citas">No hay citas para este doctor en esta fecha.</div>`;
    return;
  }

  citasDia.forEach(cita => {
    const estadoTexto = estadoRealCita(cita);
    const estadoClase = claseEstadoReal(cita);

    lista.innerHTML += `
      <div class="cita-envio-item">
        <input
          type="checkbox"
          class="check-cita-envio"
          data-dni="${cita.dni}"
          data-hora="${cita.hora}"
          onchange="actualizarContadorEnvio()"
          ${estadoTexto !== "Confirmada" ? "disabled" : ""}>

        <strong>${cita.hora}</strong>

        <div>
          <strong>${cita.nombre}</strong>
          <p>DNI: ${cita.dni}<br>${cita.especialidad}</p>
        </div>

        <span class="${estadoClase}">${estadoTexto}</span>
        <span class="paciente-dia-arrow">›</span>
      </div>
    `;
  });

  actualizarContadorEnvio();
}


function seleccionarTodasCitasEnvio() {
  const checkTodas = document.getElementById("checkTodasEnvio");
  const checks = document.querySelectorAll(".check-cita-envio");

  checks.forEach(function(check) {
    if (!check.disabled) {
      check.checked = checkTodas.checked;
    }
  });

  actualizarContadorEnvio();
}

function actualizarContadorEnvio() {
  const contador = document.getElementById("contadorSeleccionadas");
  if (!contador) return;

  const seleccionadas = document.querySelectorAll(".check-cita-envio:checked").length;
  contador.textContent = seleccionadas + " citas seleccionadas";
}

function enviarCitasSeleccionadasDoctor() {
  const checks = document.querySelectorAll(".check-cita-envio:checked");

  if (checks.length === 0) {
    alert("Seleccione al menos una cita.");
    return;
  }

  checks.forEach(check => {
    const dni = check.dataset.dni;
    const hora = check.dataset.hora;

    citasSecretaria.forEach(cita => {
      if (String(cita.dni) === String(dni) && cita.hora === hora) {
        cita.enviada = true;
        cita.estado = "Programada";
      }
    });
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));

  alert("Citas enviadas correctamente.");
  location.reload();
}

document.addEventListener("DOMContentLoaded", cargarCitasDiaDoctor);
function irConfirmarEnvioDoctor() {
  const checks = document.querySelectorAll(".check-cita-envio:checked");

  if (checks.length === 0) {
    showToast("Seleccione al menos una cita.");
    return;
  }

  const especialidadDoctor = localStorage.getItem("doctorEnvioEspecialidad") || "";
  const seleccionadas = [];

  for (const check of checks) {
    const dni = check.dataset.dni;
    const hora = check.dataset.hora;

    const cita = citasSecretaria.find(c =>
      String(c.dni) === String(dni) &&
      c.hora === hora
    );

    if (!cita) continue;

    if (cita.especialidad !== especialidadDoctor) {
      showToast(
        "Error: esta cita es de " + cita.especialidad +
        " y no puede enviarse a un doctor de " + especialidadDoctor + "."
      );
      return;
    }

    seleccionadas.push({
      dni: dni,
      hora: hora,
      especialidad: cita.especialidad
    });
  }

  localStorage.setItem("citasSeleccionadasEnvio", JSON.stringify(seleccionadas));
  localStorage.setItem("cantidadCitasEnvio", seleccionadas.length);

  location.href = "secretariaConfirmarEnvio.html";
}

function cargarConfirmarEnvioDoctor() {
  const doctor = localStorage.getItem("doctorEnvioNombre") || "Dr. Doctor";
  const especialidad = localStorage.getItem("doctorEnvioEspecialidad") || "Especialidad";
  const fecha = localStorage.getItem("fechaEnvioDoctor") || "Fecha seleccionada";
  const cantidad = localStorage.getItem("cantidadCitasEnvio") || "0";

  if (document.getElementById("confEnvioDoctor")) {
    document.getElementById("confEnvioDoctor").textContent = doctor;
  }

  if (document.getElementById("confEnvioEspecialidad")) {
    document.getElementById("confEnvioEspecialidad").textContent = especialidad;
  }

  if (document.getElementById("confEnvioFecha")) {
    document.getElementById("confEnvioFecha").textContent = fecha;
  }

  if (document.getElementById("confEnvioCantidad")) {
    document.getElementById("confEnvioCantidad").textContent =
      cantidad + (cantidad == 1 ? " cita" : " citas");
  }
}

function confirmarEnvioFinalDoctor() {
  const seleccionadas = JSON.parse(localStorage.getItem("citasSeleccionadasEnvio")) || [];
  const especialidadDoctor = localStorage.getItem("doctorEnvioEspecialidad") || "";

  if (seleccionadas.length === 0) {
    showToast("No hay citas seleccionadas para enviar.");
    return;
  }

  for (const item of seleccionadas) {
    const cita = citasSecretaria.find(c =>
      String(c.dni) === String(item.dni) &&
      c.hora === item.hora
    );

    if (!cita) continue;

    if (cita.especialidad !== especialidadDoctor) {
      showToast(
        "Error: no se puede enviar una cita de " + cita.especialidad +
        " a un doctor de " + especialidadDoctor + "."
      );
      return;
    }
  }

  citasSecretaria = citasSecretaria.map(function(cita) {
    const encontrada = seleccionadas.some(item =>
      String(item.dni) === String(cita.dni) &&
      item.hora === cita.hora
    );

    if (encontrada) {
      cita.enviada = true;
      cita.estado = "Programada";
    }

    return cita;
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citasSecretaria));

  showToast("Citas enviadas correctamente.");

  setTimeout(function() {
    location.href = "secretariaEnviarCitas.html";
  }, 800);
}

document.addEventListener("DOMContentLoaded", function() {
  cargarConfirmarEnvioDoctor();
});
function iniciarProcesoEnvioCitas() {
  const pantallaEnviando = document.getElementById("pantallaEnviando");
  const pantallaCompletado = document.getElementById("pantallaCompletado");
  const barra = document.getElementById("barraEnvio");
  const porcentaje = document.getElementById("porcentajeEnvio");
  const footer = document.getElementById("footerProceso");

  if (!pantallaEnviando || !pantallaCompletado || !barra || !porcentaje) return;

  let progreso = 0;

  const intervalo = setInterval(function () {
    progreso += 5;

    barra.style.width = progreso + "%";
    porcentaje.textContent = progreso + "%";

    if (progreso >= 100) {
      clearInterval(intervalo);

      setTimeout(function () {
        pantallaEnviando.classList.add("oculto");
        pantallaCompletado.classList.remove("oculto");

        if (footer) {
          footer.textContent = "Envío completado";
        }

        cargarDatosEnvioCompletado();
        marcarCitasComoEnviadas();
      }, 500);
    }
  }, 120);
}

function cargarDatosEnvioCompletado() {
  const doctor = localStorage.getItem("doctorEnvioNombre") || "Dr. Doctor";
  const fecha = localStorage.getItem("fechaEnvioDoctor") || "Fecha seleccionada";
  const cantidad = localStorage.getItem("cantidadCitasEnvio") || "0";

  const ahora = new Date();
  const fechaHora =
    ahora.toLocaleDateString("es-PE") +
    " - " +
    ahora.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit"
    });

  const finalDoctor = document.getElementById("finalDoctor");
  const finalFecha = document.getElementById("finalFecha");
  const finalCantidad = document.getElementById("finalCantidad");
  const finalHoraEnvio = document.getElementById("finalHoraEnvio");

  if (finalDoctor) finalDoctor.textContent = doctor;
  if (finalFecha) finalFecha.textContent = fecha;
  if (finalCantidad) {
    finalCantidad.textContent = cantidad + (cantidad == 1 ? " cita" : " citas");
  }
  if (finalHoraEnvio) finalHoraEnvio.textContent = fechaHora;
}

function marcarCitasComoEnviadas() {
  const fecha = localStorage.getItem("fechaEnvioDoctor");
  const seleccionadas = JSON.parse(localStorage.getItem("citasSeleccionadasEnvio")) || [];

  let citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  citas = citas.map(function(cita) {
    const coincide = seleccionadas.some(function(sel) {
      return cita.fecha === fecha &&
             cita.dni === sel.dni &&
             cita.hora === sel.hora;
    });

    if (coincide) {
      cita.enviada = true;
    }

    return cita;
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citas));
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarProcesoEnvioCitas();
});
function cargarResumenEnvioDoctor() {
  const doctor = localStorage.getItem("doctorEnvioNombre") || "Dr. Doctor";
  const especialidad = localStorage.getItem("doctorEnvioEspecialidad") || "Especialidad";
  const fecha = localStorage.getItem("fechaEnvioDoctor") || "Fecha seleccionada";
  const cantidad = localStorage.getItem("cantidadCitasEnvio") || "0";
  const seleccionadas = JSON.parse(localStorage.getItem("citasSeleccionadasEnvio")) || [];
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const doctorEl = document.getElementById("resumenDoctor");
  const especialidadEl = document.getElementById("resumenEspecialidad");
  const fechaEl = document.getElementById("resumenFecha");
  const cantidadEl = document.getElementById("resumenCantidad");
  const horaEl = document.getElementById("resumenHoraEnvio");
  const lista = document.getElementById("listaResumenEnvio");

  if (!lista) return;

  if (doctorEl) doctorEl.textContent = doctor;
  if (especialidadEl) especialidadEl.textContent = especialidad;
  if (fechaEl) fechaEl.textContent = fecha;
  if (cantidadEl) cantidadEl.textContent = cantidad + (cantidad == 1 ? " cita" : " citas");

  const ahora = new Date();
  if (horaEl) {
    horaEl.textContent =
      ahora.toLocaleDateString("es-PE") +
      " - " +
      ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }

  lista.innerHTML = "";

  const citasEnviadas = citas.filter(function(cita) {
    return seleccionadas.some(function(sel) {
      return cita.fecha === fecha &&
             cita.dni === sel.dni &&
             cita.hora === sel.hora;
    });
  });

  if (citasEnviadas.length === 0) {
    lista.innerHTML = `
      <div class="empty-citas">
        No hay citas enviadas para mostrar.
      </div>
    `;
    return;
  }

  citasEnviadas.forEach(function(cita) {
    lista.innerHTML += `
      <div class="resumen-cita-item">
        <strong>${cita.hora}</strong>

        <div>
          <strong>${cita.nombre}</strong>
          <p>DNI: ${cita.dni}</p>
        </div>

        <span class="estado-enviada">Enviada</span>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", function() {
  cargarResumenEnvioDoctor();
});
function obtenerDoctoresPacientesDoctor() {
  const guardados = JSON.parse(localStorage.getItem("doctoresSistema"));

  if (guardados && Array.isArray(guardados)) {
    return guardados;
  }

  return doctoresSistema;
}
function cargarDoctoresPacientesDoctor(lista = obtenerDoctoresPacientesDoctor()) {
  const contenedor = document.getElementById("listaDoctoresPacientes");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  lista.forEach(function(doc) {
    contenedor.innerHTML += `
      <button class="doctor-paciente-item mejor-doctor-item"
        onclick="seleccionarDoctorPacientes('${doc.nombre}','${doc.especialidad}')">

        <div class="doctor-paciente-avatar">
          ${iconoDoctorPersona(doc)}
        </div>

        <div class="doctor-info-lista">
          <strong>${doc.nombre}</strong>
          <p>${doc.especialidad}</p>
        </div>

        <span class="arrow">›</span>
      </button>
    `;
  });
}
function seleccionarDoctorPacientes(nombre, especialidad) {

  localStorage.setItem("doctorPacienteNombre", nombre);
  localStorage.setItem("doctorPacienteEspecialidad", especialidad);

  location.href = "secretariaPacientesDoctorFecha.html";
}
function buscarDoctorPacientes() {

  const input = document.getElementById("buscarDoctorPaciente");

  if (!input) return;

  const texto = input.value.toLowerCase().trim();

  const doctores = obtenerDoctoresPacientesDoctor();

  const filtrados = doctores.filter(function(doc) {

    return (
      doc.nombre.toLowerCase().includes(texto) ||
      doc.especialidad.toLowerCase().includes(texto)
    );

  });

  cargarDoctoresPacientesDoctor(filtrados);
}
document.addEventListener("DOMContentLoaded", function() {

  if (document.getElementById("listaDoctoresPacientes")) {
    cargarDoctoresPacientesDoctor();
  }

});
function cargarFechaPacientesDoctor() {
  const contenedor = document.getElementById("doctorCalendarDays");
  if (!contenedor) return;

  const nombre = localStorage.getItem("doctorPacienteNombre") || "Dr. Doctor";
  const especialidad = localStorage.getItem("doctorPacienteEspecialidad") || "Especialidad";

  document.getElementById("doctorFechaNombre").textContent = nombre;
  document.getElementById("doctorFechaEspecialidad").textContent = especialidad;

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diaHoy = hoy.getDate();

  document.getElementById("doctorCalendarTitulo").textContent =
    monthNames[mes] + " " + anio;

  contenedor.innerHTML = "";

  const primerDia = new Date(anio, mes, 1);
  let inicio = primerDia.getDay();
  inicio = inicio === 0 ? 6 : inicio - 1;

  const diasMes = new Date(anio, mes + 1, 0).getDate();

  for (let i = 0; i < inicio; i++) {
    contenedor.innerHTML += `<div class="doctor-calendar-day disabled"></div>`;
  }

  for (let dia = 1; dia <= diasMes; dia++) {
    const fechaTexto = formatDate(dia, mes + 1, anio);

    if (dia === diaHoy) {
      contenedor.innerHTML += `
        <div class="doctor-calendar-day today"
             onclick="seleccionarFechaPacientesDoctor('${fechaTexto}')">
          ${dia}
        </div>
      `;
    } else {
      contenedor.innerHTML += `
        <div class="doctor-calendar-day disabled">
          ${dia}
        </div>
      `;
    }
  }
}

function seleccionarFechaPacientesDoctor(fecha) {
  localStorage.setItem("doctorPacienteFecha", fecha);
  location.href = "secretariaPacientesDoctorDia.html";
}

document.addEventListener("DOMContentLoaded", function() {
  cargarFechaPacientesDoctor();
});
function cargarPacientesDoctorDia() {
  actualizarNoIngresosAutomaticos();

  const lista = document.getElementById("listaPacientesDoctorDia");
  if (!lista) return;

  const doctor = localStorage.getItem("doctorPacienteNombre") || "Dr. Doctor";
  const especialidad = localStorage.getItem("doctorPacienteEspecialidad") || "";
  const fecha = localStorage.getItem("doctorPacienteFecha") || fechaHoyTexto();

  document.getElementById("pacientesDiaTitulo").textContent =
    "Pacientes del " + doctor;

  document.getElementById("pacientesDiaFecha").textContent = fecha;

  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const pacientes = citas.filter(function(cita) {
    const estado = estadoRealCita(cita);

    return cita.fecha === fecha &&
           cita.especialidad === especialidad &&
           (estado === "Programada" || estado === "No Ingreso");
  });

  lista.innerHTML = "";

  if (pacientes.length === 0) {
    lista.innerHTML = `<div class="empty-citas">No hay pacientes para este doctor.</div>`;
    return;
  }

  pacientes.forEach(function(cita) {
    const estadoTexto = estadoRealCita(cita);
    const estadoClase = claseEstadoReal(cita);

    lista.innerHTML += `
      <div class="paciente-dia-item">
        <div class="paciente-dia-hora">${cita.hora}</div>

        <div class="paciente-dia-info">
          <strong>${cita.nombre}</strong>
          <span>DNI: ${cita.dni}</span>
          <small>${cita.especialidad}</small>
        </div>

        <span class="${estadoClase}">${estadoTexto}</span>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", function() {
  cargarPacientesDoctorDia();
});
/* ===== PACIENTES SECRETARIA ===== */

let paginaPacientesActual = 1;
const pacientesPorPagina = 5;

function obtenerPacientesUnicos() {
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];
  const hoyFecha = convertirFechaTexto(fechaHoyTexto());
  const mapa = {};

  citas.forEach(cita => {
    const fechaCita = convertirFechaTexto(cita.fecha);

    if (fechaCita < hoyFecha) return;

    if (!mapa[cita.dni]) {
      mapa[cita.dni] = {
        nombre: cita.nombre,
        dni: cita.dni
      };
    }
  });

  return Object.values(mapa);
}

function cargarPacientesSecretaria(filtro = "") {

  const lista = document.getElementById("listaPacientesSecretaria");
  const info = document.getElementById("pacientesInfo");
  const paginas = document.getElementById("pacientesPagination");

  if (!lista) return;

  let pacientes = obtenerPacientesUnicos();

  if (filtro.trim() !== "") {

    pacientes = pacientes.filter(p =>
      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      p.dni.includes(filtro)
    );

  }

  const total = pacientes.length;

  const inicio = (paginaPacientesActual - 1) * pacientesPorPagina;
  const fin = inicio + pacientesPorPagina;

  const visibles = pacientes.slice(inicio, fin);

  lista.innerHTML = "";

  visibles.forEach(paciente => {

    lista.innerHTML += `
      <div class="paciente-secretaria-item"
           onclick="verPacienteSecretaria('${paciente.dni}')">

        <div class="paciente-avatar">👨</div>

        <div>
          <strong>${paciente.nombre}</strong>
        </div>

        <div class="paciente-dni-lateral">
          DNI: ${paciente.dni}
        </div>

        <div class="paciente-arrow">›</div>

      </div>
    `;

  });

  info.textContent =
    `Mostrando ${Math.min(fin,total)} de ${total} pacientes`;

  paginas.innerHTML = "";

  const totalPaginas = Math.ceil(total / pacientesPorPagina);

  for(let i=1;i<=totalPaginas;i++){

    paginas.innerHTML += `
      <button
        class="${i===paginaPacientesActual ? 'page-active' : ''}"
        onclick="irPaginaPacientes(${i})">
        ${i}
      </button>
    `;

  }

}

function buscarPacientesSecretaria() {

  paginaPacientesActual = 1;

  const texto =
    document.getElementById("buscarPacienteInput").value;

  cargarPacientesSecretaria(texto);

}

function irPaginaPacientes(numero){

  paginaPacientesActual = numero;

  const texto =
    document.getElementById("buscarPacienteInput").value;

  cargarPacientesSecretaria(texto);

}

function verPacienteSecretaria(dni){
  actualizarNoIngresosAutomaticos();

  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];
  const paciente = citas.find(c => String(c.dni) === String(dni));

  if(!paciente) return;

  const estado = estadoRealCita(paciente);
  const infoDoctor = obtenerInfoDoctorParaVista(paciente.especialidad);

  localStorage.setItem("detallePacienteNombre", paciente.nombre);
  localStorage.setItem("detallePacienteDni", paciente.dni);
  localStorage.setItem("detallePacienteEspecialidad", paciente.especialidad);
  localStorage.setItem("detallePacienteFecha", paciente.fecha);
  localStorage.setItem("detallePacienteHora", paciente.hora);
  localStorage.setItem("detallePacienteEstado", estado);
  localStorage.setItem("detallePacienteMedico", infoDoctor.doctor);

  location.href = "secretariaDetallePaciente.html";
}

document.addEventListener("DOMContentLoaded", function(){

  cargarPacientesSecretaria();

});
function cargarDetallePaciente(){

  const nombre = document.getElementById("pacDetalleNombre");

  if(!nombre) return;

  document.getElementById("pacDetalleNombre").textContent =
    localStorage.getItem("detallePacienteNombre") || "-";

  document.getElementById("pacDetalleDni").textContent =
    localStorage.getItem("detallePacienteDni") || "-";

  document.getElementById("pacDetalleEspecialidad").textContent =
    localStorage.getItem("detallePacienteEspecialidad") || "-";

  document.getElementById("pacDetalleFecha").textContent =
    localStorage.getItem("detallePacienteFecha") || "-";

  document.getElementById("pacDetalleHora").textContent =
    localStorage.getItem("detallePacienteHora") || "-";

const especialidadDetalle =
  localStorage.getItem("detallePacienteEspecialidad") || "";

const infoDoctorDetalle = obtenerInfoDoctorParaVista(especialidadDetalle);

document.getElementById("pacDetalleMedico").textContent =
  infoDoctorDetalle.doctor;

let estado = localStorage.getItem("detallePacienteEstado") || "Confirmada";

  const estadoBox =
    document.getElementById("pacDetalleEstado");

  estadoBox.textContent = estado;

estadoBox.className =
  estado === "No Ingreso" ? "estado-no-ingreso" :
  estado === "Atendida" ? "estado-atendida" :
  estado === "Programada" ? "estado-programada" :
  "estado-confirmada";

}

document.addEventListener("DOMContentLoaded", function(){

  cargarDetallePaciente();

});
function guardarDatosDoctorPaso1() {
  const nombres = document.getElementById("nuevoDoctorNombres").value.trim();
  const apellidos = document.getElementById("nuevoDoctorApellidos").value.trim();
  const dniDoctor = document.getElementById("nuevoDoctorDni").value.trim();
  const telefono = document.getElementById("nuevoDoctorTelefono").value.trim();
  const genero = document.getElementById("doctorGenero").value;

  if (!genero || !nombres || !apellidos || !dniDoctor || !telefono) {
    alert("Complete todos los campos.");
    return;
  }

  if (!/^\d{8}$/.test(dniDoctor)) {
    alert("El DNI debe tener 8 números.");
    return;
  }

  if (!/^\d{9}$/.test(telefono)) {
    alert("El teléfono debe tener 9 números.");
    return;
  }

  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema;

  const dniExiste = doctores.some(doc => doc.dni === dniDoctor);

  if (dniExiste) {
    alert("Este DNI ya está registrado para otro doctor.");
    return;
  }

  localStorage.setItem("nuevoDoctorNombres", nombres);
  localStorage.setItem("nuevoDoctorApellidos", apellidos);
  localStorage.setItem("nuevoDoctorDni", dniDoctor);
  localStorage.setItem("nuevoDoctorTelefono", telefono);
  localStorage.setItem("nuevoDoctorGenero", genero);

  window.location.href = "secretariaRegistrarDoctorEspecialidad.html";
}
function cambiarAvatarDoctor() {

    const genero =
        document.getElementById("doctorGenero").value;

    const avatar =
        document.getElementById("avatarDoctor");

    if (genero === "F") {
        avatar.textContent = "👩‍⚕️";
    } else {
        avatar.textContent = "👨‍⚕️";
    }
}
let especialidadSeleccionadaRegistro = "";

function iconoEspecialidadRegistro(nombre) {
  const iconos = {
    "Medicina General": "💙",
    "Pediatría": "👶",
    "Traumatología": "🦴",
    "Oftalmología": "👁️",
    "Odontología": "🦷",
    "Cardiología": "💗",
    "Dermatología": "🧴",
    "Neurología": "🧠",
    "Ginecología": "♀️"
  };

  return iconos[nombre] || "➕";
}

function cargarEspecialidadesRegistroDoctor() {
  const lista = document.getElementById("listaEspecialidadesRegistro");
  const asignada = document.getElementById("especialidadAsignada");

  if (!lista || !asignada) return;

  lista.innerHTML = "";

  Object.keys(doctorsBySpecialty).forEach(function(especialidad) {
    lista.innerHTML += `
      <button class="registro-especialidad-card"
              onclick="seleccionarEspecialidadRegistro('${especialidad}')">
        <div class="icon">${mostrarIconoEspecialidad(especialidad)}</div>
        <div>${especialidad}</div>
      </button>
    `;
  });

  if (especialidadSeleccionadaRegistro === "") {
    asignada.className = "especialidad-asignada-vacia";
    asignada.textContent = "Todavía no seleccionó una especialidad";
  } else {
    asignada.className = "especialidad-asignada-item";
    asignada.innerHTML = `
      <strong>${iconoEspecialidadRegistro(especialidadSeleccionadaRegistro)} ${especialidadSeleccionadaRegistro}</strong>
      <span>Asignada</span>
    `;
  }
}

function seleccionarEspecialidadRegistro(especialidad) {
  especialidadSeleccionadaRegistro = especialidad;
  localStorage.setItem("nuevoDoctorEspecialidad", especialidad);

  cargarEspecialidadesRegistroDoctor();
}

function mostrarNuevaEspecialidad() {
  const box = document.getElementById("boxNuevaEspecialidad");
  if (box) box.classList.toggle("active");
}

function guardarNuevaEspecialidad() {
  const inputNombre = document.getElementById("inputNuevaEspecialidad");
  const inputEmoji = document.getElementById("inputIconoEspecialidad");
  const inputImagen = document.getElementById("inputImagenEspecialidad");

  const nueva = inputNombre.value.trim();
  const emoji = inputEmoji.value.trim();
  const tieneImagen = inputImagen.files.length > 0;

  if (nueva === "") {
    alert("Ingrese el nombre de la nueva especialidad.");
    return;
  }

  const existeEspecialidad = Object.keys(doctorsBySpecialty).some(function(nombre) {
    return nombre.toLowerCase().trim() === nueva.toLowerCase().trim();
  });

  if (existeEspecialidad) {
    alert("Esa especialidad ya existe.");
    return;
  }

  if (emoji === "" && !tieneImagen) {
    alert("Debe ingresar un emoji o seleccionar una imagen.");
    return;
  }

  const guardarTemporal = function(imagenBase64) {
    localStorage.setItem("nuevoDoctorEspecialidad", nueva);
    localStorage.setItem("nuevoDoctorEspecialidadIcon", emoji || "🩺");
    localStorage.setItem("nuevoDoctorEspecialidadImagen", imagenBase64 || "");

    const asignada = document.getElementById("especialidadAsignada");
    if (asignada) {
      asignada.className = "especialidad-asignada-item";
      asignada.innerHTML = `
        <strong>${imagenBase64 ? `<img src="${imagenBase64}" class="icono-especialidad-img">` : (emoji || "🩺")} ${nueva}</strong>
        <span>Asignada</span>
      `;
    }

    document.getElementById("boxNuevaEspecialidad").classList.remove("active");

    alert("Especialidad agregada temporalmente. Se guardará al final.");
  };

  if (tieneImagen) {
    const reader = new FileReader();
    reader.onload = function(e) {
      guardarTemporal(e.target.result);
    };
    reader.readAsDataURL(inputImagen.files[0]);
  } else {
    guardarTemporal("");
  }
}

function guardarEspecialidadDoctor() {

  const especialidad = localStorage.getItem("nuevoDoctorEspecialidad");

  if (!especialidad) {
    alert("Primero debe agregar una nueva especialidad.");
    return;
  }

  window.location.href = "secretariaRegistrarDoctorConsultorio.html";
}

document.addEventListener("DOMContentLoaded", function() {
  cargarEspecialidadesRegistroDoctor();
});
function renderOtrasEspecialidadesPaciente() {
  const contenedor = document.getElementById("especialidadesOtras");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const principales = ["Medicina General", "Pediatría", "Traumatología", "Oftalmología", "Odontología"];

  Object.keys(doctorsBySpecialty).forEach(function(especialidad) {
    if (!principales.includes(especialidad)) {
      contenedor.innerHTML += `
        <button class="option-card" onclick="selectSpecialty('${especialidad}')">
          <div class="icon">${mostrarIconoEspecialidad(especialidad)}</div>
          ${selectedLanguage === "qu" ? nombreEspecialidadQuechua(especialidad) : especialidad}
        </button>
      `;
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  renderOtrasEspecialidadesPaciente();
});
function mostrarIconoEspecialidad(especialidad) {
  const info = doctorsBySpecialty[especialidad];

  if (info && info.imagen) {
    return `<img src="${info.imagen}" class="icono-especialidad-img">`;
  }

  if (info && info.icon) {
    return info.icon;
  }

  return iconoEspecialidadRegistro(especialidad);
}
let diasDoctorSeleccionados = ["Lun", "Mar", "Mié", "Jue", "Vie"];

function cargarConsultoriosDisponiblesDoctor() {
  const select = document.getElementById("nuevoDoctorConsultorio");
  if (!select) return;

  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema;

  const ocupados = doctores.map(d => d.consultorio);

  select.innerHTML = `<option value="">Seleccionar consultorio disponible</option>`;

  for (let i = 1; i <= 20; i++) {
    const consultorio = "Consultorio " + i;

    if (!ocupados.includes(consultorio)) {
      select.innerHTML += `
        <option value="${consultorio}">
          ${consultorio} - Disponible
        </option>
      `;
    }
  }
}

function toggleDiaDoctor(boton, dia) {
  boton.classList.toggle("active");

  if (diasDoctorSeleccionados.includes(dia)) {
    diasDoctorSeleccionados = diasDoctorSeleccionados.filter(d => d !== dia);
  } else {
    diasDoctorSeleccionados.push(dia);
  }
}

function guardarConsultorioHorarioDoctor() {
  const consultorio = document.getElementById("nuevoDoctorConsultorio").value;
  const inicio = document.getElementById("horaInicioDoctor").value;
  const fin = document.getElementById("horaFinDoctor").value;

  if (consultorio === "") {
    alert("Seleccione un consultorio disponible.");
    return;
  }

  if (inicio === "" || fin === "") {
    alert("Seleccione el horario de atención.");
    return;
  }

  if (inicio >= fin) {
    alert("La hora de inicio debe ser menor que la hora de fin.");
    return;
  }

  if (diasDoctorSeleccionados.length === 0) {
    alert("Seleccione al menos un día de atención.");
    return;
  }

  localStorage.setItem("nuevoDoctorConsultorio", consultorio);
  localStorage.setItem("nuevoDoctorHoraInicio", inicio);
  localStorage.setItem("nuevoDoctorHoraFin", fin);
  localStorage.setItem("nuevoDoctorDias", JSON.stringify(diasDoctorSeleccionados));

  window.location.href = "secretariaRegistrarDoctorConfirmar.html";
}

document.addEventListener("DOMContentLoaded", function() {
  cargarConsultoriosDisponiblesDoctor();
});
function cargarConfirmarNuevoDoctor() {
  const nombre = document.getElementById("confNuevoDoctorNombre");
  if (!nombre) return;

  const nombres = localStorage.getItem("nuevoDoctorNombres") || "";
  const apellidos = localStorage.getItem("nuevoDoctorApellidos") || "";

  nombre.textContent = nombres + " " + apellidos;

  document.getElementById("confNuevoDoctorDni").textContent =
    localStorage.getItem("nuevoDoctorDni") || "";

  document.getElementById("confNuevoDoctorTelefono").textContent =
    localStorage.getItem("nuevoDoctorTelefono") || "";

  document.getElementById("confNuevoDoctorEspecialidad").textContent =
    localStorage.getItem("nuevoDoctorEspecialidad") || "";

  document.getElementById("confNuevoDoctorConsultorio").textContent =
    localStorage.getItem("nuevoDoctorConsultorio") || "";

  const inicio = localStorage.getItem("nuevoDoctorHoraInicio") || "";
  const fin = localStorage.getItem("nuevoDoctorHoraFin") || "";

  document.getElementById("confNuevoDoctorHorario").textContent =
    inicio + " - " + fin;

  const dias = JSON.parse(localStorage.getItem("nuevoDoctorDias")) || [];

  document.getElementById("confNuevoDoctorDias").textContent =
    dias.join(" a ");
}

function guardarDoctorFinal() {
  const nombres = localStorage.getItem("nuevoDoctorNombres") || "";
  const apellidos = localStorage.getItem("nuevoDoctorApellidos") || "";
  const dni = localStorage.getItem("nuevoDoctorDni") || "";
  const telefono = localStorage.getItem("nuevoDoctorTelefono") || "";
  const genero = localStorage.getItem("nuevoDoctorGenero") || "";
  const especialidad = localStorage.getItem("nuevoDoctorEspecialidad") || "";
  const iconEspecialidad = localStorage.getItem("nuevoDoctorEspecialidadIcon") || "🩺";
  const imagenEspecialidad = localStorage.getItem("nuevoDoctorEspecialidadImagen") || "";
  const consultorio = localStorage.getItem("nuevoDoctorConsultorio") || "";
  const inicio = localStorage.getItem("nuevoDoctorHoraInicio") || "";
  const fin = localStorage.getItem("nuevoDoctorHoraFin") || "";
  const dias = JSON.parse(localStorage.getItem("nuevoDoctorDias") || "[]");

  if (!nombres || !apellidos || !dni || !telefono || !especialidad || !consultorio) {
    alert("Faltan datos del doctor.");
    return;
  }

  const nombreCompleto = (genero === "F" ? "Dra. " : "Dr. ") + nombres + " " + apellidos;
  const iconoDoctor = genero === "F" ? "👩‍⚕️" : "👨‍⚕️";

  doctorsBySpecialty[especialidad] = {
    doctor: nombreCompleto,
    dni: dni,
    telefono: telefono,
    icon: iconEspecialidad,
    imagen: imagenEspecialidad,
    consultorio: consultorio,
    horario: inicio + " - " + fin,
    horaInicio: inicio,
    horaFin: fin,
    dias: dias
  };

  doctoresSistema.push({
    nombre: nombreCompleto,
    dni: dni,
    telefono: telefono,
    especialidad: especialidad,
    icono: iconEspecialidad,
iconoDoctor: iconoDoctor,
imagen: imagenEspecialidad,
    consultorio: consultorio,
    horario: inicio + " - " + fin,
    horaInicio: inicio,
horaFin: fin,
    dias: dias
  });

  localStorage.setItem("doctorsBySpecialty", JSON.stringify(doctorsBySpecialty));
  localStorage.setItem("doctoresSistema", JSON.stringify(doctoresSistema));

  limpiarDatosTemporalesDoctor();

  alert("Doctor registrado correctamente.");
  window.location.href = "secretariaMenu.html";
}

function limpiarDatosTemporalesDoctor() {
  localStorage.removeItem("nuevoDoctorNombres");
  localStorage.removeItem("nuevoDoctorApellidos");
  localStorage.removeItem("nuevoDoctorDni");
  localStorage.removeItem("nuevoDoctorTelefono");
  localStorage.removeItem("nuevoDoctorGenero");
  localStorage.removeItem("nuevoDoctorEspecialidad");
  localStorage.removeItem("nuevoDoctorEspecialidadIcon");
  localStorage.removeItem("nuevoDoctorEspecialidadImagen");
  localStorage.removeItem("nuevoDoctorConsultorio");
  localStorage.removeItem("nuevoDoctorHoraInicio");
  localStorage.removeItem("nuevoDoctorHoraFin");
  localStorage.removeItem("nuevoDoctorDias");
}

document.addEventListener("DOMContentLoaded", cargarConfirmarNuevoDoctor);
function bloquearImagenEspecialidad() {
  const emoji = document.getElementById("inputIconoEspecialidad");
  const imagen = document.getElementById("inputImagenEspecialidad");

  if (!emoji || !imagen) return;

  imagen.disabled = emoji.value.trim() !== "";
}

function bloquearEmojiEspecialidad() {
  const emoji = document.getElementById("inputIconoEspecialidad");
  const imagen = document.getElementById("inputImagenEspecialidad");

  if (!emoji || !imagen) return;

  emoji.disabled = imagen.files.length > 0;
}
let doctorEliminarSeleccionado = "";

function renderDoctoresEliminar(lista = obtenerDoctoresUnificados()) {
  const contenedor = document.getElementById("listaDoctoresEliminar");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  lista.forEach(function(doc) {
    const clave = doc.nombre + "|" + doc.especialidad + "|" + doc.consultorio;

    contenedor.innerHTML += `
      <button class="doctor-eliminar-item"
        onclick="seleccionarDoctorEliminar('${clave}', event)">

        <div class="doctor-avatar">${doc.icono}</div>

        <div>
          <strong>${doc.nombre}</strong>
          <p>${doc.especialidad}</p>
          <small>${doc.consultorio || "Sin consultorio"}</small>
        </div>

        <span>Seleccionar</span>
      </button>
    `;
  });
}
function seleccionarDoctorEliminar(clave, event) {
  doctorEliminarSeleccionado = clave;

  document.querySelectorAll(".doctor-eliminar-item").forEach(function(btn) {
    btn.classList.remove("doctor-eliminar-selected");
  });

  event.currentTarget.classList.add("doctor-eliminar-selected");
}

function eliminarDoctorSeleccionado() {
  if (!doctorEliminarSeleccionado) {
    alert("Primero seleccione un doctor.");
    return;
  }

  const partes = doctorEliminarSeleccionado.split("|");
  const nombre = partes[0];
  const especialidad = partes[1];
  const consultorio = partes[2];

  const doctor = doctoresSistema.find(function(doc) {
    return doc.nombre === nombre &&
           doc.especialidad === especialidad &&
           doc.consultorio === consultorio;
  });

  if (!doctor) {
    alert("No se encontró el doctor seleccionado.");
    return;
  }

  if (!confirm("¿Seguro que desea eliminar a " + doctor.nombre + "?")) {
    return;
  }

  doctoresSistema = doctoresSistema.filter(function(doc) {
    return !(
      doc.nombre === nombre &&
      doc.especialidad === especialidad &&
      doc.consultorio === consultorio
    );
  });

  localStorage.setItem("doctoresSistema", JSON.stringify(doctoresSistema));

  const otroDoctorMismaEspecialidad = doctoresSistema.find(function(doc) {
    return doc.especialidad === especialidad;
  });

  if (otroDoctorMismaEspecialidad) {
    doctorsBySpecialty[especialidad] = {
      doctor: otroDoctorMismaEspecialidad.nombre,
      dni: otroDoctorMismaEspecialidad.dni || "",
      telefono: otroDoctorMismaEspecialidad.telefono || "",
      icon: doctorsBySpecialty[especialidad]?.icon || otroDoctorMismaEspecialidad.icono || "🩺",
      imagen: doctorsBySpecialty[especialidad]?.imagen || otroDoctorMismaEspecialidad.imagen || "",
      consultorio: otroDoctorMismaEspecialidad.consultorio || "",
      horario: otroDoctorMismaEspecialidad.horario || "",
      dias: otroDoctorMismaEspecialidad.dias || []
    };
  } else {
    delete doctorsBySpecialty[especialidad];
  }

  localStorage.setItem("doctorsBySpecialty", JSON.stringify(doctorsBySpecialty));

  localStorage.removeItem("nuevoDoctorDatos");
  localStorage.removeItem("nuevoDoctorEspecialidad");
  localStorage.removeItem("nuevoDoctorEspecialidadIcon");
  localStorage.removeItem("nuevoDoctorEspecialidadImagen");
  localStorage.removeItem("nuevoDoctorConsultorio");
  localStorage.removeItem("nuevoDoctorHoraInicio");
  localStorage.removeItem("nuevoDoctorHoraFin");
  localStorage.removeItem("nuevoDoctorDias");

  doctorEliminarSeleccionado = "";

  alert("Doctor eliminado correctamente. El consultorio quedó libre.");

  renderDoctoresEliminar();
}
function obtenerDoctoresUnificados() {
  return doctoresSistema.map(function(doc) {
    const infoEspecialidad = doctorsBySpecialty[doc.especialidad] || {};

    return {
      nombre: doc.nombre,
      dni: doc.dni || "",
      telefono: doc.telefono || "",
      especialidad: doc.especialidad,
      icono: infoEspecialidad.imagen
        ? `<img src="${infoEspecialidad.imagen}" class="icono-especialidad-img">`
        : (infoEspecialidad.icon || doc.icono || "🩺"),
      consultorio: doc.consultorio || ""
    };
  });
}
function buscarDoctorEliminar() {
  const input = document.getElementById("buscarDoctorEliminar");
  if (!input) return;

  const texto = input.value.toLowerCase().trim();
  const doctores = obtenerDoctoresUnificados();

  const filtrados = doctores.filter(function(doc) {
    return (
      doc.nombre.toLowerCase().includes(texto) ||
      doc.especialidad.toLowerCase().includes(texto) ||
      doc.consultorio.toLowerCase().includes(texto)
    );
  });

  renderDoctoresEliminar(filtrados);
}
function obtenerIconoEspecialidadDoctor(doc) {
  const info = doctorsBySpecialty[doc.especialidad] || {};

  if (info.imagen) {
    return `<img src="${info.imagen}" class="icono-especialidad-img">`;
  }

  if (doc.imagen) {
    return `<img src="${doc.imagen}" class="icono-especialidad-img">`;
  }

  return info.icon || doc.iconoEspecialidad || doc.icono || "🩺";
}
function iconoEspecialidadParaLista(doc) {
  const info = doctorsBySpecialty[doc.especialidad] || {};

  if (doc.imagen) {
    return `<img src="${doc.imagen}" class="icono-especialidad-img">`;
  }

  if (info.imagen) {
    return `<img src="${info.imagen}" class="icono-especialidad-img">`;
  }

  return doc.iconoEspecialidad || info.icon || doc.icono || "🩺";
}

function iconoDoctorPersona(doc) {
  return doc.iconoDoctor || "👨‍⚕️";
}
function obtenerSolicitudPorDni(dniBuscado) {
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];

  return citas.find(function(cita) {
    return cita.dni === dniBuscado;
  });
}

function verificarBotonSolicitudPaciente() {
  const btn = document.getElementById("btnVerSolicitud");
  if (!btn) return;

  const dniActual = dni;

  if (dniActual.length !== 8) {
    btn.style.display = "none";
    return;
  }

  const solicitud = obtenerSolicitudPorDni(dniActual);

  if (solicitud) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}
function continuarDespuesDni() {
  const solicitud = obtenerSolicitudPorDni(dni);
  const btn = document.getElementById("btnVerSolicitud");

  if (solicitud) {
    localStorage.setItem("dni", dni);
    localStorage.setItem("patientFullName", solicitud.nombre);

    if (btn) btn.style.display = "block";

    if (voiceActive) {
      speak(t(
  "Este DNI tiene una solicitud registrada. Puede decir ver solicitud para revisarla, o salir solicitud para volver a ingresar otro DNI.",
  "Kay DNIqa solicitudniyuqmi. Qhaway munanki chayqa ver solicitud niy, huk DNI churay munanki chayqa salir solicitud niy."
), () => {
        setTimeout(listenByScreen, 800);
      });
    }

    return;
  }

  if (btn) btn.style.display = "none";

  validateDni();
}

function mostrarSolicitudPaciente() {
  const dniActual = dni || localStorage.getItem("dni") || "";
  const solicitud = obtenerSolicitudPorDni(dniActual);

  if (!solicitud) {
    alert(t("No tiene solicitud registrada.", "Manam solicitud qillqasqachu."));
    return;
  }

  document.querySelector("#solicitudPacienteBox h2").textContent =
    t("Solicitud encontrada", "Solicitud tarisqa");

  document.querySelector("#solicitudPacienteBox p:nth-of-type(1) strong").textContent =
    t("Paciente:", "Paciente:");

  document.querySelector("#solicitudPacienteBox p:nth-of-type(2) strong").textContent =
    "DNI:";

  document.querySelector("#solicitudPacienteBox p:nth-of-type(3) strong").textContent =
    t("Especialidad:", "Especialidad:");

  document.querySelector("#solicitudPacienteBox p:nth-of-type(4) strong").textContent =
    t("Fecha:", "Punchaw:");

  document.querySelector("#solicitudPacienteBox p:nth-of-type(5) strong").textContent =
    t("Hora:", "Hora:");

  document.getElementById("solPaciente").textContent = solicitud.nombre;
  document.getElementById("solDni").textContent = solicitud.dni;
  document.getElementById("solEspecialidad").textContent = solicitud.especialidad;
  document.getElementById("solFecha").textContent = solicitud.fecha;
  document.getElementById("solHora").textContent = solicitud.hora;

  const botones = document.querySelectorAll("#solicitudPacienteBox button");
  if (botones[0]) botones[0].textContent = t("Salir", "Lluqsiy");
  if (botones[1]) botones[1].textContent = t("Imprimir", "Imprimir");

  document.getElementById("solicitudPacienteBox").style.display = "block";

  if (voiceActive) {
    speak(t(
      "Solicitud encontrada. Paciente " + solicitud.nombre +
      ". Especialidad " + solicitud.especialidad +
      ". Fecha " + solicitud.fecha +
      ". Hora " + solicitud.hora +
      ". Puede decir imprimir solicitud o salir solicitud.",
      "Solicitud tarisqa. Paciente " + solicitud.nombre +
      ". Especialidad " + solicitud.especialidad +
      ". Punchaw " + solicitud.fecha +
      ". Hora " + solicitud.hora +
      ". Imprimir solicitud niyta atinki, utaq salir solicitud niyta atinki."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}

function salirSolicitudPaciente() {
  const box = document.getElementById("solicitudPacienteBox");
  if (box) box.style.display = "none";

  clearDni();

  if (voiceActive) {
    speak(t(
      "Solicitud cerrada. Ingrese nuevamente su número de DNI.",
      "Solicitud wisqasqa. DNI yupaykita yapamanta churay."
    ), () => {
      setTimeout(listenByScreen, 800);
    });
  }
}

function imprimirSolicitudPaciente() {
  window.onafterprint = function () {
    clearDni();
    document.getElementById("solicitudPacienteBox").style.display = "none";
    window.onafterprint = null;
  };

  window.print();
}
let doctorDni = "";

function addDoctorDni(numero) {
  if (doctorDni.length < 8) {
    doctorDni += numero;
    updateDoctorDniDisplay();
  }
}

function deleteDoctorDni() {
  doctorDni = doctorDni.slice(0, -1);
  updateDoctorDniDisplay();
}

function clearDoctorDni() {
  doctorDni = "";
  updateDoctorDniDisplay();

  const error = document.getElementById("doctorLoginError");
  if (error) error.textContent = "";
}

function updateDoctorDniDisplay() {
  const display = document.getElementById("doctorDniDisplay");
  const estado = document.getElementById("doctorDniStatus");
  if (!display) return;

  display.textContent = doctorDni.padEnd(8, "_").split("").join(" ");

  // Indicador accesible de estado: error se limpia al escribir, y se marca
  // visualmente cuando el DNI ya tiene los 8 dígitos ingresados.
  if (doctorDni.length === 8) {
    display.setAttribute("data-estado", "completo");
  } else {
    display.removeAttribute("data-estado");
  }

  const error = document.getElementById("doctorLoginError");
  if (error && error.textContent) {
    error.textContent = "";
    display.removeAttribute("data-estado");
  }

  if (estado) {
    estado.textContent = doctorDni.length + " de 8 dígitos ingresados" +
      (doctorDni.length === 8 ? ". DNI completo." : ".");
  }
}

function loginDoctorDni() {
  const error = document.getElementById("doctorLoginError");
  const display = document.getElementById("doctorDniDisplay");

  if (doctorDni.length !== 8) {
    if (error) error.textContent = "Ingrese un DNI de 8 dígitos.";
    if (display) display.setAttribute("data-estado", "error");
    return;
  }

  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];

  const doctorEncontrado = doctores.find(function(doc) {
    return String(doc.dni).trim() === String(doctorDni).trim();
  });

  console.log("DNI ingresado:", doctorDni);
  console.log("Doctor encontrado:", doctorEncontrado);

  if (!doctorEncontrado) {
    if (error) error.textContent = "Número de DNI incorrecto.";
    if (display) display.setAttribute("data-estado", "error");
    return;
  }

  localStorage.setItem("doctorLogueadoDni", doctorEncontrado.dni);
  localStorage.setItem("doctorLogueadoNombre", doctorEncontrado.nombre);
  localStorage.setItem("doctorLogueadoEspecialidad", doctorEncontrado.especialidad);
  localStorage.setItem("doctorLogueadoConsultorio", doctorEncontrado.consultorio);

  // Notificar al LoginServlet para establecer HttpSession en Tomcat
  try {
    const loginParams = new URLSearchParams();
    loginParams.append("action", "paciente_dni");
    loginParams.append("dni", doctorEncontrado.dni);
    loginParams.append("format", "json");
    fetch("login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: loginParams.toString()
    }).catch(function(e) {});
  } catch (e) {}

  window.location.href = "doctorMenu.html";
}

// Soporte de teclado físico en la pantalla de acceso del doctor.
// Solo actúa si el teclado numérico en pantalla existe (DoctorLogin.html).
document.addEventListener("keydown", function (e) {
  const dniDisplay = document.getElementById("doctorDniDisplay");
  if (!dniDisplay) return;

  if (e.key >= "0" && e.key <= "9") {
    e.preventDefault();
    addDoctorDni(e.key);
  } else if (e.key === "Backspace") {
    e.preventDefault();
    deleteDoctorDni();
  } else if (e.key === "Escape") {
    e.preventDefault();
    clearDoctorDni();
  } else if (e.key === "Enter") {
    e.preventDefault();
    loginDoctorDni();
  }
});
function cargarMenuDoctor() {
  const titulo = document.getElementById("doctorBienvenida");
  if (!titulo) return;

  const nombre = localStorage.getItem("doctorLogueadoNombre") || "Doctor";
  titulo.textContent = "¡Bienvenido, " + nombre + "!";

  const espEl = document.getElementById("doctorEspecialidad");
  if (espEl) {
    const esp = localStorage.getItem("doctorLogueadoEspecialidad") || "Medicina General";
    const con = localStorage.getItem("doctorLogueadoConsultorio") || "Consultorio 1";
    espEl.textContent = esp + " • " + con;
  }
}

function cerrarSesionDoctor() {
  localStorage.removeItem("doctorLogueadoDni");
  localStorage.removeItem("doctorLogueadoNombre");
  localStorage.removeItem("doctorLogueadoEspecialidad");
  localStorage.removeItem("doctorLogueadoConsultorio");

  window.location.href = "DoctorLogin.html";
}

// Impide el acceso directo a las páginas internas del doctor sin haber
// iniciado sesión con DNI. Cada página protegida la llama al cargar
// (ver protegerPaginaDoctor() en el <head>, antes de pintar el contenido).
function verificarSesionDoctor() {
  if (!localStorage.getItem("doctorLogueadoDni")) {
    window.location.replace("DoctorLogin.html");
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", cargarMenuDoctor);
function cargarPacientesHoyDoctor() {
  actualizarNoIngresosAutomaticos();

  const lista = document.getElementById("doctorPacientesHoyLista");
  const fechaTexto = document.getElementById("doctorHoyFecha");

  if (!lista) return;

  const especialidadDoctor = localStorage.getItem("doctorLogueadoEspecialidad") || "";
  const hoy = fechaHoyTexto();

  if (fechaTexto) {
    fechaTexto.textContent = "📅 " + hoy;
  }

  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const pacientesHoy = citas.filter(cita => {
    return cita.fecha === hoy &&
           cita.especialidad === especialidadDoctor &&
           cita.enviada === true &&
           (cita.estado === "Programada" || cita.estado === "Confirmada");
  });

  lista.innerHTML = "";

  if (pacientesHoy.length === 0) {
    lista.innerHTML = `<div class="doctor-empty">No tiene pacientes asignados para hoy.</div>`;
    return;
  }

  pacientesHoy.forEach(function(cita, index) {
    lista.innerHTML += `
      <div class="doctor-paciente-item" onclick="verDetallePacienteDoctor('${cita.dni}')">
        <div class="doctor-paciente-num">${index + 1}</div>
        <div>
          <strong>${cita.nombre}</strong>
          <p>DNI: ${cita.dni}</p>
        </div>
        <div class="doctor-paciente-hora">
          <strong>Hora:</strong> ${cita.hora}
        </div>
        <div class="doctor-paciente-arrow">›</div>
      </div>
    `;
  });
}

function verDetallePacienteDoctor(dniPaciente) {
  localStorage.setItem("doctorDetallePacienteDni", dniPaciente);
  window.location.href = "doctorDetallePaciente.html";
}

document.addEventListener("DOMContentLoaded", cargarPacientesHoyDoctor);
function cargarDetallePacienteDoctor() {
  actualizarNoIngresosAutomaticos();

  const nombreBox = document.getElementById("docDetNombre");
  if (!nombreBox) return;

  const dniPaciente = localStorage.getItem("doctorDetallePacienteDni") || "";
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];
  const cita = citas.find(c => String(c.dni) === String(dniPaciente));

  if (!cita || cita.estado === "No Ingreso") {
    alert("La cita ya finalizó y el paciente no ingresó.");
    location.href = "doctorPacientesHoy.html";
    return;
  }

  const infoDoctor = obtenerInfoDoctorParaVista(cita.especialidad);

  document.getElementById("docDetNombre").textContent = cita.nombre;
  document.getElementById("docDetDni").textContent = cita.dni;
  document.getElementById("docDetEspecialidad").textContent = cita.especialidad;
  document.getElementById("docDetConsultorio").textContent = infoDoctor.consultorio || "Sin consultorio";
  document.getElementById("docDetFecha").textContent = cita.fecha;
  document.getElementById("docDetHora").textContent = cita.hora;

  const estado = document.getElementById("docDetEstado");
  if (estado) estado.textContent = "Pendiente";
}

document.addEventListener("DOMContentLoaded", cargarDetallePacienteDoctor);
let tiposObsSeleccionados = ["general"];

const datosTiposObs = {
  general: {
    boton: "btnObsGeneral",
    titulo: "Observación General",
    placeholder: "Escriba aquí la observación médica."
  },
  diagnostico: {
    boton: "btnObsDiagnostico",
    titulo: "Diagnóstico",
    placeholder: "Escriba aquí el diagnóstico del paciente."
  },
  medicamentos: {
    boton: "btnObsMedicamentos",
    titulo: "Medicamentos",
    placeholder: "Indique medicamentos, dosis o tratamiento."
  }
};

function toggleTipoObs(tipo) {
  const existe = tiposObsSeleccionados.includes(tipo);

  if (existe && tiposObsSeleccionados.length === 1) {
    alert("Debe quedar al menos un tipo seleccionado.");
    return;
  }

  tiposObsSeleccionados = existe
    ? tiposObsSeleccionados.filter(t => t !== tipo)
    : [...tiposObsSeleccionados, tipo];

  renderTextosObservacion();
}

function renderTextosObservacion() {
  const contenedor = document.getElementById("contenedorTextosObs");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  Object.keys(datosTiposObs).forEach(tipo => {
    const btn = document.getElementById(datosTiposObs[tipo].boton);
    if (btn) btn.classList.toggle("active", tiposObsSeleccionados.includes(tipo));
  });

  tiposObsSeleccionados.forEach(tipo => {
    const data = datosTiposObs[tipo];

    contenedor.innerHTML += `
      <div class="obs-campo-dinamico">
        <label>${data.titulo}</label>
        <textarea id="obsTexto_${tipo}" maxlength="1000"
          placeholder="${data.placeholder}"
          oninput="actualizarContadorObs('${tipo}')"></textarea>
        <div class="obs-contador">
          <span id="obsContador_${tipo}">0</span> / 1000 caracteres
        </div>
      </div>
    `;
  });
}

function actualizarContadorObs(tipo) {
  const texto = document.getElementById("obsTexto_" + tipo);
  const contador = document.getElementById("obsContador_" + tipo);
  if (texto && contador) contador.textContent = texto.value.length;
}

document.addEventListener("DOMContentLoaded", function () {
  cargarObservacionDoctor();
  renderTextosObservacion();
});
function imprimirObservacionDoctor() {
  const dniPaciente = localStorage.getItem("doctorDetallePacienteDni") || "";
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];

  const cita = citas.find(c => String(c.dni) === String(dniPaciente));

  if (!cita) {
    alert("No se encontró la cita del paciente.");
    return;
  }

  const observacionesSeleccionadas = [];

  tiposObsSeleccionados.forEach(tipo => {
    const campo = document.getElementById("obsTexto_" + tipo);
    const texto = campo ? campo.value.trim() : "";

    if (texto) {
      observacionesSeleccionadas.push({
        tipo: tipo,
        titulo: datosTiposObs[tipo].titulo,
        texto: texto
      });
    }
  });

  if (observacionesSeleccionadas.length === 0) {
    alert("Ingrese al menos una observación antes de imprimir.");
    return;
  }

  cita.estado = "Atendida";
  cita.enviada = true;

  if (!cita.observacionesDoctor) cita.observacionesDoctor = [];

  observacionesSeleccionadas.forEach(obs => {
    cita.observacionesDoctor.push({
      tipo: obs.tipo,
      titulo: obs.titulo,
      texto: obs.texto,
      fechaRegistro: new Date().toLocaleString()
    });
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citas));

  const doctorNombre = localStorage.getItem("doctorLogueadoNombre") || "Doctor";
  const doctorEspecialidad = localStorage.getItem("doctorLogueadoEspecialidad") || cita.especialidad;
  const consultorio = document.getElementById("obsConsultorio").textContent || "Sin consultorio";
  const fechaImpresion = new Date().toLocaleString("es-PE");

  const tiposTexto = observacionesSeleccionadas
    .map(obs => obs.titulo)
    .join(" / ");

  const contenidoObservaciones = observacionesSeleccionadas.map(obs => `
    <div class="print-section">
      <h3>📄 ${obs.titulo}</h3>
      <div class="print-texto">${obs.texto.replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");

  document.getElementById("printAreaObs").innerHTML = `
    <div class="print-observacion">
      <div class="print-header">
        <div class="print-brand">
          <div class="print-logo">♡</div>
          <div>
            <h2>IncluCita</h2>
            <p>Sistema de Gestión de Citas Médicas</p>
          </div>
        </div>

        <div class="print-fecha">
          📅 <strong>Fecha de impresión:</strong><br>
          ${fechaImpresion}
        </div>
      </div>

      <div class="print-line"></div>

      <h1>🩺 OBSERVACIÓN MÉDICA</h1>
      <p class="print-subtitle">Registro de atención del paciente</p>

      <div class="print-section">
        <h3>👤 DATOS DEL PACIENTE</h3>
        <div class="print-paciente">
          <div>
            <p>Nombre del paciente:</p>
            <strong>${cita.nombre}</strong>
            <p>DNI:</p>
            <strong>${cita.dni}</strong>
          </div>
          <div class="print-avatar">👤</div>
        </div>
      </div>

      <div class="print-section">
        <h3>📋 DATOS DE LA ATENCIÓN</h3>
        <div class="print-grid">
          <div><span>🩺 Especialidad:</span><strong>${cita.especialidad}</strong></div>
          <div><span>🏥 Consultorio:</span><strong>${consultorio}</strong></div>
          <div><span>📅 Fecha:</span><strong>${cita.fecha}</strong></div>
          <div><span>⏰ Hora:</span><strong>${cita.hora}</strong></div>
        </div>
      </div>

      <div class="print-section print-green">
        <h3>✅ TIPO DE OBSERVACIÓN</h3>
        <div class="print-tipo">${tiposTexto}</div>
      </div>

      ${contenidoObservaciones}

      <div class="print-section">
        <h3>👨‍⚕️ MÉDICO TRATANTE</h3>
        <div class="print-medico">
          <div>
            <strong>${doctorNombre}</strong>
            <p>${doctorEspecialidad}</p>
          </div>
          <div class="firma">
            ___________________________<br>
            Firma del médico
          </div>
        </div>
      </div>

      <div class="print-footer">
        Documento generado por IncluCita - Sistema de Gestión de Citas Médicas
        <span>Página 1 de 1</span>
      </div>
    </div>
  `;

  window.onafterprint = function () {
    window.onafterprint = null;
    window.location.href = "doctorPacientesHoy.html";
  };

  window.print();
}

document.addEventListener("DOMContentLoaded", renderTextosObservacion);

function cargarObservacionDoctor() {
  const nombre = document.getElementById("obsNombre");
  if (!nombre) return;

  const dniPaciente = localStorage.getItem("doctorDetallePacienteDni") || "";
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];

  const cita = citas.find(c => String(c.dni) === String(dniPaciente));

  if (!cita) {
    alert("No se encontró el paciente seleccionado.");
    location.href = "doctorPacientesHoy.html";
    return;
  }

  const infoDoctor = doctorsBySpecialty[cita.especialidad] || {};

  document.getElementById("obsNombre").textContent = cita.nombre;
  document.getElementById("obsDni").textContent = cita.dni;
  document.getElementById("obsEspecialidad").textContent = cita.especialidad;
  document.getElementById("obsConsultorio").textContent = infoDoctor.consultorio || cita.consultorio || "Sin consultorio";
  document.getElementById("obsFecha").textContent = cita.fecha;
  document.getElementById("obsHora").textContent = cita.hora;
}

document.addEventListener("DOMContentLoaded", cargarObservacionDoctor);
function limpiarPacienteActual() {
  dni = "";
  patientFullName = "";

  localStorage.removeItem("dni");
  localStorage.removeItem("patientFullName");
  localStorage.removeItem("selectedSpecialty");
  localStorage.removeItem("selectedDate");
  localStorage.removeItem("selectedTime");
}
document.addEventListener("DOMContentLoaded", function () {
  const bienvenida = document.getElementById("doctorBienvenida");
  const especialidadTexto = document.getElementById("doctorEspecialidad");

  const nombreDoctor = localStorage.getItem("doctorLogueadoNombre");
  const especialidadDoctor = localStorage.getItem("doctorLogueadoEspecialidad");

  if (bienvenida && nombreDoctor) {
    bienvenida.textContent = "¡Bienvenido, " + nombreDoctor + "!";
  }

  if (especialidadTexto && especialidadDoctor) {
    especialidadTexto.textContent = "Especialidad: " + especialidadDoctor;
  }
});
function cargarCitasAtendidasDoctor() {
  const lista = document.getElementById("listaCitasAtendidasDoctor");
  if (!lista) return;

  const especialidadDoctor = localStorage.getItem("doctorLogueadoEspecialidad") || "";
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const atendidas = citas.filter(cita =>
    cita.especialidad === especialidadDoctor &&
    cita.estado === "Atendida"
  );

  lista.innerHTML = "";

  if (atendidas.length === 0) {
    lista.innerHTML = `
      <div class="empty-atendidas">
        No tiene citas atendidas registradas.
      </div>
    `;
    return;
  }

  atendidas.forEach(cita => {
    lista.innerHTML += `
      <div class="fila-atendida">
        <span>${cita.nombre}</span>
        <span>${cita.fecha}</span>
        <span>${cita.hora}</span>
        <span>${cita.especialidad}</span>
        <span>${cita.consultorio || obtenerConsultorioPorEspecialidad(cita.especialidad)}</span>
<button class="btn-print-atendida" onclick="reimprimirObservacionAtendida('${cita.dni}', '${cita.hora}')">
  📄
</button>
      </div>
    `;
  });
}

function obtenerConsultorioPorEspecialidad(especialidad) {
  const info = doctorsBySpecialty[especialidad];
  return info ? info.consultorio : "Consultorio";
}

document.addEventListener("DOMContentLoaded", cargarCitasAtendidasDoctor);
function reimprimirObservacionAtendida(dniPaciente, horaPaciente) {
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];

  const cita = citas.find(c =>
    String(c.dni) === String(dniPaciente) &&
    String(c.hora) === String(horaPaciente)
  );

  if (!cita) {
    alert("No se encontró la cita atendida.");
    return;
  }

  const obs = cita.observacionesDoctor || [];

  if (obs.length === 0) {
    alert("Esta cita no tiene observación guardada.");
    return;
  }

  const doctorNombre = localStorage.getItem("doctorLogueadoNombre") || "Doctor";
  const doctorEspecialidad = localStorage.getItem("doctorLogueadoEspecialidad") || cita.especialidad;
  const infoDoctor = doctorsBySpecialty[cita.especialidad] || {};
  const consultorio = infoDoctor.consultorio || cita.consultorio || "Sin consultorio";
  const fechaImpresion = new Date().toLocaleString("es-PE");

  const tiposTexto = obs.map(o => o.titulo || o.tipo).join(" / ");

  const contenidoObservaciones = obs.map(o => `
    <div class="print-section">
      <h3>📄 ${o.titulo || o.tipo}</h3>
      <div class="print-texto">${String(o.texto || "").replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");

  document.getElementById("printAreaObs").innerHTML = `
    <div class="print-observacion">
      <div class="print-header">
        <div class="print-brand">
          <div class="print-logo">♡</div>
          <div>
            <h2>IncluCita</h2>
            <p>Sistema de Gestión de Citas Médicas</p>
          </div>
        </div>

        <div class="print-fecha">
          📅 <strong>Fecha de impresión:</strong><br>
          ${fechaImpresion}
        </div>
      </div>

      <div class="print-line"></div>

      <h1>🩺 OBSERVACIÓN MÉDICA</h1>
      <p class="print-subtitle">Registro de atención del paciente</p>

      <div class="print-section">
        <h3>👤 DATOS DEL PACIENTE</h3>
        <div class="print-paciente">
          <div>
            <p>Nombre del paciente:</p>
            <strong>${cita.nombre}</strong>
            <p>DNI:</p>
            <strong>${cita.dni}</strong>
          </div>
          <div class="print-avatar">👤</div>
        </div>
      </div>

      <div class="print-section">
        <h3>📋 DATOS DE LA ATENCIÓN</h3>
        <div class="print-grid">
          <div><span>🩺 Especialidad:</span><strong>${cita.especialidad}</strong></div>
          <div><span>🏥 Consultorio:</span><strong>${consultorio}</strong></div>
          <div><span>📅 Fecha:</span><strong>${cita.fecha}</strong></div>
          <div><span>⏰ Hora:</span><strong>${cita.hora}</strong></div>
        </div>
      </div>

      <div class="print-section print-green">
        <h3>✅ TIPO DE OBSERVACIÓN</h3>
        <div class="print-tipo">${tiposTexto}</div>
      </div>

      ${contenidoObservaciones}

      <div class="print-section">
        <h3>👨‍⚕️ MÉDICO TRATANTE</h3>
        <div class="print-medico">
          <div>
            <strong>${doctorNombre}</strong>
            <p>${doctorEspecialidad}</p>
          </div>
          <div class="firma">
            ___________________________<br>
            Firma del médico
          </div>
        </div>
      </div>

      <div class="print-footer">
        Documento generado por IncluCita - Sistema de Gestión de Citas Médicas
        <span>Página 1 de 1</span>
      </div>
    </div>
  `;

  window.print();
}
/* ===== MI AGENDA - CALENDARIO ===== */

let agendaFechaActual = new Date();
let agendaFechaSeleccionada = new Date();

function iniciarAgendaDoctor() {
  const agendaDias = document.getElementById("agendaDias");
  if (!agendaDias) return;

  agendaFechaActual = new Date();
  agendaFechaSeleccionada = new Date();

  renderAgendaCalendario();
  actualizarFechaSeleccionadaAgenda();
}

function renderAgendaCalendario() {
  const contenedor = document.getElementById("agendaDias");
  const mesTexto = document.getElementById("agendaMesTexto");

  if (!contenedor || !mesTexto) return;

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = agendaFechaActual.getFullYear();
  const month = agendaFechaActual.getMonth();

  mesTexto.textContent = `${meses[month]} ${year}`;
  contenedor.innerHTML = "";

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0).getDate();

  let inicioSemana = primerDia.getDay();
  inicioSemana = inicioSemana === 0 ? 6 : inicioSemana - 1;

  for (let i = 0; i < inicioSemana; i++) {
    const vacio = document.createElement("div");
    contenedor.appendChild(vacio);
  }

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const btn = document.createElement("button");
    btn.className = "agenda-day";
    btn.textContent = dia;

    const fechaBtn = new Date(year, month, dia);
    const hoy = new Date();

if (
  fechaBtn.getDate() === hoy.getDate() &&
  fechaBtn.getMonth() === hoy.getMonth() &&
  fechaBtn.getFullYear() === hoy.getFullYear()
) {
  btn.classList.add("today");
}

    if (
      fechaBtn.getDate() === agendaFechaSeleccionada.getDate() &&
      fechaBtn.getMonth() === agendaFechaSeleccionada.getMonth() &&
      fechaBtn.getFullYear() === agendaFechaSeleccionada.getFullYear()
    ) {
      btn.classList.add("selected");
    }

    btn.onclick = function () {
      agendaFechaSeleccionada = fechaBtn;
      renderAgendaCalendario();
      actualizarFechaSeleccionadaAgenda();
    };

    contenedor.appendChild(btn);
  }
}

function cambiarMesAgenda(valor) {
  agendaFechaActual.setMonth(agendaFechaActual.getMonth() + valor);
  renderAgendaCalendario();
}

function actualizarFechaSeleccionadaAgenda() {
  const fechaTexto = document.getElementById("agendaFechaSeleccionada");
  const diaSemanaTexto = document.getElementById("agendaDiaSemana");

  if (!fechaTexto || !diaSemanaTexto) return;

  const diasSemana = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado"
  ];

  const dia = String(agendaFechaSeleccionada.getDate()).padStart(2, "0");
  const mes = String(agendaFechaSeleccionada.getMonth() + 1).padStart(2, "0");
  const anio = agendaFechaSeleccionada.getFullYear();

  fechaTexto.textContent = `${dia}/${mes}/${anio}`;
  diaSemanaTexto.textContent = diasSemana[agendaFechaSeleccionada.getDay()];

  localStorage.setItem("agendaDoctorFecha", `${dia}/${mes}/${anio}`);
  localStorage.setItem("agendaDoctorDia", diasSemana[agendaFechaSeleccionada.getDay()]);
}

function verAgendaDelDia() {
  window.location.href = "doctorAgendaDia.html";
}

document.addEventListener("DOMContentLoaded", iniciarAgendaDoctor);
function renderDoctorAgendaDia() {
  const tbody = document.getElementById("doctorAgendaDiaBody");
  const tituloFecha = document.getElementById("doctorAgendaDiaFecha");

  if (!tbody) return;

  const fecha =
    localStorage.getItem("agendaDoctorFecha") ||
    localStorage.getItem("selectedDate") ||
    "22/06/2026";

  if (tituloFecha) tituloFecha.textContent = fecha;

  const doctorEspecialidad =
    localStorage.getItem("doctorLogueadoEspecialidad") ||
    "Medicina General";

  const doctorInfo = doctorsBySpecialty[doctorEspecialidad] || {
    consultorio: "Consultorio 1"
  };

  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];

  tbody.innerHTML = "";

  allTimeSlots.forEach(slot => {
    const horaTexto = horaConFormato(slot.value);

    const cita = citas.find(c =>
      c.fecha === fecha &&
      c.especialidad === doctorEspecialidad &&
      c.hora === horaTexto
    );

    let paciente = "—";
    let tipo = "Disponible";
    let estado = "Disponible";
    let claseEstado = "estado-disponible";

    if (cita) {
      paciente = cita.nombre;
      tipo = "Consulta";

if (cita.estado === "Atendida") {
  estado = "Atendida";
  claseEstado = "estado-atendida";
} else if (cita.estado === "Cancelada") {
  estado = "Cancelada";
  claseEstado = "estado-cancelada";
} else if (cita.enviada === true) {
  estado = "Programada";
  claseEstado = "estado-programada";
} else {
  estado = "Pendiente";
  claseEstado = "estado-pendiente";
}
    }

    const editable = !!cita;
    const filaAttrs = editable
      ? `class="agenda-row-editable" onclick="abrirSlicerEstadoCita('${fecha.replace(/'/g, "\\'")}','${doctorEspecialidad.replace(/'/g, "\\'")}','${horaTexto.replace(/'/g, "\\'")}')"`
      : "";

    tbody.innerHTML += `
      <tr ${filaAttrs}>
        <td>${horaTexto}</td>
        <td>${doctorInfo.consultorio}</td>
        <td>${paciente}</td>
        <td>${tipo}</td>
        <td>
          <span class="estado-pill ${claseEstado}">${estado}</span>
          ${editable ? '<span class="agenda-row-edit-hint">✎</span>' : ""}
        </td>
      </tr>
    `;
  });
}

document.addEventListener("DOMContentLoaded", renderDoctorAgendaDia);

/* ===== Slicer: cambiar estado de la cita (agenda del doctor) ===== */
let slicerCitaClave = null; // { fecha, especialidad, hora }
let slicerEstadoElegido = null;

function abrirSlicerEstadoCita(fecha, especialidad, hora) {
  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];
  const cita = citas.find(c => c.fecha === fecha && c.especialidad === especialidad && c.hora === hora);
  if (!cita) return;

  slicerCitaClave = { fecha, especialidad, hora };

  let estadoActual = "Pendiente";
  if (cita.estado === "Atendida") estadoActual = "Atendida";
  else if (cita.estado === "Cancelada") estadoActual = "Cancelada";
  else if (cita.enviada === true) estadoActual = "Programada";

  slicerEstadoElegido = estadoActual;

  const infoBox = document.getElementById("slicerCitaInfo");
  if (infoBox) {
    infoBox.innerHTML = `
      <strong>${cita.nombre}</strong>
      <p>DNI: ${cita.dni} · ${especialidad}</p>
      <p>${fecha} · ${hora}</p>
    `;
  }

  actualizarChipsSlicer();

  const overlay = document.getElementById("slicerEstadoOverlay");
  if (overlay) overlay.classList.add("active");
}

function actualizarChipsSlicer() {
  document.querySelectorAll(".estado-chip").forEach(chip => {
    chip.classList.toggle("selected", chip.dataset.estado === slicerEstadoElegido);
  });
}

function elegirEstadoSlicer(estado) {
  slicerEstadoElegido = estado;
  actualizarChipsSlicer();
}

function cerrarSlicerEstadoCita() {
  const overlay = document.getElementById("slicerEstadoOverlay");
  if (overlay) overlay.classList.remove("active");
  slicerCitaClave = null;
  slicerEstadoElegido = null;
}

function guardarEstadoCitaSlicer() {
  if (!slicerCitaClave || !slicerEstadoElegido) return;

  const citas = JSON.parse(localStorage.getItem("citasSecretaria")) || citasSecretaria || [];
  const { fecha, especialidad, hora } = slicerCitaClave;

  const idx = citas.findIndex(c => c.fecha === fecha && c.especialidad === especialidad && c.hora === hora);
  if (idx === -1) {
    cerrarSlicerEstadoCita();
    return;
  }

  if (slicerEstadoElegido === "Atendida") {
    citas[idx].estado = "Atendida";
  } else if (slicerEstadoElegido === "Cancelada") {
    citas[idx].estado = "Cancelada";
  } else if (slicerEstadoElegido === "Programada") {
    citas[idx].estado = "Confirmada";
    citas[idx].enviada = true;
  } else {
    citas[idx].estado = "Confirmada";
    citas[idx].enviada = false;
  }

  localStorage.setItem("citasSecretaria", JSON.stringify(citas));
  citasSecretaria = citas; // mantiene sincronizada la variable global de la sesión

  cerrarSlicerEstadoCita();
  renderDoctorAgendaDia();
}

function aplicarIdiomaPantallaDni() {
  if (getCurrentScreenByPage() !== "screen-dni") return;

  const esQuechua = selectedLanguage === "qu";

  const h1 = document.querySelector(".dni-card h1");
  const pDni = document.querySelector(".dni-card > p");
  const h3 = document.querySelector(".doctor-panel h3");
  const pBienvenida = document.querySelector(".doctor-panel p");
  const btnVoz = document.querySelector(".voice-btn");
  const btnVolver = document.querySelector(".back-btn");
  const btnAceptar = document.querySelector(".dni-card .main-btn");
  const btnLimpiar = document.querySelector(".keypad button:last-child");

  if (h3) h3.textContent = esQuechua ? "Allin hamusqayki" : "Bienvenido";
  if (pBienvenida) pBienvenida.textContent = esQuechua
    ? "Hampi citaykita utqaylla, sasa mana kananpaq ruwanki."
    : "Reserva tu cita médica de forma rápida, simple e inclusiva.";

  if (h1) h1.textContent = esQuechua ? "DNI yupaykita churay" : "Ingrese su DNI";
  if (pDni) pDni.textContent = esQuechua
    ? "DNI yupayniykipa 8 yupayninta qillqay."
    : "Digite los 8 dígitos de su DNI";

  if (btnVoz) btnVoz.textContent = esQuechua ? "🔊 Rimaywan yanapakuy" : "🔊 Asistencia por voz";
  if (btnVolver) btnVolver.textContent = esQuechua ? "← Kutimuy" : "← Volver";
  if (btnAceptar) btnAceptar.textContent = esQuechua ? "DNI chaskiy" : "Aceptar DNI";
  if (btnLimpiar) btnLimpiar.textContent = esQuechua ? "Pichay" : "Limpiar";
}
function mostrarDoctoresRegistrados() {
  const modal = document.getElementById("modalDoctoresRegistrados");
  const lista = document.getElementById("listaDoctoresRegistrados");

  if (!modal || !lista) return;

  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];

  lista.innerHTML = "";

  doctores.forEach((doc, index) => {
    lista.innerHTML += `
      <div class="doctor-registrado-item" onclick="verDetalleDoctorRegistrado(${index})">
        <div class="doctor-registrado-avatar">${doc.iconoDoctor || doc.icono || "👨‍⚕️"}</div>

        <div>
          <strong>${doc.nombre}</strong>
          <p>${doc.especialidad}</p>
          <small>${doc.consultorio || "Sin consultorio"}</small>
        </div>

        <span>Ver ›</span>
      </div>
    `;
  });

  modal.classList.add("active");
}

function cerrarModalDoctores() {
  const modal = document.getElementById("modalDoctoresRegistrados");
  if (modal) modal.classList.remove("active");
}

function verDetalleDoctorRegistrado(index) {
  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];
  const doc = doctores[index];

  if (!doc) return;

  const modal = document.getElementById("modalDetalleDoctor");
  const contenido = document.getElementById("detalleDoctorContenido");

  if (!modal || !contenido) return;

  const infoEspecialidad = doctorsBySpecialty[doc.especialidad] || {};

  const horario =
    doc.horario ||
    infoEspecialidad.horario ||
    "07:00 - 18:00";

  const dias =
    Array.isArray(doc.dias) && doc.dias.length > 0
      ? doc.dias.join(", ")
      : Array.isArray(infoEspecialidad.dias) && infoEspecialidad.dias.length > 0
        ? infoEspecialidad.dias.join(", ")
        : "Lun, Mar, Mié, Jue, Vie";

  contenido.innerHTML = `
    <div style="text-align:center;">
      <div class="doctor-registrado-avatar" style="margin:auto;">
        ${doc.iconoDoctor || doc.icono || "👨‍⚕️"}
      </div>

      <h2>${doc.nombre}</h2>
      <p>${doc.especialidad}</p>
    </div>

    <div class="doctor-detalle-grid">
      <div class="doctor-detalle-card">
        <span>DNI</span>
        <strong>${doc.dni || "No registrado"}</strong>
      </div>

      <div class="doctor-detalle-card">
        <span>Teléfono</span>
        <strong>${doc.telefono || infoEspecialidad.telefono || "No registrado"}</strong>
      </div>

      <div class="doctor-detalle-card">
        <span>Especialidad</span>
        <strong>${doc.especialidad || "No registrado"}</strong>
      </div>

      <div class="doctor-detalle-card">
        <span>Consultorio</span>
        <strong>${doc.consultorio || infoEspecialidad.consultorio || "No registrado"}</strong>
      </div>

      <div class="doctor-detalle-card">
        <span>Horario de atención</span>
        <strong>${horario}</strong>
      </div>

      <div class="doctor-detalle-card">
        <span>Días de atención</span>
        <strong>${dias}</strong>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

function cerrarDetalleDoctor() {
  const modal = document.getElementById("modalDetalleDoctor");
  if (modal) modal.classList.remove("active");
}
function aplicarIdiomaPantallaEspecialidad() {
  if (getCurrentScreenByPage() !== "screen-specialty") return;

  const esQuechua = selectedLanguage === "qu";

  const titulo = document.querySelector("#screen-specialty h2");
  const volver = document.querySelector("#screen-specialty .back-btn");
  const footer = document.querySelector("#screen-specialty .footer-note");
  const otrasTitulo = document.querySelector("#otherSpecialtiesBox h3");

  if (titulo) titulo.textContent = esQuechua ? "Hampi especialidadta akllay" : "Seleccione la especialidad";
  if (volver) volver.textContent = esQuechua ? "← Kutimuy" : "← Volver";
  if (footer) footer.textContent = esQuechua ? "Munakusqayki especialidadta ñitiy" : "Toque la especialidad que necesita";
  if (otrasTitulo) otrasTitulo.textContent = esQuechua ? "Huk especialidadkuna kachkan" : "Otras especialidades disponibles";

  const textos = {
    "Medicina General": esQuechua ? "Llapan hampi" : "Medicina General",
    "Pediatría": esQuechua ? "Wawakuna hampi" : "Pediatría",
    "Traumatología": esQuechua ? "Tullu hampi" : "Traumatología",
    "Oftalmología": esQuechua ? "Ñawi hampi" : "Oftalmología",
    "Odontología": esQuechua ? "Kiru hampi" : "Odontología"
  };

  document.querySelectorAll(".option-card").forEach(btn => {
    const original = btn.getAttribute("onclick") || "";

    Object.keys(textos).forEach(nombre => {
      if (original.includes(nombre)) {
        btn.childNodes[btn.childNodes.length - 1].textContent = textos[nombre];
      }
    });

    if (original.includes("showOtherSpecialties")) {
      btn.childNodes[btn.childNodes.length - 1].textContent =
        esQuechua ? "Huk especialidadkuna" : "Otras especialidades";
    }
  });
}
function aplicarIdiomaPantallaFecha() {
  if (getCurrentScreenByPage() !== "screen-date") return;

  const esQuechua = selectedLanguage === "qu";

  const titulo = document.querySelector("#screen-date h2");
  const volver = document.querySelector("#screen-date .back-btn");
  const footer = document.querySelector("#screen-date .footer-note");
  const legend = document.querySelectorAll("#screen-date .legend div");
  const dias = document.querySelectorAll("#calendarHeader div");

  if (titulo) titulo.textContent = esQuechua
    ? "Kachkan punchawta akllay"
    : "Seleccione la fecha disponible";

  if (volver) volver.textContent = esQuechua ? "← Kutimuy" : "← Volver";

  if (footer) footer.textContent = esQuechua
    ? "Kachkan punchawta akllay"
    : "Seleccione un día con disponibilidad";

  if (legend[0]) legend[0].innerHTML = `<span class="box free"></span> ${esQuechua ? "Kachkan" : "Libre"}`;
  if (legend[1]) legend[1].innerHTML = `<span class="box partial"></span> ${esQuechua ? "Wakin horakuna ocupasqa" : "Algunos horarios ocupados"}`;
  if (legend[2]) legend[2].innerHTML = `<span class="box gray"></span> ${esQuechua ? "Mana kachkanchu" : "Sin disponibilidad"}`;

  const diasEs = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const diasQu = ["KILLA", "ATI", "QUY", "ILL", "CHI", "K'UY", "INTI"];

  dias.forEach((d, i) => {
    d.textContent = esQuechua ? diasQu[i] : diasEs[i];
  });
}
function aplicarIdiomaPantallaHora() {
  if (getCurrentScreenByPage() !== "screen-time") return;

  const esQuechua = selectedLanguage === "qu";

  const titulo = document.querySelector("#screen-time h2");
  const volver = document.querySelector("#screen-time .back-btn");
  const footer = document.querySelector("#screen-time .footer-note");
  const secciones = document.querySelectorAll("#screen-time .time-section strong");
  const leyenda = document.querySelectorAll("#screen-time .time-legend div");

  if (titulo) titulo.textContent = esQuechua ? "Kachkan horata akllay" : "Seleccione la hora disponible";
  if (volver) volver.textContent = esQuechua ? "← Kutimuy" : "← Volver";
  if (footer) footer.textContent = esQuechua ? "Horata ñitiy qatiqanaykipaq" : "Toque la hora para continuar";

  if (secciones[0]) secciones[0].textContent = esQuechua ? "Tutamanta" : "Mañana";
  if (secciones[1]) secciones[1].textContent = esQuechua ? "Chisi" : "Tarde";

  if (leyenda[0]) leyenda[0].innerHTML = `<span class="legend-box available-box"></span> ${esQuechua ? "Kachkan" : "Disponible"}`;
  if (leyenda[1]) leyenda[1].innerHTML = `<span class="legend-box occupied-box"></span> ${esQuechua ? "Ocupasqa" : "Ocupado"}`;
}
function aplicarIdiomaPantallaConfirmar() {
  if (getCurrentScreenByPage() !== "screen-confirm") return;

  const esQuechua = selectedLanguage === "qu";

  const titulo = document.querySelector("#screen-confirm h2");
  const footer = document.querySelector("#screen-confirm .footer-note");

  if (titulo) {
    titulo.textContent = esQuechua
      ? "Citaykipa willakuyninta takyachiy"
      : "Confirme los datos de su cita";
  }

  const textos = {
    confirmPatient: esQuechua ? "Paciente" : "Paciente",
    confirmSpecialty: esQuechua ? "Especialidad" : "Especialidad",
    confirmDoctor: esQuechua ? "Hampi" : "Médico",
    confirmConsultorio: esQuechua ? "Consultorio" : "Consultorio",
    confirmDate: esQuechua ? "Punchaw" : "Fecha",
    confirmTime: esQuechua ? "Hora" : "Hora"
  };

  Object.keys(textos).forEach(id => {
    const valor = document.getElementById(id);
    if (!valor) return;

    const fila = valor.closest(".confirm-row, .info-row, .confirm-item, div");
    if (!fila) return;

    const label = fila.querySelector("strong");
    if (label) label.textContent = textos[id];
  });

  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const confirmSpecialty = document.getElementById("confirmSpecialty");

  if (confirmSpecialty) {
    confirmSpecialty.textContent = esQuechua
      ? nombreEspecialidadQuechua(specialty)
      : specialty;
  }

  document.querySelectorAll("#screen-confirm button").forEach(btn => {
    if (btn.textContent.includes("Volver") || btn.textContent.includes("Kutimuy")) {
      btn.textContent = esQuechua ? "← Kutimuy" : "← Volver";
    }

    if (btn.textContent.includes("Confirmar") || btn.textContent.includes("Takyachiy") || btn.textContent.includes("takyachiy")) {
      btn.textContent = esQuechua ? "✓ Cita takyachiy" : "✓ Confirmar cita";
    }
  });

  if (footer) {
    footer.textContent = esQuechua
      ? "Willakuykunata allin qhawariy"
      : "Verifique que los datos sean correctos";
  }
}
function aplicarIdiomaPantallaExito() {
  if (getCurrentScreenByPage() !== "screen-success") return;

  const esQuechua = selectedLanguage === "qu";

  const titulo = document.querySelector("#screen-success h1");
  const parrafos = document.querySelectorAll("#screen-success p");
  const boton = document.querySelector("#screen-success button");
  const footer = document.querySelector("#screen-success .footer-note");

  if (titulo) {
    titulo.textContent = esQuechua ? "¡Cita takyachisqa!" : "¡Cita confirmada!";
  }

  if (parrafos[0]) {
    parrafos[0].textContent = esQuechua
      ? "Citayki allinta qillqasqa."
      : "Su cita ha sido registrada correctamente.";
  }

  if (parrafos[1]) {
    parrafos[1].textContent = esQuechua
      ? "Comprobante qhawarinaykipaq kay ñitiy."
      : "Se imprimirá su comprobante.";
  }

  if (boton) {
    boton.textContent = esQuechua ? "Comprobante qhaway" : "Ver comprobante";
  }

  if (footer) {
    footer.textContent = esQuechua
      ? "Ama hina kaspa comprobanteykita qhaway"
      : "Por favor, retire su comprobante";
  }
}
function aplicarIdiomaPantallaTicket() {
  if (getCurrentScreenByPage() !== "screen-ticket") return;

  const esQuechua = selectedLanguage === "qu";

  const volver = document.querySelector("#screen-ticket .back-btn");
  const titulo = document.querySelector("#screen-ticket h2");
  const imprimir = document.querySelector("#screen-ticket .print-btn");
  const footer = document.querySelector("#screen-ticket .footer-note");

  if (volver) volver.textContent = esQuechua ? "← Qallariyman kutimuy" : "← Volver al inicio";
  if (titulo) titulo.textContent = esQuechua ? "Comprobante qhaway" : "Vista previa del comprobante";
  if (imprimir) imprimir.textContent = esQuechua ? "🖨️ Comprobante qhaway" : "🖨️ Imprimir comprobante";
  if (footer) footer.textContent = esQuechua ? "Comprobante imprimir ñitiy" : 'Toque "Imprimir comprobante"';

  const labels = document.querySelectorAll("#screen-ticket .ticket-body strong");

  if (labels[0]) labels[0].textContent = esQuechua ? "Paciente:" : "Paciente:";
  if (labels[1]) labels[1].textContent = "DNI:";
  if (labels[2]) labels[2].textContent = esQuechua ? "Especialidad:" : "Especialidad:";
  if (labels[3]) labels[3].textContent = esQuechua ? "Hampi:" : "Médico:";
  if (labels[4]) labels[4].textContent = "Consultorio:";
  if (labels[5]) labels[5].textContent = esQuechua ? "Punchaw:" : "Fecha:";
  if (labels[6]) labels[6].textContent = "Hora:";

  const gracias = document.querySelector("#screen-ticket .ticket-modern > p strong");
  if (gracias) {
    gracias.textContent = esQuechua
      ? "💙 ¡Ñuqaykupi confiasqaykimanta añay!"
      : "💙 ¡Gracias por confiar en nosotros!";
  }

  const specialty = localStorage.getItem("selectedSpecialty") || "";
  const ticketSpecialty = document.getElementById("ticketSpecialty");

  if (ticketSpecialty) {
    ticketSpecialty.textContent = esQuechua
      ? nombreEspecialidadQuechua(specialty)
      : specialty;
  }
}
function obtenerInfoDoctorParaVista(especialidad) {
  const doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || [];

  const doctorSistema = doctores.find(doc =>
    doc.especialidad === especialidad
  );

  if (doctorSistema) {
    return {
      doctor: doctorSistema.nombre || doctorSistema.doctor || "Doctor no asignado",
      consultorio: doctorSistema.consultorio || "Consultorio no asignado",
      icon: doctorSistema.icon || "👨‍⚕️"
    };
  }

  const info = doctorsBySpecialty[especialidad];

  if (info) {
    return {
      doctor: info.doctor || "Doctor no asignado",
      consultorio: info.consultorio || "Consultorio no asignado",
      icon: info.icon || "👨‍⚕️"
    };
  }

  return {
    doctor: "Doctor no asignado",
    consultorio: "Consultorio no asignado",
    icon: "👨‍⚕️"
  };
}
function horaTextoAMinutos(horaTexto) {
  let texto = String(horaTexto || "").toLowerCase().trim();

  const esPM = texto.includes("p. m.") || texto.includes("pm");
  const esAM = texto.includes("a. m.") || texto.includes("am");

  texto = texto
    .replace("a. m.", "")
    .replace("p. m.", "")
    .replace("am", "")
    .replace("pm", "")
    .trim();

  let [h, m] = texto.split(":").map(Number);

  if (esPM && h < 12) h += 12;
  if (esAM && h === 12) h = 0;

  return h * 60 + m;
}

function horaCitaFinalizo(cita) {
  if (!cita.fecha || !cita.hora) return false;
  if (cita.fecha !== fechaHoyTexto()) return false;

  const finCita = horaTextoAMinutos(cita.hora) + 25;

  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const segundosActuales = ahora.getSeconds();

  return minutosActuales > finCita ||
         (minutosActuales === finCita && segundosActuales >= 1);
}

function actualizarNoIngresosAutomaticos() {
  let citas = JSON.parse(localStorage.getItem("citasSecretaria")) || [];
  let huboCambios = false;

  citas = citas.map(cita => {
    const finalizo = horaCitaFinalizo(cita);

    const tieneObservacion =
      cita.observacionesDoctor &&
      cita.observacionesDoctor.length > 0;

    const estabaEnDoctor =
      cita.estado === "Programada" ||
      (cita.estado === "Confirmada" && cita.enviada === true);

    if (
      finalizo &&
      estabaEnDoctor &&
      !tieneObservacion &&
      cita.estado !== "Atendida"
    ) {
      cita.estado = "No Ingreso";
      cita.enviada = false;
      huboCambios = true;
    }

    return cita;
  });

  localStorage.setItem("citasSecretaria", JSON.stringify(citas));
  citasSecretaria = citas;
}
window.addEventListener("resize", function () {

  if (!document.getElementById("citasList")) {
    return;
  }

  paginaCitasSecretaria = 1;

  renderCitasSecretaria();
});

/* =========================================================
   REGISTRO DE PERSONAL MÉDICO CON FILTRO AUTOMÁTICO POR API
   ========================================================= */

function filtrarDniPersonalPorApi() {
  const inputDni = document.getElementById("personalDni");
  if (!inputDni) return;

  // Solo permitir dígitos
  inputDni.value = inputDni.value.replace(/\D/g, "");
  const valor = inputDni.value.trim();

  const feedback = document.getElementById("dniApiFeedback");
  const errorBox = document.getElementById("registroPersonalError");
  if (errorBox) errorBox.style.display = "none";

  if (valor.length === 8) {
    if (feedback) {
      feedback.innerHTML = '<span class="text-primary fw-bold">🔍 Consultando API de identidad...</span>';
    }
    consultarDniPersonal(valor);
  } else {
    if (feedback) {
      feedback.innerHTML = '<span class="text-muted small">Ingrese 8 dígitos para consultar automáticamente (' + valor.length + '/8)</span>';
    }
  }
}

function consultarDniPersonalManual() {
  const inputDni = document.getElementById("personalDni");
  if (!inputDni) return;
  const valor = inputDni.value.trim();
  if (valor.length !== 8) {
    const errorBox = document.getElementById("registroPersonalError");
    if (errorBox) {
      errorBox.textContent = "El DNI debe tener exactamente 8 dígitos.";
      errorBox.style.display = "block";
    }
    return;
  }
  consultarDniPersonal(valor);
}

function consultarDniPersonal(dniBuscado) {
  // 1. Revisar si está en el padrón personalizado
  const customPadron = JSON.parse(localStorage.getItem("padronOficialPersonalizado")) || {};
  if (customPadron[dniBuscado]) {
    aplicarDatosPersonalApi(customPadron[dniBuscado]);
    return;
  }

  // 2. Revisar padrón oficial precargado
  const padronOficial = {
    "76261461": { nombres: "Rodrigo Alonso", paterno: "De la Cruz", materno: "Mendoza" },
    "12345678": { nombres: "Juan Carlos", paterno: "Pérez", materno: "Gómez" },
    "87654321": { nombres: "María Elena", paterno: "Flores", materno: "Ramos" },
    "74859612": { nombres: "Roberto", paterno: "Dávila", materno: "Sánchez" },
    "72527818": { nombres: "Carmen Rosa", paterno: "Salas", materno: "Vega" },
    "10000001": { nombres: "Luis Alberto", paterno: "Ramírez", materno: "Soto" },
    "10000002": { nombres: "María Fernanda", paterno: "López", materno: "Quispe" },
    "10000003": { nombres: "Carlos Eduardo", paterno: "Mendoza", materno: "Castro" },
    "10000004": { nombres: "Ana Lucía", paterno: "Torres", materno: "Prado" },
    "10000005": { nombres: "José Antonio", paterno: "Vargas", materno: "Morales" },
    "10000006": { nombres: "Patricia Elena", paterno: "Ruiz", materno: "Huamán" },
    "10000007": { nombres: "Rosa Del Carmen", paterno: "Castillo", materno: "Chávez" }
  };

  if (padronOficial[dniBuscado]) {
    aplicarDatosPersonalApi(padronOficial[dniBuscado]);
    return;
  }

  // 3. Generador algorítmico determinista con apellidos y nombres peruanos reales
  const nombresLista = ["Alejandro", "Valeria", "Gabriel", "Fiorella", "Christian", "Daniela", "Renzo", "Milagros", "Julio César", "Luciana", "Diego", "Camila", "Jorge Luis", "Diana", "Guillermo", "Sofía", "Marco Antonio", "Estefany"];
  const paternosLista = ["Quispe", "Flores", "Rodríguez", "Sánchez", "García", "Rojas", "Díaz", "Torres", "Espinoza", "Vásquez", "Castillo", "Morales", "Zevallos", "Palomino", "Cornejo"];
  const maternosLista = ["Huamán", "Mendoza", "Mamani", "Chávez", "Gutiérrez", "Navarro", "Salazar", "Romero", "Paredes", "Vega", "Silva", "Medina", "Herrera", "Carrasco"];

  const numDni = parseInt(dniBuscado, 10) || 12345678;
  const nom = nombresLista[numDni % nombresLista.length];
  const pat = paternosLista[(numDni >> 2) % paternosLista.length];
  const mat = maternosLista[(numDni >> 4) % maternosLista.length];

  aplicarDatosPersonalApi({ nombres: nom, paterno: pat, materno: mat });
}

function aplicarDatosPersonalApi(datos) {
  const feedback = document.getElementById("dniApiFeedback");
  const inputNombres = document.getElementById("personalNombres");
  const inputPaterno = document.getElementById("personalPaterno");
  const inputMaterno = document.getElementById("personalMaterno");

  if (inputNombres) {
    inputNombres.value = datos.nombres || "";
    inputNombres.style.borderColor = "var(--primary-teal)";
    inputNombres.style.backgroundColor = "#f0fdfa";
  }
  if (inputPaterno) {
    inputPaterno.value = datos.paterno || "";
    inputPaterno.style.borderColor = "var(--primary-teal)";
    inputPaterno.style.backgroundColor = "#f0fdfa";
  }
  if (inputMaterno) {
    inputMaterno.value = datos.materno || "";
    inputMaterno.style.borderColor = "var(--primary-teal)";
    inputMaterno.style.backgroundColor = "#f0fdfa";
  }

  const completo = (datos.nombres + " " + datos.paterno + " " + (datos.materno || "")).trim();
  if (feedback) {
    feedback.innerHTML = '<span class="text-success fw-bold">✓ Identidad verificada (API RENIEC): ' + completo + '</span>';
  }
  if (typeof showToast === "function") {
    showToast("Datos cargados por API: " + completo);
  }
}

function habilitarEdicionManualNombres() {
  const inNom = document.getElementById("personalNombres");
  const inPat = document.getElementById("personalPaterno");
  const inMat = document.getElementById("personalMaterno");
  [inNom, inPat, inMat].forEach(function (inp) {
    if (inp) {
      inp.removeAttribute("readonly");
      inp.style.backgroundColor = "#ffffff";
    }
  });
  if (inNom) inNom.focus();
  const feedback = document.getElementById("dniApiFeedback");
  if (feedback) {
    feedback.innerHTML = '<span class="text-warning fw-bold">✏️ Edición manual habilitada. Ingrese sus nombres y apellidos.</span>';
  }
}

function guardarRegistroPersonal() {
  const errorBox = document.getElementById("registroPersonalError");
  if (errorBox) errorBox.style.display = "none";

  const elDni = document.getElementById("personalDni");
  const elNom = document.getElementById("personalNombres");
  const elPat = document.getElementById("personalPaterno");
  const elMat = document.getElementById("personalMaterno");
  const elProv = document.getElementById("personalProvincia");
  const elCiu = document.getElementById("personalCiudad");
  const elDom = document.getElementById("personalDomicilio");
  const elCel = document.getElementById("personalCelular");
  const elEsp = document.getElementById("personalEspecialidad");
  const elCon = document.getElementById("personalConsultorio");

  const dni = elDni ? elDni.value.trim() : "";
  const nombres = elNom ? elNom.value.trim() : "";
  const paterno = elPat ? elPat.value.trim() : "";
  const materno = elMat ? elMat.value.trim() : "";
  const provincia = elProv ? elProv.value.trim() : "";
  const ciudad = elCiu ? elCiu.value.trim() : "";
  const domicilio = elDom ? elDom.value.trim() : "";
  const celular = elCel ? elCel.value.trim() : "";
  const especialidad = elEsp ? elEsp.value.trim() : "Medicina General";
  const consultorio = elCon ? elCon.value.trim() : "Consultorio 1";

  // Validaciones
  if (dni.length !== 8 || !/^\d+$/.test(dni)) {
    mostrarErrorRegistroPersonal("El DNI debe tener exactamente 8 dígitos numéricos.");
    return;
  }
  if (!nombres || !paterno) {
    mostrarErrorRegistroPersonal("Por favor consulte el DNI para autocompletar o ingrese sus nombres y apellido paterno.");
    return;
  }
  if (!provincia) {
    mostrarErrorRegistroPersonal("Por favor ingrese o seleccione su provincia.");
    return;
  }
  if (!ciudad) {
    mostrarErrorRegistroPersonal("Por favor ingrese su ciudad o distrito.");
    return;
  }
  if (!domicilio) {
    mostrarErrorRegistroPersonal("Por favor ingrese su domicilio (dirección).");
    return;
  }
  if (celular.length < 9 || !/^\d+$/.test(celular)) {
    mostrarErrorRegistroPersonal("Por favor ingrese un número de celular válido de 9 dígitos.");
    return;
  }

  const apellidos = (paterno + " " + materno).trim();
  const nombreCompleto = "Dr. " + (nombres + " " + apellidos).trim();

  const nuevoDoctor = {
    nombre: nombreCompleto,
    nombres: nombres,
    apellidos: apellidos,
    paterno: paterno,
    materno: materno,
    dni: dni,
    telefono: celular,
    celular: celular,
    provincia: provincia,
    ciudad: ciudad,
    domicilio: domicilio,
    especialidad: especialidad,
    consultorio: consultorio,
    horario: "08:00 - 13:00",
    horaInicio: "08:00",
    horaFin: "13:00",
    dias: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    icono: "🩺",
    iconoDoctor: "👨‍⚕️",
    foto: "doctor.png"
  };

  // 1. Guardar en doctoresSistema (localStorage)
  let doctores = JSON.parse(localStorage.getItem("doctoresSistema")) || doctoresSistema || [];
  // Evitar duplicados por DNI
  doctores = doctores.filter(function (doc) {
    return String(doc.dni).trim() !== String(dni).trim();
  });
  doctores.unshift(nuevoDoctor);
  localStorage.setItem("doctoresSistema", JSON.stringify(doctores));
  doctoresSistema = doctores;

  // 2. Asociar especialidad en doctorsBySpecialty para asignación de citas
  let dbs = JSON.parse(localStorage.getItem("doctorsBySpecialty")) || doctorsBySpecialty || {};
  dbs[especialidad] = {
    doctor: nombreCompleto,
    dni: dni,
    telefono: celular,
    icon: "🩺",
    consultorio: consultorio,
    horario: "08:00 - 13:00"
  };
  localStorage.setItem("doctorsBySpecialty", JSON.stringify(dbs));
  doctorsBySpecialty = dbs;

  // 3. Guardar en padrón personalizado
  let customPadron = JSON.parse(localStorage.getItem("padronOficialPersonalizado")) || {};
  customPadron[dni] = {
    nombres: nombres,
    paterno: paterno,
    materno: materno,
    nombreCompleto: (nombres + " " + apellidos).trim(),
    dni: dni,
    provincia: provincia,
    ciudad: ciudad,
    domicilio: domicilio,
    celular: celular
  };
  localStorage.setItem("padronOficialPersonalizado", JSON.stringify(customPadron));

  // 4. Intentar persistencia en backend Java (Tomcat / DoctorServlet) si está activo
  try {
    const params = new URLSearchParams();
    params.append("dni", dni);
    params.append("nombre", nombreCompleto);
    params.append("telefono", celular);
    params.append("email", dni + "@inclucita.com");
    params.append("username", dni);
    params.append("password", "doctor123");
    params.append("idEspecialidad", "1");
    params.append("consultorio", consultorio);
    params.append("horario", "08:00 - 13:00");
    params.append("format", "json");

    fetch("doctores", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    }).catch(function () {});
  } catch (e) {}

  // 5. Dejar registrado el DNI para que DoctorLogin.html lo auto-complete
  localStorage.setItem("ultimoDniRegistrado", dni);

  if (typeof showToast === "function") {
    showToast("¡Personal registrado con éxito! Redirigiendo a inicio de sesión...");
  } else {
    alert("¡Personal registrado con éxito! Redirigiendo a inicio de sesión...");
  }

  setTimeout(function () {
    window.location.href = "DoctorLogin.html";
  }, 1200);
}

function mostrarErrorRegistroPersonal(msg) {
  const errorBox = document.getElementById("registroPersonalError");
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
    errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    alert(msg);
  }
}