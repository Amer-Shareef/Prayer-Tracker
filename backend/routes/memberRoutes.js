const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticate, authorizeFounder } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all members for the authenticated user's mosque
router.get('/', memberController.getMembers);

// Create a new member (founders only)
router.post('/', authorizeFounder, memberController.createMember);

// Delete a member (founders only)
router.delete('/:id', authorizeFounder, memberController.deleteMember);

// Update member status (founders only)
router.patch('/:id/status', authorizeFounder, memberController.updateStatus);

module.exports = router;
