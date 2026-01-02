/* ============================
   SISTEMA DE UBICACIONES
   ============================ */
const LOCATIONS = {
  lapaz: [
    {
      id: "malecon_lapaz",
      name: "Malecón de La Paz",
      durationMin: 20,
      totalKm: 1.5,
      video: "https://customer-cw0heb9gadqlxjsv.cloudflarestream.com/10ac873a161207846254bb189091b06f/manifest/video.m3u8"
    }
  ],

  cabosanlucas: [
    {
      id: "playa_medano",
      name: "Playa El Médano",
      durationMin: 25,
      totalKm: 1.8,
      
    }
  ]
};

let currentCity = null;
let currentLocation = null;



/* ================== NAVEGACIÓN ================== */
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  
  if (id === 'historial') {
    loadHistory();
  }
}

function selectCity(cityId) {
  currentCity = cityId;
  renderLocations();
  goTo('locations');
}

function renderLocations() {
  const container = document.getElementById("locationList");
  const title = document.getElementById("cityTitle");

  container.innerHTML = "";

  title.innerText =
    currentCity === "lapaz"
      ? "¿Dónde quieres caminar en La Paz?"
      : "¿Dónde quieres caminar en Cabo San Lucas?";

  LOCATIONS[currentCity].forEach(route => {
    const btn = document.createElement("button");
    btn.className = "location-btn route";
    btn.innerText = "🌊 " + route.name;

    btn.onclick = () => {
      // 🚧 SI NO HAY VIDEO
      if (!route.video) {
        document.getElementById("comingTitle").innerText = route.name;
        goTo("comingSoon");
        return;
      }

      // ✅ SI SÍ HAY VIDEO
      currentLocation = route;
      goTo("config");
    };

    container.appendChild(btn);
  });
}

/* ================== VARIABLES ================== */
let ritmo = 'Suave';
let timer;
let seconds = 0;
let steps = 0;
let distance = 0;
let isPaused = false;

/* ================== CONFIGURACIÓN DE RITMOS ================== */
const ritmos = {
  Suave: { pasosMin: 90, kmh: 3.2 },
  Normal: { pasosMin: 110, kmh: 4.5 },
  Activo: { pasosMin: 135, kmh: 5.8 }
};

/* ================== SELECCIÓN DE RITMO ================== */
function selectRitmo(el) {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  ritmo = el.innerText;
}

/* ================== INICIAR CAMINATA ================== */function startWalk() {
  goTo('loading');
  clearInterval(timer);
  seconds = 0;
  steps = 0;
  distance = 0;
  isPaused = false;

  const totalSeconds = currentLocation.durationMin * 60;
  document.getElementById("routeName").innerText = currentLocation.name;

  
  const videoSource = document.getElementById("videoSource");

  const video = document.getElementById("walkVideo");
video.muted = true;      // 🔇 SILENCIADO
video.volume = 0;       // (opcional, refuerzo)

  videoSource.src = currentLocation.video;
  video.load();

  // 🔑 AQUÍ ESTÁ LA CLAVE
  video.onplaying = () => {
  goTo('walk');

    // Evita timers duplicados
    clearInterval(timer);

    timer = setInterval(() => {
      if (isPaused || video.paused) return;

      seconds++;

      const data = ritmos[ritmo];
      steps += data.pasosMin / 60;
      distance += data.kmh / 3600;

      document.getElementById('time').innerText = formatTime(seconds);
      document.getElementById('steps').innerText = Math.floor(steps);
      document.getElementById('distance').innerText = distance.toFixed(2);

      const progress = Math.min((seconds / totalSeconds) * 100, 100);
      document.getElementById("progressBar").style.width = progress + "%";

      // ⏳ Tiempo restante (B)
      const remaining = totalSeconds - seconds;
      const timeLeftEl = document.getElementById("timeLeft");

      if (remaining > 300) {
        timeLeftEl.innerText = `⏳ Te quedan ${Math.ceil(remaining / 60)} min`;
        timeLeftEl.style.color = "#6b7280";
      } else if (remaining > 60) {
        timeLeftEl.innerText = `⚡ Últimos ${Math.ceil(remaining / 60)} minutos`;
        timeLeftEl.style.color = "#f59e0b";
      } else if (remaining > 0) {
        timeLeftEl.innerText = `🔥 Últimos ${remaining} segundos`;
        timeLeftEl.style.color = "#ef4444";
      }

      if (remaining <= 0) {
        finishWalk();
      }

    }, 1000);
  };


  // ▶ Intentar reproducir
  video.play().catch(() => {
    console.log("Autoplay bloqueado hasta interacción");
  });
}

