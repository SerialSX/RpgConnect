import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { addXP, getUserLevel } from "../js/xp";
import { API_URL } from "../config/api";
import "../styles/chat.css";

/* ===== ATIVOS ===== */
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
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]); 
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [usuarioDigitando, setUsuarioDigitando] = useState(false);
  const [groupMembersSelected, setGroupMembersSelected] = useState([]);
  const [groups, setGroups] = useState([]);
  const [meuLevel, setMeuLevel] = useState(1);
  const typingTimeoutRef = useRef(null);
  
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado")) || {};

  // Atualiza o nível do usuário logado
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

    // Atualiza a última visita ao chat na montagem
    checkAndSetVisit();

    return () => {
      window.removeEventListener("xpUpdated", handleXP);
      // Atualiza também ao sair do chat
      checkAndSetVisit();
    };
  }, [usuarioLogado.id]);
  
  // Identificador Único Digital (ID) para isolamento total
  const getParticipantKey = (u) => {
    if (!u) return "null";
    return String(u.id);
  };

  const meuIdUnico = getParticipantKey(usuarioLogado);
  
  const socket = useRef(null); 
  const scrollRef = useRef(null);
  const fetchOnlineUsersRef = useRef(null); // Ref para invocar recarregamento da lista de usuários fora do escopo
  // Ref para guardar o usuário selecionado DENTRO do handler do socket (evita closure stale)
  const usuarioSelecionadoRef = useRef(null);

  // Mantém a ref sincronizada com o state
  useEffect(() => {
    usuarioSelecionadoRef.current = usuarioSelecionado;
  }, [usuarioSelecionado]);

  // 1. GERENCIAMENTO DO SOCKET (Conexão e Recebimento)
  useEffect(() => {
    if (!usuarioLogado?.id) return;

    const s = io(API_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"]
    });

    socket.current = s;

    s.on("connect", () => {
      console.log("✅ Socket Conectado! ID:", s.id);
      s.emit("join", String(usuarioLogado.id));
    });

    s.on("connect_error", (err) => {
      console.error("❌ Erro de conexão socket:", err.message);
    });

    s.on("receber_mensagem", (novaMsg) => {
      console.log("📩 Chegou mensagem:", novaMsg);
      
      const conversaAberta = usuarioSelecionadoRef.current;
      const meuId = Number(usuarioLogado.id);
      const remetenteId = Number(novaMsg.remetenteId);
      const destinatarioId = Number(novaMsg.destinatarioId);

      // 1. Atualiza a sidebar na aba Conversas para subir o usuário pro topo
      setUsuariosOnline((prev) => {
        // Se eu mandei a msg (meuId), o contato que deve subir é o destinatarioId. 
        // Se eu recebi (outro mandou), o contato que deve subir é o remetenteId.
        const userIdParaAtualizar = Number(remetenteId) === Number(meuId) ? Number(destinatarioId) : Number(remetenteId);
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
        } else if (Number(remetenteId) !== Number(meuId)) {
          // Se for uma msg de alguém que não estava na lista, mas recebemos a mensagem (como se fosse um novo chat)
          // Isso recarregará a lista em seguida
          fetchOnlineUsersRef.current && fetchOnlineUsersRef.current();
        }
        return prev;
      });

      // 2. Só adiciona se a mensagem for da conversa aberta no momento
      const outroId = conversaAberta ? Number(conversaAberta.id) : null;
      const ehDessaConversa = outroId && (
        (remetenteId === outroId && destinatarioId === meuId) ||
        (remetenteId === meuId && destinatarioId === outroId)
      );

      if (!ehDessaConversa) {
        console.log("💬 Mensagem de outra conversa ignorada.");
        return;
      }

      setMensagens((prev) => {
        // De-duplicação robusta: Verifica ID ou combinação de Conteúdo + Timestamp
        const jaExiste = prev.some(m => 
          (novaMsg.id && m.id === novaMsg.id) || 
          (m.conteudo === novaMsg.conteudo && m.timestamp === novaMsg.timestamp)
        );
        
        if (jaExiste) return prev;
        
        const novaLista = [...prev, novaMsg];
        
        // Persiste no histórico isolado local ao receber
        const outroIdUnico = getParticipantKey(conversaAberta);
        const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
        localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
        
        return novaLista;
      });
    });

    // 🔔 Quando um novo usuário se cadastra, adiciona à lista em tempo real
    s.on("novo_usuario", (novoUser) => {
      console.log("🆕 Novo usuário detectado:", novoUser.nome);
      const meuId = Number(usuarioLogado.id);
      
      // Filtro rigoroso para não se ver duas vezes
      if (Number(novoUser.id) === meuId) return; 
      if ((novoUser.nome || "").toLowerCase().trim() === (usuarioLogado.nome || "").toLowerCase().trim()) return;

      setUsuariosOnline((prev) => {
        const isDuplicateName = prev.some(u => (u.nome || "").toLowerCase().trim() === (novoUser.nome || "").toLowerCase().trim());
        if (prev.some(u => Number(u.id) === Number(novoUser.id)) || isDuplicateName) return prev; // Sem duplicata de ID ou Nome
        return [novoUser, ...prev]; // Adiciona ao topo provisoriamente
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

  // 2. BUSCA DE USUÁRIOS ONLINE
  useEffect(() => {
    if (!usuarioLogado?.id) return;

    const fetchOnlineUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/usuarios/usuarios-online?usuarioId=${usuarioLogado.id}`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        if (res.status === 401) {
          console.warn("Sessão expirada (401) no Chat. Redirecionando...");
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Erro na requisição");
        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn("Retorno de usuarios-online não é um array no Chat:", data);
          return;
        }

        // 🕐 Sincroniza a última visita baseada na hora real do servidor para não dar conflito de fuso horário
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
        const seenNames = new Set();
        const meuNomeLower = (usuarioLogado.nome || "").toLowerCase().trim();
        data.forEach(u => {
          const nomeLower = (u.nome || "").toLowerCase().trim();
          
          // Se for o próprio usuário pelo ID ou pelo NOME, ignora 100%
          if (Number(u.id) === Number(usuarioLogado.id)) return;
          if (nomeLower === meuNomeLower) return;
          
          if (!seenNames.has(nomeLower)) {
            seenNames.add(nomeLower);
            filtered.push(u);
          }
        });
        
        console.log("Usuários carregados:", filtered);
        setUsuariosOnline(filtered);
      } catch (err) { 
        console.error("Erro ao buscar usuários:", err); 
      }
    };

    fetchOnlineUsersRef.current = fetchOnlineUsers; // Guarda a ref pra usar no evento socket
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, [usuarioLogado.id]);

  useEffect(() => {
    if (!usuarioLogado?.id) return;

    const chaveGrupos = `chat_groups_${usuarioLogado.id}`;
    const gravado = localStorage.getItem(chaveGrupos);
    if (gravado) {
      try {
        const parsed = JSON.parse(gravado);
        if (Array.isArray(parsed)) setGroups(parsed);
      } catch (err) {
        console.error("Erro ao carregar grupos locais:", err);
      }
    }
  }, [usuarioLogado.id]);

  const saveGroups = (nextGroups) => {
    setGroups(nextGroups);
    if (!usuarioLogado?.id) return;
    const chaveGrupos = `chat_groups_${usuarioLogado.id}`;
    localStorage.setItem(chaveGrupos, JSON.stringify(nextGroups));
  };

  // 2.1 AUTO-SELEÇÃO DE USUÁRIO (Vindo da notificação)
  useEffect(() => {
    const autoSelectId = location.state?.autoSelectUserId;
    if (autoSelectId && usuariosOnline.length > 0) {
      const targetUser = usuariosOnline.find(u => Number(u.id) === Number(autoSelectId));
      if (targetUser) {
        console.log("🎯 Auto-selecionando usuário vindo da notificação:", targetUser.nome);
        setUsuarioSelecionado(targetUser);
        // Limpa o state da navegação para não re-selecionar ao navegar internamente
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, usuariosOnline]);

  // 3. CARREGAR HISTÓRICO AO TROCAR DE USUÁRIO E LIMPAR DIGITANDO
  useEffect(() => {
    setUsuarioDigitando(false);
    if (usuarioSelecionado && usuarioLogado.id) {
      if (usuarioSelecionado.isGroup) {
        setMensagens([]);
        return;
      }

      const outroIdUnico = getParticipantKey(usuarioSelecionado);
      const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
      
      // Tenta carregar do local primeiro para isolamento total instantâneo
      const localHistory = localStorage.getItem(chaveHistorico);
      if (localHistory) {
        setMensagens(JSON.parse(localHistory));
      } else {
        setMensagens([]);
      }

      // Sincroniza com o backend como um "backup" ou base histórica
      const token = localStorage.getItem("token");
      fetch(`${API_URL}/usuarios/historico/${usuarioLogado.id}/${usuarioSelecionado.id}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem("usuarioLogado");
            localStorage.removeItem("token");
            window.location.href = "/login";
            throw new Error("Não autorizado");
          }
          return res.json();
        })
        .then(dados => {
          if (Array.isArray(dados) && dados.length > 0) {
            // Unimos o que veio do banco com o que temos localmente (evitando duplicatas)
            setMensagens(prev => {
              const combined = [...dados, ...prev];
              const unique = [];
              const seenSignatures = new Set();

              combined.forEach(m => {
                const signature = m.id || `${m.conteudo}_${m.timestamp}`;
                if (!seenSignatures.has(signature)) {
                  seenSignatures.add(signature);
                  unique.push(m);
                }
              });

              // Ordenação cronológica para garantir integridade visual
              unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

              localStorage.setItem(chaveHistorico, JSON.stringify(unique));
              return unique;
            });
          }
        })
        .catch(() => console.log("Backend offline ou sem histórico."));
    } else {
      setMensagens([]); 
    }
  }, [usuarioSelecionado, meuIdUnico]);

  // 4. AUTO-SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const formatarHora = (dataString) => {
    if (!dataString) return "";
    const dt = new Date(dataString);
    if(isNaN(dt)) return "";
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!mensagem.trim() || !usuarioSelecionado) return;
    if (!socket.current?.connected) {
      console.warn("⚠️ Socket desconectado, não é possível enviar.");
      return;
    }

    const idUnico = self.crypto ? self.crypto.randomUUID() : Date.now().toString();

    const chatMessage = {
      id: idUnico,
      remetenteId: Number(usuarioLogado.id),
      remetenteNome: usuarioLogado.nome,
      destinatarioId: Number(usuarioSelecionado.id),
      conteudo: mensagem.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Salvar no Histórico Isolado Local
    const outroIdUnico = getParticipantKey(usuarioSelecionado);
    const chaveHistorico = `chat_history_${meuIdUnico}_${outroIdUnico}`;
    setMensagens((prev) => {
      const novaLista = [...prev, chatMessage];
      localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
      return novaLista;
    });

    // Enviar via Socket
    socket.current.emit("enviar_mensagem", chatMessage);

    // Ganhar XP por mensagem
    addXP(5);

    // Atualiza a sidebar localmente também
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
    
    // Para de digitar
    socket.current.emit("parou_digitar", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const rolarDado = async (lados) => {
    if (!usuarioSelecionado) return;
    try {
      const res = await fetch(`http://localhost:8081/rolar/${lados}`);
      if (res.ok) {
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
      } else {
        alert("Erro ao rolar dados no servidor auxiliar.");
      }
    } catch (err) {
      console.error(err);
      alert("O servidor auxiliar de dados está offline.");
    }
  };

  const handleChangeInput = (e) => {
    setMensagem(e.target.value);
    if(usuarioSelecionado && socket.current?.connected) {
      socket.current.emit("digitando", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
      if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.current.emit("parou_digitar", { remetenteId: usuarioLogado.id, destinatarioId: usuarioSelecionado.id });
      }, 2000);
    }
  };

  const handleToggleGroupMember = (userId) => {
    setGroupMembersSelected((prev) => {
      const exists = prev.includes(userId);
      if (exists) {
        return prev.filter((id) => id !== userId);
      }
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

  const handleSelectGroup = (group) => {
    setUsuarioSelecionado(group);
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
             <Link to="/" className="nav-icon-link"> <button className="btn-join">Inicio</button> </Link>
             <Link to="/dashboard" className="nav-icon-link"> <img src={iconDashboard} alt="" /> Dashboard </Link>
             <Link to="/mapa" className="nav-icon-link"> <img src={iconMapa} alt="" /> Mapa </Link>
             <Link to="/perfil" className="nav-icon-link"> <img src={iconPerfil} alt="" /> Perfil </Link>
          </div>
        </div>
      </header>

      <section className="chat-layout">
        <aside className="sidebar">
          <div className="mb-3 d-grid">
            <button className="botao_criar_grupo" onClick={() => setShowModal(true)}>＋ Criar grupo</button>
          </div>

          <div className="user-self-profile">
            <img 
              src={usuarioLogado.avatar || `https://ui-avatars.com/api/?name=${usuarioLogado.nome || 'User'}&background=random`} 
              className="user-self-avatar" 
              alt="Me"
            />
            <div className="user-self-info">
              <h6>{usuarioLogado.nome || "Meu Perfil"}</h6>
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
                <div className="groups-section">
                  <div className="group-section-header">Grupos</div>
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <div
                        key={group.id}
                        className={`group-item ${usuarioSelecionado?.id === group.id ? 'active-chat' : ''}`}
                        onClick={() => handleSelectGroup(group)}
                      >
                        <div className="group-item-icon">✨</div>
                        <div className="group-item-info">
                          <h6>{group.name}</h6>
                          <p>{group.members.map((member) => member.nome).join(", ")}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-groups-card">
                      <span className="no-groups-icon">👥</span>
                      <p className="no-groups-title">Nenhum grupo criado</p>
                      <p className="no-groups-text">Crie um grupo acima para começar!</p>
                    </div>
                  )}
                </div>

                <div className="usuarios-online">
                  {usuariosOnline.filter(u => u.ultima_mensagem || (usuarioSelecionado && Number(u.id) === Number(usuarioSelecionado.id))).length > 0 ? (
                    usuariosOnline.filter(u => u.ultima_mensagem || (usuarioSelecionado && Number(u.id) === Number(usuarioSelecionado.id))).map((user) => (
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
                        <span style={{ position: "absolute", bottom: "0px", right: "0px", width: "12px", height: "12px", backgroundColor: "#22c55e", borderRadius: "50%", border: "2px solid #1a1236" }}></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <h6 title={user.nome || "Usuário"} style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "16.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{user.nome || "Usuário"}</h6>
                        <p style={{ fontSize: "12px", color: "#bd83f2", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic", display: "block" }}>
                          {user.jogos || "Sem jogos no grimório"}
                        </p>
                        {usuarioSelecionado?.id === user.id ? (
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#A345F5", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>Conversa ativa</p>
                        ) : (
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
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
            </> ) : (
              <div className="usuarios-online">
                <input type="text" placeholder="Pesquisar..." className="sidebar-search-field" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {usuariosOnline.filter(u => (u.nome || "").toLowerCase().includes((searchTerm || "").toLowerCase())).map((user) => (
                  <div key={user.id} className="chat-item" onClick={() => { setUsuarioSelecionado(user); setActiveTab("conversas"); }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.nome || 'User'}&background=random`} 
                        alt="" 
                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #7c3aed" }}
                      />
                      <span style={{ position: "absolute", bottom: "0px", right: "0px", width: "12px", height: "12px", backgroundColor: "#22c55e", borderRadius: "50%", border: "2px solid #1a1236" }}></span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <h6 title={user.nome || "Usuário"} style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{user.nome || "Usuário"}</h6>
                      <p style={{ fontSize: "12px", color: "#bd83f2", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic", display: "block" }}>
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
            ) : usuarioSelecionado.isGroup ? (
              <div className="group-window">
                <div className="chat-header-top">
                  <div className="chat-header-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}>
                    <span style={{ fontSize: '1.3rem' }}>G</span>
                  </div>
                  <div className="chat-header-info">
                    <div className="d-flex align-items-center gap-2">
                      <h5>{usuarioSelecionado.name}</h5>
                      <div className="chat-level-badge">GRUPO</div>
                    </div>
                    <p className="user-grimorio-header">
                      {usuarioSelecionado.members.map((member) => member.nome).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="group-placeholder">
                  <h3>Grupo criado com sucesso!</h3>
                  <p>Esse grupo aparece na sidebar e você pode consultá-lo sempre que precisar.</p>
                  <div className="group-members-summary">
                    {usuarioSelecionado.members.map((member) => (
                      <div key={member.id} className="group-summary-member">
                        <span>{member.nome}</span>
                      </div>
                    ))}
                  </div>
                  <p className="group-placeholder-note">A funcionalidade de chat em grupo será anunciada em breve neste universo.</p>
                </div>
              </div>
            ) : (
              <div className="chat-window">
                <div className="chat-header-top">
                  <div className="chat-header-avatar">
                     {usuarioSelecionado.avatar ? (
                       <img src={usuarioSelecionado.avatar} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                     ) : (
                       usuarioSelecionado.nome.charAt(0)
                     )}
                  </div>
                  <div className="chat-header-info">
                    <h5>{usuarioSelecionado.nome}</h5>
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
                  <div ref={scrollRef} style={{ float:"left", clear: "both" }} />
                </div>
                
                {usuarioDigitando && (
                  <div className="typing-indicator">
                     <span></span><span></span><span></span>
                     <div style={{marginLeft: '8px'}}>{usuarioSelecionado.nome} está digitando...</div>
                  </div>
                )}

                <div className="dice-roll-tray" style={{ display: "flex", gap: "10px", padding: "10px 20px", background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "#bd83f2", fontWeight: "bold" }}>Rolar Dado:</span>
                  {[4, 6, 8, 10, 12, 20, 100].map(lados => (
                    <button 
                      key={lados} 
                      onClick={() => rolarDado(lados)} 
                      type="button" 
                      style={{ 
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", 
                        border: "none", 
                        color: "white", 
                        borderRadius: "8px", 
                        padding: "4px 10px", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "transform 0.2s"
                      }}
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
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </form>
              </div>
            )}
        </main>
      </section>

      {/* MODAL ÚNICO E CORRIGIDO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <div className="modal-header">
              <div className="modal-header-icon">⚔️</div>
              <div className="modal-header-text">
                <h3 id="dialog-title">Criar novo grupo</h3>
                <p id="dialog-description">Inicie uma nova aventura com amigos e construa sua equipe épica.</p>
              </div>
            </div>
            <label className="modal-label" htmlFor="group-name">Nome do grupo</label>
            <input id="group-name" type="text" placeholder="Nome do grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />

            <label className="modal-label" htmlFor="group-members">Selecione participantes</label>
            <div className="selection-counter">Selecionados: {groupMembersSelected.length}</div>
            <div className="group-members-list" id="group-members">
              {usuariosOnline.filter(u => u.ultima_mensagem).length > 0 ? (
                usuariosOnline.filter(u => u.ultima_mensagem).map((user) => {
                  const selected = groupMembersSelected.includes(Number(user.id));
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`group-member-item ${selected ? 'selected' : ''}`}
                      onClick={() => handleToggleGroupMember(Number(user.id))}
                    >
                      <span className="member-name">{user.nome}</span>
                      <span className={`member-badge ${selected ? 'selected' : ''}`}>
                        {selected ? '✔ Selecionado' : 'Selecionar'}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="modal-empty-message">Nenhuma conversa antiga encontrada. Converse com alguém primeiro para poder criar grupos.</p>
              )}
            </div>

            <div className="modal-buttons">
              <button className="btn-create" onClick={handleCreateGroup}>Criar Grupo</button>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
            <p className="modal-note">Dica: use um nome épico como “Batalhão das Runas” e convide apenas parceiros de campanha.</p>
          </div>
        </div>
      )}
    </div>
  );
}