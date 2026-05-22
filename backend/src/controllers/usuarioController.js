import { db } from "../config/db.js";

export const registerUsuario = async (req, res) => {
    console.log("🔥 registerUsuario foi chamada");

    const { nome, email, senha } = req.body;


    try {
        const result = await db.query(
            "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id",
            [nome, email, senha]
        );

        res.status(201).json({
            message: "Usuário criado com sucesso!",
            id: result.rows[0].id
        });

    } catch (error) {
        console.error("ERRO REAL:", error);
        res.status(500).json({ error: error.message });
    }



};




export const loginUsuario = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const result = await db.query(
            "SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha = $2",
            [email, senha]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const usuario = result.rows[0];

        // 🔥 MARCA COMO ONLINE
        await db.query(
            "UPDATE usuarios SET online = TRUE WHERE id = $1",
            [usuario.id]
        );

        res.json({
            message: "Login realizado!",
            usuario
        });

    } catch (error) {
        res.status(500).json({ message: "Erro interno." });
    }
};




export const listarUsuarios = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nome, email FROM usuarios"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuários." });
    }
};

export const listarUsuariosOnline = async (req, res) => {
    try {
        const usuarioId = Number(req.query.usuarioId);

        console.log("UsuarioId recebido:", usuarioId);

        const result = await db.query(
            "SELECT id, nome, email FROM usuarios WHERE online = TRUE AND id != $1",
            [usuarioId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar usuários online" });
    }
};