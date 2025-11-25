import { Client } from 'pg'
import 'dotenv/config'

const dbName = process.env.DB_DATABASE
const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const host = process.env.DB_HOST
const port = Number(process.env.DB_PORT)

async function createDatabase() {
  // Pripojíme sa do prednastavenej "postgres" databázy
  const client = new Client({
    user,
    password,
    host,
    port,
    database: 'postgres',
  })

  await client.connect()

  // Skontrolujeme, či databáza už existuje
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname=$1`, [dbName])
  if (res.rowCount === 0) {
    console.log(`Creating database "${dbName}"...`)
    await client.query(`CREATE DATABASE "${dbName}"`)
    console.log(`Database "${dbName}" created successfully.`)
  } else {
    console.log(`Database "${dbName}" already exists.`)
  }

  await client.end()
}

// Spustenie
createDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error creating database:', err)
    process.exit(1)
  })
