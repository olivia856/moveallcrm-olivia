const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/logs - List all activity logs (paginated)
router.get('/', logsController.getAll);

module.exports = router;
