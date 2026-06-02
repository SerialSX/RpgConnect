import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/guia.css";
import "../styles/home.css";

import logo from "../assets/icone_logo.png";
import iconMapa from "../assets/icone_mapa.png";
import iconChat from "../assets/icone_chat.png";
import iconPerfil from "../assets/icone_perfil.png";
import rpgPhoto from "../assets/rpg_photo.png";
import bookIcon from "../assets/book.png";
import magicChar from "../assets/magic_character_photo.png";
import treasureChest from "../assets/treasure_chest_photo.png";
import guiaPdf from "../assets/Guia_RPG_Content.pdf";

const ABAS = ["Magias", "Monstros", "Itens Mágicos"];

const ENDPOINT_MAP = {
  Magias: "spells",
  Monstros: "creatures",
  "Itens Mágicos": "magicitems",
};

const RPG_DICIONARIO = {
  "raio": ["ray", "lightning", "bolt", "shocking"],
  "gelo": ["frost", "ice", "cold", "chill"],
  "fogo": ["fire", "flame", "burning", "blaze"],
  "cura": ["cure", "heal", "healing", "restoration"],
  "espada": ["sword", "blade", "rapier", "scimitar"],
  "escudo": ["shield", "ward", "protection"],
  "morte": ["death", "dead", "necromancy", "decay"],
  "luz": ["light", "daylight", "radiant", "sun"],
  "sombra": ["shadow", "dark", "darkness", "obscure"],
  "veneno": ["poison", "toxic", "venom"],
  "vento": ["wind", "gust", "air", "storm"],
  "terra": ["earth", "stone", "rock", "clay", "mold"],
  "agua": ["water", "wave", "tide", "fluid"],
  "dragao": ["dragon", "drake", "wyrm"],
  "monstro": ["beast", "creature", "monster", "aberration"],
  "magia": ["spell", "magic", "arcane"],
  "arco": ["bow", "arrow", "archery"],
  "anel": ["ring", "band"],
  "capa": ["cloak", "cape", "robe"],
  "bota": ["boot", "boots"],
  "livro": ["book", "tome", "grimoire"],
  "pocao": ["potion", "elixir", "vial"],
  "tempo": ["time", "temporal", "slow", "haste"]
};

