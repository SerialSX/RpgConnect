import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getLevelInfo, addXP, claimUniqueBonus } from "../js/xp";
import "../styles/tela_usuario.css";

import logo from "../assets/icone_logo.png";
import iconInicio from "../assets/icone_botao_inicio.png";
import iconMapa from "../assets/icone_mapa.png";
import iconChat from "../assets/chat_icon.png";
import iconPerfil from "../assets/icone_perfil.png";
import iconDices from "../assets/dices_icon.png";
import plusIcon from "../assets/plus.png";
import swordShield from "../assets/sword_shield.png";
import logoutIcon from "../assets/logout.png";
import iconeNotificacao from "../assets/notificacao.png";
import NotificationSystem from "./NotificationSystem";
import magicPhoto from "../assets/magic_character_photo.png";
import adventurePhoto from "../assets/adventure.png";
import rpgPhoto from "../assets/rpg_photo.png";
import treasurePhoto from "../assets/treasure_chest_photo.png";
import bookPhoto from "../assets/book.png";

import catanImg from "../assets/catan_1.png";
import ddImg from "../assets/dungeons_and_dragons_1.png";
import ttrImg from "../assets/ticket_to_ride_1.png";
import warImg from "../assets/war_1.png";

const LISTA_JOGOS = [
  { id: "catan", nome: "Catan", imagem: catanImg },
  { id: "dd", nome: "D&D", imagem: ddImg },
  { id: "ttr", nome: "Ticket to Ride", imagem: ttrImg },
  { id: "war", nome: "War", imagem: warImg },
];

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog";

const classesRPG = [
  {
    nome: "Paladino",
    descricao: "Um guerreiro sagrado que utiliza a fé para proteger seus aliados.",
    imagem: swordShield,
    cor: "#ffd700",
    stats: { for: 85, int: 40, agi: 30, vit: 90 },
    skills: ["Escudo Divino", "Golpe Radiante"]
  },
  {
    nome: "Mago Arcano",
    descricao: "Mestre das energias místicas, capaz de dobrar a realidade.",
    imagem: magicPhoto,
    cor: "#a345f5",
    stats: { for: 20, int: 95, agi: 40, vit: 35 },
    skills: ["Chuva de Meteoros", "Teletransporte"]
  },
  {
    nome: "Explorador",
    descricao: "Vanguardista que desbrava terras desconhecidas em busca de glória.",
    imagem: adventurePhoto,
    cor: "#2ecc71",
    stats: { for: 55, int: 60, agi: 85, vit: 70 },
    skills: ["Sexto Sentido", "Mestre de Terreno"]
  },
  {
    nome: "Mestre de Armas",
    descricao: "Um veterano de mil batalhas que domina qualquer lâmina.",
    imagem: rpgPhoto,
    cor: "#e74c3c",
    stats: { for: 90, int: 30, agi: 65, vit: 80 },
    skills: ["Corte Preciso", "Contra-Ataque"]
  },
  {
    nome: "Guardião do Tesouro",
    descricao: "Protetor das relíquias mais raras, ninguém passa pelo seu escudo.",
    imagem: treasurePhoto,
    cor: "#f1c40f",
    stats: { for: 70, int: 50, agi: 35, vit: 95 },
    skills: ["Muralha de Ferro", "Olhar da Ganância"]
  },
  {
    nome: "Escriba Místico",
    descricao: "Conhecedor de rituais antigos e segredos que o tempo esqueceu.",
    imagem: bookPhoto,
    cor: "#3498db",
    stats: { for: 15, int: 98, agi: 30, vit: 40 },
    skills: ["Glifo de Proteção", "Invocação de Saber"]
  },
  {
    nome: "Sombra Carmesim",
    descricao: "Especialista em infiltração que ataca de onde menos se espera.",
    imagem: iconPerfil,
    cor: "#4a4a4a",
    stats: { for: 45, int: 50, agi: 95, vit: 40 },
    skills: ["Passo das Sombras", "Ataque Crítico"]
  },
  {
    nome: "Berserker Furioso",
    descricao: "Alimentado pela fúria, ignora a dor para destruir seus inimigos.",
    imagem: iconInicio,
    cor: "#ff4d4d",
    stats: { for: 95, int: 10, agi: 60, vit: 75 },
    skills: ["Grito de Guerra", "Fúria Incontrolável"]
  },
  {
    nome: "Arquimago",
    descricao: "A forma definitiva do conhecimento místico e poder elemental.",
    imagem: iconDices,
    cor: "#8e44ad",
    stats: { for: 25, int: 99, agi: 45, vit: 40 },
    skills: ["Buraco Negro", "Singularidade"]
  },
  {
    nome: "Sentinela",
    descricao: "Atirador de elite que vigia as fronteiras do reino com olhos de águia.",
    imagem: logo,
    cor: "#16a085",
    stats: { for: 40, int: 35, agi: 92, vit: 55 },
    skills: ["Olho de Rapina", "Tiro Perfurante"]
  }
];

