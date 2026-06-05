import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { db } from "./src/config/db.js";
import createUserRoutes from "./src/routes/usuarioRoutes.js";

const app = express();

const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// =====================================================
// CORS para requisições HTTP normais (REST)
// =====================================================
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || localOriginRegex.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy violation"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// =====================================================
// SERVIDOR HTTP + SOCKET.IO
// =====================================================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin || localOriginRegex.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error("CORS policy violation"), false);
        },
        methods: ["GET", "POST"],
        credentials: true       // <-- ESSENCIAL: evita o erro de CORS que você viu
    },
    transports: ["polling", "websocket"]
});

// =====================================================
// LÓGICA DO SOCKET.IO
// =====================================================
io.on("connection", (socket) => {
    console.log(`✅ Usuário conectado: ${socket.id}`);

    socket.on("join", (userId) => {
        socket.join(String(userId));
        console.log(`👤 Usuário ${userId} entrou na sala.`);
    });

    socket.on("enviar_mensagem", async (data) => {
        try {
            const { remetenteId, destinatarioId, conteudo, timestamp } = data;

            await db.query(
                `INSERT INTO mensagens (remetente_id, destinatario_id, conteudo, timestamp)
                 VALUES ($1, $2, $3, $4)`,
                [remetenteId, destinatarioId, conteudo, timestamp || new Date().toISOString()]
            );

            io.to(String(destinatarioId)).emit("receber_mensagem", data);

            console.log(`📩 Mensagem de ${remetenteId} → ${destinatarioId}: ${conteudo}`);
        } catch (err) {
            console.error("❌ Erro ao processar mensagem via socket:", err);
            socket.emit("erro_mensagem", { mensagem: "Erro ao enviar mensagem." });
        }
    });

    socket.on("digitando", (data) => {
        // data = { remetenteId, destinatarioId }
        io.to(String(data.destinatarioId)).emit("usuario_digitando", data.remetenteId);
    });

    socket.on("parou_digitar", (data) => {
        io.to(String(data.destinatarioId)).emit("usuario_parou_digitar", data.remetenteId);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Usuário desconectado: ${socket.id}`);
    });
});

// =====================================================
// ROTAS REST
// =====================================================
// Passa `io` para que as rotas possam emitir eventos de socket (ex: novo_usuario)
app.use("/usuarios", createUserRoutes(io));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// =====================================================
// ENDPOINTS AUXILIARES INTEGRADOS (Sem microserviço externo)
// =====================================================

// 🔮 Dicas de RPG do Dia
const dicas = [
    "Não divida o grupo! Manter-se unido é a chave para sobreviver a encontros perigosos.",
    "Use o cenário a seu favor: mesas viradas, árvores ou pilares podem servir como ótima cobertura contra flechas e magias.",
    "Como Mestre, lembre-se de recompensar a criatividade dos seus jogadores, não apenas os combates vencidos.",
    "Descreva suas ações de combate com detalhes narrativos! Isso torna a rodada muito mais emocionante para todos.",
    "Sempre carregue corda e tochas. Itens simples de aventura salvam vidas mais vezes do que você imagina!",
    "Ataques furtivos dependem de posicionamento. Flanqueie seus inimigos para garantir vantagem nos dados.",
    "Use testes de Percepção Passiva para perceber armadilhas ou inimigos à espreita sem alertar os jogadores.",
    "Nem todo conflito precisa ser resolvido com combate. Diplomacia, suborno ou intimidação podem abrir caminhos mais fáceis."
];

app.get("/dica", (req, res) => {
    const randomTip = dicas[Math.floor(Math.random() * dicas.length)];
    res.json({ dica: randomTip });
});

// Status de Serviços Integrados (Ambos agora sempre Online já que estão unificados)
app.get("/status", (req, res) => {
    res.json({
        servico_auxiliar: "Online",
        servidor_principal: "Online"
    });
});

// Descritor Rápido de Classes RPG
const classesInfo = {
    mago: {
        classe: "Mago",
        func: "Estudioso erudito das artes arcanas que aprende magias através de livros e grimórios, moldando a realidade com seu intelecto."
    },
    barbaro: {
        classe: "Bárbaro",
        func: "Um combatente feroz que usa sua fúria primitiva e alta resistência para despedaçar inimigos na linha de frente."
    },
    guerreiro: {
        classe: "Guerreiro",
        func: "Um combatente altamente treinado que domina todas as táticas de combate, armas e armaduras com precisão militar."
    },
    clerigo: {
        classe: "Clérigo",
        func: "Um guerreiro sagrado que canaliza o poder de sua divindade para curar ferimentos e punir as forças das trevas."
    },
    druida: {
        classe: "Druida",
        func: "Um sacerdote da antiga fé capaz de invocar os poderes elementais da natureza e assumir formas de feras selvagens."
    },
    bardo: {
        classe: "Bardo",
        func: "Um mestre da música e da magia que inspira seus aliados e manipula a mente dos inimigos com suas canções e contos."
    },
    monge: {
        classe: "Monge",
        func: "Um artista marcial que canaliza a energia de seu próprio corpo (Ki) para desferir golpes rápidos e acrobáticos."
    },
    paladino: {
        classe: "Paladino",
        func: "Um guerreiro sagrado jurado a um voto solene de justiça, que usa sua fé para proteger aliados e destruir o mal."
    },
    patrulheiro: {
        classe: "Patrulheiro",
        func: "Um caçador implacável das fronteiras selvagens, mestre do rastreamento, da sobrevivência e do combate à distância."
    },
    ladino: {
        classe: "Ladino",
        func: "Um especialista em furtividade e precisão, capaz de abrir fechaduras, desarmar armadilhas e atacar sorrateiramente."
    },
    feiticeiro: {
        classe: "Feiticeiro",
        func: "Um conjurador nato que carrega magia pura em suas veias, herdada de linhagens exóticas, fadas ou dracônicas."
    },
    bruxo: {
        classe: "Bruxo",
        func: "Um conjurador místico que firmou um pacto eterno com uma entidade poderosa do outro mundo em troca de segredos arcanos."
    }
};

app.get("/info-classe", (req, res) => {
    let classeParam = req.query.classe;
    if (!classeParam) {
        return res.status(400).json({ erro: "Parâmetro 'classe' é obrigatório." });
    }
    const classeNormalizada = classeParam
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const info = classesInfo[classeNormalizada];
    if (info) {
        res.json(info);
    } else {
        res.status(404).json({ erro: `Classe '${classeParam}' não encontrada.` });
    }
});

// Sorteador de Fobia e Medo de Monstros
const fobias = ["Luz Forte", "Fogo", "Água", "Ratos", "Barulho Alto", "Prata", "Frio Extremo", "Veneno", "Eletricidade", "Alho", "Símbolos Sagrados"];

app.get("/fobia-monstro", (req, res) => {
    const randomFobia = fobias[Math.floor(Math.random() * fobias.length)];
    res.json({ fobia: randomFobia });
});

// Gerador de Tribos e Hordas Inimigas
const substantivosTribo = ["Clã", "Horda", "Tribo", "Facção", "Aliança", "Seita", "Bando"];
const complementosTribo = ["do Crânio", "do Dente", "da Garra", "do Olho", "da Presa", "do Sangue", "da Caveira", "do Fogo", "da Névoa"];
const adjetivosTribo = ["Partido", "Negro", "Sangrento", "Quebrado", "Faminto", "Profano", "Vermelho", "Cinzento", "Feroz", "Amaldiçoado"];

app.get("/tribo", (req, res) => {
    const sub = substantivosTribo[Math.floor(Math.random() * substantivosTribo.length)];
    const comp = complementosTribo[Math.floor(Math.random() * complementosTribo.length)];
    const adj = adjetivosTribo[Math.floor(Math.random() * adjetivosTribo.length)];
    
    let adjFinal = adj;
    if (["Horda", "Tribo", "Facção", "Aliança", "Seita"].includes(sub)) {
        if (adj.endsWith("o")) {
            adjFinal = adj.slice(0, -1) + "a";
        }
    }
    res.json({ nomeTribo: `${sub} ${comp} ${adjFinal}` });
});

// Rolagem de Dados
app.get("/rolar/:lados", (req, res) => {
    const lados = parseInt(req.params.lados);
    if (isNaN(lados) || lados <= 0) {
        return res.status(400).json({ erro: "Número de lados inválido." });
    }
    
    const resultado = Math.floor(Math.random() * lados) + 1;
    let mensagem = "";
    
    if (lados === 20) {
        if (resultado === 20) {
            mensagem = "Sucesso Crítico! 🌟";
        } else if (resultado === 1) {
            mensagem = "Falha Crítica! 💀";
        } else if (resultado >= 15) {
            mensagem = "Ótimo resultado!";
        } else if (resultado <= 5) {
            mensagem = "Resultado ruim...";
        } else {
            mensagem = "Resultado mediano.";
        }
    } else {
        if (resultado === lados) {
            mensagem = "Rolagem Máxima! 🔥";
        } else if (resultado === 1) {
            mensagem = "Que azar! Mínimo no dado. 😢";
        } else {
            mensagem = "Rolagem efetuada.";
        }
    }
    
    res.json({
        resultado: resultado,
        mensagem: mensagem
    });
});

// =====================================================
// RPGGEEK SEARCH PROXY (Busca de RPG de mesa físicos)
// =====================================================
app.get("/api/rpggeek/search", async (req, res) => {
    const query = req.query.q || "";
    if (!query) {
        return res.json([]);
    }

    try {
        const response = await fetch(
            `https://rpggeek.com/geeksearch.php?action=search&objecttype=rpgitem&q=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
            throw new Error(`RPGGeek responded with status ${response.status}`);
        }
        
        const html = await response.text();
        const rows = html.split("<tr id='row_'>");
        const results = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Extract ID and Name
            const linkMatch = row.match(/href=["']\/rpgitem\/(\d+)\/([^"']*)["']\s+class=['"]primary['"]\s*>(.*?)<\/a>/is);
            if (!linkMatch) continue;
            
            const id = linkMatch[1];
            const slug = linkMatch[2];
            const nome = linkMatch[3].replace(/<[^>]*>/g, '').trim();
            
            // Extract thumbnail image
            const thumbTdMatch = row.match(/class=['"]collection_thumbnail['"][\s\S]*?<img[\s\S]*?src=['"]([^'"]+)['"]/is);
            const imagem = thumbTdMatch ? thumbTdMatch[1] : "";
            
            // Extract Year
            const yearMatch = row.match(/<span class=['"]smallerfont dull['"]>\((.*?)\)<\/span>/is);
            const ano = yearMatch ? yearMatch[1] : "";
            
            results.push({ id, nome, slug, ano, imagem });
        }

        res.json(results);
    } catch (error) {
        console.error("Error fetching/parsing RPGGeek:", error);
        res.status(500).json({ error: "Erro ao buscar jogos do RPGGeek" });
    }
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR RODANDO NA PORTA ${PORT}`);
});