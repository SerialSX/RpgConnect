import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckSquare, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/icone_logo.png";
import { API_URL } from "../config/api";
import "../styles/signup.css";

// --- Sub-componentes de Notificação ---
const NOTIFICATION_TTL = 3000;

const Notification = ({ text, id, removeNotif }) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      removeNotif(id);
    }, NOTIFICATION_TTL);
    return () => clearTimeout(timeoutRef);
  }, [id, removeNotif]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "0",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "500",
        background: "linear-gradient(135deg, #a345f5 0%, #8b2cf5 100%)",
        boxShadow: "0 10px 15px -3px rgba(163, 69, 245, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        pointerEvents: "auto",
        marginBottom: "12px",
        width: "320px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        position: "relative"
      }}
    >
      {/* Conteúdo Principal */}
      <div style={{ display: "flex", padding: "16px", gap: "12px", alignItems: "center" }}>
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          padding: "6px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FiCheckSquare size={18} color="white" />
        </div>

        <span style={{ flexGrow: 1, color: "white", lineHeight: "1.4" }}>{text}</span>

        <button
          onClick={() => removeNotif(id)}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "50%",
            display: "flex",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Barra de Progresso Animada */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: NOTIFICATION_TTL / 1000, ease: "linear" }}
        style={{
          height: "4px",
          background: "rgba(255, 255, 255, 0.5)",
          alignSelf: "flex-start"
        }}
      />
    </motion.div>
  );
};

// --- Componente Principal ---
export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmacao: "",
  });

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text) => {
    const newNotif = { id: Math.random(), text };
    setNotifications((pv) => [newNotif, ...pv]);
  };

  const removeNotif = (id) => {
    setNotifications((pv) => pv.filter((n) => n.id !== id));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nome || !form.email || !form.senha) {
      addNotification("⚠️ Preencha todos os campos.");
      return;
    }

    if (form.senha !== form.confirmacao) {
      addNotification("❌ As senhas não conferem.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addNotification(`❌ ${data.error || "Erro ao cadastrar. E-mail pode já existir."}`);
        return;
      }

      addNotification("🎉 Conta criada com sucesso! Redirecionando...");
      setForm({ nome: "", email: "", senha: "", confirmacao: "" });

      // Redireciona para login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      addNotification("🔌 Erro ao conectar com o servidor.");
    }
  };

  return (
    <main className="signup-page" style={{ position: "relative" }}>

      {/* Container das Notificações - Fixado no topo direito */}
      <div
        className="notif-container"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999, // Fica acima de tudo
          pointerEvents: "none", // Permite clicar no que está atrás se não houver notificação
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end"
        }}
      >
        <AnimatePresence>
          {notifications.map((n) => (
            <Notification removeNotif={removeNotif} {...n} key={n.id} />
          ))}
        </AnimatePresence>
      </div>

      <div className="container" style={{ maxWidth: "520px" }}>
        <div className="text-center mb-4">
          <img src={logo} alt="logo" width="100" className="signup-logo" />
          <h1 className="text_signup">Crie sua conta</h1>
          <p className="subtitle_signup">
            Encontre jogadores e locais para a sua aventura
          </p>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-3">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-2">
                <label className="form-label name_label">Nome</label>
                <input
                  type="text"
                  name="nome"
                  className="form-control"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label name_label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label name_label">Senha</label>
                <input
                  type="password"
                  name="senha"
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label name_label">Confirmar senha</label>
                <input
                  type="password"
                  name="confirmacao"
                  className="form-control"
                  placeholder="Repita a senha"
                  value={form.confirmacao}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="botao_registrar">
                Registrar
              </button>
            </form>

            <p className="text-center text-secondary small mt-3 mb-0">
              Já tem conta?{" "}
              <a href="/login" className="link-primary text-decoration-none">
                Logar
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}