const curiosidadesRPG = [
  {
    titulo: "O Primeiro RPG",
    fato: "Dungeons & Dragons, o primeiro RPG comercial, foi publicado em 1974 por Gary Gygax e Dave Arneson."
  },
  {
    titulo: "Origem dos Dados",
    fato: "Os dados de 20 lados (d20) já existiam no Antigo Egito, embora não fossem usados para jogos de RPG na época."
  },
  {
    titulo: "Impacto Cultural",
    fato: "O 'Efeito Stranger Things' trouxe milhões de novos jogadores ao hobby na última década."
  },
  {
    titulo: "Poder da Imaginação",
    fato: "Estudos sugerem que jogar RPG ajuda a desenvolver empatia, resolução de problemas e habilidades sociais."
  }
];

const getDeterministicClass = (nome, email, id) => {
  const seed = `${nome || ""}-${email || ""}-${id || ""}`.toLowerCase();
  if (!seed || seed === "--") return classesRPG[0];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const saltedHash = Math.abs(hash * 31);
  const index = saltedHash % classesRPG.length;
  return classesRPG[index];
};

const TelaUsuario = () => {
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("token");
    navigate("/");
  };

  const dadosStored = localStorage.getItem("usuarioLogado");
  let nomeParaExibir = "Aventureiro";
  let avatarParaExibir = null;

  if (dadosStored) {
    try {
      const usuarioObj = JSON.parse(dadosStored);
      nomeParaExibir = (usuarioObj.nome || "Aventureiro").replace(/[0-9]/g, "");
      const email = usuarioObj.email || "anon";
      avatarParaExibir = localStorage.getItem(`avatar_${email}`) ||
        usuarioObj.avatar ||
        usuarioObj.foto ||
        usuarioObj.img ||
        usuarioObj.profile_image ||
        usuarioObj.photoURL;
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
    }
  }

  const [levelInfo, setLevelInfo] = useState(getLevelInfo());

  useEffect(() => {
    const handleXP = () => setLevelInfo(getLevelInfo());
    window.addEventListener("xpUpdated", handleXP);
    return () => window.removeEventListener("xpUpdated", handleXP);
  }, []);

  useEffect(() => {
    const usuario = localStorage.getItem("usuarioLogado") || localStorage.getItem("token");
    const linksProtegidos = document.querySelectorAll('[data-protected="true"]');

    const handleClick = (e) => {
      if (!usuario) {
        e.preventDefault();
        navigate("/login");
      }
    };

    linksProtegidos.forEach((link) => link.addEventListener("click", handleClick));

    const infoRota = document.getElementById("info-rota");
    if (infoRota) infoRota.remove();

    return () => linksProtegidos.forEach((link) => link.removeEventListener("click", handleClick));
  }, [navigate]);

  return (
    <div className="app-bg min-vh-100 pb-5">
      <header className="main-header">
        <div className="container header-container">
          <div className="header-left">
            <Link className="brand" to="/inicio">
              <img src={logo} alt="Logo" className="nav-logo-img" />
              <span className="brand-text">RPG CONNECT</span>
            </Link>
          </div>
          <div className="header-right">
            <Link to="/" className="nav-icon-link" data-protected="true" title="Chat">
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

            <NotificationSystem />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="btn_deslogar">
                  <img src={logoutIcon} alt="Sair" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sair da Aventura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sua jornada será pausada. Tem certeza que deseja deslogar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="voltar_btn">Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="sair_btn">Sair</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="container mt-5 pt-3">
        <HeaderUsuario nome={nomeParaExibir} avatar={avatarParaExibir} levelInfo={levelInfo} />
        <AcessoRapido />
        <ConteudoUsuario levelInfo={levelInfo} />
      </main>
    </div>
  );
};

