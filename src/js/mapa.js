import L from "leaflet";
import "leaflet-routing-machine";

let mapInstance = null;
let markers = [];
let routingControl = null;
let userLocation = null;

// ==============================
// LOCAIS RPG (Fortaleza)
// ==============================

export const locaisRPG = [
  { nome: "Guilda Arcana", coords: [-3.7445, -38.5322], horario: { abre: 8, fecha: 18 }, categoria: "Guilda" },
  { nome: "Taverna do Dragão Roxo", coords: [-3.7415, -38.5300], horario: { abre: 10, fecha: 23 }, categoria: "Taverna" },
  { nome: "Mercado Negro de Runas", coords: [-3.7470, -38.5280], horario: { abre: 18, fecha: 3 }, categoria: "Mercado" },
  { nome: "Biblioteca dos Magos Antigos", coords: [-3.7428, -38.5355], horario: { abre: 9, fecha: 17 }, categoria: "Biblioteca" },
  { nome: "Templo da Lua Carmesim", coords: [-3.7495, -38.5312], horario: { abre: 6, fecha: 20 }, categoria: "Templo" },
  { nome: "Arena dos Campeões", coords: [-3.7398, -38.5275], horario: { abre: 14, fecha: 22 }, categoria: "Arena" },
  { nome: "Cripta das Sombras", coords: [-3.7482, -38.5340], horario: { abre: 20, fecha: 4 }, categoria: "Masmorra" },
  { nome: "Loja de Poções Alquímicas", coords: [-3.7430, -38.5268], horario: { abre: 9, fecha: 18 }, categoria: "Loja" },
  { nome: "Praça dos Bardos", coords: [-3.7365, -38.5260], horario: { abre: 6, fecha: 22 }, categoria: "Praca" },
  { nome: "Café do Mago Errante", coords: [-3.7408, -38.5335], horario: { abre: 8, fecha: 20 }, categoria: "Taverna" },
  { nome: "Observatório Celestial", coords: [-3.7512, -38.5370], horario: { abre: 17, fecha: 23 }, categoria: "Arena" },
  { nome: "Fortaleza das Lâminas", coords: [-3.7330, -38.5288], horario: { abre: 10, fecha: 19 }, categoria: "Guilda" },
  { nome: "Jardim das Fadas Antigas", coords: [-3.7528, -38.5295], horario: { abre: 7, fecha: 18 }, categoria: "Praca" },
  { nome: "Taberna do Anão Dourado", coords: [-3.7387, -38.5358], horario: { abre: 11, fecha: 2 }, categoria: "Taverna" },
  { nome: "Círculo Arcano de Fortaleza", coords: [-3.7458, -32.5242], horario: { abre: 9, fecha: 21 }, categoria: "Templo" },
  { nome: "Porto das Caravelas Místicas", coords: [-3.7220, -38.5210], horario: { abre: 6, fecha: 18 }, categoria: "Mercado" },
  { nome: "Torre do Arquimago Azul", coords: [-3.7540, -38.5400], horario: { abre: 13, fecha: 22 }, categoria: "Biblioteca" },
  { nome: "Cripta dos Antigos Guardiões", coords: [-3.7468, -38.5425], horario: { abre: 19, fecha: 4 }, categoria: "Masmorra" },
  { nome: "Mercado das Relíquias Perdidas", coords: [-3.7352, -38.5309], horario: { abre: 8, fecha: 17 }, categoria: "Mercado" },
  { nome: "Salão dos Conselheiros Élficos", coords: [-3.7420, -38.5388], horario: { abre: 10, fecha: 18 }, categoria: "Guilda" }
];

// ==============================
// STATUS ABERTO / FECHADO
// ==============================

export function calcularStatusReal(local) {
  const agora = new Date().getHours();
  const { abre, fecha } = local.horario;

  let aberto;

  if (abre < fecha) {
    aberto = agora >= abre && agora < fecha;
  } else {
    aberto = agora >= abre || agora < fecha;
  }

  return {
    aberto,
    msg: aberto ? "🟢 Aberto agora" : "🔴 Fechado agora"
  };
}

// ==============================
// ÍCONE GOOGLE STYLE
// ==============================

