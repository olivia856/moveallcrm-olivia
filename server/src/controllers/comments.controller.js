const { supabase } = require('../config/database');

// GET /api/leads/:leadId/comments
async function getByLead(req, res, next) {
    try {
        const { leadId } = req.params;
        const { data, error } = await supabase
            .from('lead_comments')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

// POST /api/leads/:leadId/comments
async function create(req, res, next) {
    try {
        const { leadId } = req.params;
        const { comment, author_name, author_email } = req.body;
        if (!comment?.trim()) return res.status(400).json({ success: false, error: 'Comment is required' });
        const { data, error } = await supabase
            .from('lead_comments')
            .insert({ lead_id: leadId, comment: comment.trim(), author_name: author_name || 'Staff', author_email: author_email || null })
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

// DELETE /api/comments/:id
async function remove(req, res, next) {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('lead_comments').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { next(err); }
}

// GET /api/jobs/:jobId/comments
async function getByJob(req, res, next) {
    try {
        const { jobId } = req.params;
        const { data, error } = await supabase
            .from('job_comments')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

// POST /api/jobs/:jobId/comments
async function createJobComment(req, res, next) {
    try {
        const { jobId } = req.params;
        const { comment, author_name, author_role, file_url, file_name, file_type } = req.body;
        if (!comment?.trim() && !file_url) return res.status(400).json({ success: false, error: 'Comment or file is required' });
        const { data, error } = await supabase
            .from('job_comments')
            .insert({
                job_id: jobId,
                comment: comment?.trim() || '',
                author_name: author_name || 'Staff',
                author_role: author_role || 'staff',
                file_url: file_url || null,
                file_name: file_name || null,
                file_type: file_type || null
            })
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

// DELETE /api/job-comments/:id
async function removeJobComment(req, res, next) {
    try {
        const { id } = req.params;
        // Fetch the comment first so we can get the file_url
        const { data: comment, error: fetchErr } = await supabase
            .from('job_comments')
            .select('file_url')
            .eq('id', id)
            .single();
        if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

        const { error } = await supabase.from('job_comments').delete().eq('id', id);
        if (error) throw error;

        // Return file_url so client can delete from storage bucket too
        res.json({ success: true, file_url: comment?.file_url || null });
    } catch (err) { next(err); }
}

module.exports = { getByLead, create, remove, getByJob, createJobComment, removeJobComment };
