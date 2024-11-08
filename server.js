import { fastify } from 'fastify'
import { DatabasePostgres } from './db-postgres.js'

const server = fastify()

const database = new DatabasePostgres()

server.post('/tasks', async (req, reply) => {
    const { name, cost, deadline } = req.body

    await database.create({
        name,
        cost,
        deadline,
    })

    return reply.status(201).send()
})

server.get('/tasks', async (req) => {
    const search = req.query.search

    const tasks = await database.list(search)

    return tasks
})

server.put('/tasks/:id', async (req, reply) => {
    const tasksId = req.params.id
    const { name, cost, deadline } = req.body

    await database.update(tasksId, {
        name,
        cost,
        deadline,
    })
    return reply.status(204).send()
})

server.delete('/tasks/:id', async (req, reply) => {
    const tasksId = req.params.id

    await database.delete(tasksId)

    return reply.status(204).send()
})

server.listen({
    port: process.env.PORT ?? 3333,
})