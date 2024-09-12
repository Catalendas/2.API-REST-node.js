import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionsRoutes } from './routes/Transactions'

export const app = fastify()

app.register(cookie)

app.register(transactionsRoutes, {
    prefix: 'transactions',
})
