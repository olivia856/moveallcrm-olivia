const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { createUserValidation, uuidParam } = require('../middleware/validate');

// User routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

router.get('/', usersController.getAll);
router.get('/:id', uuidParam, usersController.getById);
router.post('/', createUserValidation, usersController.create);
router.put('/:id', uuidParam, usersController.update);
router.delete('/:id', uuidParam, usersController.delete);

module.exports = router;
