import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis | null {
    if (redis) return redis

    const url = process.env.REDIS_URL
    // Skip if URL is missing or is a placeholder value
    if (!url || url === 'placeholder' || !url.startsWith('redis')) {
        console.warn('[Redis] Not configured, in-memory fallback will be used')
        return null
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
    const client = getRedis()
    if (!client) {
        console.warn('[Redis] Skipping setClaimToken - not configured')
        return
    }
    await client.set(`${CLAIM_PREFIX}${leadId}`, token, 'EX', ttlSeconds)
}

export async function getClaimToken(leadId: string): Promise<string | null> {
    const client = getRedis()
    if (!client) return null
    return client.get(`${CLAIM_PREFIX}${leadId}`)
}

export async function deleteClaimToken(leadId: string) {
    const client = getRedis()
    if (!client) return
    await client.del(`${CLAIM_PREFIX}${leadId}`)
}

export { getRedis as redis }
