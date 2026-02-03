import Twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

interface SendSMSParams {
    to: string
    from: string
    body: string
}

export async function sendSMS({ to, from, body }: SendSMSParams) {
    if (!client) {
        console.warn('[Twilio] Client not configured, skipping SMS')
        return null
    }

    try {
        const message = await client.messages.create({
            to,
            from,
            body,
        })
        return message
    } catch (error) {
        console.error('[Twilio] SMS failed:', error)
        throw error
    }
}

export { client as twilioClient }
