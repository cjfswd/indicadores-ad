import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não definida. Defina no .env ou como variável de ambiente.')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    console.log('✅ Conectado ao PostgreSQL')

    const migrationsDir = path.resolve(__dirname, '../src/config/migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`⏳ Executando ${file}...`)
      await client.query(sql)
      console.log(`✅ ${file} aplicado com sucesso`)
    }

    console.log('\n🎉 Todas as migrations aplicadas!')
  } catch (err) {
    console.error('❌ Erro na migration:', (err as Error).message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()
