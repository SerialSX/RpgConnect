import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiCheckCircle, FiAlertTriangle } from "react-icons/fi"; 
import logo from "../assets/icone_logo.png";
import { API_URL } from "../config/api";
import "../styles/login.css";
import { HiCheck } from "react-icons/hi";


export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erro) setErro(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailLimpo = form.email.trim().toLowerCase();
    const senhaLimpa = form.senha.trim();

    if (!emailLimpo || !senhaLimpa) {
      setErro("Preencha todos os campos.");
      return;
    }

    setStatus("loading");
    setErro("");

    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailLimpo,
          senha: senhaLimpa
        }),
      });

      const contentType = response.headers.get("content-type");

      // Adicionamos um delay de 3 segundos (3000ms) para o loading ficar visível
      setTimeout(async () => {
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          
          if (!response.ok) {
            setErro(data.message || "Credenciais inválidas.");
            setStatus("idle");
            return;
          }

          // SUCESSO
          setStatus("success");
          localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario || data));
          if (data.token) {
            localStorage.setItem("token", data.token);
          }

          // Tempo para exibir a mensagem de "Logado com sucesso!"
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);

        } else {
          console.error("O servidor não devolveu JSON.");
          setErro("A rota de login não foi encontrada no servidor (Erro 404).");
          setStatus("idle");
        }
      }, 3000); // <--- Aumente aqui para o loading demorar mais ou menos

    } catch (error) {
      setTimeout(() => {
        console.error("Erro técnico:", error);
        setErro("Falha na comunicação com o servidor.");
        setStatus("idle");
      }, 3000);
    }
  };

  return (
    <main className="login-page">
      <div className="container" style={{ maxWidth: "520px" }}>
        <div className="text-center mb-4">
          <img src={logo} alt="logo" width="100" className="login_logo" />
          <h1 className="text_login">Bem vindo(a) de volta</h1>
          <p className="subtitle_login">Acesse sua conta de RPG</p>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} noValidate>
              <div className="email_label mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="email@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={status !== "idle"}
                />
              </div>

              <div className="senha_label mb-3">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  name="senha"
                  className="form-control"
                  placeholder="Digite sua senha"
                  value={form.senha}
                  onChange={handleChange}
                  disabled={status !== "idle"}
                />
              </div>

              <AnimatePresence mode="wait">
                {erro && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="alert-erro-rpg"
                  >
                    <FiAlertTriangle /> {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                className={`btn_register w-100 mt-4 ${status === "success" ? "btn-success-anim" : ""}`}
                disabled={status !== "idle"}
              >
                <AnimatePresence mode="wait">
                  {status === "loading" ? (
                    <motion.div 
                      key="l" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="d-flex align-items-center gap-2"
                    >
                      <FiLoader className="spinner" /> Validando...
                    </motion.div>
                  ) : status === "success" ? (
                    <motion.div 
                      key="s" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="d-flex align-items-center gap-2"
                    >
                      <HiCheck size={28} color="#fff" />
                    </motion.div>
                  ) : (
                    <motion.span 
                      key="t" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                    >
                      Entrar
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </form>

            <p className="text-center text-secondary small mt-3 mb-0">
               Não tem uma conta?{" "}
               <a href="/signup" className="link-primary text-decoration-none">
                 Cadastrar-se
               </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}