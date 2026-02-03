import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        // Return a dummy client that will fail at runtime if used
        // This allows builds to pass without a DB connection
        console.warn('[Prisma] DATABASE_URL not set, using lazy initialization')
        return new Proxy({} as PrismaClient, {
            get(target, prop) {
                if (prop === 'then' || prop === 'catch') return undefined
                throw new Error('DATABASE_URL is not defined - cannot use Prisma client')
            }
        })
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient()
    }
    return globalForPrisma.prisma
}

// Lazy export - only accessed when actually needed
export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
    }
})
