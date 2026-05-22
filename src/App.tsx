import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Shield, 
  Users, 
  Calendar, 
  Compass, 
  Sparkles,
  Award,
  Dices
} from 'lucide-react';

interface Campaign {
  id: number;
  title: string;
  system: string;
  master: string;
  slots: number;
  maxSlots: number;
  schedule: string;
  description: string;
  level: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    title: "A Tumba da Aniquilação",
    system: "D&D 5e",
    master: "Master Thiago",
    slots: 4,
    maxSlots: 5,
    schedule: "Sábados, 19h00",
    description: "Uma terrível maldição da morte assola o mundo de Faerûn. Aventure-se nas selvas misteriosas de Chult para desvendar este mal antigo.",
    level: "Nível 5-10"
  },
  {
    id: 2,
    title: "A Queda de Otari",
    system: "Pathfinder 2e",
    master: "Mestre Helena",
    slots: 2,
    maxSlots: 4,
    schedule: "Domingos quinzenais, 15h00",
    description: "Estranhos acontecimentos ameaçam a pacífica cidade costeira de Otari. Investigar os mistérios abaixo do farol abandonado.",
    level: "Nível 1-3"
  },
  {
    id: 3,
    title: "O Chamado de Cthulhu: Máscaras de Nyarlathotep",
    system: "Call of Cthulhu",
    master: "Keeper Roberto",
    slots: 3,
    maxSlots: 5,
    schedule: "Sextas-feiras, 21h00",
    description: "Investigue o desaparecimento da expedição Carlyle e impeça o despertar de horrores cósmicos além da compreensão humana.",
    level: "Investigadores iniciantes"
  },
  {
    id: 4,
    title: "Tormenta20: Fim dos Tempos",
    system: "Tormenta 20",
    master: "Mestre Leon",
    slots: 5,
    maxSlots: 5,
    schedule: "Quintas-feiras, 20h00",
    description: "Em Arton, a ameaça da Tormenta cresce a cada dia. Faça parte do grupo que tentará impedir a destruição total das Colinas de Valkaria.",
    level: "Nível 10+"
  },
  {
    id: 5,
    title: "Ordem Paranormal: Segredo na Floresta",
    system: "Ordem Paranormal",
    master: "Agente Liz",
    slots: 3,
    maxSlots: 4,
    schedule: "Quartas-feiras, 19h30",
    description: "Um mistério paranormal ronda a pacata vila de Carpazinha. Rastreie os símbolos enigmáticos e combata as criaturas do Outro Lado.",
    level: "NEX 15%"
  }
];

