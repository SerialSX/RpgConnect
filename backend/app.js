import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { db } from "./src/config/db.js";
import createUserRoutes from "./src/routes/usuarioRoutes.js";

const app = express();

// =====================================================
// CORS para requisições HTTP normais (REST)
// =====================================================
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// =====================================================
// SERVIDOR HTTP + SOCKET.IO
// =====================================================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
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

    // Cada usuário entra numa "sala" com seu próprio ID
    socket.on("join", (userId) => {
        socket.join(String(userId));
        console.log(`👤 Usuário ${userId} entrou na sala.`);
    });

    // Recebe mensagem do remetente, salva no banco e reencaminha ao destinatário
    socket.on("enviar_mensagem", async (data) => {
        try {
            const { remetenteId, destinatarioId, conteudo, timestamp } = data;
            // Adiciona um ID único na mensagem se não vier do frontend
            data.id = data.id || crypto.randomUUID();

            // Salva a mensagem no banco de dados PostgreSQL
            await db.query(
                `INSERT INTO mensagens (remetente_id, destinatario_id, conteudo, timestamp)
         VALUES ($1, $2, $3, $4)`,
                [remetenteId, destinatarioId, conteudo, timestamp || new Date().toISOString()]
            );

            // Envia a mensagem para a sala do destinatário e do rementente (para manter abas sincronizadas)
            io.to(String(destinatarioId)).emit("receber_mensagem", data);
            io.to(String(remetenteId)).emit("receber_mensagem", data);

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
// INICIAR SERVIDOR
// =====================================================
const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SERVIDOR RODANDO NA PORTA ${PORT}`);
});