import { randomUUID } from "crypto"
import { sql } from "./db.js"

export class DatabasePostgres {
    async list(search) {
        let tasks 

        if (search) {
            tasks = await sql
            `
                SELECT * FROM tasks
                WHERE name ILIKE ${'%' + search + '%'}
                ORDER BY order_tasks ASC
            `;

        } else {
            tasks = await sql`SELECT * FROM tasks ORDER BY order_tasks ASC`
        }

        return tasks
    }

    async create(task) {
        const tasksId = randomUUID();
        const { name, cost, deadline } = task  
    
        if (!name || !cost || !deadline) {
            throw new Error("Missing required fields")
        }
    
        const numericCost = parseFloat(cost)
    
        if (isNaN(numericCost)) {
            throw new Error("Invalid cost value")
        }
    
        await sql 
        `
            INSERT INTO tasks(id, name, cost, deadline)
            VALUES(${tasksId}, ${name}, ${numericCost}, ${deadline});
        `;
    }
    

    async update(id, task) {
        const { name, cost, deadline } = task  

        await sql 
        `
            UPDATE tasks SET name = ${name}, cost = ${cost}, deadline = ${deadline} 
            WHERE id = ${id}
        `
    }

    async delete(id) {
        await sql `DELETE from tasks WHERE id = ${id}`
    }
}