import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Your NeonDB URL from the dashboard
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
