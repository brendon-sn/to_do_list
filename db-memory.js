import { randomUUID } from "crypto"

export class DatabaseMemory {
    #tasks = new Map()

    list(search) {
        return Array.from(this.#tasks.entries())
        .map((taskArray) => {
            const id = taskArray[0]
            const data = taskArray[1]

            return {
                id,
                ... data,
            }
        })
        .filter(tasks => {
            if(search) {
                return tasks.name.includes(search)
            }

            return true
        })
    }

    create(task) {
        const taskId = randomUUID()
        this.#tasks.set(taskId,task)
    }

    update(id, task) {
        this.#tasks.set(id, task)
    }

    delete(id) {
        this.#tasks.delete(id)
    }
}