/* ================== PAUSAR / REANUDAR ================== */
function togglePause() {
  const video = document.getElementById('walkVideo');
  const btn = document.getElementById('pauseBtn');

  if (video.paused) {
    video.play();
    isPaused = false;
    btn.innerText = '⏸ Pausar';
  } else {
    video.pause();
    isPaused = true;
    btn.innerText = '▶ Reanudar';
  }
}

/* ================== FINALIZAR ================== */
function finishWalk() {
  clearInterval(timer);

  const video = document.getElementById("walkVideo");
  video.pause();

  const totalSeconds = currentLocation.durationMin * 60;
  const completed = seconds >= totalSeconds * 0.95; // 95% o más = completada

  const titleEl = document.querySelector("#final h1");
  const subtitleEl = document.getElementById("finalSubtitle");
  const dataEl = document.getElementById("finalData");

  if (completed) {
    // ✅ Caminata completada
    titleEl.innerText = "¡Buen trabajo! 👏";
    subtitleEl.innerText = "Completaste tu caminata";

    dataEl.innerText =
      `📍 ${currentLocation.name}
⏱ ${formatTime(seconds)} · 📏 ${distance.toFixed(2)} km · 👣 ${Math.floor(steps)}`;

  } else {
    // ⚠️ Caminata incompleta
    titleEl.innerText = "Caminata finalizada";
    subtitleEl.innerText = "Caminata finalizada antes de tiempo";

    dataEl.innerText =
      `📍 ${currentLocation.name}
⏱ ${formatTime(seconds)} · 📏 ${distance.toFixed(2)} km · 👣 ${Math.floor(steps)}
⏸ Saliste antes de completar la ruta`;
  }

  goTo('final');
}

/* ================== GUARDAR HISTORIAL ================== */
function saveHistory() {
  const history = JSON.parse(localStorage.getItem('pasoreal')) || [];

  const totalSeconds = currentLocation.durationMin * 60;
  const completed = seconds >= totalSeconds * 0.95;

  history.push({
  date: new Date().toLocaleString(),
  routeId: currentLocation.id,        // 👈 CLAVE REAL
  routeName: currentLocation.name,    // 👈 SOLO VISUAL
  time: formatTime(seconds),
  distance: distance.toFixed(2),
  steps: Math.floor(steps),
  completed: seconds >= currentLocation.durationMin * 60 * 0.95
});

  localStorage.setItem('pasoreal', JSON.stringify(history));
  loadHistory();
  goTo('historial');
}

/* ================== CARGAR HISTORIAL ================== */
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('pasoreal')) || [];
  const container = document.getElementById('historyList');
  container.innerHTML = '';

  // Agrupar por ruta
  const grouped = {};

  history.forEach(h => {
    if (!grouped[h.routeId]) {
  grouped[h.routeId] = {
    name: h.routeName,
    walks: []
  };
}

grouped[h.routeId].walks.push(h);
  });

  // Render por ruta
  Object.values(grouped).forEach(route => {
  const walks = route.walks;

    const totalKm = walks.reduce((sum, w) => sum + parseFloat(w.distance), 0);
    const completedCount = walks.filter(w => w.completed).length;

    // Card resumen (logro)
    const summary = document.createElement('div');
    summary.className = 'route-summary';

    summary.innerHTML = `
      <h3>📍 ${route.name}</h3>
      <p>
        ${walks.length} intentos · 
        ${completedCount} completadas · 
        ${totalKm.toFixed(2)} km
      </p>
    `;

    container.appendChild(summary);

    // Detalle de caminatas
    walks.forEach(h => {
      const card = document.createElement('div');
      card.className = 'history-card';

      card.innerHTML = `
        <div class="history-date">${h.date}</div>
        <div class="history-metrics">
          <span>⏱ ${h.time}</span>
          <span>📏 ${h.distance} km</span>
          <span>👣 ${h.steps}</span>
        </div>
        <div class="history-status ${h.completed ? 'ok' : 'warn'}">
          ${h.completed ? '✅ Ruta completada' : '⚠️ Ruta incompleta'}
        </div>
      `;

      container.appendChild(card);
    });
  });
}

/* ================== UTILIDAD ================== */
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function toggleFullscreen() {
  const video = document.querySelector('video');

  if (!document.fullscreenElement) {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen(); // Android / Chrome
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}