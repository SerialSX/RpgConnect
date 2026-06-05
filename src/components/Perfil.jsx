import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_URL } from '../config/api';
import '../styles/perfil.css'; 

import logo from "../assets/icone_logo.png";
import iconInicio from "../assets/icone_botao_inicio.png";
import iconDashboard from "../assets/espadas_icone.png";
import iconMapa from "../assets/icone_mapa.png";
import iconChat from "../assets/icone_chat.png";
import iconPerfil from "../assets/icone_perfil.png";

export default function Perfil() {
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [jogos, setJogos] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [alerta, setAlerta] = useState({ mensagem: "", tipo: "", visivel: false });

  const uploadInputRef = useRef(null);

  useEffect(() => {
    const dadosStored = localStorage.getItem("usuarioLogado");
    if (dadosStored) {
      try {
        const usuarioObj = JSON.parse(dadosStored);
        const email = usuarioObj.email || "anon";
        setUsuarioEmail(email);
        
        // Carregar do localStorage primeiro (rápido)
        const savedNome = localStorage.getItem(`nome_${email}`);
        setNome(savedNome || usuarioObj.nome || "Aventureiro");
        
        const savedBio = localStorage.getItem(`bio_${email}`);
        setBio(savedBio || usuarioObj.bio || "");
        
        const savedJogos = localStorage.getItem(`jogos_${email}`);
        setJogos(savedJogos || usuarioObj.jogos || "");
        
        const savedAvatar = localStorage.getItem(`avatar_${email}`);
        const avatarUrl = savedAvatar || usuarioObj.avatar || usuarioObj.foto || usuarioObj.img || usuarioObj.profile_image || usuarioObj.photoURL;
        setAvatar(avatarUrl || null);

        // 🔥 Buscar dados frescos do servidor para sincronizar
        if (usuarioObj.id) {
          fetch(`http://localhost:8080/usuarios/${usuarioObj.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(perfilData => {
              if (!perfilData) return;

              // Só sobrescreve se o servidor tiver dados mais completos
              if (perfilData.nome && !savedNome) setNome(perfilData.nome);
              if (perfilData.bio && !savedBio) setBio(perfilData.bio);
              if (perfilData.jogos && !savedJogos) setJogos(perfilData.jogos);
              if (perfilData.avatar && !savedAvatar) {
                setAvatar(perfilData.avatar);
                localStorage.setItem(`avatar_${email}`, perfilData.avatar);
              }
              if (perfilData.nome && !savedNome) localStorage.setItem(`nome_${email}`, perfilData.nome);
              if (perfilData.bio && !savedBio) localStorage.setItem(`bio_${email}`, perfilData.bio);
              if (perfilData.jogos && !savedJogos) localStorage.setItem(`jogos_${email}`, perfilData.jogos);
            })
            .catch(err => console.warn("Aviso: não foi possível buscar perfil do servidor:", err));
        }
        
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  }, []);

  const exibirAlerta = (msg, tipo) => {
    setAlerta({ mensagem: msg, tipo: tipo, visivel: true });
    setTimeout(() => setAlerta(prev => ({ ...prev, visivel: false })), 4000);
  };

  const handleUploadAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        setAvatar(imageData);
        localStorage.setItem(`avatar_${usuarioEmail}`, imageData);
        exibirAlerta('Avatar atualizado!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarPerfil = () => {
    if (!nome.trim() || !bio.trim() || !jogos.trim()) {
      exibirAlerta('Por favor, preencha todos os campos.', 'danger');
      return;
    }
    
    // Salvar em chaves individuais (legado/específico)
    localStorage.setItem(`nome_${usuarioEmail}`, nome);
    localStorage.setItem(`bio_${usuarioEmail}`, bio);
    localStorage.setItem(`jogos_${usuarioEmail}`, jogos);
    
    // Sincronizar com o objeto central usuarioLogado para outros componentes (como o CHAT)
    const dadosStored = localStorage.getItem("usuarioLogado");
    if (dadosStored) {
      try {
        const usuarioObj = JSON.parse(dadosStored);
        const usuarioAtualizado = { 
          ...usuarioObj, 
          nome: nome,
          bio: bio,
          jogos: jogos,
          avatar: avatar // Garantir que o avatar mais recente também esteja aqui
        };
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));

        const token = localStorage.getItem("token");
        fetch(`${API_URL}/usuarios/perfil-update`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            id: usuarioObj.id,
            nome: nome,
            bio: bio,
            jogos: jogos,
            avatar: avatar // 🔥 Enviar a foto para o servidor
          })
        }).then(res => {
          if (res.status === 401) {
            localStorage.removeItem("usuarioLogado");
            localStorage.removeItem("token");
            window.location.href = "/login";
            throw new Error("Não autorizado");
          }
          if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
          return res.json();
        })
          .then(data => {
            console.log("✅ Sincronizado com o servidor:", data);
            exibirAlerta('Alterações salvas com sucesso!', 'success');
          })
          .catch(err => {
            console.error("❌ Erro ao sincronizar com servidor:", err);
            if (err.message !== "Não autorizado") {
                exibirAlerta('Salvo localmente, mas falhou ao sincronizar com o servidor.', 'danger');
            }
          });

      } catch (err) {
        console.error("Erro ao sincronizar usuarioLogado:", err);
        exibirAlerta('Erro ao salvar perfil.', 'danger');
      }
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div className="perfil-page-bg min-vh-100">
      {/* NAVBAR - OCUPANDO 100% DA LARGURA */}
          <header className="main-header">
            <div className="container header-container">
              {/* LADO ESQUERDO: LOGO */}
              <div className="header-left">
                <Link className="brand" to="/">
                  <img src={logo} alt="Logo" className="nav-logo-img" />
                  <span className="brand-text">RPG CONNECT</span>
                </Link>
              </div>
          
              {/* LADO DIREITO: BOTÃO PRIMEIRO E ÍCONES DEPOIS */}
              <div className="header-right">
            {/* Botão Laranja vindo primeiro */}
            <Link to="/" className="nav-icon-link" data-protected="true" title="Chat">
                  <button className="btn-join">Inicio</button>
            </Link>
            
            {/* Ícones separados e sem fundo de grupo */}
             <Link to="/dashboard" className="nav-icon-link" data-protected="true" title="Mapa">
            <img src={iconDashboard} alt="Dashboard" /> Dashboard
          </Link>
         <Link to="/mapa" className="nav-icon-link" data-protected="true" title="Mapa">
            <img src={iconMapa} alt="Mapa" /> Mapa
          </Link>
            <Link to="/chat" className="nav-icon-link" data-protected="true" title="Chat">
              <img src={iconChat} alt="Chat" /> Chat
            </Link>
          </div>
            </div>
          </header>

      <main className="container py-5">
        {alerta.visivel && (
          <div className={`alert alert-${alerta.tipo} alert-custom fade show`} role="alert">
            {alerta.mensagem}
          </div>
        )}

        {/* CONTAINER DO PERFIL COM LARGURA MÉDIA */}
        <div className="user-profile-glass medium-size">
          <div className="profile-header mb-4">
            <div 
              className="avatar_usuario" 
              onClick={() => uploadInputRef.current.click()}
              style={{ overflow: 'hidden', position: 'relative' }}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span className="plus-icon">+</span>
              )}
            </div>
            <input type="file" ref={uploadInputRef} onChange={handleUploadAvatar} accept="image/*" className="d-none" />
            
            <div className="header-text">
              <h1 className="user-name-title">{nome || "Novo Aventureiro"}</h1>
              <p className="texto_user">Nível 1 • Pronto pra jogar?</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="chat-card">
              <p className="chat-title">NOME DO PERSONAGEM</p>
              <input type="text" className="chat-subtitle" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={nome || "Seu nome..."} />
              <p className="chat-user-email"></p>
            </div>

            <div className="chat-card">
              <p className="chat-title">BIOGRAFIA DO HERÓI</p>
              <textarea className="chat-subtitle" value={bio} onChange={(e) => setBio(e.target.value)} onInput={autoResize} placeholder="Sua história..." rows="1" />
            </div>

            <div className="chat-card">
              <p className="chat-title">GRIMÓRIO DE JOGOS</p>
              <textarea className="chat-subtitle" value={jogos} onChange={(e) => setJogos(e.target.value)} onInput={autoResize} placeholder="D&D, Ordem, Tormenta..." rows="1" />
            </div>
          </div>

          <button className="botao_salvarPerfil" onClick={salvarPerfil}>Gravar Alterações</button>
        </div>
      </main>
    </div>
  );
}