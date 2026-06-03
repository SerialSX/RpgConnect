import pkg from "pg";
import 'dotenv/config';
const { Pool } = pkg;

const db = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "RPG",
    password: process.env.DB_PASSWORD || "teste",
    port: parseInt(process.env.DB_PORT || "5432", 10),
});

async function migrate() {
    try {
        console.log("🚀 Starting database migration...");

        // 1. Cria as tabelas base se elas não existirem
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(100) NOT NULL
            );
        `);
        console.log("✅ Tabela 'usuarios' garantida.");

        await db.query(`
            CREATE TABLE IF NOT EXISTS mensagens (
                id SERIAL PRIMARY KEY,
                remetente_id INTEGER REFERENCES usuarios(id),
                destinatario_id INTEGER REFERENCES usuarios(id),
                conteudo TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabela 'mensagens' garantida.");

        const checkJogos = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='usuarios' AND column_name='jogos'
    `);
        if (checkJogos.rows.length === 0) {
            await db.query("ALTER TABLE usuarios ADD COLUMN jogos TEXT");
            console.log("✅ Column 'jogos' added.");
        }

        const checkAvatar = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='usuarios' AND column_name='avatar'
    `);
        if (checkAvatar.rows.length === 0) {
            await db.query("ALTER TABLE usuarios ADD COLUMN avatar TEXT");
            console.log("✅ Column 'avatar' added.");
        }

        const checkBio = await db.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name='usuarios' AND column_name='bio'
        `);
        if (checkBio.rows.length === 0) {
            await db.query("ALTER TABLE usuarios ADD COLUMN bio TEXT");
            console.log("✅ Column 'bio' added.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();