/**
 * DEPRECATED - This file was used for Prisma/PostgreSQL.
 * The application now uses Firebase/Firestore.
 * See firebase-admin.ts for the current database client.
 * 
 * @deprecated Use firebase-admin.ts instead
 */

export const prisma = new Proxy({} as never, {
    get() {
        throw new Error(
            'Prisma has been replaced with Firestore. ' +
            'Import from @/lib/firebase-admin instead.'
        )
    }
})
