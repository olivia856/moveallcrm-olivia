const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leads.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { uuidParam } = require('../middleware/validate');

// All leads routes require authentication
router.use(authenticate);

router.get('/', leadsController.getAll);
router.get('/:id', uuidParam, leadsController.getById);
router.post('/', leadsController.create);
router.put('/:id', uuidParam, leadsController.update);
router.delete('/:id', uuidParam, requireAdmin, leadsController.delete);

module.exports = router;