const HeaderUsuario = ({ nome, avatar, levelInfo }) => (
  <header className="d-flex align-items-center mb-5 header-dashboard-rpg">
    <div className="avatar-wrapper">
      {avatar ? (
        <img src={avatar} alt="User" style={{ objectFit: 'cover' }} />
      ) : (
        <img src="https://i.imgur.com/8Km9tLL.png" alt="User" />
      )}
    </div>
    <div className="ms-3 d-flex flex-column">
      <div className="d-flex align-items-center gap-3">
        <h1 className="h2 mb-0 text-white fw-bold">Olá, {nome}</h1>
        <div className="header-level-badge">
          <span className="lvl-text">LVL</span>
          <span className="lvl-num">{levelInfo.level}</span>
        </div>
      </div>
      <p className="texto_user mb-0">Pronto pra jogar?</p>
    </div>
  </header>
);

const AcessoRapido = () => (
  <>
    <h3 className="titulo_secao mb-4">Acesso rápido</h3>
    <div className="row g-4 mb-5">
      <CardAcesso titulo="Chat de conversas" desc="Converse com outros jogadores" img={iconChat} rota="/chat" />
      <CardAcesso titulo="Explorar mapa" desc="Encontre locais próximos" img={iconMapa} rota="/mapa" />
      <CardAcesso titulo="Guia RPG" desc="Técnicas para mestres" img={iconDices} rota="/guia" />
    </div>
    <h4 className="text_jogos_favoritos">Meus Jogos Favoritos</h4>
  </>
);

