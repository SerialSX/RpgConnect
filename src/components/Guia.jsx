import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/guia.css";
import "../styles/home.css";

// Assets
import logo from "../assets/icone_logo.png";
import iconMapa from "../assets/icone_mapa.png";
import iconChat from "../assets/icone_chat.png";
import iconPerfil from "../assets/icone_perfil.png";
import rpgPhoto from "../assets/rpg_photo.png";
import bookIcon from "../assets/book.png";
import magicChar from "../assets/magic_character_photo.png";
import treasureChest from "../assets/treasure_chest_photo.png";
import guiaPdf from "../assets/Guia_RPG_Content.pdf";

const Guia = () => {
  // Prevent drag and drop
  useEffect(() => {
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => e.preventDefault();
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const baixarGuia = () => {
    const link = document.createElement("a");
    link.href = guiaPdf;
    link.download = "Guia_Supremo_Aventureiro_2026.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="guia-page-body min-vh-100">
      {/* ===== NAVBAR PADRONIZADA ===== */}
      <header className="main-header">
        <div className="container header-container">
          <div className="header-left">
            <Link className="brand" to="/">
              <img src={logo} alt="Logo" className="nav-logo-img" />
              <span className="brand-text">RPG CONNECT</span>
            </Link>
          </div>

          <div className="header-right">
            <Link to="/" className="nav-icon-link" title="Inicio">
              <button className="btn-join">Inicio</button>
            </Link>
            
            <Link to="/mapa" className="nav-icon-link" data-protected="true" title="Mapa">
              <img src={iconMapa} alt="Mapa" /> Mapa
            </Link>

            <Link to="/chat" className="nav-icon-link" data-protected="true" title="Chat">
              <img src={iconChat} alt="Chat" /> Chat
            </Link>

            <Link to="/perfil" className="nav-icon-link" data-protected="true" title="Perfil">
              <img src={iconPerfil} alt="Perfil" /> Perfil
            </Link>
          </div>
        </div>
      </header>

      {/* 🔹 CONTEÚDO PRINCIPAL */}
      <main className="guia-main">
        {/* HERO SECTION */}
        <section className="guia-header-section">
          <h1 className="titulo-guia">Guia dos Reinos</h1>
          <p className="subtitulo-guia">
            Bem-vindo, aventureiro! Você está prestes a mergulhar no multiverso infinito do RPG de mesa. 
            Nesta página, compilamos o conhecimento essencial para transformar sua imaginação em lendas épicas.
          </p>
        </section>

        {/* PILLARS SECTION */}
        <section className="guia-section">
          <h2 className="section-title">Os Três Pilares</h2>
          <div className="pillars-grid">
            <div className="pillar-card">
              <span className="pillar-icon">🎭</span>
              <h3>Interpretação</h3>
              <p>Dê vida a personagens únicos com medos, desejos e personalidades próprias. No RPG, você não apenas joga, você SE TORNA o herói.</p>
            </div>
            <div className="pillar-card">
              <span className="pillar-icon">🧭</span>
              <h3>Exploração</h3>
              <p>Viaje por mapas vastos, investigue ruínas antigas e descubra mistérios que aguardam nas sombras de cada masmorra.</p>
            </div>
            <div className="pillar-card">
              <span className="pillar-icon">⚔️</span>
              <h3>Combate</h3>
              <p>Estratégia e sorte se encontram nos dados. Enfrente criaturas lendárias e use suas habilidades para proteger seu grupo.</p>
            </div>
          </div>
        </section>

        {/* SYSTEMS SECTION */}
        <section className="guia-section">
          <h2 className="section-title">Sistemas Lendários</h2>
          <div className="systems-container">
            <div className="system-item">
              <div className="system-img-wrapper"><img src={rpgPhoto} alt="D&D" /></div>
              <div className="system-info">
                <h4>Dungeons & Dragons 5e</h4>
                <p>O precursor de todos. Focado em alta fantasia heroica, dragões, magia e o lendário sistema d20.</p>
              </div>
            </div>
            <div className="system-item">
              <div className="system-img-wrapper"><img src={bookIcon} alt="Tormenta" /></div>
              <div className="system-info">
                <h4>Tormenta20</h4>
                <p>O maior RPG brasileiro. Um mundo de aventura desenfreada com um panteão complexo e ameaças colossais.</p>
              </div>
            </div>
            <div className="system-item">
              <div className="system-img-wrapper"><img src={magicChar} alt="CoC" /></div>
              <div className="system-info">
                <h4>Call of Cthulhu</h4>
                <p>Mistério e horror cósmico. Prepare-se para enfrentar o desconhecido e tentar manter sua sanidade intacta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MASTER TIPS */}
        <section className="guia-section">
            <h2 className="section-title">Dica de Mestre</h2>
            <div className="pillar-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <span className="pillar-icon">🐉</span>
                <h3>"A regra de ouro é se divertir"</h3>
                <p>O RPG é uma história contada em conjunto. O Mestre não joga CONTRA os jogadores, mas sim COM eles para criar momentos inesquecíveis. Deixe os dados rolarem e aceite o destino que eles traçarem!</p>
            </div>
        </section>

        {/* DOWNLOAD SECTION */}
        <section className="download-section">
          <h3>Pronto para se tornar uma lenda?</h3>
          <p style={{marginBottom: '30px', color: '#b8b1e0'}}>Preparamos um material completo em PDF com fichas, regras básicas e um guia de criação de mundo.</p>
          <button className="botao-download" onClick={baixarGuia}>
            <span>📘</span> Baixar Manual do Aventureiro (PDF)
          </button>
        </section>
      </main>
    </div>
  );
};

export default Guia;
