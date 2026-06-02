import pkg from "pg";
import 'dotenv/config';
import fs from "fs";
import path from "path";

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "RPG",
    password: process.env.DB_PASSWORD || "teste",
    port: parseInt(process.env.DB_PORT || "5432", 10),
});

let useFallback = false;
let fallbackChecked = false;

const usersFile = path.resolve("usuarios.json");
const messagesFile = path.resolve("mensagens.json");

function readJson(file, defaultVal) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultVal, null, 4));
        return defaultVal;
    }
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        return defaultVal;
    }
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

async function checkConnection() {
    if (fallbackChecked) return;
    try {
        // Quick connection test
        const client = await pool.connect();
        client.release();
        console.log("✅ Conectado com sucesso ao PostgreSQL!");
        useFallback = false;
    } catch (err) {
        console.log("⚠️ Falha ao conectar ao PostgreSQL. Ativando banco de dados local (JSON fallback)...");
        console.log("Detalhes do erro:", err.message);
        useFallback = true;
    }
    fallbackChecked = true;
}

function queryFallback(sql, params) {
    const cleanedSql = sql.replace(/\s+/g, " ").trim();
    
    // Support migration queries so migrate.js doesn't fail
    if (cleanedSql.includes("information_schema.columns")) {
        return { rows: [{ column_name: 'jogos' }, { column_name: 'avatar' }] };
    }

    // 1. INSERT INTO usuarios
    if (cleanedSql.includes("INSERT INTO usuarios")) {
        const [nome, email, senha] = params;
        const users = readJson(usersFile, []);
        if (users.some(u => u.email === email)) {
            throw new Error("Erro ao cadastrar. O e-mail pode já existir.");
        }
        const newUser = {
            id: users.length + 1,
            nome,
            email,
            senha,
            bio: "",
            jogos: "",
            avatar: ""
        };
        users.push(newUser);
        writeJson(usersFile, users);
        return { rows: [newUser] };
    }
    
    // 2. SELECT FROM usuarios for login
    if (cleanedSql.includes("SELECT id, nome, email, jogos, avatar FROM usuarios WHERE email = $1 AND senha = $2")) {
        const [email, senha] = params;
        const users = readJson(usersFile, []);
        const user = users.find(u => u.email === email && u.senha === senha);
        return { rows: user ? [user] : [] };
    }
    
    // 3. UPDATE usuarios SET nome
    if (cleanedSql.includes("UPDATE usuarios SET nome")) {
        const [nome, jogos, avatar, id] = params;
        const users = readJson(usersFile, []);
        const userIndex = users.findIndex(u => String(u.id) === String(id));
        if (userIndex !== -1) {
            users[userIndex].nome = nome;
            users[userIndex].jogos = jogos;
            users[userIndex].avatar = avatar;
            writeJson(usersFile, users);
        }
        return { rows: [] };
    }
    
    // 4. INSERT INTO mensagens
    if (cleanedSql.includes("INSERT INTO mensagens")) {
        const [remetente_id, destinatario_id, conteudo, timestamp] = params;
        const messages = readJson(messagesFile, []);
        const newMessage = {
            remetente_id: Number(remetente_id),
            destinatario_id: Number(destinatario_id),
            conteudo,
            timestamp: timestamp || new Date().toISOString()
        };
        messages.push(newMessage);
        writeJson(messagesFile, messages);
        return { rows: [newMessage] };
    }
    
    // 5. SELECT online users
    if (cleanedSql.includes("FROM usuarios u WHERE u.id != $1")) {
        const [myId] = params;
        const users = readJson(usersFile, []);
        const messages = readJson(messagesFile, []);
        
        const otherUsers = users.filter(u => String(u.id) !== String(myId));
        const resultRows = otherUsers.map(u => {
            const conversation = messages.filter(m => 
                (String(m.remetente_id) === String(myId) && String(m.destinatario_id) === String(u.id)) ||
                (String(m.remetente_id) === String(u.id) && String(m.destinatario_id) === String(myId))
            );
            
            conversation.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const lastMsg = conversation[0];
            
            return {
                id: Number(u.id),
                nome: u.nome,
                jogos: u.jogos || "",
                avatar: u.avatar || "",
                ultima_mensagem: lastMsg ? lastMsg.conteudo : null,
                ultimo_horario: lastMsg ? lastMsg.timestamp : null
            };
        });
        
        resultRows.sort((a, b) => {
            if (a.ultimo_horario && b.ultimo_horario) {
                return new Date(b.ultimo_horario) - new Date(a.ultimo_horario);
            }
            if (a.ultimo_horario) return -1;
            if (b.ultimo_horario) return 1;
            return a.nome.localeCompare(b.nome);
        });
        
        return { rows: resultRows };
    }
    
    // 6. SELECT history
    if (cleanedSql.includes("FROM mensagens WHERE (remetente_id = $1 AND destinatario_id = $2)")) {
        const [meuId, outroId] = params;
        const messages = readJson(messagesFile, []);
        const conversation = messages.filter(m => 
            (String(m.remetente_id) === String(meuId) && String(m.destinatario_id) === String(outroId)) ||
            (String(m.remetente_id) === String(outroId) && String(m.destinatario_id) === String(meuId))
        );
        
        conversation.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return {
            rows: conversation.map(m => ({
                remetenteId: Number(m.remetente_id),
                destinatarioId: Number(m.destinatario_id),
                conteudo: m.conteudo,
                timestamp: m.timestamp
            }))
        };
    }

    console.log("⚠️ Fallback unhandled query:", cleanedSql);
    return { rows: [] };
}

export const db = {
    async query(sql, params = []) {
        if (!fallbackChecked) {
            await checkConnection();
        }
        
        if (useFallback) {
            return queryFallback(sql, params);
        } else {
            try {
                return await pool.query(sql, params);
            } catch (err) {
                console.error("Erro na query do Postgres, tentando fallback:", err.message);
                return queryFallback(sql, params);
            }
        }
    }
};