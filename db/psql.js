import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "rh_apotik",
  password: "1",
  port: 5432,
});
