import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Campanhas from './components/Campanhas';
import Signup from './components/Signup';
import Login from './components/Login';
import Tela_usuario from './components/Tela_usuario';
import Mapa from './components/Mapa';
import Chat from './components/Chat';
import Perfil from './components/Perfil';
import Guia from './components/Guia';
import GlobalNotification from './components/GlobalNotification';

function App() {
  return (
    <>
      <GlobalNotification />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campanhas" element={<Campanhas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Tela_usuario />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/guia" element={<Guia />} />
      </Routes>
    </>
  );
}

export default App;