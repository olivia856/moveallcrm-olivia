const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, checkJobAccess } = require('../middleware/rbac');

// All jobs routes require authentication
router.use(authenticate);

router.get('/', jobsController.getAll);
router.get('/:id', checkJobAccess, jobsController.getById);
router.post('/', jobsController.create);
router.put('/:id', checkJobAccess, jobsController.update);
router.delete('/:id', requireAdmin, jobsController.delete);

module.exports = router;
