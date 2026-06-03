# ⚔️ RPGConnect — O Portal Definitivo do Aventureiro

O **RPGConnect** é uma plataforma completa desenvolvida para jogadores de RPG de mesa e entusiastas de board games. O sistema conecta jogadores a locais físicos, permite a formação de grupos via chat em tempo real e oferece um sistema de progressão de personagem (XP) integrado.

---

## 🚀 Principais Funcionalidades

### 📍 Sistema de Mapa (Kingdom Explorer)
* **Exploração de Locais:** Encontre pontos de interesse categorizados para encontrar-se com comunidades.
* **Status Dinâmicos:** Indicadores visuais no mapa indicando os locais como "fechados" ou "abertos".
* **Navegação Imersiva:** Rotas com descrições narrativas baseadas em elementos de RPG.
* **Integração com XP:** Ganhe experiência ao explorar novos locais e completar missões específicas.

### 💬 Sistema de Chat (Taberna Digital)
A **Taberna Digital** é o coração social do RPGConnect, um chat em tempo real que conecta jogadores para formar grupos e planejar campanhas.
* **Mensagens Privadas e Grupos:** Histórico isolado por conversa, garantindo privacidade total.
* **Feedback Visual:** Indicadores de "Usuário digitando" e lista de utilizadores online.
* **Integração com XP:** Ganhe pontos de experiência por interações sociais, incentivando a comunidade[cite: 1].
* **Notificações em Tempo Real:** Alertas instantâneos para novas mensagens[cite: 1].

### 🛡️ Perfil e Dashboard (Painel do Herói)
O **Painel do Herói** é a central de identidade do jogador, onde ele constrói o seu personagem digital e personaliza a sua presença no mundo RPGConnect[cite: 1].
* **Escolha de Jogos Favoritos:** Seleção de sistemas preferidos (D&D, Pathfinder, etc.) para filtrar conteúdos e conexões[cite: 1].
* **Classe RPG Própria:** Criação de classes personalizadas com atributos (Força, Inteligência, Carisma) e qualidades especiais[cite: 1].
* **Sistema de Nível e XP:** Barra de progresso integrada no cabeçalho com badges de nível[cite: 1].
* **Sincronização Global:** Nível e XP consistentes em todas as telas da plataforma[cite: 1].

---

## 🎨 Design & Experiência (UI/UX)
* **Tema Arcane Dark:** Paleta de cores baseada em Roxos Profundos, Violetas Arcanos e Acentos Dourados[cite: 1].
* **Glassmorphism:** Efeitos de transparência e desfoque aplicados em sidebars e cartões[cite: 1].
* **Consistência Global:** Navegação padronizada com ícones exclusivos em todas as telas[cite: 1].

---

## 🛠️ Stack Tecnológica

### Frontend
* React.js + Vite[cite: 1]
* Leaflet (Motor de mapas interativos)[cite: 1]
* Framer Motion (Animações de interface)[cite: 1]
* Bootstrap + Vanilla CSS[cite: 1]

### Backend
* Node.js + Express[cite: 1]
* Socket.io (Comunicação bidirecional em tempo real)[cite: 1]
* PostgreSQL (Banco de dados)[cite: 1]
* Sistema de Portas Inteligente (Scripts automatizados para limpeza das portas `5173` e `8080`)[cite: 1]

## 🔗 Integração Multissistemas (Requisito da Disciplina)

O projeto está dividido em **dois sistemas distintos** rodando de forma independente e se comunicando via requisições HTTP REST e troca de dados estruturados em JSON:

1. **RpgConnect (Sistema Principal — Portas 8080 e 5173):** Aplicação principal em React e Node.js que gerencia a interface do usuário, chat WebSockets e persistência no banco de dados PostgreSQL.
2. **RpgConnect-Auxiliar (Sistema Secundário — Porta 8081):** Microsserviço complementar responsável por rolagens de dados justas (Dice Roller), dicas dinâmicas de RPG e auditoria de status da integração.

### Mecanismos de Integração Implementados:
* **Heartbeat de Status (Batimento Cardíaco):** Ao iniciar, o servidor principal do RpgConnect (`8080`) envia um ping HTTP POST para o microsserviço auxiliar (`8081`). O microsserviço rastreia esse ping em tempo real: se o servidor principal parar de enviar sinais por mais de 90 segundos, o status da integração muda para `Offline`.
* **Painel de Monitoramento:** O Dashboard principal do frontend consome o status de ambos os servidores e exibe indicadores luminosos ("Serviço Auxiliar: ONLINE" e "Servidor Principal: ONLINE"), demonstrando a troca segura de status de integridade.
* **Dica de RPG do Dia:** O Dashboard consome dinamicamente o endpoint `/dica` do microsserviço auxiliar a cada carregamento, exibindo um conselho de RPG diferente aos jogadores.
* **Rolagem de Dados via API:** No Chat, os botões de rolagem de dados (`d4`, `d6`, `d8`, etc.) fazem requisições HTTP GET ao microsserviço de dados auxiliar, que sorteia os números e responde com o resultado e mensagens temáticas (como acertos críticos). O resultado é injetado diretamente no chat em tempo real via WebSockets.

---

## 🛠️ Como Iniciar

### Pré-requisitos
* **Node.js** (versão 16 ou superior)[cite: 1]
* **PostgreSQL** (versão 12 ou superior)[cite: 1]

### 1. Clonagem e Instalação
Clone o repositório e instale as dependências do projeto:

### 2. Configuração do Banco de Dados
* ** Crie um banco de dados chamado RPG no seu PostgreSQL[cite: 1].

* ** Certifique-se de que as credenciais de acesso no arquivo backend/src/config/db.js estão corretas (como usuário, senha e porta)[cite: 1].


### 3. Migração do Banco de Dados
* ** Antes de rodar o sistema, crie as tabelas necessárias executando a migração:

* ** node backend/migrate.js

### 4. Execução do Sistema

Para rodar todo o ecossistema de forma integrada, inicie os serviços em três terminais separados:

* **Terminal 1 (Interface Frontend):**
  ```bash
  cd RpgConnect
  npm run dev
  ```
  *(Disponível em `http://localhost:5173`)*

* **Terminal 2 (Servidor Backend Principal):**
  ```bash
  cd RpgConnect/backend
  npm run dev
  ```
  *(Disponível em `http://localhost:8080`)*

* **Terminal 3 (Serviço Auxiliar):**
  ```bash
  cd RpgConnect-Auxiliar
  npm run dev
  ```
  *(Disponível em `http://localhost:8081`)*


