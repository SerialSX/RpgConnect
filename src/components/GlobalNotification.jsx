import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../styles/global_notification.css";

const GlobalNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const silentXPRef = useRef(0);

  useEffect(() => {
    // 1. Escuta ganho de XP
    const handleXP = (e) => {
      // Se estiver no chat, acumula silenciosamente
      if (location.pathname === "/chat") {
        silentXPRef.current += e.detail.amount;
        return;
      }

      const id = Date.now() + Math.random();
      const newNotif = {
        id,
        type: "xp",
        amount: e.detail.amount,
        title: "XP Ganho!",
        msg: `+${e.detail.amount} pontos de experiência`,
        icon: "✨"
      };
      
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => removeNotification(id), 3000);
    };

    // 2. Escuta Level Up (Sempre global e visível)
    const handleLevelUp = (e) => {
      const id = Date.now() + Math.random();
      const newNotif = {
        id,
        type: "level",
        level: e.detail.level,
        title: "LEVEL UP!",
        msg: `Você subiu para o nível ${e.detail.level}!`,
        icon: "⭐"
      };
      
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => removeNotification(id), 6000);
    };

    window.addEventListener("xpUpdated", handleXP);
    window.addEventListener("levelUp", handleLevelUp);

    return () => {
      window.removeEventListener("xpUpdated", handleXP);
      window.removeEventListener("levelUp", handleLevelUp);
    };
  }, [location.pathname]); // Re-bind quando a rota muda para pegar o pathname atualizado no closure

  // 3. Verifica XP acumulado ao entrar no dashboard
  useEffect(() => {
    if (location.pathname === "/dashboard" && silentXPRef.current > 0) {
      const id = Date.now() + Math.random();
      const totalXP = silentXPRef.current;
      
      const newNotif = {
        id,
        type: "xp",
        title: "Resumo da Jornada!",
        msg: `Você ganhou +${totalXP} XP no Chat!`,
        icon: "📜"
      };
      
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => removeNotification(id), 5000);
      
      // Reseta o contador
      silentXPRef.current = 0;
    }
  }, [location.pathname]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="global-notification-container">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className={`notification-item ${notif.type === 'level' ? 'level-up' : 'xp-gain'}`}
        >
          <div className={notif.type === 'level' ? 'level-icon' : 'xp-icon'}>
            {notif.icon}
          </div>
          <div className="notif-content">
            <span className="notif-title">{notif.title}</span>
            <span className="notif-msg">{notif.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalNotification;
