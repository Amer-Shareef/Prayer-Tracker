const Member = require('../models/Member');
const bcrypt = require('bcrypt');

// Controller for member-related routes
const memberController = {
  // Create a new member
  createMember: async (req, res) => {
    try {
      console.log('Creating member with data:', req.body);
      
      // Extract required fields
      const { firstName, lastName, username, email, phone, address, status } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      // Generate username if not provided
      const finalUsername = username || email.split('@')[0];
      
      // Set default password: password123
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Get mosque ID from the authenticated founder
      const mosqueId = req.user.mosqueId || 1;
      
      // Create member data object
      const memberData = {
        firstName,
        lastName,
        username: finalUsername,
        email,
        phone: phone || null,
        address: address || null,
        status: status || 'active',
        password: hashedPassword,
        mosqueId
      };
      
      console.log('Final member data:', memberData);
      
      // Create the member in the database
      const result = await Member.create(memberData);
      
      res.status(201).json({
        success: true,
        message: 'Member created successfully',
        memberId: result.id
      });
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).json({ message: 'Error creating member', error: error.message });
    }
  },

  // Get all members for the authenticated user's mosque
  getMembers: async (req, res) => {
    try {
      // Get the mosque ID from the authenticated user
      const mosqueId = req.user?.mosqueId || 1;
      
      const members = await Member.getAllByMosque(mosqueId);
      res.status(200).json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ message: 'Error fetching members', error: error.message });
    }
  },

  // Delete a member
  deleteMember: async (req, res) => {
    try {
      const { id } = req.params;
      await Member.delete(id);
      res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ message: 'Error deleting member', error: error.message });
    }
  },
  
  // Update member status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      await Member.updateStatus(id, status);
      res.status(200).json({ message: 'Member status updated successfully' });
    } catch (error) {
      console.error('Error updating member status:', error);
      res.status(500).json({ message: 'Error updating member status', error: error.message });
    }
  }
};

module.exports = memberController;
