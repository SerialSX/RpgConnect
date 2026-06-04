import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { addXP, getUserLevel } from "../js/xp";
import "../styles/chat.css";

import logo from "../assets/icone_logo.png";
import iconPerfil from "../assets/icone_perfil.png";
import iconMapa from "../assets/icone_mapa.png";
import chatImg from "../assets/imgchat.png";
import groupMembers from "../assets/group_members.png";
import iconDashboard from "../assets/espadas_icone.png";
import searchIcon from "../assets/icon_search.png";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("conversas");
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [usuarioDigitando, setUsuarioDigitando] = useState(false);
  const [meuLevel, setMeuLevel] = useState(1);
  const typingTimeoutRef = useRef(null);

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado")) || {};

  useEffect(() => {
    setMeuLevel(getUserLevel(usuarioLogado));
    const handleXP = () => setMeuLevel(getUserLevel(usuarioLogado));
    window.addEventListener("xpUpdated", handleXP);

    const checkAndSetVisit = () => {
      if (usuarioLogado.id) {
        const key = `ultima_visita_chat_${usuarioLogado.id}`;
        const prev = new Date(localStorage.getItem(key)).getTime() || 0;
        const current = Date.now() + 2000;
        localStorage.setItem(key, new Date(Math.max(prev, current)).toISOString());
        localStorage.setItem("dashboard_has_notification", "false");
        localStorage.setItem("dashboard_unread_notifications", "[]");
      }
    };

    checkAndSetVisit();

    return () => {
      window.removeEventListener("xpUpdated", handleXP);
      checkAndSetVisit();
    };
  }, [usuarioLogado.id]);

  const getParticipantKey = (u) => {
    if (!u) return "null";
    return String(u.id);
  };

  const meuIdUnico = getParticipantKey(usuarioLogado);

  const socket = useRef(null);
  const scrollRef = useRef(null);
  const fetchOnlineUsersRef = useRef(null);
  const usuarioSelecionadoRef = useRef(null);

  useEffect(() => {
    usuarioSelecionadoRef.current = usuarioSelecionado;
  }, [usuarioSelecionado]);

  useEffect(() => {
    if (!usuarioLogado?.id) return;

    const s = io("http://localhost:8080", {
      withCredentials: true,
      transports: ["polling", "websocket"]
    });

    socket.current = s;

    s.on("connect", () => {
      s.emit("join", String(usuarioLogado.id));
    });

    s.on("connect_error", (err) => {
      console.error("Erro de conexão socket:", err.message);
    });

    s.on("receber_mensagem", (novaMsg) => {
      const conversaAberta = usuarioSelecionadoRef.current;
      const meuId = Number(usuarioLogado.id);
      const remetenteId = Number(novaMsg.remetenteId);
      const destinatarioId = Number(novaMsg.destinatarioId);

      setUsuariosOnline((prev) => {
        const userIdParaAtualizar = remetenteId === meuId ? destinatarioId : remetenteId;
        const index = prev.findIndex((u) => Number(u.id) === userIdParaAtualizar);

        if (index !== -1) {
          const usuarioAtualizado = {
            ...prev[index],
            ultima_mensagem: novaMsg.conteudo,
            ultimo_horario: novaMsg.timestamp
          };
          const novaLista = [...prev];
          novaLista.splice(index, 1);
          return [usuarioAtualizado, ...novaLista];
        } else if (remetenteId !== meuId) {
          fetchOnlineUsersRef.current && fetchOnlineUsersRef.current();
        }
        return prev;
      });

      const outroId = conversaAberta ? Number(conversaAberta.id) : null;
      const ehDessaConversa = outroId && (
        (remetenteId === outroId && destinatarioId === meuId) ||
        (remetenteId === meuId && destinatarioId === outroId)
      );

      if (!ehDessaConversa) return;

      setMensagens((prev) => {
        const jaExiste = prev.some(m =>
          (novaMsg.id && m.id === novaMsg.id) ||
          (m.conteudo === novaMsg.conteudo && m.timestamp === novaMsg.timestamp)
        );

        if (jaExiste) return prev;

        const novaLista = [...prev, novaMsg];
        const outroIdUnico = getParticipantKey(conversaAberta);
        const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
        localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
        return novaLista;
      });
    });

    s.on("novo_usuario", (novoUser) => {
      const meuId = Number(usuarioLogado.id);
      if (Number(novoUser.id) === meuId) return;

      setUsuariosOnline((prev) => {
        if (prev.some(u => Number(u.id) === Number(novoUser.id))) return prev;
        return [novoUser, ...prev];
      });
    });

    s.on("usuario_digitando", (id) => {
      if (usuarioSelecionadoRef.current && Number(id) === Number(usuarioSelecionadoRef.current.id)) {
        setUsuarioDigitando(true);
      }
    });

    s.on("usuario_parou_digitar", (id) => {
      if (usuarioSelecionadoRef.current && Number(id) === Number(usuarioSelecionadoRef.current.id)) {
        setUsuarioDigitando(false);
      }
    });

    return () => {
      s.off("connect");
      s.off("connect_error");
      s.off("receber_mensagem");
      s.off("novo_usuario");
      s.off("usuario_digitando");
      s.off("usuario_parou_digitar");
      s.disconnect();
    };
  }, [usuarioLogado.id]);

  useEffect(() => {
    if (!usuarioLogado?.id) return;

    const fetchOnlineUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/usuarios/usuarios-online?usuarioId=${usuarioLogado.id}`, {
          headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
        });
        if (!res.ok) throw new Error("Erro na requisição");
        const data = await res.json();

        if (data && data.length > 0) {
          const maxServerTime = data.reduce((m, u) => {
            const t = new Date(u.ultimo_horario).getTime();
            return (t && t > m) ? t : m;
          }, 0);
          if (maxServerTime > 0) {
            const key = `ultima_visita_chat_${usuarioLogado.id}`;
            const prev = new Date(localStorage.getItem(key)).getTime() || 0;
            localStorage.setItem(key, new Date(Math.max(prev, maxServerTime + 2000)).toISOString());
            localStorage.setItem("dashboard_has_notification", "false");
          }
        }

        const filtered = [];
        const seenIds = new Set();
        data.forEach(u => {
          if (Number(u.id) === Number(usuarioLogado.id)) return;
          if (seenIds.has(Number(u.id))) return;
          seenIds.add(Number(u.id));
          filtered.push(u);
        });

        setUsuariosOnline(filtered);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
      }
    };

    fetchOnlineUsersRef.current = fetchOnlineUsers;
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, [usuarioLogado.id]);

  const saveGroups = (nextGroups) => {
    setGroups(nextGroups);
    if (!usuarioLogado?.id) return;
    localStorage.setItem(`chat_groups_${usuarioLogado.id}`, JSON.stringify(nextGroups));
  };

  useEffect(() => {
    const autoSelectId = location.state?.autoSelectUserId;
    if (autoSelectId && usuariosOnline.length > 0) {
      const targetUser = usuariosOnline.find(u => Number(u.id) === Number(autoSelectId));
      if (targetUser) {
        setUsuarioSelecionado(targetUser);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, usuariosOnline]);

  useEffect(() => {
    setUsuarioDigitando(false);
    if (!usuarioSelecionado || !usuarioLogado.id) {
      setMensagens([]);
      return;
    }

    if (usuarioSelecionado.isGroup) {
      setMensagens([]);
      return;
    }

    const outroIdUnico = getParticipantKey(usuarioSelecionado);
    const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;

    const localHistory = localStorage.getItem(chaveHistorico);
    if (localHistory) {
      try {
        setMensagens(JSON.parse(localHistory));
      } catch {
        setMensagens([]);
      }
    } else {
      setMensagens([]);
    }

    const token = localStorage.getItem("token");
    fetch(`http://localhost:8080/usuarios/historico/${usuarioLogado.id}/${usuarioSelecionado.id}`, {
      headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(dados => {
        if (!Array.isArray(dados) || dados.length === 0) return;

        setMensagens(prev => {
          const combined = [...dados, ...prev];
          const unique = [];
          const seenSignatures = new Set();

          combined.forEach(m => {
            const ts = m.timestamp ? new Date(m.timestamp).toISOString() : "";
            const signature = m.id
              ? `id_${m.id}`
              : `${Number(m.remetenteId)}_${Number(m.destinatarioId)}_${m.conteudo}_${ts}`;
            if (!seenSignatures.has(signature)) {
              seenSignatures.add(signature);
              unique.push(m);
            }
          });

          unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          localStorage.setItem(chaveHistorico, JSON.stringify(unique));
          return unique;
        });
      })
      .catch(() => {});
  }, [usuarioSelecionado, meuIdUnico]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const formatarHora = (dataString) => {
    if (!dataString) return "";
    const dt = new Date(dataString);
    if (isNaN(dt)) return "";
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!mensagem.trim() || !usuarioSelecionado) return;
    if (!socket.current?.connected) return;

    const idUnico = self.crypto ? self.crypto.randomUUID() : Date.now().toString();

    const chatMessage = {
      id: idUnico,
      remetenteId: Number(usuarioLogado.id),
      remetenteNome: usuarioLogado.nome,
      destinatarioId: Number(usuarioSelecionado.id),
      conteudo: mensagem.trim(),
      timestamp: new Date().toISOString()
    };

    const outroIdUnico = getParticipantKey(usuarioSelecionado);
    const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
    setMensagens((prev) => {
      const novaLista = [...prev, chatMessage];
      localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
      return novaLista;
    });

    socket.current.emit("enviar_mensagem", chatMessage);
    addXP(5);

    setUsuariosOnline((prev) => {
      const index = prev.findIndex((u) => Number(u.id) === Number(usuarioSelecionado.id));
      if (index !== -1) {
        const usuarioAtualizado = {
          ...prev[index],
          ultima_mensagem: chatMessage.conteudo,
          ultimo_horario: chatMessage.timestamp
        };
        const novaLista = [...prev];
        novaLista.splice(index, 1);
        return [usuarioAtualizado, ...novaLista];
      }
      return prev;
    });

    setMensagem("");
    socket.current.emit("parou_digitar", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const rolarDado = async (lados) => {
    if (!usuarioSelecionado) return;
    try {
      const res = await fetch(`http://localhost:8081/rolar/${lados}`);
      if (!res.ok) {
        alert("Erro ao rolar dados no servidor auxiliar.");
        return;
      }
      const data = await res.json();
      const textoMsg = `🎲 Rotei um d${lados}: obtive **${data.resultado}**! ${data.mensagem ? `(${data.mensagem})` : ""}`;

      const idUnico = self.crypto ? self.crypto.randomUUID() : Date.now().toString();
      const chatMessage = {
        id: idUnico,
        remetenteId: Number(usuarioLogado.id),
        remetenteNome: usuarioLogado.nome,
        destinatarioId: Number(usuarioSelecionado.id),
        conteudo: textoMsg,
        timestamp: new Date().toISOString()
      };

      const outroIdUnico = getParticipantKey(usuarioSelecionado);
      const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
      setMensagens((prev) => {
        const novaLista = [...prev, chatMessage];
        localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
        return novaLista;
      });

      if (socket.current?.connected) {
        socket.current.emit("enviar_mensagem", chatMessage);
      }

      addXP(10);

      setUsuariosOnline((prev) => {
        const index = prev.findIndex((u) => Number(u.id) === Number(usuarioSelecionado.id));
        if (index !== -1) {
          const usuarioAtualizado = {
            ...prev[index],
            ultima_mensagem: chatMessage.conteudo,
            ultimo_horario: chatMessage.timestamp
          };
          const novaLista = [...prev];
          novaLista.splice(index, 1);
          return [usuarioAtualizado, ...novaLista];
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      alert("O servidor auxiliar de dados está offline.");
    }
  };

  const handleChangeInput = (e) => {
    setMensagem(e.target.value);
    if (usuarioSelecionado && socket.current?.connected) {
      socket.current.emit("digitando", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.current.emit("parou_digitar", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
      }, 2000);
    }
  };

  const handleToggleGroupMember = (userId) => {
    setGroupMembersSelected((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      return [...prev, userId];
    });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const groupNameTrimmed = groupName.trim();
    if (!groupNameTrimmed) {
      alert("Escolha um nome para o grupo antes de continuar.");
      return;
    }
    if (groupMembersSelected.length < 3) {
      alert("Selecione pelo menos 3 participantes para criar o grupo.");
      return;
    }

    const members = usuariosOnline
      .filter((u) => groupMembersSelected.includes(Number(u.id)))
      .map((u) => ({ id: u.id, nome: u.nome, avatar: u.avatar, jogos: u.jogos }));

    const newGroup = {
      id: `group_${Date.now()}`,
      name: groupNameTrimmed,
      members,
      createdAt: new Date().toISOString(),
      isGroup: true,
    };

    saveGroups([newGroup, ...groups]);
    setGroupName("");
    setGroupMembersSelected([]);
    setShowModal(false);
  };

  return (
    <div className="chat-app-container">
      <header className="main-header">
        <div className="container header-container">
          <div className="header-left">
            <Link className="brand" to="/">
              <img src={logo} alt="Logo" className="nav-logo-img" />
              <span className="brand-text">RPG CONNECT</span>
            </Link>
          </div>
          <div className="header-right">
            <Link to="/" className="nav-icon-link"><button className="btn-join">Inicio</button></Link>
            <Link to="/dashboard" className="nav-icon-link"><img src={iconDashboard} alt="" /> Dashboard</Link>
            <Link to="/mapa" className="nav-icon-link"><img src={iconMapa} alt="" /> Mapa</Link>
            <Link to="/perfil" className="nav-icon-link"><img src={iconPerfil} alt="" /> Perfil</Link>
          </div>
        </div>
      </header>

      <section className="chat-layout">
        <aside className="sidebar">
              <div className="user-self-profile">
            <img
              src={usuarioLogado.avatar || `https://ui-avatars.com/api/?name=${usuarioLogado.nome || 'User'}&background=random`}
              className="user-self-avatar"
              alt="Me"
            />
            <div className="user-self-info">
              <div className="d-flex align-items-center gap-2">
                <h6>{usuarioLogado.nome || "Meu Perfil"}</h6>
                <div className="chat-level-badge">LVL {meuLevel}</div>
              </div>
              <p className="user-self-grimorio">{usuarioLogado.jogos || "Sem jogos no grimório"}</p>
            </div>
          </div>

          <div className="tabs">
            <button className={`tab-btn ${activeTab === "conversas" ? "active" : ""}`} onClick={() => setActiveTab("conversas")}>
              <img src={groupMembers} width={22} alt="" /> Conversas
            </button>
            <button className={`tab-btn ${activeTab === "buscar" ? "active" : ""}`} onClick={() => setActiveTab("buscar")}>
              <img src={searchIcon} width={19} alt="" /> Buscar
            </button>
          </div>

          <div className="sidebar-content">
          {activeTab === "conversas" ? (
  <>
    <div className="usuarios-online">
      {usuariosOnline.filter(u => u.ultima_mensagem || (usuarioSelecionado && Number(u.id) === Number(usuarioSelecionado.id))).length > 0 ? (
        usuariosOnline
          .filter(u => u.ultima_mensagem || (usuarioSelecionado && Number(u.id) === Number(usuarioSelecionado.id)))
          .map((user) => (
            <div
              key={user.id}
              className={`chat-item ${usuarioSelecionado?.id === user.id ? 'active-chat' : ''}`}
              onClick={() => setUsuarioSelecionado(user)}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.nome || 'User'}&background=random`}
                  alt=""
                  style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #7c3aed" }}
                />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", backgroundColor: "#22c55e", borderRadius: "50%", border: "2px solid #1a1236" }}></span>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", minWidth: 0 }}>
                  <h6 style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "16.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{user.nome || "Usuário"}</h6>
                  <div className="chat-level-badge" style={{ flexShrink: 0 }}>LVL {getUserLevel(user)}</div>
                </div>
                <p style={{ fontSize: "12px", color: "#bd83f2", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>
                  {user.jogos || "Sem jogos no grimório"}
                </p>
                {usuarioSelecionado?.id === user.id ? (
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A345F5", fontWeight: 600 }}>Conversa ativa</p>
                ) : (
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.ultima_mensagem || "Nenhuma mensagem ainda"}
                  </p>
                )}
              </div>
              {user.ultimo_horario && (
                <div style={{ fontSize: "11px", color: "#888", marginLeft: "auto", alignSelf: "flex-start", flexShrink: 0, marginTop: "2px" }}>
                  {formatarHora(user.ultimo_horario)}
                </div>
              )}
            </div>
          ))
      ) : (
        <div className="no-users-card">
          <span className="no-users-icon">💬</span>
          <p className="no-users-title">Nenhuma conversa recente</p>
          <p className="no-users-text">Vá na aba "Buscar" para encontrar amigos.</p>
        </div>
      )}
    </div>
  </>
            ) : (
              <div className="usuarios-online">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="sidebar-search-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {usuariosOnline
                  .filter(u => (u.nome || "").toLowerCase().includes((searchTerm || "").toLowerCase()))
                  .map((user) => (
                    <div key={user.id} className="chat-item" onClick={() => { setUsuarioSelecionado(user); setActiveTab("conversas"); }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.nome || 'User'}&background=random`}
                          alt=""
                          style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #7c3aed" }}
                        />
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", backgroundColor: "#22c55e", borderRadius: "50%", border: "2px solid #1a1236" }}></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", minWidth: 0 }}>
                          <h6 style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{user.nome || "Usuário"}</h6>
                          <div className="chat-level-badge" style={{ flexShrink: 0 }}>LVL {getUserLevel(user)}</div>
                        </div>
                        <p style={{ fontSize: "12px", color: "#bd83f2", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>
                          {user.jogos || ""}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </aside>

        <main className="content">
        {!usuarioSelecionado ? (
          <div className="empty-state">
            <img src={chatImg} alt="" />
            <h2>Selecione uma conversa</h2>
          </div>
            ) : (
            <div className="chat-window">
              <div className="chat-header-top">
                <div className="chat-header-avatar">
                  {usuarioSelecionado.avatar ? (
                    <img src={usuarioSelecionado.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    usuarioSelecionado.nome.charAt(0)
                  )}
                </div>
                <div className="chat-header-info">
                  <div className="d-flex align-items-center gap-2">
                    <h5>{usuarioSelecionado.nome}</h5>
                    <div className="chat-level-badge">LVL {getUserLevel(usuarioSelecionado)}</div>
                  </div>
                  <p className="user-grimorio-header">
                    {usuarioSelecionado.jogos || "Aventureiro sem grimório"}
                  </p>
                </div>
              </div>

              <div className="chat-messages">
                {mensagens.map((msg, index) => (
                  <div key={msg.id || index} className={`message ${Number(msg.remetenteId) === Number(usuarioLogado.id) ? "sent" : "received"}`}>
                    <div className="msg-content">{msg.conteudo}</div>
                    <div className="msg-time">{formatarHora(msg.timestamp)}</div>
                  </div>
                ))}
                <div ref={scrollRef} style={{ float: "left", clear: "both" }} />
              </div>

              {usuarioDigitando && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                  <div style={{ marginLeft: '8px' }}>{usuarioSelecionado.nome} está digitando...</div>
                </div>
              )}

              <div className="dice-roll-tray" style={{ display: "flex", gap: "10px", padding: "10px 20px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#bd83f2", fontWeight: "bold" }}>Rolar Dado:</span>
                {[4, 6, 8, 10, 12, 20, 100].map(lados => (
                  <button
                    key={lados}
                    onClick={() => rolarDado(lados)}
                    type="button"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", border: "none", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    d{lados}
                  </button>
                ))}
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Escreva uma mensagem..."
                  value={mensagem}
                  onChange={handleChangeInput}
                  className="chat-input"
                />
                <button type="submit" className="send-btn" title="Enviar">
                  <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </button>
              </form>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}