const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/comments.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/leads/:leadId/comments',  ctrl.getByLead);
router.post('/leads/:leadId/comments', ctrl.create);
router.put('/comments/:id',            ctrl.update);
router.delete('/comments/:id',         ctrl.remove);

module.exports = router;