const normalizarTexto = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const Guia = () => {
  const [abaSelecionada, setAbaSelecionada] = useState("Magias");
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [itemExpandido, setItemExpandido] = useState(null);
  const [traducoes, setTraducoes] = useState({});
  const [traduzindoKey, setTraduzindoKey] = useState(null);

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

  useEffect(() => {
    setResultados([]);
    setBusca("");
    setErro("");
    setItemExpandido(null);
  }, [abaSelecionada]);

  const traduzirTexto = async (texto, de = "en", para = "pt") => {
    if (!texto) return "";
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${de}|${para}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.responseStatus === 200) {
          return data.responseData?.translatedText || texto;
        } else {
          console.warn("MyMemory Translation Warning:", data.responseDetails);
        }
      }
    } catch (e) {
      console.error("Erro na tradução:", e);
    }
    return texto;
  };

  const traduzirTextoLongo = async (texto, de = "en", para = "pt") => {
    if (!texto) return "";
    if (texto.length <= 400) {
      return await traduzirTexto(texto, de, para);
    }

    const chunks = [];
    let currentChunk = "";
    
    // Split by punctuation marks followed by spaces
    const sentences = texto.split(/([.!?]\s+)/);
    
    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      if ((currentChunk + part).length > 400) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    const finalChunks = [];
    for (const chunk of chunks) {
      if (chunk.length <= 400) {
        finalChunks.push(chunk);
      } else {
        for (let i = 0; i < chunk.length; i += 400) {
          finalChunks.push(chunk.substring(i, i + 400));
        }
      }
    }

    try {
      const promises = finalChunks.map(c => traduzirTexto(c, de, para));
      const translatedParts = await Promise.all(promises);
      return translatedParts.join(" ");
    } catch (e) {
      console.error("Erro ao traduzir texto longo:", e);
      return texto;
    }
  };

  const resumirTexto = (texto, limite = 300) => {
    if (!texto) return "";
    if (texto.length <= limite) return texto;
    
    const corte = texto.substring(0, limite);
    const lastSpace = corte.lastIndexOf(" ");
    if (lastSpace > limite * 0.7) {
      return corte.substring(0, lastSpace) + "... (Resumido)";
    }
    return corte + "... (Resumido)";
  };

  const buscarNaAPI = async () => {
    const termo = busca.trim();
    if (!termo) return;

    setCarregando(true);
    setErro("");
    setResultados([]);
    setItemExpandido(null);

    const endpoint = ENDPOINT_MAP[abaSelecionada];
    const termoNorm = normalizarTexto(termo);

    let termosPesquisa = [];
    
    // Check direct dictionary keyword match
    if (RPG_DICIONARIO[termoNorm]) {
      termosPesquisa = RPG_DICIONARIO[termoNorm];
    } else {
      // Check substring matches in dictionary keywords
      const keyEncontrada = Object.keys(RPG_DICIONARIO).find(k => termoNorm.includes(k));
      if (keyEncontrada) {
        termosPesquisa = RPG_DICIONARIO[keyEncontrada];
      } else {
        // Fall back to MyMemory Translation
        try {
          const transRes = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(termo)}&langpair=pt|en`
          );
          if (transRes.ok) {
            const transData = await transRes.json();
            if (transData.responseStatus === 200 && transData.responseData && transData.responseData.translatedText) {
              termosPesquisa = [transData.responseData.translatedText.toLowerCase()];
            }
          }
        } catch (e) {
          console.error("Erro ao traduzir busca:", e);
        }
        
        if (termosPesquisa.length === 0) {
          termosPesquisa = [termo.toLowerCase()];
        }
      }
    }

    console.log("English search terms:", termosPesquisa);

    try {
      // Query Open5e API for all terms in parallel
      const promessas = termosPesquisa.map(async (t) => {
        try {
          const res = await fetch(
            `https://api.open5e.com/v2/${endpoint}/?name__icontains=${encodeURIComponent(t)}&limit=15`
          );
          if (res.ok) {
            const data = await res.json();
            return data.results || [];
          }
        } catch (err) {
          console.error(`Erro ao buscar termo "${t}":`, err);
        }
        return [];
      });

      const todosResultados = await Promise.all(promessas);
      
      // Merge results and deduplicate by key
      const resultadosMesclados = [];
      const chavesUnicas = new Set();

      for (const lista of todosResultados) {
        for (const item of lista) {
          if (!chavesUnicas.has(item.key)) {
            chavesUnicas.add(item.key);
            resultadosMesclados.push(item);
          }
        }
      }

      if (resultadosMesclados.length === 0) {
        setErro("Nenhum resultado encontrado. Tente pesquisar outros termos relacionados.");
      } else {
        // Limit to top 15 results
        setResultados(resultadosMesclados.slice(0, 15));
      }
    } catch {
      setErro("Não foi possível conectar ao Compêndio. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") buscarNaAPI();
  };

  const toggleExpandir = async (item) => {
    const key = item.key;
    if (itemExpandido === key) {
      setItemExpandido(null);
      return;
    }

    setItemExpandido(key);

    if (traducoes[key]) return;

    setTraduzindoKey(key);
    try {
      const nomeTraduzido = await traduzirTexto(item.name);
      
      let descTraduzida = "";
      if (item.desc) {
        const descResumida = resumirTexto(item.desc);
        descTraduzida = await traduzirTextoLongo(descResumida);
      }

      let castingTimeTraduzido = "";
      if (item.casting_time) {
        castingTimeTraduzido = await traduzirTexto(item.casting_time);
      }

      let durationTraduzida = "";
      if (item.duration) {
        durationTraduzida = await traduzirTexto(item.duration);
      }

      let rangeTraduzido = "";
      if (item.range) {
        rangeTraduzido = await traduzirTexto(item.range);
      }

      let typeTraduzido = "";
      const rawType = typeof item.type === "object" ? item.type.name : item.type;
      if (rawType) {
        typeTraduzido = await traduzirTexto(rawType);
      }

      let sizeTraduzido = "";
      const rawSize = typeof item.size === "object" ? item.size.name : item.size;
      if (rawSize) {
        sizeTraduzido = await traduzirTexto(rawSize);
      }

      let rarityTraduzido = "";
      const rawRarity = typeof item.rarity === "object" ? item.rarity.name : item.rarity;
      if (rawRarity) {
        rarityTraduzido = await traduzirTexto(rawRarity);
      }

      setTraducoes(prev => ({
        ...prev,
        [key]: {
          name: nomeTraduzido,
          desc: descTraduzida,
          casting_time: castingTimeTraduzido,
          duration: durationTraduzida,
          range: rangeTraduzido,
          type: typeTraduzido,
          size: sizeTraduzido,
          rarity: rarityTraduzido
        }
      }));
    } catch (err) {
      console.error("Erro ao traduzir item:", err);
    } finally {
      setTraduzindoKey(null);
    }
  };

  const baixarGuia = () => {
    const link = document.createElement("a");
    link.href = guiaPdf;
    link.download = "Guia_Supremo_Aventureiro_2026.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCampos = (item) => {
    const traduzido = traducoes[item.key] || {};
    const desc = traduzido.desc || item.desc;
    const casting_time = traduzido.casting_time || item.casting_time;
    const duration = traduzido.duration || item.duration;
    const range = traduzido.range || item.range;
    const type = traduzido.type || (typeof item.type === "object" ? item.type.name : item.type);
    const size = traduzido.size || (typeof item.size === "object" ? item.size.name : item.size);
    const rarity = traduzido.rarity || (typeof item.rarity === "object" ? item.rarity.name : item.rarity);

    if (abaSelecionada === "Magias") {
      return (
        <div className="compendio-detalhes">
          {traduzindoKey === item.key && (
            <p className="compendio-info" style={{ color: '#bd83f2', fontStyle: 'italic' }}>
              ✨ Traduzindo grimório para português...
            </p>
          )}
          {item.level !== undefined && (
            <span className="compendio-tag">Nível {item.level}</span>
          )}
          {item.school && (
            <span className="compendio-tag">
              {typeof item.school === "object" ? item.school.name : item.school}
            </span>
          )}
          {casting_time && (
            <p className="compendio-info"><strong>Tempo de Conjuração:</strong> {casting_time}</p>
          )}
          {range && (
            <p className="compendio-info"><strong>Alcance:</strong> {range}</p>
          )}
          {duration && (
            <p className="compendio-info"><strong>Duração:</strong> {duration}</p>
          )}
          {desc && (
            <p className="compendio-desc">{desc}</p>
          )}
        </div>
      );
    }
  
    if (abaSelecionada === "Monstros") {
      return (
        <div className="compendio-detalhes">
          {traduzindoKey === item.key && (
            <p className="compendio-info" style={{ color: '#bd83f2', fontStyle: 'italic' }}>
              ✨ Traduzindo grimório para português...
            </p>
          )}
          {type && (
            <span className="compendio-tag">{type}</span>
          )}
          {size && (
            <span className="compendio-tag">{size}</span>
          )}
          {item.challenge_rating_text && (
            <span className="compendio-tag">CR {item.challenge_rating_text}</span>
          )}
          {item.hit_points !== undefined && (
            <p className="compendio-info"><strong>Pontos de Vida:</strong> {item.hit_points}</p>
          )}
          {item.armor_class !== undefined && (
            <p className="compendio-info"><strong>Classe de Armadura:</strong> {item.armor_class}</p>
          )}
          {item.speed && (
            <p className="compendio-info">
              <strong>Deslocamento:</strong>{" "}
              {typeof item.speed === "object"
                ? Object.entries(item.speed)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")
                : item.speed}
            </p>
          )}
        </div>
      );
    }
  
    if (abaSelecionada === "Itens Mágicos") {
      return (
        <div className="compendio-detalhes">
          {traduzindoKey === item.key && (
            <p className="compendio-info" style={{ color: '#bd83f2', fontStyle: 'italic' }}>
              ✨ Traduzindo grimório para português...
            </p>
          )}
          {type && (
            <span className="compendio-tag">{type}</span>
          )}
          {rarity && (
            <span className="compendio-tag">{rarity}</span>
          )}
          {item.requires_attunement && (
            <span className="compendio-tag">Requer Sintonização</span>
          )}
          {desc && (
            <p className="compendio-desc">{desc}</p>
          )}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="guia-page-body min-vh-100">
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

      <main className="guia-main">
        <section className="guia-header-section">
          <h1 className="titulo-guia">Guia dos Reinos</h1>
          <p className="subtitulo-guia">
            Bem-vindo, aventureiro! Você está prestes a mergulhar no multiverso infinito do RPG de mesa.
            Nesta página, compilamos o conhecimento essencial para transformar sua imaginação em lendas épicas.
          </p>
        </section>

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

        <section className="guia-section">
          <h2 className="section-title">Dica de Mestre</h2>
          <div className="pillar-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <span className="pillar-icon">🐉</span>
            <h3>"A regra de ouro é se divertir"</h3>
            <p>O RPG é uma história contada em conjunto. O Mestre não joga CONTRA os jogadores, mas sim COM eles para criar momentos inesquecíveis. Deixe os dados rolarem e aceite o destino que eles traçarem!</p>
          </div>
        </section>

        <section className="guia-section">
          <h2 className="section-title">Compêndio de Aventureiros</h2>
          <p className="subtitulo-guia" style={{ textAlign: "center", marginBottom: "40px" }}>
            Consulte magias, monstros e itens mágicos do D&D 5e em tempo real. Pesquise em inglês para melhores resultados.
          </p>

          <div className="compendio-abas">
            {ABAS.map((aba) => (
              <button
                key={aba}
                className={`compendio-aba-btn ${abaSelecionada === aba ? "ativa" : ""}`}
                onClick={() => setAbaSelecionada(aba)}
              >
                {aba}
              </button>
            ))}
          </div>

          <div className="compendio-busca">
            <input
              type="text"
              className="compendio-input"
              placeholder={`Buscar ${abaSelecionada.toLowerCase()}... ex: ${abaSelecionada === "Magias" ? "fireball" : abaSelecionada === "Monstros" ? "goblin" : "sword"}`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="compendio-btn-buscar" onClick={buscarNaAPI}>
              Buscar
            </button>
          </div>

          {carregando && (
            <div className="compendio-loading">
              <div className="compendio-spinner"></div>
              <p>Consultando os tomos arcanos...</p>
            </div>
          )}

          {erro && !carregando && (
            <div className="compendio-erro">{erro}</div>
          )}

          {!carregando && resultados.length > 0 && (
            <div className="compendio-lista">
              {resultados.map((item) => (
                <div key={item.key} className="compendio-card">
                  <div
                    className="compendio-card-header"
                    onClick={() => toggleExpandir(item)}
                  >
                    <span className="compendio-nome">
                      {traducoes[item.key]?.name || item.name}
                      {traducoes[item.key]?.name && traducoes[item.key]?.name !== item.name ? ` (${item.name})` : ""}
                    </span>
                    <span className="compendio-seta">{itemExpandido === item.key ? "▲" : "▼"}</span>
                  </div>
                  {itemExpandido === item.key && renderCampos(item)}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="download-section">
          <h3>Pronto para se tornar uma lenda?</h3>
          <p style={{ marginBottom: "30px", color: "#b8b1e0" }}>
            Preparamos um material completo em PDF com fichas, regras básicas e um guia de criação de mundo.
          </p>
          <button className="botao-download" onClick={baixarGuia}>
            <span>📘</span> Baixar Manual do Aventureiro (PDF)
          </button>
        </section>
      </main>
    </div>
  );
};

export default Guia;