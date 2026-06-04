import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config/api";
import "../styles/notification_system.css";

// Assets
import iconeNotificacao from "../assets/notificacao.png";

const NotificationSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState(() => {
    const saved = localStorage.getItem("dashboard_unread_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  
  const usuarioObj = JSON.parse(localStorage.getItem("usuarioLogado"));

  // 1. Persistência e Controle de Estado
  useEffect(() => {
    localStorage.setItem("dashboard_unread_notifications", JSON.stringify(notificacoes));
    localStorage.setItem("dashboard_has_notification", notificacoes.length > 0);
  }, [notificacoes]);

  // 2. Socket em tempo real
  useEffect(() => {
    if (!usuarioObj?.id) return;

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"]
    });

    socket.on("connect", () => {
      console.log("🛡️ [NotificationSystem] Conectado!");
      socket.emit("join", String(usuarioObj.id));
    });

    socket.on("receber_mensagem", (novaMsg) => {
      console.log("🛡️ [NotificationSystem] Nova mensagem:", novaMsg);
      setNotificacoes(prev => {
        if (Number(novaMsg.remetenteId) === Number(usuarioObj.id)) return prev;

        const jaExiste = prev.some(n => n.id === novaMsg.id);
        if (jaExiste) return prev;
        
        return [...prev, { 
          id: novaMsg.id || Date.now() + Math.random(),
          remetenteId: novaMsg.remetenteId, 
          conteudo: novaMsg.conteudo,
          timestamp: novaMsg.timestamp,
          nome: novaMsg.remetenteNome || "Novo Usuário"
        }];
      });
    });

    return () => socket.disconnect();
  }, [usuarioObj?.id]);

  // 3. Verificação Inicial de Mensagens Não Lidas
  useEffect(() => {
    const checkUnread = async () => {
      if (!usuarioObj?.id) return;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/usuarios/usuarios-online?usuarioId=${usuarioObj.id}`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        if (response.status === 401) {
          console.warn("Sessão expirada (401). Redirecionando para login...");
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        const usuarios = await response.json();
        if (!Array.isArray(usuarios)) {
          console.warn("Retorno de usuarios-online não é um array:", usuarios);
          return;
        }
        const ultimaVisita = localStorage.getItem(`ultima_visita_chat_${usuarioObj.id}`) || 0;
        
        const novas = usuarios
          .filter(u => {
            if (Number(u.id) === Number(usuarioObj.id)) return false;
            if (!u.ultimo_horario) return false;
            
            // 1. Rejeita se foi lido comprovadamente antes
            if (new Date(u.ultimo_horario).getTime() <= new Date(ultimaVisita).getTime()) return false;
            
            // 2. SOLUÇÃO FORÇADA E ABSOLUTA P/ MENSAGENS PRÓPRIAS FANTASMAS
            // A API não diz quem é o remetente da última mensagem, então validamos no histórico local
            const history = JSON.parse(localStorage.getItem(`chat_history_${usuarioObj.id}_${u.id}`) || "[]");
            
            if (history.length > 0) {
              const lastMsgLocal = history[history.length - 1];
              // Se nós fomos os remetentes da última mensagem local:
              if (Number(lastMsgLocal.remetenteId) === Number(usuarioObj.id)) {
                 // E ela é exatamente o conteúdo reportado pelo banco de dados: ignora.
                 if (lastMsgLocal.conteudo === u.ultima_mensagem) {
                    return false;
                 }
              }
            }
            return true;
          })
          .map(u => ({
            id: `init_${u.id}_${u.ultimo_horario}`,
            remetenteId: u.id,
            nome: u.nome,
            conteudo: u.ultima_mensagem,
            timestamp: u.ultimo_horario
          }));

        if (novas.length > 0) setNotificacoes(novas);
      } catch (err) {
        console.error("❌ Erro checkUnread:", err);
      }
    };
    checkUnread();
  }, [usuarioObj?.id]);

  // 4. Sincronização entre Abas
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "dashboard_has_notification" && e.newValue === "false") {
        setNotificacoes([]);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleVerMensagem = (remetenteId) => {
    const maxTs = notificacoes.reduce((m, n) => {
      const ts = new Date(n.timestamp).getTime();
      return ts > m ? ts : m;
    }, Date.now());

    setNotificacoes([]);
    localStorage.setItem("dashboard_has_notification", "false");
    localStorage.setItem("dashboard_unread_notifications", "[]");
    localStorage.setItem(`ultima_visita_chat_${usuarioObj.id}`, new Date(maxTs + 2000).toISOString());
    
    navigate("/chat", { state: { autoSelectUserId: remetenteId } });
    setIsSidebarOpen(false);
  };

  const handleLimparTudo = () => {
    const maxTs = notificacoes.reduce((m, n) => {
      const ts = new Date(n.timestamp).getTime();
      return ts > m ? ts : m;
    }, Date.now());
    
    setNotificacoes([]);
    localStorage.setItem("dashboard_has_notification", "false");
    localStorage.setItem("dashboard_unread_notifications", "[]");
    localStorage.setItem(`ultima_visita_chat_${usuarioObj.id}`, new Date(maxTs + 2000).toISOString());
  };

  const totalNotificacoes = notificacoes.length;

  return (
    <>
      {/* O ÍCONE (SINO) */}
      <div 
        className="notif-bell-container"
        onClick={() => setIsSidebarOpen(true)}
        title="Notificações de Mensagens"
      >
        <motion.div 
          className="notif-bell-wrapper"
          animate={totalNotificacoes > 0 ? {
            rotate: [0, -15, 15, -15, 15, 0],
          } : {
            rotate: 0
          }}
          transition={totalNotificacoes > 0 ? {
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut"
          } : {
            duration: 0.3
          }}
        >
          <img src={iconeNotificacao} alt="Sino" className="notif-bell-img" />
          <AnimatePresence>
            {totalNotificacoes > 0 && (
              <motion.span 
                className="notif-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {totalNotificacoes}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* SIDEBAR (VIA PORTAL) */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                className="notif-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.aside 
                className="notif-sidebar"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <div className="notif-sidebar-header">
                  <h3>Notificações</h3>
                  <button className="notif-close-btn" onClick={() => setIsSidebarOpen(false)}>&times;</button>
                </div>

                <div className="notif-sidebar-content">
                  {notificacoes.length === 0 ? (
                    <div className="notif-empty">
                      <p>Sua jornada está tranquila por enquanto...</p>
                    </div>
                  ) : (
                    <div className="notif-list">
                      {Object.values(notificacoes.reduce((acc, n) => {
                        if (!acc[n.remetenteId]) acc[n.remetenteId] = { ...n, count: 0 };
                        acc[n.remetenteId].count++;
                        if (new Date(n.timestamp) > new Date(acc[n.remetenteId].timestamp)) {
                          acc[n.remetenteId].conteudo = n.conteudo;
                          acc[n.remetenteId].timestamp = n.timestamp;
                        }
                        return acc;
                      }, {})).map((notif, idx) => (
                        <motion.div 
                          key={idx} 
                          className="notif-item"
                          whileHover={{ x: -5, backgroundColor: "rgba(189, 131, 242, 0.1)" }}
                          onClick={() => handleVerMensagem(notif.remetenteId)}
                        >
                          <div className="notif-item-avatar">
                            {notif.nome?.charAt(0).toUpperCase() || "A"}
                            {notif.count > 1 && <span className="notif-item-count">{notif.count}</span>}
                          </div>
                          <div className="notif-item-info">
                            <span className="notif-item-user">{notif.nome || "Aventureiro"}</span>
                            <p className="notif-item-text">{notif.conteudo}</p>
                            <span className="notif-item-time">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="notif-item-sword">⚔️</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {notificacoes.length > 0 && (
                  <div className="notif-sidebar-footer">
                    <button className="notif-clear-btn" onClick={handleLimparTudo}>Limpar Tudo</button>
                  </div>
                )}
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default NotificationSystem;
