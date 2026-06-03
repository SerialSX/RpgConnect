import express from "express";
import { db } from "../config/db.js";

export default function createUserRoutes(io) {
    const router = express.Router();


    router.post("/cadastro", async (req, res) => {
        const { nome, email, senha } = req.body;
        try {
            const result = await db.query(
                "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
                [nome, email, senha]
            );
            const novoUsuario = result.rows[0];

            io.emit("novo_usuario", { id: novoUsuario.id, nome: novoUsuario.nome });
            console.log(`🆕 Novo usuário cadastrado: ${novoUsuario.nome} (ID: ${novoUsuario.id})`);

            res.status(201).json(novoUsuario);
        } catch (error) {
            console.error("Erro no cadastro:", error);
            res.status(500).json({ error: "Erro ao cadastrar. O e-mail pode já existir." });
        }
    });


    router.post("/login", async (req, res) => {
        const { email, senha } = req.body;
        try {
            const result = await db.query(
                "SELECT id, nome, email, jogos, avatar FROM usuarios WHERE email = $1 AND senha = $2",
                [email, senha]
            );

            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(401).json({ error: "E-mail ou senha incorretos." });
            }
        } catch (error) {
            console.error("Erro no login:", error);
            res.status(500).json({ error: "Erro interno no servidor." });
        }
    });


    router.get("/usuarios-online", async (req, res) => {
        try {
            const { usuarioId } = req.query;
            const result = await db.query(
                `SELECT u.id::INTEGER as id, u.nome, u.jogos, u.avatar,
         (SELECT conteudo FROM mensagens m 
          WHERE (m.remetente_id = $1 AND m.destinatario_id = u.id) 
             OR (m.remetente_id = u.id AND m.destinatario_id = $1) 
          ORDER BY timestamp DESC LIMIT 1) as ultima_mensagem,
         (SELECT timestamp FROM mensagens m 
          WHERE (m.remetente_id = $1 AND m.destinatario_id = u.id) 
             OR (m.remetente_id = u.id AND m.destinatario_id = $1) 
          ORDER BY timestamp DESC LIMIT 1) as ultimo_horario
         FROM usuarios u WHERE u.id != $1 ORDER BY ultimo_horario DESC NULLS LAST, u.nome ASC`,
                [usuarioId || 0]
            );
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erro ao buscar usuários." });
        }
    });


    router.get("/historico/:meuId/:outroId", async (req, res) => {
        try {
            const { meuId, outroId } = req.params;
            const result = await db.query(
                `SELECT remetente_id::INTEGER as "remetenteId", destinatario_id::INTEGER as "destinatarioId", conteudo, timestamp 
         FROM mensagens 
         WHERE (remetente_id = $1 AND destinatario_id = $2) 
            OR (remetente_id = $2 AND destinatario_id = $1)
         ORDER BY timestamp ASC`,
                [meuId, outroId]
            );
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: "Erro ao carregar histórico." });
        }
    });


    router.put("/perfil-update", async (req, res) => {
        const { id, nome, bio, jogos, avatar } = req.body;
        try {
            await db.query(
                "UPDATE usuarios SET nome = $1, jogos = $2, avatar = $3 WHERE id = $4",
                [nome, jogos, avatar, id]
            );
            res.json({ message: "Perfil atualizado no servidor com sucesso!" });
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            res.status(500).json({ error: "Erro ao sincronizar perfil com o servidor." });
        }
    });

    router.post("/traduzir", async (req, res) => {
        const { texto, de, para } = req.body;
        try {
            const sourceLang = de || "en";
            const targetLang = para || "pt";
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(texto)}`
            );
            if (response.ok) {
                const data = await response.json();
                if (data && data[0]) {
                    const translatedText = data[0].map((item) => item[0]).join("");
                    res.json({ translatedText });
                } else {
                    res.status(500).json({ error: "Resposta vazia da API de tradução" });
                }
            } else {
                res.status(response.status).json({ error: "Erro na tradução externa" });
            }
        } catch (error) {
            console.error("Erro no proxy de tradução:", error);
            res.status(500).json({ error: "Erro interno ao traduzir" });
        }
    });

    return router;
}