const express = require('express');
const router = express.Router();
const { getOptions, addOption, deleteOption } = require('../controllers/dropdown.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

router.use(authenticate);

router.get('/',       getOptions);
router.post('/',      requireAdmin, addOption);
router.delete('/:id', requireAdmin, deleteOption);

module.exports = router;
