const { supabase } = require('../config/database');

/**
 * Log an activity against any entity.
 */
async function log({ entityType, entityId, userId, action, details }) {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .insert([{
                entity_type: entityType,
                entity_id: entityId || null,
                user_id: userId || null,
                action: action,
                details: details || null
            }])
            .select();
            
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Activity log error:', error.message);
        return null;
    }
}

/**
 * Get recent activity logs.
 */
async function getRecent({ entityType, entityId, limit = 20, offset = 0 } = {}) {
    let queryBuilder = supabase
        .from('activity_logs')
        .select('*, users(name)')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (entityType) { queryBuilder = queryBuilder.eq('entity_type', entityType); }
    if (entityId) { queryBuilder = queryBuilder.eq('entity_id', entityId); }

    const { data, error } = await queryBuilder;
    if (error) throw error;

    return data.map(row => ({
        ...row,
        user_name: row.users ? row.users.name : null
    }));
}

module.exports = { log, getRecent };
