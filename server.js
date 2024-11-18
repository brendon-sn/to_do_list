import fastify from 'fastify'
import { DatabasePostgres } from './db-postgres.js'

const server = fastify({
  logger: true,
})

const database = new DatabasePostgres()

server.addHook('onSend', async (request, reply, payload) => {
  reply.header('Access-Control-Allow-Origin', '*')
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  reply.header('Access-Control-Allow-Credentials', 'true')
  return payload
})

server.options('*', async (req, reply) => {
  reply
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .header('Access-Control-Allow-Credentials', 'true')
    .status(204) // No Content
    .send()
})

server.post('/tasks', async (req, reply) => {
  const { name, cost, deadline } = req.body

  try {
    await database.create({
      name,
      cost,
      deadline,
    })
    return reply.status(201).send({ message: 'Tarefa criada com sucesso.' })
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao criar tarefa.' })
  }
})

server.get('/tasks', async (req, reply) => {
  const search = req.query.search || ''
  try {
    const tasks = await database.list(search)
    return reply.status(200).send(tasks)
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar tarefas.' })
  }
})

server.put('/tasks/:id', async (req, reply) => {
  const tasksId = req.params.id
  const { name, cost, deadline } = req.body

  try {
    await database.update(tasksId, {
      name,
      cost,
      deadline,
    })
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao atualizar tarefa.' })
  }
})

server.put('/tasks/:id/move', async (req, reply) => {
  const { id } = req.params
  const { direction } = req.query

  if (!direction || !['up', 'down'].includes(direction)) {
    return reply.status(400).send({ error: 'Direção inválida. Use "up" ou "down".' })
  }

  try {
    const task = await database.getTaskById(id)
    if (!task) {
      return reply.status(404).send({ error: 'Tarefa não encontrada.' })
    }

    if (direction === 'up') {
      await database.moveTaskUp(task.id)
    } else if (direction === 'down') {
      await database.moveTaskDown(task.id)
    }

    return reply.status(200).send({ message: `Task moved successfully - ${direction}.` })
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: `Error moving task: ${error.message}` })
  }
})

server.delete('/tasks/:id', async (req, reply) => {
  const tasksId = req.params.id

  try {
    await database.delete(tasksId)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar tarefa.' })
  }
})

const start = async () => {
  try {
    await server.listen({
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3333,
    })
    server.log.info(`Servidor rodando em http://0.0.0.0:${server.server.address().port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()