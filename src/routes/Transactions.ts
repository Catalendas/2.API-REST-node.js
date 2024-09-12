import { FastifyInstance } from "fastify";
import { knex } from "../dabase";
import { z } from "zod";
import crypto from 'node:crypto'
import { checkSessionidExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
    app.get('/', {
        preHandler: [checkSessionidExists],
    }, async (request) => {
        const { sessionId } = request.cookies

        const transactions = await knex('transactions')
            .where('session_id', sessionId)
            .select()

        return {
            transactions
        }
    })

    app.get('/:id', {
        preHandler: [checkSessionidExists]
    }, async (request) => {
        const { sessionId } = request.cookies

        const getTransactionsParamSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = getTransactionsParamSchema.parse(request.params)

        const transactions = await knex('transactions')
            .where({
                session_id: sessionId,
                id
            })
            .first()

        return {
            transactions
        }
    })

    app.get('/summary', {
        preHandler: [checkSessionidExists]
    }, async (request) => {
        const { sessionId } = request.cookies

        const summary = await knex('transactions')
            .sum('amount', { as: 'amount' })
            .where('session_id', sessionId)
            .first()

        return {
            summary
        }
    })

    app.post('/', async (request, reply) => {
        const resquestBodyParse = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit'])
        })

        const { title, amount, type } = resquestBodyParse.parse(
            request.body
        )

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = crypto.randomUUID()

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            })
        }

        await knex('transactions')
            .insert({
                id: crypto.randomUUID(),
                title,
                amount: type === 'credit' ? amount : amount * -1,
                session_id: sessionId
            })

        return reply.status(201).send()
    })
}