const ConteudoUsuario = ({ levelInfo }) => {
  const [classe, setClasse] = useState(null);
  const [jogosFavoritos, setJogosFavoritos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const dadosStored = localStorage.getItem("usuarioLogado");
    if (!dadosStored) return;
    try {
      const usuarioObj = JSON.parse(dadosStored);
      const identificadorChave = usuarioObj.id || usuarioObj.email || "visitante";
      const chaveClasse = `classe_${identificadorChave}`;
      let classeSalva = localStorage.getItem(chaveClasse);

      const classeIdeal = getDeterministicClass(usuarioObj.nome, usuarioObj.email, usuarioObj.id);

      if (!classeSalva) {
        localStorage.setItem(chaveClasse, JSON.stringify(classeIdeal));
        setClasse(classeIdeal);
      } else {
        const parsedClass = JSON.parse(classeSalva);
        if (!parsedClass || !parsedClass.skills || !parsedClass.stats || parsedClass.nome === "Paladino") {
          localStorage.setItem(chaveClasse, JSON.stringify(classeIdeal));
          setClasse(classeIdeal);
        } else {
          setClasse(parsedClass);
        }
      }

      const chaveFavoritos = `favoritos_${identificadorChave}`;
      const salvos = localStorage.getItem(chaveFavoritos);
      const favs = salvos ? JSON.parse(salvos) : [];
      setJogosFavoritos(favs);

      const hoje = new Date().toDateString();
      const userKey = usuarioObj.id || usuarioObj.email;
      const ultimaVisita = localStorage.getItem(`last_visit_${userKey}`);
      if (ultimaVisita !== hoje) {
        addXP(20);
        localStorage.setItem(`last_visit_${userKey}`, hoje);
      }

      if (favs.length === 3) {
        claimUniqueBonus("favorites_full", 50);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  const salvarFavoritos = (novosFavoritos) => {
    const dadosStored = localStorage.getItem("usuarioLogado");
    if (!dadosStored) return;
    const usuarioObj = JSON.parse(dadosStored);
    const identificador = usuarioObj.id || usuarioObj.email || usuarioObj.nome || "anon";
    const chaveFavoritos = `favoritos_${identificador}`;

    localStorage.setItem(chaveFavoritos, JSON.stringify(novosFavoritos));
    setJogosFavoritos(novosFavoritos);

    if (novosFavoritos.length === 3) {
      claimUniqueBonus("favorites_full", 50);
    }

    setModalAberto(false);
  };

  const toggleJogo = (jogo) => {
    if (jogosFavoritos.find(j => j.id === jogo.id)) {
      salvarFavoritos(jogosFavoritos.filter(j => j.id !== jogo.id));
    } else {
      if (jogosFavoritos.length < 3) {
        salvarFavoritos([...jogosFavoritos, jogo]);
      } else {
        alert("Máximo de 3 jogos favoritos!");
      }
    }
  };


  if (!classe) return <div className="loading-rpg">Carregando aventura...</div>;

  return (
    <div className="container_cards_jogos_classe">
      <section>
        <div className="card_jogo_favorito">
          <div className="card-body p-4 text-center">
            {jogosFavoritos.length === 0 ? (
              <>
                <h5 className="subtext_jogos_favoritos">Você ainda não tem jogos favoritos</h5>
                <div className="circulo_favoritos" onClick={() => setModalAberto(true)}>
                  <img src={plusIcon} alt="Adicionar" style={{ width: 35, height: 35 }} />
                </div>
              </>
            ) : (
              <div className="selecao_favoritos_container">
                <div className="jogos_selecionados_grid">
                  {jogosFavoritos.map(jogo => (
                    <div key={jogo.id} className="jogo_favorito_item">
                      <img src={jogo.imagem} alt={jogo.nome} />
                      <span>{jogo.nome}</span>
                    </div>
                  ))}
                  {jogosFavoritos.length < 3 && (
                    <div className="circulo_favoritos_pequeno" onClick={() => setModalAberto(true)}>
                      <img src={plusIcon} alt="Adicionar" style={{ width: 20, height: 20 }} />
                    </div>
                  )}
                </div>
                <button className="btn_editar_jogos" onClick={() => setModalAberto(true)}>Editar Favoritos</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {modalAberto && (
        <div className="modal_jogos_overlay">
          <div className="modal_jogos_content">
            <h3 className="modal_titulo_roxo">Escolha seus Favoritos</h3>
            <p className="modal_subtitulo">Selecione até 3 jogos que você mais gosta</p>
            <div className="modal_jogos_grid">
              {LISTA_JOGOS.map(jogo => {
                const selecionado = jogosFavoritos.find(j => j.id === jogo.id);
                return (
                  <div
                    key={jogo.id}
                    className={`modal_jogo_card ${selecionado ? 'selecionado' : ''}`}
                    onClick={() => toggleJogo(jogo)}
                  >
                    <div className="check_box">{selecionado ? '✓' : ''}</div>
                    <img src={jogo.imagem} alt={jogo.nome} />
                    <span>{jogo.nome}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn_fechar_modal" onClick={() => setModalAberto(false)}>Concluir</button>
          </div>
        </div>
      )}

      <section className="mb-5">
        <h4 className="text_classe_rpg mb-4 text-center">Sua Identidade Heroica</h4>
        <div className="container_classe_rpg">
          <div className="premium-class-card" style={{ "--item-color": classe.cor }}>
            <div className="class-card-glow"></div>
            <div className="class-card-content p-4 p-md-5">
              <div className="row g-4 align-items-stretch">
                <div className="col-lg-4 text-center border-end-custom d-flex flex-column justify-content-center">
                  <div className="class-icon-wrapper mb-3">
                    <img src={classe.imagem} alt={classe.nome} />
                  </div>
                  <h2 className="class-name-title mb-2">{classe.nome}</h2>
                </div>
                <div className="col-lg-4 px-lg-4 border-end-custom">
                  <div className="h-100 d-flex flex-column justify-content-center">
                    <h5 className="section-subtitle">Bio da Classe</h5>
                    <p className="class-bio-text">{classe.descricao}</p>
                    <h5 className="section-subtitle mt-2">Habilidades Especiais</h5>
                    <div className="skills-container">
                      {classe.skills && Array.isArray(classe.skills) && classe.skills.map((skill, i) => (
                        <span key={i} className="skill-pill">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 ps-lg-4 d-flex flex-column justify-content-center">
                  <h5 className="section-subtitle">Ficha de Atributos</h5>
                  <div className="stats-grid">
                    <StatBar label="FORÇA" value={classe.stats?.for || 0} color="#ff4d4d" />
                    <StatBar label="INTELIGÊNCIA" value={classe.stats?.int || 0} color="#3498db" />
                    <StatBar label="AGILIDADE" value={classe.stats?.agi || 0} color="#2ecc71" />
                    <StatBar label="VITALIDADE" value={classe.stats?.vit || 0} color="#f1c40f" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <CuriosidadeRPG />
      </section>
    </div>
  );
};

const CuriosidadeRPG = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % curiosidadesRPG.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const curio = curiosidadesRPG[index];

  return (
    <div className="curiosidade-container">
      <h4 className="text-center text-white mb-4 fw-bold">Segredos do Multiverso</h4>
      <div className="premium-curiosity-card" style={{ "--item-color": "#bd83f2" }}>
        <div className="class-card-glow"></div>
        <div className="class-card-content p-4 p-md-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-4 text-center border-end-custom d-flex flex-column justify-content-center">
              <div className="class-icon-wrapper mb-3">
                <img src={bookPhoto} alt="Book" />
              </div>
              <h2 className="class-name-title mb-2">{curio.titulo}</h2>
              <div className="class-badge">Curiosidade</div>

              <div className="page-indicator justify-content-center mt-3">
                {curiosidadesRPG.map((_, i) => (
                  <div key={i} className={`page-dot ${i === index ? 'active' : ''}`}></div>
                ))}
              </div>
            </div>

            <div className="col-lg-8 ps-lg-5">
              <div className="h-100 d-flex flex-column justify-content-center">
                <h5 className="section-subtitle">Você Sabia?</h5>
                <p className="curiosidade-fato-text">"{curio.fato}"</p>

                <div className="decor-line mt-3"></div>
                <p className="small opacity-50 mt-2 mb-0 italic">Descubra mais segredos a cada 10 segundos...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBar = ({ label, value, color }) => (
  <div className="stat-row mb-2">
    <div className="d-flex justify-content-between mb-1">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
    <div className="stat-bar-bg">
      <div className="stat-bar-fill" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
  </div>
);

const CardAcesso = ({ titulo, desc, img, rota }) => {
  const navigate = useNavigate();
  return (
    <div className="col-md-4">
      <div className="card card-acesso" style={{ cursor: "pointer" }} onClick={() => navigate(rota)}>
        <div className="card-body">
          <div className="text-container">
            <h5 className="fw-bold">{titulo}</h5>
            <p>{desc}</p>
          </div>
          <div className="icon-box-dark">
            <img src={img} alt={titulo} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelaUsuario;