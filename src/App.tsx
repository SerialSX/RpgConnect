import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Campanhas from './components/Campanhas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campanhas" element={<Campanhas />} />
        {/* Placeholder routes matching the buttons/links in Home */}
        <Route path="/login" element={
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#f5f4f8', background: '#07070a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Página de Login (Em Construção)</h2>
            <p style={{ color: '#9c97aa', marginBottom: '30px' }}>O portal da Taverna está sendo preparado para receber as suas credenciais.</p>
            <a href="/" style={{ color: '#d4af37', textDecoration: 'underline' }}>Voltar ao Início</a>
          </div>
        } />
        <Route path="/signup" element={
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#f5f4f8', background: '#07070a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Criar Nova Conta (Em Construção)</h2>
            <p style={{ color: '#9c97aa', marginBottom: '30px' }}>Os escrivães do reino estão preparando as fichas de inscrição.</p>
            <a href="/" style={{ color: '#d4af37', textDecoration: 'underline' }}>Voltar ao Início</a>
          </div>
        } />
        <Route path="/mapa" element={
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#f5f4f8', background: '#07070a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Explorar o Mapa (Em Construção)</h2>
            <p style={{ color: '#9c97aa', marginBottom: '30px' }}>Os cartógrafos imperiais estão desenhando as rotas das masmorras.</p>
            <a href="/" style={{ color: '#d4af37', textDecoration: 'underline' }}>Voltar ao Início</a>
          </div>
        } />
        <Route path="/chat" element={
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#f5f4f8', background: '#07070a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Salão do Chat (Em Construção)</h2>
            <p style={{ color: '#9c97aa', marginBottom: '30px' }}>Os mensageiros estão alimentando os pombos-correio do reino.</p>
            <a href="/" style={{ color: '#d4af37', textDecoration: 'underline' }}>Voltar ao Início</a>
          </div>
        } />
        <Route path="/perfil" element={
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#f5f4f8', background: '#07070a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Perfil de Aventureiro (Em Construção)</h2>
            <p style={{ color: '#9c97aa', marginBottom: '30px' }}>O mestre de armas está organizando as suas conquistas.</p>
            <a href="/" style={{ color: '#d4af37', textDecoration: 'underline' }}>Voltar ao Início</a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