function criarIcone(local, status) {
  const gradientId = "grad-" + local.nome.replace(/\s+/g, "");

  return L.divIcon({
    className: "marker-rpg",
    html: `
      <svg viewBox="0 0 24 36">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${status.aberto ? '#C084FC' : '#888'}"/>
            <stop offset="100%" stop-color="${status.aberto ? '#6B21A8' : '#555'}"/>
          </linearGradient>
        </defs>

        <path
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
          fill="url(#${gradientId})"
        />

        <circle cx="12" cy="12" r="4.5" fill="white"/>
      </svg>
    `,
    iconSize: [36, 54],
    iconAnchor: [18, 54],
    popupAnchor: [0, -45]
  });
}

// ==============================
// INIT MAPA
// ==============================

export function initMapa() {
  if (mapInstance) {
    mapInstance.invalidateSize();
    return mapInstance;
  }

  const limitesFortaleza = L.latLngBounds(
    [-3.9000, -38.6500],
    [-3.6500, -38.4300]
  );

  mapInstance = L.map("map", {
    maxBounds: limitesFortaleza,
    maxBoundsViscosity: 1.0,
    minZoom: 12,
    maxZoom: 18
  }).setView([-3.7445, -38.5322], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(mapInstance);

  locaisRPG.forEach(local => {
    const status = calcularStatusReal(local);
    const icon = criarIcone(local, status);

    const marker = L.marker(local.coords, { icon })
      .addTo(mapInstance)
      .bindPopup(`<b>${local.nome}</b><br>${status.msg}`);

    markers.push(marker);
  });

  return mapInstance;
}

// ==============================
// FOCO
// ==============================

export function focarLocal(coords) {
  if (!mapInstance) return;

  mapInstance.flyTo(coords, 16, { duration: 0.6 });
}

// ==============================
// LOCALIZAÇÃO
// ==============================

export function sincronizarUsuario() {
  if (!mapInstance) return;

  mapInstance.locate({ setView: true, maxZoom: 16 });

  mapInstance.once("locationfound", function (e) {
    userLocation = e.latlng;

    L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: "#A345F5",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(mapInstance);

    mostrarPopupSucesso("📍 Localização sincronizada com sucesso!");
  });

  mapInstance.once("locationerror", function () {
    mostrarPopupErro("❌ Não foi possível obter sua localização.");
  });
}

// ==============================
// CRIAR ROTA
// ==============================

export function criarRota(destinoCoords) {
  if (!mapInstance || !userLocation) {
    alert("Ative sua localização primeiro.");
    return;
  }

  if (routingControl) {
    mapInstance.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(destinoCoords[0], destinoCoords[1])
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,
    lineOptions: {
      styles: [{ color: "#A345F5", weight: 6 }]
    },
    createMarker: () => null
  }).addTo(mapInstance);

  routingControl.on("routesfound", function (e) {
    const rota = e.routes[0];

    const distancia = rota.summary.totalDistance;
    const tempo = rota.summary.totalTime;

    const distanciaFormatada =
      distancia > 1000
        ? (distancia / 1000).toFixed(2) + " km"
        : Math.round(distancia) + " m";

    const tempoMin = Math.round(tempo / 60);

    const antiga = document.getElementById("info-rota");
    if (antiga) antiga.remove();

    const div = document.createElement("div");
    div.id = "info-rota";
    div.innerHTML = `
      <div style="
        position:absolute;
        bottom:20px;
        left:50%;
        transform:translateX(-50%);
        background:#1a1236;
        padding:12px 20px;
        border-radius:12px;
        border:1px solid #A345F5;
        color:white;
        font-weight:600;
        z-index:9999;
      ">
        Distância: ${distanciaFormatada} • Tempo estimado: ${tempoMin} min
      </div>
    `;
    document.body.appendChild(div);
  });
}




function mostrarPopupSucesso(mensagem) {
  criarPopup(mensagem, "#28a745");
}

function mostrarPopupErro(mensagem) {
  criarPopup(mensagem, "#dc3545");
}

function criarPopup(mensagem, cor) {
  const antigo = document.getElementById("popup-status");
  if (antigo) antigo.remove();

  const div = document.createElement("div");
  div.id = "popup-status";

  div.innerHTML = `
    <div style="
      position:fixed;
      top:20px;
      right:20px;
      background:#1a1236;
      border-left:5px solid ${cor};
      padding:14px 20px;
      border-radius:12px;
      color:white;
      font-weight:600;
      background-color: #a245f6;
      box-shadow:0 10px 25px rgba(134, 38, 207, 0.4);
      z-index:9999;
      animation:fadeIn 0.3s ease;
    ">
      ${mensagem}
    </div>
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}
