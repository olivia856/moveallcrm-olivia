const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/comments.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/leads/:leadId/comments',  ctrl.getByLead);
router.post('/leads/:leadId/comments', ctrl.create);
router.delete('/comments/:id',         ctrl.remove);

router.get('/jobs/:jobId/comments',    ctrl.getByJob);
router.post('/jobs/:jobId/comments',   ctrl.createJobComment);
router.delete('/job-comments/:id',     ctrl.removeJobComment);

module.exports = router;
