import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis {
    if (redis) return redis

    const url = process.env.REDIS_URL
    if (!url) {
        throw new Error('REDIS_URL is not defined')
    }

    redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 3) return null
            return Math.min(times * 100, 3000)
        },
    })

    return redis
}

// Claim link patterns
export const CLAIM_PREFIX = 'claim:'

export async function setClaimToken(leadId: string, token: string, ttlSeconds: number = 60) {
    await getRedis().set(`${CLAIM_PREFIX}${leadId}`, token, 'EX', ttlSeconds)
}

export async function getClaimToken(leadId: string): Promise<string | null> {
    return getRedis().get(`${CLAIM_PREFIX}${leadId}`)
}

export async function deleteClaimToken(leadId: string) {
    await getRedis().del(`${CLAIM_PREFIX}${leadId}`)
}

export { getRedis as redis }
