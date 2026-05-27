import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import {
  initMapa,
  sincronizarUsuario,
  focarLocal,
  locaisRPG,
  calcularStatusReal,
  criarRota
} from "../js/mapa";
import { addXP } from "../js/xp";

import "../styles/mapa.css";

import logoImg from "../assets/icone_logo.png";
import iconInicio from "../assets/icone_botao_inicio.png";
import iconChat from "../assets/chat_icon.png";
import iconPerfil from "../assets/icone_perfil.png";
import iconDashboard from "../assets/espadas_icone.png";
import logo from "../assets/icone_logo.png";


export default function Mapa() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [locaisFiltrados, setLocaisFiltrados] = useState(locaisRPG);

  // Inicializa o mapa apenas uma vez
  useEffect(() => {
    initMapa();
    
    // Cleanup ao sair da tela de mapa
    return () => {
      const infoRota = document.getElementById("info-rota");
      if (infoRota) infoRota.remove();
    };
  }, []);

  // Filtro de busca + status
  useEffect(() => {
    const filtrados = locaisRPG.filter((local) => {
      const termo = busca.toLowerCase();

      const correspondeBusca =
        local.nome.toLowerCase().includes(termo) ||
        (local.desc && local.desc.toLowerCase().includes(termo));

      const status = calcularStatusReal(local);

      if (filtroStatus === "aberto")
        return correspondeBusca && status.aberto;

      if (filtroStatus === "fechado")
        return correspondeBusca && !status.aberto;

      return correspondeBusca;
    });

    setLocaisFiltrados(filtrados);
    
    // Ganhar XP ao realizar uma busca com sucesso
    if (busca.length > 2 && filtrados.length > 0) {
      addXP(10);
    }
  }, [busca, filtroStatus]);

  return (
    <div className="map-page-wrapper">
      <header className="main-header">
        <div className="container header-container">
          <div className="header-left">
            <Link className="brand" to="/inicio">
              <img src={logo} alt="Logo" className="nav-logo-img" />
              <span className="brand-text">RPG CONNECT</span>
            </Link>
          </div>
          <div className="header-right">
            <Link to="/" className="nav-icon-link">
              <button className="btn-join">Inicio</button>
            </Link>
            <Link to="/dashboard" className="nav-icon-link"> 
              <img src={iconDashboard} alt="Dashboard" /> Dashboard 
            </Link>
            <Link to="/chat" className="nav-icon-link">
              <img src={iconChat} alt="Chat" /> Chat
            </Link>
            <Link to="/perfil" className="nav-icon-link">
              <img src={iconPerfil} alt="Perfil" /> Perfil
            </Link>
          </div>
        </div>
      </header>

      <main className="map-dashboard">
        <div className="sidebar-rpg">
          <div className="sidebar-header-rpg">
            <h2 className="rpg-title-gold">Explorador de Reinos</h2>
            <p className="rpg-subtitle">Onde a sua próxima aventura começa</p>
          </div>

          <div className="rpg-search-container">
            <div className="rpg-search-input">
              <input
                type="text"
                placeholder="Nome da taverna, guilda..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <span className="search-glow"></span>
            </div>
          </div>

          <div className="rpg-filter-pills">
            <button onClick={() => setFiltroStatus("todos")} className={filtroStatus === "todos" ? "active" : ""}>Todos</button>
            <button onClick={() => setFiltroStatus("aberto")} className={filtroStatus === "aberto" ? "active" : ""}>Abertos</button>
            <button onClick={() => setFiltroStatus("fechado")} className={filtroStatus === "fechado" ? "active" : ""}>Fechados</button>
          </div>

          <div className="locais-scroll-area">
            {locaisFiltrados.length > 0 ? (
              locaisFiltrados.map((local, index) => {
                const status = calcularStatusReal(local);
                return (
                  <div
                    key={index}
                    className={`rpg-location-card ${status.aberto ? 'status-open' : 'status-closed'}`}
                    onClick={() => {
                      focarLocal(local.coords);
                      criarRota(local.coords);
                      addXP(15);
                    }}
                  >
                    <div className="card-top">
                      <span className="category-tag">{local.categoria}</span>
                      <span className={`status-dot ${status.aberto ? 'online' : 'offline'}`}></span>
                    </div>
                    <h3 className="location-name">{local.nome}</h3>
                    <div className="card-footer">
                      <span className="status-label">{status.aberto ? "Portões Abertos" : "Caminho Bloqueado"}</span>
                      <span className="explore-hint">Zarpas para cá →</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-rpg">Nenhum local encontrado nos mapas...</div>
            )}
          </div>

          <button className="btn-gps-rpg" onClick={sincronizarUsuario}>
            <span className="gps-icon">📍</span> Sincronizar Bússola
          </button>
        </div>

        <div className="map-viewer-container">
          <div id="map" className="rpg-map-frame"></div>
          <div className="map-overlay-vignette"></div>
        </div>
      </main>
    </div>
  );
}
