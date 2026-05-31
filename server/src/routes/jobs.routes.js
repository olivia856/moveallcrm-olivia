const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, checkJobAccess } = require('../middleware/rbac');
const { createJobValidation, updateJobValidation, uuidParam } = require('../middleware/validate');

// All jobs routes require authentication
router.use(authenticate);

router.get('/', jobsController.getAll);
router.get('/:id', uuidParam, checkJobAccess, jobsController.getById);
router.post('/', createJobValidation, jobsController.create);
router.put('/:id', uuidParam, updateJobValidation, checkJobAccess, jobsController.update);
router.delete('/:id', uuidParam, requireAdmin, jobsController.delete);

module.exports = router;
