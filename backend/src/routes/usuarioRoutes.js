import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

function hashPassword(password) {
    if (!password) return "";
    return crypto.createHash("sha256").update(password).digest("hex");
}

export default function createUserRoutes(io) {
    const router = express.Router();


    router.post("/cadastro", async (req, res) => {
        const { nome, email, senha } = req.body;
        try {
            const senhaHash = hashPassword(senha);
            const result = await db.query(
                "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
                [nome, email, senhaHash]
            );
            const novoUsuario = result.rows[0];

            io.emit("novo_usuario", { id: novoUsuario.id, nome: novoUsuario.nome });
            console.log(`🆕 Novo usuário cadastrado: ${novoUsuario.nome} (ID: ${novoUsuario.id})`);

            const token = jwt.sign(
                { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email },
                process.env.JWT_SECRET || "rpgconnect_super_secret_key_2026",
                { expiresIn: "24h" }
            );

            res.status(201).json({ usuario: novoUsuario, token });
        } catch (error) {
            console.error("Erro no cadastro:", error);
            res.status(500).json({ error: "Erro ao cadastrar. O e-mail pode já existir." });
        }
    });


    router.post("/login", async (req, res) => {
        const { email, senha } = req.body;
        try {
            const result = await db.query(
                "SELECT id, nome, email, senha, bio, jogos, avatar FROM usuarios WHERE email = $1",
                [email]
            );

            if (result.rows.length > 0) {
                const usuario = result.rows[0];
                const senhaHash = hashPassword(senha);
                
                // Suporta tanto senha hashada quanto plaintext (retrocompatibilidade)
                if (usuario.senha === senhaHash || usuario.senha === senha) {
                    const token = jwt.sign(
                        { id: usuario.id, nome: usuario.nome, email: usuario.email },
                        process.env.JWT_SECRET || "rpgconnect_super_secret_key_2026",
                        { expiresIn: "24h" }
                    );
                    
                    // Remove a senha do objeto enviado ao frontend
                    const { senha: _, ...usuarioSemSenha } = usuario;
                    res.json({ usuario: usuarioSemSenha, token });
                } else {
                    res.status(401).json({ error: "E-mail ou senha incorretos." });
                }
            } else {
                res.status(401).json({ error: "E-mail ou senha incorretos." });
            }
        } catch (error) {
            console.error("Erro no login:", error);
            res.status(500).json({ error: "Erro interno no servidor." });
        }
    });


    router.get("/usuarios-online", authMiddleware, async (req, res) => {
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


    router.get("/historico/:meuId/:outroId", authMiddleware, async (req, res) => {
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


    router.put("/perfil-update", authMiddleware, async (req, res) => {
        const { id, nome, bio, jogos, avatar } = req.body;
        try {
            // Adicionamos a 'bio = $2' no comando SQL e passamos a variável no array!
            await db.query(
                "UPDATE usuarios SET nome = $1, bio = $2, jogos = $3, avatar = $4 WHERE id = $5",
                [nome, bio, jogos, avatar, id]
            );
            res.json({ message: "Perfil atualizado no servidor com sucesso!" });
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            res.status(500).json({ error: "Erro ao sincronizar perfil com o servidor." });
        }
    });

    // ROTA NOVA: Buscar os dados de um usuário específico para preencher o Perfil
    router.get("/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(
                "SELECT id, nome, email, bio, jogos, avatar FROM usuarios WHERE id = $1",
                [id]
            );

            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ error: "Usuário não encontrado no banco." });
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            res.status(500).json({ error: "Erro interno ao buscar perfil." });
        }
    });

    router.post("/traduzir", authMiddleware, async (req, res) => {
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