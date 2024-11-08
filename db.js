import 'dotenv/config'
import postgres from 'postgres'

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`

export const sql = postgres(URL, {
  ssl: { rejectUnauthorized: false }, 
})

sql`
  SELECT 1
`
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch((err) => {
    console.error('Erro ao conectar ao banco:', err)
  })