function App() {
  const [campaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('Todos');

  // Dice Roller State
  const [currentRoll, setCurrentRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollVerdict, setRollVerdict] = useState<string>('');
  const [rollHistory, setRollHistory] = useState<number[]>([]);

  // Roll D20 handler
  const rollD20 = () => {
    if (isRolling) return;
    setIsRolling(true);
    setCurrentRoll(null);
    setRollVerdict('');

    // Wait for the animation to finish (1.2s)
    setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1;
      setCurrentRoll(result);
      setIsRolling(false);

      // Determine verdict
      let verdict = '';
      if (result === 20) {
        verdict = 'Sucesso Crítico! 🌟';
      } else if (result === 1) {
        verdict = 'Fracasso Crítico! 💀';
      } else if (result >= 12) {
        verdict = 'Sucesso! 🎉';
      } else {
        verdict = 'Falha! ⚠️';
      }
      setRollVerdict(verdict);
      setRollHistory(prev => [result, ...prev].slice(0, 10)); // keep last 10 rolls
    }, 1200);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.master.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSystem = systemFilter === 'Todos' || c.system === systemFilter;
    return matchesSearch && matchesSystem;
  });

  // Unique systems for the filter dropdown
  const systems = ['Todos', ...Array.from(new Set(campaigns.map(c => c.system)))];

  return (
    <>
      {/* Header */}
      <header className="header">
        <a href="/" className="logo">
          <Dices size={28} />
          <span>RPGConnect</span>
        </a>
        <nav className="nav-links">
          <a href="#" className="nav-link active">Campanhas</a>
          <a href="#" className="nav-link">Criar Mesa</a>
          <a href="#" className="nav-link">Comunidade</a>
        </nav>
        <div>
          <button className="btn btn-outline" style={{ marginRight: '12px' }}>Entrar</button>
          <button className="btn btn-primary">Cadastrar</button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        
        {/* Left Column: Campaigns */}
        <section>
          <div className="card">
            <h2 className="card-title">
              <Compass size={24} />
              Explorar Campanhas Ativas
            </h2>
            
            {/* Search and Filters */}
            <div className="search-bar">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-search" 
                  placeholder="Buscar por campanha, mestre ou descrição..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
                <select 
                  className="filter-select"
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                >
                  {systems.map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campaign List */}
            <div className="campaign-list">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map(campaign => (
                  <div key={campaign.id} className="campaign-item">
                    <div className="campaign-info">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="campaign-tag">{campaign.system}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{campaign.level}</span>
                      </div>
                      <h3>{campaign.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                        {campaign.description}
                      </p>
                      <div className="campaign-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} style={{ color: 'var(--primary-light)' }} />
                          Mestre: <strong>{campaign.master}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--primary-light)' }} />
                          {campaign.schedule}
                        </span>
                      </div>
                    </div>
                    
                    <div className="campaign-status">
                      <span className="slots-badge">
                        <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        {campaign.slots} / {campaign.maxSlots} Jogadores
                      </span>
                      <button 
                        className={`btn ${campaign.slots === campaign.maxSlots ? 'btn-outline' : 'btn-primary'}`} 
                        disabled={campaign.slots === campaign.maxSlots}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        {campaign.slots === campaign.maxSlots ? 'Lotado' : 'Pedir Vaga'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <p>Nenhuma campanha encontrada com os filtros selecionados.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Dice Roller & Stats */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Interactive D20 Card */}
          <div className="card">
            <h2 className="card-title">
              <Sparkles size={24} />
              Torre de Dados D20
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Teste a sua sorte! Toque no dado de 20 lados para fazer uma rolagem oficial para a sua mesa.
            </p>
            
            <div className="dice-container">
              <div className="d20-wrapper" onClick={rollD20}>
                <div className={`d20-dice ${isRolling ? 'rolling' : ''}`}>
                  <div className="d20-shape">
                    <span className={`d20-number ${
                      currentRoll === 20 ? 'crit-success' : 
                      currentRoll === 1 ? 'crit-fail' : ''
                    }`}>
                      {isRolling ? '?' : (currentRoll !== null ? currentRoll : 20)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="roll-result">
                {isRolling ? (
                  <p className="roll-text" style={{ animation: 'pulse 0.5s infinite alternate' }}>
                    Rolando os dados do destino...
                  </p>
                ) : currentRoll !== null ? (
                  <>
                    <p className="roll-text">Você rolou um D20 e obteve:</p>
                    <div className="roll-verdict">{rollVerdict}</div>
                  </>
                ) : (
                  <p className="roll-text" style={{ color: 'var(--gold)' }}>
                    Clique no dado para rolar!
                  </p>
                )}
              </div>

              {rollHistory.length > 0 && (
                <div style={{ width: '100%', marginTop: '20px', borderTop: '1px solid rgba(140, 67, 236, 0.1)', paddingTop: '15px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                    Histórico de Rolagens (Últimos 10)
                  </p>
                  <div className="history-list">
                    {rollHistory.map((roll, idx) => (
                      <span 
                        key={idx} 
                        className={`history-item ${roll === 20 || roll === 1 ? 'crit' : ''}`}
                        title={roll === 20 ? 'Sucesso Crítico' : roll === 1 ? 'Fracasso Crítico' : `Rolagem: ${roll}`}
                      >
                        {roll}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="card">
            <h2 className="card-title">
              <Award size={24} />
              Por que usar o RPGConnect?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: 'var(--gold)', marginTop: '2px' }}>✦</div>
                <div>
                  <strong>Matchmaking Inteligente:</strong> Encontre mesas perfeitas baseadas nos seus horários, sistemas favoritos e estilo de jogo preferido.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: 'var(--gold)', marginTop: '2px' }}>✦</div>
                <div>
                  <strong>Fichas Dinâmicas:</strong> Crie e gerencie seus personagens de D&D 5e, Tormenta20 e outros sistemas diretamente pelo navegador.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ color: 'var(--gold)', marginTop: '2px' }}>✦</div>
                <div>
                  <strong>Ferramentas Integradas:</strong> Chat de voz, rolagem de dados auditada e grid de batalha simplificado para facilitar a vida do mestre.
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} RPGConnect. Desenvolvido para Mestres e Jogadores lendários.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.7 }}>
          Criado com React + TypeScript + Vite.
        </p>
      </footer>
    </>
  );
}

export default App;
