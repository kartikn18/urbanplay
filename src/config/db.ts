import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import dotenv from "dotenv"
import type { Database } from "../db/schema.js"
dotenv.config();

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool: new Pool({
            connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
        })
    })
})