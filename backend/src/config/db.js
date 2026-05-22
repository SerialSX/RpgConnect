import pkg from "pg";
import 'dotenv/config';
const { Pool } = pkg;

export const db = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "RPG",
    password: process.env.DB_PASSWORD || "teste",
    port: parseInt(process.env.DB_PORT || "5432", 10),
});

console.log(`🔄 Tentando conectar ao PostgreSQL em ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}...`);