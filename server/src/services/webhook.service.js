const config = require('../config/env');

/**
 * Trigger a webhook by action key.
 * Each action (sms_no_answer, email_2m_booking, etc.) has its own webhook URL.
 * @param {string} action   - Webhook action key (e.g. 'sms_no_answer')
 * @param {Object} data     - Payload to send (lead data, phone, email, etc.)
 */
async function trigger(action, data) {
    // Look up the webhook URL for this action
    const webhookUrl = getWebhookUrl(action);

    if (!webhookUrl) {
        console.warn(`Webhook [${action}] not configured. Skipping.`);
        return { success: true, message: `Webhook ${action} skipped (not configured)`, simulated: true };
    }

    const requestPayload = {
        action,
        data,
        timestamp: new Date().toISOString(),
        source: 'movehome-crm'
    };

    const retries = config.n8n.retries || 3;
    const timeout = config.n8n.timeout || 10000;
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const responseData = await response.json().catch(() => ({}));
                console.log(`✅ Webhook [${action}] triggered successfully (attempt ${attempt})`);
                return { success: true, statusCode: response.status, response: responseData };
            }

            lastError = `HTTP ${response.status}: ${response.statusText}`;
            console.warn(`Webhook [${action}] attempt ${attempt} failed: ${lastError}`);
        } catch (error) {
            lastError = error.name === 'AbortError' ? 'Request timeout' : error.message;
            console.error(`Webhook [${action}] attempt ${attempt} error: ${lastError}`);
        }

        // Exponential backoff
        if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }

    return {
        success: false,
        error: `Webhook [${action}] failed after ${retries} attempts: ${lastError}`
    };
}

/**
 * Get the webhook URL for a specific action from environment variables.
 * Format: WEBHOOK_{ACTION_UPPERCASE}_URL
 * Falls back to N8N_BASE_URL + path if specific one not set.
 */
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.n8k5q.space';

const WEBHOOK_PATHS = {
    sms_no_answer: '/webhook/e9f77d9b-c4da-4fea-9a1f-09fbc07a3d80',
    sms_after_hours: '/webhook/14f5c15d-2390-4361-ab8f-92cf25a5f846',
    sms_1st_checkin: '/webhook/c5116f54-7b70-4887-b898-bfcdfe1fa6a1',
    sms_2nd_nudge: '/webhook/2822fc2b-ddfa-45bf-bd0c-6662b1e6c12a',
    sms_3rd_final: '/webhook/2822fc2b-ddfa-45bf-bd0c-6662b1e6c12a',
    email_2m_booking: '/webhook/1c875952-54e5-4435-a970-67dc95905277',
    email_3m_booking: '/webhook/c1bc6abd-d239-46ac-ab55-7f8c58bd99d3',
    on_way_sms: '/webhook/ab017c31-2726-499f-b8e7-86ff77f9a77e',
    late_sms: '/webhook/cb1e7238-a642-4e53-86a2-1c8893cb459e'
};

function getWebhookUrl(action) {
    // Check if an explicit env var is set for this action (e.g. WEBHOOK_SMS_NO_ANSWER_URL)
    const envKey = `WEBHOOK_${action.toUpperCase()}_URL`;
    if (process.env[envKey]) {
        return process.env[envKey];
    }
    
    // Otherwise construct from base URL and path
    const path = WEBHOOK_PATHS[action];
    if (path) {
        // Remove trailing slash from base url if present to prevent double slashes
        const baseUrl = N8N_BASE_URL.replace(/\/$/, '');
        return `${baseUrl}${path}`;
    }
    return null;
}

/**
 * Get all configured webhook actions and their status.
 */
function getWebhookConfig() {
    const actions = [
        { key: 'sms_no_answer', label: 'SMS No Answer' },
        { key: 'sms_after_hours', label: 'SMS After Hours' },
        { key: 'sms_1st_checkin', label: 'SMS 1st Check-in' },
        { key: 'sms_2nd_nudge', label: 'SMS 2nd Nudge' },
        { key: 'sms_3rd_final', label: 'SMS 3rd & Final Try' },
        { key: 'email_2m_booking', label: 'Email 2M Booking Form' },
        { key: 'email_3m_booking', label: 'Email 3M Booking Form' }
    ];

    return actions.map(a => ({
        ...a,
        url: getWebhookUrl(a.key),
        configured: !!getWebhookUrl(a.key)
    }));
}

module.exports = { trigger, getWebhookUrl, getWebhookConfig };
