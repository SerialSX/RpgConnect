import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido. Acesso não autorizado." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
        return res.status(401).json({ error: "Erro no token. Formato inválido." });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: "Erro no token. Tipo incorreto (deve ser Bearer)." });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "rpgconnect_super_secret_key_2026"
        );
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.userNome = decoded.nome;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
}
