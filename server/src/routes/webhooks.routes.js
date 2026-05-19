const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabase } = require('../config/database');
const webhook = require('../services/webhook.service');

// Action labels
const ACTION_LABELS = {
    sms_no_answer:    'SMS No Answer',
    sms_after_hours:  'SMS After Hours',
    sms_1st_checkin:  'SMS 1st Check-in',
    sms_2nd_nudge:    'SMS 2nd Nudge',
    sms_3rd_final:    'SMS 3rd & Final',
    email_2m_booking: 'Email 2M Booking',
    email_3m_booking: 'Email 3M Booking'
};

// GET /api/webhooks/config - Get webhook configuration status
router.get('/config', (req, res) => {
    const config = webhook.getWebhookConfig();
    res.json({ success: true, data: config });
});

// GET /api/webhooks/config - protected
router.get('/config', authenticate, (req, res) => {
    const config = webhook.getWebhookConfig();
    res.json({ success: true, data: config });
});

// POST /api/webhooks/trigger - NO auth required (called from browser, proxied to n8n)
router.post('/trigger', async (req, res, next) => {
    try {
        const { action, leadId, entityType } = req.body;
        const type = entityType || 'lead';

        if (!action || !leadId) {
            return res.status(400).json({ success: false, error: 'action and leadId are required' });
        }

        // Fetch the entity from Supabase
        const table = type === 'job' ? 'jobs' : 'leads';
        const { data: records, error: fetchErr } = await supabase
            .from(table)
            .select('*')
            .eq('id', leadId)
            .limit(1);

        if (fetchErr || !records || records.length === 0) {
            return res.status(404).json({ success: false, error: `${type} not found` });
        }

        const record = records[0];
        const label = ACTION_LABELS[action] || action;

        // Build payload
        const payload = {
            action_key:         action,
            action_label:       label,
            ...record,
            triggered_by:       req.body.triggered_by       || 'Staff',
            triggered_by_email: req.body.triggered_by_email || '',
            triggered_by_role:  req.body.triggered_by_role  || 'staff',
            triggered_at:       new Date().toISOString(),
            source:             'movehome-crm'
        };

        // Fire the webhook
        const webhookResult = await webhook.trigger(action, payload);

        // Tag entity with last SMS/Email action
        try {
            if (type === 'lead') {
                if (action.startsWith('sms_')) {
                    await supabase.from('leads').update({ last_sms_action: label, last_sms_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', leadId);
                } else if (action.startsWith('email_')) {
                    await supabase.from('leads').update({ last_email_action: label, last_email_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', leadId);
                }
            } else if (type === 'job') {
                if (action === 'on_way_sms') {
                    await supabase.from('jobs').update({ on_way_sms: 'sent' }).eq('id', leadId);
                } else if (action === 'late_sms') {
                    await supabase.from('jobs').update({ last_sms: 'sent' }).eq('id', leadId);
                }
            }
        } catch (tagErr) {
            console.error('Failed to tag entity:', tagErr.message);
        }

        // Log to activity_logs
        try {
            await supabase.from('activity_logs').insert({
                action:      `webhook_${action}`,
                entity_type: type,
                entity_id:   record.id,
                details:     JSON.stringify({ action, label, success: webhookResult.success })
            });
        } catch (logErr) {
            console.error('Failed to log webhook action:', logErr.message);
        }

        if (webhookResult.success) {
            res.json({
                success:   true,
                message:   webhookResult.simulated
                    ? `"${label}" recorded. Webhook fires once URL is configured.`
                    : `"${label}" triggered successfully.`,
                simulated: webhookResult.simulated || false,
                tag:       label
            });
        } else {
            res.status(502).json({ success: false, error: webhookResult.error || 'Webhook failed' });
        }
    } catch (error) {
        next(error);
    }
});

// PUT /api/webhooks/tag/:leadId - protected
router.put('/tag/:leadId', authenticate, async (req, res, next) => {
    try {
        const { leadId } = req.params;
        const { last_sms_action, last_email_action } = req.body;

        const updates = { updated_at: new Date().toISOString() };
        if (last_sms_action !== undefined) {
            updates.last_sms_action = last_sms_action || null;
            updates.last_sms_at    = new Date().toISOString();
        }
        if (last_email_action !== undefined) {
            updates.last_email_action = last_email_action || null;
            updates.last_email_at     = new Date().toISOString();
        }

        if (Object.keys(updates).length === 1) {
            return res.status(400).json({ success: false, error: 'No tags to update' });
        }

        const { error } = await supabase.from('leads').update(updates).eq('id', leadId);
        if (error) throw new Error(error.message);

        res.json({ success: true, message: 'Tags updated' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
