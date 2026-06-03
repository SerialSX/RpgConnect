import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getLevelInfo, addXP, claimUniqueBonus } from "../js/xp";
import "../styles/dashboard.css";

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

const traduzirTexto = async (texto, de = "en", para = "pt") => {
    if (!texto) return "";
    const tClean = texto.trim();
    
    const dicionario = {
        "Barbarian": "Bárbaro",
        "Bard": "Bardo",
        "Cleric": "Clérigo",
        "Druid": "Druida",
        "Fighter": "Guerreiro",
        "Monk": "Monge",
        "Paladin": "Paladino",
        "Ranger": "Patrulheiro",
        "Rogue": "Ladino",
        "Sorcerer": "Feiticeiro",
        "Warlock": "Bruxo",
        "Wizard": "Mago",
        "In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.": 
            "Em batalha, você luta com ferocidade primitiva. Em seu turno, você pode entrar em fúria como uma ação bônus.",
        "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music.": 
            "Você aprendeu a desatar e remodelar a estrutura da realidade em harmonia com seus desejos e música.",
        "As a conduit for divine power, you can cast cleric spells.": 
            "Como um canalizador de poder divino, você pode conjurar magias de clérigo.",
        "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages. You and others who know this language automatically spot such a message. Others spot the message's presence with a successful DC 15 Wisdom (Perception) check but can't decipher it without magic.": 
            "Você conhece o Druídico, a linguagem secreta dos druidas. Você pode falar o idioma e usá-lo para deixar mensagens ocultas.",
        "You adopt a particular style of fighting as your specialty. Choose one of the following options. You can't take a Fighting Style option more than once, even if you later get to choose again.": 
            "Você adota um estilo de combate particular como sua especialidade, dominando táticas de combate com maestria única.",
        "Beginning at 1st level, while you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.": 
            "Começando no 1º nível, enquanto não estiver usando armadura nem escudo, você canaliza sua energia para se defender com maestria.",
        "The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears. As an action, you can open your awareness to detect such forces. Until the end of your next turn, you know the location of any celestial, fiend, or undead within 60 feet of you that is not behind total cover. You know the type (celestial, fiend, or undead) of any being whose presence you sense, but not its identity (the vampire": 
            "A presença de um mal forte é registrada em seus sentidos como um odor nocivo, e o bem poderoso ressoa em seus ouvidos como música celestial.",
        "Beginning at 1st level, you have significant experience studying, tracking, hunting, and even talking to a certain type of enemy.": 
            "Começando no 1º nível, você tem experiência significativa em estudar, rastrear, caçar e até mesmo falar com certos tipos de inimigos.",
        "At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.": 
            "No 1º nível, você escolhe duas de suas perícias para dominar com maestria, dobrando seu bônus de proficiência nelas.",
        "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic. This font of magic, whatever its origin, fuels your spells.": 
            "Um evento em seu passado, ou na vida de um ancestral, deixou uma marca indelével em você, infundindo-o com magia arcana nativa.",
        "At 1st level, you have struck a bargain with an otherworldly being of your choice: the Archfey, the Fiend, or the Great Old One, each of which is detailed at the end of the class description. Your choice grants you features at 1st level and again at 6th, 10th, and 14th level.": 
            "No 1º nível, você fez um pacto com uma entidade transcendental de outro mundo, concedendo-lhe segredos arcanos e poderes sombrios.",
        "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.": 
            "Como um estudante de magia arcana, você possui um grimório contendo magias que mostram os primeiros vislumbres do seu verdadeiro poder.",
        "Rage": "Fúria",
        "Unarmored Defense": "Defesa Sem Armadura",
        "Reckless Attack": "Ataque Temerário",
        "Danger Sense": "Sentido de Perigo",
        "Primal Path": "Caminho Primal",
        "Bardic Inspiration": "Inspiração Bárdica",
        "Jack of All Trades": "Pau pra Toda Obra",
        "Song of Rest": "Canção de Descanso",
        "Divine Domain": "Domínio Divino",
        "Channel Divinity": "Canalizar Divindade",
        "Destroy Undead": "Destruir Mortos-Vivos",
        "Druidic": "Druídico",
        "Fighting Style": "Estilo de Luta",
        "Second Wind": "Retomar o Fôlego",
        "Action Surge": "Surto de Ação",
        "Martial Arts": "Artes Marciais",
        "Ki": "Ki",
        "Divine Sense": "Sentido Divino",
        "Lay on Hands": "Imposição de Mãos",
        "Favored Enemy": "Inimigo Favorito",
        "Natural Explorer": "Explorador Natural",
        "Expertise": "Especialização",
        "Sneak Attack": "Ataque Furtivo",
        "Thieves' Cant": "Gíria de Ladrão",
        "Sorcerous Origin": "Origem Feiticeira",
        "Font of Magic": "Fonte de Magia",
        "Metamagic": "Metamagia",
        "Otherworldly Patron": "Patrono do Outro Mundo",
        "Pact Magic": "Magia de Pacto",
        "Eldritch Invocations": "Invocações Místicas",
        "Arcane Recovery": "Recuperação Arcana",
        "Arcane Tradition": "Tradição Arcana",
        "Spell Mastery": "Maestria em Magia",
        "Ritual Casting": "Conjuração de Ritual",
        "Spellcasting Ability": "Habilidade de Conjuração"
    };

    if (dicionario[tClean]) return dicionario[tClean];
    
    try {
        const res = await fetch("http://localhost:8080/usuarios/traduzir", {
            method: "POST",
            body: JSON.stringify({
                texto: tClean,
                de,
                para
            }),
            headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
            const data = await res.json();
            return data.translatedText || texto;
        }
    } catch (e) {
        console.error("Erro na tradução:", e);
    }
    return texto;
};

const getBio = (desc) => {
    if (!desc) return "";
    const lines = desc.split("\n");
    for (let line of lines) {
        line = line.trim();
        if (line.length > 10 && !line.startsWith("#") && !line.startsWith("*") && !line.startsWith("|")) {
            return line;
        }
    }
    return desc.replace(/[#*|]/g, "").substring(0, 150).trim();
};

const getSkills = (desc) => {
    const matches = [];
    const regex = /^###\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(desc)) !== null) {
        const name = match[1].trim();
        if (!["ability score improvement", "extra attack", "spellcasting", "equipment"].includes(name.toLowerCase())) {
            matches.push(name);
        }
    }
    return matches.slice(0, 3);
};

const getClassStatsAndColor = (slug) => {
    switch (slug) {
        case "barbarian":
            return {
                stats: { for: 95, int: 15, agi: 60, vit: 85 },
                cor: "#ff4d4d",
                imagem: iconInicio,
            };
        case "bard":
            return {
                stats: { for: 35, int: 80, agi: 75, vit: 50 },
                cor: "#bd83f2",
                imagem: iconChat,
            };
        case "cleric":
            return {
                stats: { for: 70, int: 75, agi: 40, vit: 80 },
                cor: "#ffd700",
                imagem: swordShield,
            };
        case "druid":
            return {
                stats: { for: 40, int: 85, agi: 60, vit: 75 },
                cor: "#2ecc71",
                imagem: adventurePhoto,
            };
        case "fighter":
            return {
                stats: { for: 90, int: 40, agi: 70, vit: 80 },
                cor: "#e74c3c",
                imagem: rpgPhoto,
            };
        case "monk":
            return {
                stats: { for: 60, int: 65, agi: 90, vit: 70 },
                cor: "#e67e22",
                imagem: magicPhoto,
            };
        case "paladin":
            return {
                stats: { for: 85, int: 60, agi: 40, vit: 90 },
                cor: "#ffd700",
                imagem: swordShield,
            };
        case "ranger":
            return {
                stats: { for: 65, int: 55, agi: 85, vit: 70 },
                cor: "#16a085",
                imagem: logo,
            };
        case "rogue":
            return {
                stats: { for: 50, int: 70, agi: 95, vit: 45 },
                cor: "#34495e",
                imagem: iconPerfil,
            };
        case "sorcerer":
            return {
                stats: { for: 30, int: 90, agi: 65, vit: 55 },
                cor: "#9b59b6",
                imagem: magicPhoto,
            };
        case "warlock":
            return {
                stats: { for: 35, int: 92, agi: 60, vit: 65 },
                cor: "#8e44ad",
                imagem: iconDices,
            };
        case "wizard":
            return {
                stats: { for: 20, int: 98, agi: 50, vit: 40 },
                cor: "#2980b9",
                imagem: bookPhoto,
            };
        default:
            return {
                stats: { for: 50, int: 50, agi: 50, vit: 50 },
                cor: "#a345f5",
                imagem: rpgPhoto,
            };
    }
};

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
    const [carregandoClasse, setCarregandoClasse] = useState(false);

    const gerarClasseAleatoria = async () => {
        const dadosStored = localStorage.getItem("usuarioLogado");
        if (!dadosStored) return;
        const usuarioObj = JSON.parse(dadosStored);
        const identificadorChave = usuarioObj.id || usuarioObj.email || "visitante";
        const chaveClasse = `classe_${identificadorChave}`;

        setCarregandoClasse(true);
        try {
            const res = await fetch("https://api.open5e.com/v1/classes/");
            if (!res.ok) throw new Error("Erro ao buscar classes na API");
            const data = await res.json();
            const classesList = data.results;
            if (!classesList || classesList.length === 0) throw new Error("Nenhuma classe encontrada");

            const classeSorteada = classesList[Math.floor(Math.random() * classesList.length)];
            const slug = classeSorteada.slug;

            const config = getClassStatsAndColor(slug);
            const bioEng = getBio(classeSorteada.desc);
            const skillsEng = getSkills(classeSorteada.desc);

            const nomeTraduzido = await traduzirTexto(classeSorteada.name);
            const bioTraduzida = await traduzirTexto(bioEng);
            
            const skillsTraduzidas = [];
            for (const skill of skillsEng) {
                const skillTrad = await traduzirTexto(skill);
                skillsTraduzidas.push(skillTrad);
            }

            const novaClasse = {
                nome: nomeTraduzido,
                descricao: bioTraduzida,
                skills: skillsTraduzidas,
                stats: config.stats,
                cor: config.cor,
                imagem: config.imagem,
                api: true,
                slug: slug
            };

            localStorage.setItem(chaveClasse, JSON.stringify(novaClasse));
            setClasse(novaClasse);
        } catch (err) {
            console.error("Erro ao gerar classe aleatória:", err);
            alert("Erro ao conectar à API Open5e. Tente novamente.");
        } finally {
            setCarregandoClasse(false);
        }
    };

    useEffect(() => {
        const inicializarClasse = async () => {
            const dadosStored = localStorage.getItem("usuarioLogado");
            if (!dadosStored) return;
            try {
                const usuarioObj = JSON.parse(dadosStored);
                const identificadorChave = usuarioObj.id || usuarioObj.email || "visitante";
                const chaveClasse = `classe_${identificadorChave}`;
                let classeSalva = localStorage.getItem(chaveClasse);

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

                if (classeSalva) {
                    const parsedClass = JSON.parse(classeSalva);
                    if (parsedClass && parsedClass.api) {
                        setClasse(parsedClass);
                        return;
                    }
                }

                setCarregandoClasse(true);
                const res = await fetch("https://api.open5e.com/v1/classes/");
                if (!res.ok) throw new Error("Erro ao buscar classes na API");
                const data = await res.json();
                const classesList = data.results;
                if (classesList && classesList.length > 0) {
                    const seed = `${usuarioObj.nome || ""}-${usuarioObj.email || ""}-${usuarioObj.id || ""}`.toLowerCase();
                    let hash = 0;
                    for (let i = 0; i < seed.length; i++) {
                        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                        hash |= 0;
                    }
                    const index = Math.abs(hash) % classesList.length;
                    const classeSorteada = classesList[index];
                    const slug = classeSorteada.slug;

                    const config = getClassStatsAndColor(slug);
                    const bioEng = getBio(classeSorteada.desc);
                    const skillsEng = getSkills(classeSorteada.desc);

                    const nomeTraduzido = await traduzirTexto(classeSorteada.name);
                    const bioTraduzida = await traduzirTexto(bioEng);
                    
                    const skillsTraduzidas = [];
                    for (const skill of skillsEng) {
                        const skillTrad = await traduzirTexto(skill);
                        skillsTraduzidas.push(skillTrad);
                    }

                    const novaClasse = {
                        nome: nomeTraduzido,
                        descricao: bioTraduzida,
                        skills: skillsTraduzidas,
                        stats: config.stats,
                        cor: config.cor,
                        imagem: config.imagem,
                        api: true,
                        slug: slug
                    };

                    localStorage.setItem(chaveClasse, JSON.stringify(novaClasse));
                    setClasse(novaClasse);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                setClasse({
                    nome: "Guerreiro",
                    descricao: "Um especialista em combate armado, resiliente e versátil.",
                    skills: ["Retomar o Fôlego", "Surto de Ação"],
                    stats: { for: 90, int: 40, agi: 70, vit: 80 },
                    cor: "#e74c3c",
                    imagem: rpgPhoto,
                    api: true,
                    slug: "fighter"
                });
            } finally {
                setCarregandoClasse(false);
            }
        };

        inicializarClasse();
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

    if (carregandoClasse || !classe) {
        return <div className="loading-rpg">Consultando pergaminhos de destino...</div>;
    }

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
                <div className="d-flex justify-content-center align-items-center gap-3 mb-4 flex-wrap">
                    <h4 className="text_classe_rpg mb-0 text-center">Sua Identidade Heroica</h4>
                    <button 
                        className="btn_editar_jogos" 
                        onClick={gerarClasseAleatoria}
                        disabled={carregandoClasse}
                        style={{ fontSize: "0.8rem", padding: "6px 16px" }}
                    >
                        {carregandoClasse ? "Invocando..." : "🎲 Sortear Nova Classe"}
                    </button>
                </div>
                <div className="container_classe_rpg">
                    <div className="premium-class-card" style={{ "--item-color": classe.cor }}>
                        <div className="class-card-glow"></div>
                        <div className="class-card-content p-4 p-md-5">
                            <div className="row g-4 align-items-stretch">
                                <div className="col-lg-4 text-center border-end-custom d-flex flex-column justify-content-center">
                                    <div className="class-icon-wrapper mb-3">
                                        <img src={classe.imagem || rpgPhoto} alt={classe.nome} />
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