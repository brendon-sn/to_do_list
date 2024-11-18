import { randomUUID } from "crypto"
import { sql } from "./db.js"

export class DatabasePostgres {
  async list(search) {
    let tasks

    if (search) {
      tasks = await sql`
        SELECT * FROM tasks
        WHERE name ILIKE ${'%' + search + '%'}
        ORDER BY order_tasks ASC
      `
    } else {
      tasks = await sql`SELECT * FROM tasks ORDER BY order_tasks ASC`
    }

    return tasks
  }

  async getTaskById(id) {
    const result = await sql`
      SELECT * FROM tasks WHERE id = ${id}
    `
    return result[0]
  }

  async update(id, task) {
    const { name, cost, deadline } = task

    await sql`
      UPDATE tasks SET name = ${name}, cost = ${cost}, deadline = ${deadline} 
      WHERE id = ${id}
    `
  }

async moveTaskUp(id) {
    const task = await this.getTaskById(id)

    if (!task) {
      throw new Error('Task not found')
    }

    const previousTask = await sql`
      SELECT * FROM tasks 
      WHERE order_tasks < ${task.order_tasks} 
      ORDER BY order_tasks DESC 
      LIMIT 1
    `

    if (previousTask.length === 0) {
      throw new Error('No task to move up.')
    }

    const currentOrder = task.order_tasks
    const prevTask = previousTask[0]

    await sql`
      UPDATE tasks SET order_tasks = ${currentOrder} 
      WHERE id = ${prevTask.id}
    `
    await sql`
      UPDATE tasks SET order_tasks = ${prevTask.order_tasks} 
      WHERE id = ${task.id}
    `
}

async moveTaskDown(id) {
    const task = await this.getTaskById(id)

    if (!task) {
      throw new Error('Task not found')
    }

    const nextTask = await sql`
      SELECT * FROM tasks 
      WHERE order_tasks > ${task.order_tasks} 
      ORDER BY order_tasks ASC 
      LIMIT 1
    `

    if (nextTask.length === 0) {
      throw new Error('No task to move down.')
    }

    const currentOrder = task.order_tasks
    const nextTaskRow = nextTask[0]

    await sql`
      UPDATE tasks SET order_tasks = ${currentOrder} 
      WHERE id = ${nextTaskRow.id}
    `
    await sql`
      UPDATE tasks SET order_tasks = ${nextTaskRow.order_tasks} 
      WHERE id = ${task.id}
    `
}

  async moveTaskPosition(taskId, direction) {
    try {
      if (direction !== 'up' && direction !== 'down') {
        throw new Error("Invalid direction. Use 'up' or 'down'.")
      }

      await sql.begin(async (sql) => {
        const [currentTask] = await sql`
          SELECT id, order_tasks 
          FROM tasks 
          WHERE id = ${taskId}
        `

        if (!currentTask) {
          throw new Error('Task not found')
        }

        let targetTask

        if (direction === 'up') {
          [targetTask] = await sql`
            SELECT id, order_tasks 
            FROM tasks 
            WHERE order_tasks < ${currentTask.order_tasks}
            ORDER BY order_tasks DESC 
            LIMIT 1
          `
        } else if (direction === 'down') {
          [targetTask] = await sql`
            SELECT id, order_tasks 
            FROM tasks 
            WHERE order_tasks > ${currentTask.order_tasks}
            ORDER BY order_tasks ASC 
            LIMIT 1
          `
        }

        if (!targetTask) {
          return 
        }

        await sql`
          UPDATE tasks 
          SET order_tasks = ${targetTask.order_tasks}
          WHERE id = ${currentTask.id}
        `

        await sql`
          UPDATE tasks 
          SET order_tasks = ${currentTask.order_tasks}
          WHERE id = ${targetTask.id}
        `
      })

      return true
    } catch (error) {
      throw new Error(`Failed to move task: ${error.message}`)
    }
  }

  async reorderAfterDelete(deletedOrder, sql) {
    await sql`
        UPDATE tasks
        SET order_tasks = order_tasks - 1
        WHERE order_tasks > ${deletedOrder}
    `
}

  async delete(id) {
    await sql.begin(async (sql) => {
        const [taskToDelete] = await sql`SELECT order_tasks FROM tasks WHERE id = ${id}`
        if (!taskToDelete) {
            throw new Error('Task not found')
        }

        await sql`DELETE FROM tasks WHERE id = ${id}`

        await this.reorderAfterDelete(taskToDelete.order_tasks, sql)
    })
}

async create(task) {
    const tasksId = randomUUID()
    const { name, cost, deadline } = task
    
    if (name.length > 140) {
        throw new Error("The task name cannot be longer than 140 characters.")
    }
    
    const numericCost = parseFloat(cost)

    if (isNaN(numericCost)) {
        throw new Error("The cost value is invalid.")
    }
    if (numericCost < 0 || numericCost > 99999999) {
        throw new Error("The cost must be between 0 and 99,999,999.")
    }

    await sql`
        INSERT INTO tasks(id, name, cost, deadline, order_tasks)
        SELECT ${tasksId}, ${name}, ${numericCost}, ${deadline}, 
               COALESCE(MAX(order_tasks), 0) + 1
        FROM tasks
    `
}
}