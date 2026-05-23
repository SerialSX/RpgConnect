import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";

import logo from "../assets/logo_connect.png";
import iconInicio from "../assets/icone_botao_inicio.png";
import iconMapa from "../assets/icone_mapa.png";
import iconChat from "../assets/chat_icon.png";
import iconPerfil from "../assets/icone_perfil.png";
import iconGrupos from "../assets/icone_grupos.png";
import iconLocation from "../assets/location_icon.png";
import icondices from "../assets/dices_icon.png";
import iconcards from "../assets/cards_icon.png";
import iconTrophy from "../assets/trophy_icon.png";
import iconStar from "../assets/star_icon.png";
import imgMountains from "../assets/mountains_rpg.png";


export default function Home() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const featuresRef = useRef(null);
    const [featuresVisible, setFeaturesVisible] = useState(false);

    const chroniclesRef = useRef(null);
    const [chroniclesVisible, setchroniclesVisible] = useState(false);

    const [authAlert, setAuthAlert] = useState({ visible: false, message: "" });
    const usuario = localStorage.getItem("usuarioLogado") || localStorage.getItem("token");

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target === featuresRef.current) {
                        setFeaturesVisible(entry.isIntersecting);
                    } else if (entry.target === chroniclesRef.current) {
                        setchroniclesVisible(entry.isIntersecting);
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (featuresRef.current) observer.observe(featuresRef.current);
        if (chroniclesRef.current) observer.observe(chroniclesRef.current);

        return () => {
            if (featuresRef.current) observer.unobserve(featuresRef.current);
            if (chroniclesRef.current) observer.unobserve(chroniclesRef.current);
        };
    }, []);

    useEffect(() => {
        const linksProtegidos = document.querySelectorAll('[data-protected="true"]');

        const handleClick = (e) => {
            if (!usuario) {
                e.preventDefault();
                setAuthAlert({
                    visible: true,
                    message: "Cadastre-se ou faça login para acessar os recursos da guilda!"
                });

                // Esconder após 3 segundos
                setTimeout(() => {
                    setAuthAlert(prev => ({ ...prev, visible: false }));
                }, 3000);
            }
        };

        linksProtegidos.forEach((link) => link.addEventListener("click", handleClick));
        return () => linksProtegidos.forEach((link) => link.removeEventListener("click", handleClick));
    }, [navigate]);

    return (
        <div className="mystical-portal">
            <header className="main-header">
                <div className="container header-container">
                    <div className="header-left">
                        <Link className="brand" to="/">
                            <img src={logo} alt="Logo" className="nav-logo-img" />
                            <span className="brand-text">RPG CONNECT</span>
                        </Link>
                    </div>

                    <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                        <span className="material-symbols-outlined">
                            {isMobileMenuOpen ? "close" : "menu"}
                        </span>
                    </button>

                    <div className={`header-right ${isMobileMenuOpen ? "active" : ""}`}>
                        {!usuario && (
                            <Link to="/login" className="nav-icon-link" title="Jogar">
                                <button className="btn-join">Entrar <span className="btn-text-hide">na aventura</span></button>
                            </Link>
                        )}

                        <Link to="/mapa" className="nav-icon-link" data-protected="true" title="Mapa">
                            <img src={iconMapa} alt="Mapa" /> <span className="nav-link-text">Mapa</span>
                        </Link>
                        <Link to="/chat" className="nav-icon-link" data-protected="true" title="Chat">
                            <img src={iconChat} alt="Chat" /> <span className="nav-link-text">Chat</span>
                        </Link>
                        <Link to="/perfil" className="nav-icon-link" data-protected="true" title="Perfil">
                            <img src={iconPerfil} alt="Perfil" /> <span className="nav-link-text">Perfil</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ALERTA DE AUTENTICAÇÃO */}
            {authAlert.visible && (
                <div className="auth-custom-alert">
                    <div className="alert-content">
                        <span className="material-symbols-outlined alert-icon">lock</span>
                        <span className="alert-message">{authAlert.message}</span>
                    </div>
                    <div className="alert-progress"></div>
                </div>
            )}

            <main>
                <section className="hero-section">
                    <div className="hero-overlay"></div>
                    <div className="container hero-inner">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                A <span className="italic-text">Jornada</span>
                            </h1>
                            <div className="hero-footer">
                                <p className="hero-description">
                                    Conecte-se com jogadores, descubra locais incríveis e embarque
                                </p>
                                <p className="hero-description2">em novas aventuras através do maior portal de RPG. </p>

                                <Link to="/signup" className="btn-explore">
                                    Começar Aventura
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="marquee-wrapper">
                    <div className="tilted-marquee">
                        <div className="marquee-content">
                            ROLE DE INICIATIVA • ENCONTRE SEU GRUPO • ENTRE NA TAVERNA • ENTRE NA AVENTURA •
                            ROLE DE INICIATIVA • ENCONTRE SEU GRUPO • ENTRE NA TAVERNA • ENTRE NA AVENTURA
                        </div>
                    </div>
                </div>

                <section className="features-dark">
                    <div ref={featuresRef} className={`container grid-3 ${featuresVisible ? "visible" : ""}`}>
                        <div className="f-card">
                            <div className="f-icon-wrapper">
                                <img src={iconLocation} alt="Localização" />
                            </div>
                            <h3>Descubra Locais</h3>
                            <p>Encontre cafés, lojas e espaços para jogar RPG e board games perto de você.</p>
                        </div>
                        <div className="f-card">
                            <div className="f-icon-wrapper">
                                <img src={iconGrupos} alt="Grupos" />
                            </div>
                            <h3>Sua Jornada</h3>
                            <p>Customize seu perfil e defina suas classes favoritas.</p>
                        </div>
                        <div className="f-card">
                            <div className="f-icon-wrapper">
                                <img src={iconChat} alt="Chat" />
                            </div>
                            <h3>Chat Integrado</h3>
                            <p>Conheça jogadores com os mesmos interesses e forme o seu grupo ideal.</p>
                        </div>
                    </div>
                </section>

                <section className="games-supported">
                    <div className="container">
                        <h2 className="serif-title text-center">Sistemas & Reinos Suportados</h2>
                        <div className="games-grid">
                            <div className="game-item">
                                <img src={icondices} alt="RPG de Mesa" />
                                <span>RPG DE MESA</span>
                            </div>
                            <div className="game-item">
                                <img src={iconcards} alt="TCG" />
                                <span>JOGO DE CARTAS</span>
                            </div>
                            <div className="game-item">
                                <img src={iconTrophy} alt="Board Games" />
                                <span>BOARD GAMES</span>
                            </div>
                            <div className="game-item">
                                <img src={iconStar} alt="Wargames" />
                                <span>WARGAMES</span>
                            </div>
                        </div>
                    </div>
                </section>


                <section className="community-chronicles">
                    <div ref={chroniclesRef} className={`container chronicles-wrapper ${chroniclesVisible ? "visible" : ""}`}>

                        <div className="chronicles-content">
                            <h2 className="editorial-title">
                                Community <br />
                                <span className="accent-purple">Chronicles</span>
                            </h2>

                            <div className="article-list">
                                <div className="article-entry">
                                    <span className="entry-number">01</span>
                                    <div className="entry-text">
                                        <h4>A Arte de Construir Mundos: Além do Mapa</h4>
                                    </div>
                                </div>

                                <div className="article-entry">
                                    <span className="entry-number">02</span>
                                    <div className="entry-text">
                                        <h4>5 Regras para melhor Roleplaying na Mesa</h4>
                                    </div>
                                </div>

                                <div className="article-entry">
                                    <span className="entry-number">03</span>
                                    <div className="entry-text">
                                        <h4>Crie Vínculos: Por que sua Party Precisa incluir</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="chronicles-visual">
                            <div className="image-frame">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB82dgP0xvhbc9vUCVzxhvEy5rJVllqSMd9v3qSjyAlntnNJz7yJtLEwVAjsLXPCzLEUTnmMLTTkNrytL_kjmv1CLvK2bQ9lZ1aQknVc1rZiBnDUWVUj5P2Nj5fIC5b3EBdi4rSJKr1PGRz3vORfWJNK6LxBWKlMmsaCBOSj4YguTMzPGGsMdZ0Mctcq7I3ORdOulRUUt8xZ4PMR8VfMKZNrBWRA8zmOSZJZYZjteLsAPj6mmOkmbOrESneL_ii53elS5D_a2iQEw" alt="Players" />
                                <div className="stat-badge">
                                    <span className="stat-number">RPG</span>
                                    <span className="stat-label">Adventures</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>


                <section
                    className="cta-ready-to-roll"
                    style={{ backgroundImage: `url(${imgMountains})` }}
                >
                    <div className="cta-overlay"></div>
                    <div className="container cta-content">
                        <h2 className="cta-title">READY TO ROLL?</h2>
                        <p className="cta-description">
                            A taverna está aquecida, o hidromel está gelado e sua aventura está à espera.
                            Junte-se à guilda mais prestigiada do reino.
                        </p>
                        <Link to="/signup" className="btn-join-guild">
                            Entrar no Time
                        </Link>
                    </div>
                </section>

            </main>

            <footer className="massive-footer">
                <div className="container footer-container">
                    <div className="footer-grid">

                        <div className="footer-brand-col">
                            <div className="footer-logo-wrapper">
                                <div className="logo-icon-box">
                                    <img src={logo} className="footer-logo-img" alt="RPG Connect" />
                                </div>
                                <span className="footer-brand-name">RPG CONNECT</span>
                            </div>
                            <p className="footer-description">
                                O hub definitivo para jogadores de RPG de mesa encontrarem seu grupo, compartilharem suas histórias e explorarem o multiverso infinito dos jogos.
                                Descubra novos cenários, domine sistemas clássicos e encontre os melhores locais físicos para suas sessões presenciais."
                            </p>
                        </div>



                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 RPG Connect — Criado por aventureiros para aventureiros.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}