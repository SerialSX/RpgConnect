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

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();