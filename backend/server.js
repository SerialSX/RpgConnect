import { Server } from "socket.io";
import http from "http";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        // IMPORTANTE: Sem a barra "/" no final da URL
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true // Isso preenche o cabeçalho que aparece vazio nas suas fotos
    },
    // Garante que o polling (xhr) funcione antes de tentar o websocket
    transports: ["polling", "websocket"]
});

// No evento de conexão
io.on("connection", (socket) => {
    socket.on("join", (userId) => {
        socket.join(String(userId));
        console.log(`Usuário ${userId} entrou na sala.`);
    });

    socket.on("enviar_mensagem", async (data) => {
        try {
            const { remetenteId, destinatarioId, conteudo } = data;

            // Salva no banco (use os nomes com underline da sua tabela)
            await db.query(
                "INSERT INTO mensagens (remetente_id, destinatario_id, conteudo) VALUES ($1, $2, $3)",
                [remetenteId, destinatarioId, conteudo]
            );

            // Envia para o destinatário
            console.log(`📤 Enviando mensagem de ${remetenteId} para ${destinatarioId}`);
            io.to(String(destinatarioId)).emit("receber_mensagem", data);
        } catch (err) {
            console.error("Erro ao processar socket:", err);
        }
    });
});

httpServer.listen(8080, () => console.log("Servidor rodando na 8080"));