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
// BATIMENTO CARDÍACO DE INTEGRAÇÃO (Ping para o RpgConnect-Auxiliar)
// =====================================================
const enviarPingAuxiliar = async () => {
    try {
        const response = await fetch("http://localhost:8081/ping", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: "Online" })
        });
        if (response.ok) {
            console.log("📡 Ping de integração enviado com sucesso para o RpgConnect-Auxiliar.");
        }
    } catch (err) {
        console.warn("⚠️ Não foi possível comunicar com o RpgConnect-Auxiliar (Serviço Auxiliar desligado).");
    }
};

// =====================================================
// INICIAR SERVIDOR
// =====================================================
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR RODANDO NA PORTA ${PORT}`);
    
    // Envia o primeiro ping e agenda os próximos a cada 30 segundos
    enviarPingAuxiliar();
    setInterval(enviarPingAuxiliar, 30000);
});