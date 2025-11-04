import 'dotenv/config'
import { Client } from 'pg'
import { execSync } from 'node:child_process'

async function resetDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  })

  try {
    await client.connect()
    console.log('🧹 Dropping all tables...')

    // Drop all public schema tables
    await client.query(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `)

    console.log('✅ All tables dropped successfully.')
  } catch (error) {
    console.error('❌ Error while dropping tables:', error)
  } finally {
    await client.end()
  }

  // Run migrations again
  console.log('🚀 Running migrations...')
  execSync('node ace migration:run', { stdio: 'inherit' })

  console.log('✅ Database reset complete!')
}

resetDatabase()
