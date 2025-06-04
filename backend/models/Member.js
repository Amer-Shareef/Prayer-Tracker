const db = require('../config/db');

// Member model
const Member = {
  // Create a new member
  create: (memberData) => {
    return new Promise((resolve, reject) => {
      const { firstName, lastName, username, email, phone, address, status, password, mosqueId } = memberData;
      
      const query = `
        INSERT INTO members 
        (first_name, last_name, username, email, phone, address, status, password, mosque_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      db.query(
        query, 
        [firstName, lastName, username, email, phone, address, status, password, mosqueId],
        (err, result) => {
          if (err) {
            console.error('Error in Member.create:', err);
            return reject(err);
          }
          resolve({ id: result.insertId, ...memberData });
        }
      );
    });
  },
  
  // Find a member by username
  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM members WHERE username = ?', 
        [username],
        (err, results) => {
          if (err) return reject(err);
          if (results.length === 0) return resolve(null);
          
          // Convert snake_case to camelCase for frontend
          const member = {
            id: results[0].id,
            firstName: results[0].first_name,
            lastName: results[0].last_name,
            username: results[0].username,
            email: results[0].email,
            phone: results[0].phone,
            address: results[0].address,
            status: results[0].status,
            mosqueId: results[0].mosque_id,
            password: results[0].password,
            createdAt: results[0].created_at
          };
          
          resolve(member);
        }
      );
    });
  },
  
  // Get all members for a mosque
  getAllByMosque: (mosqueId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id, 
          first_name as firstName, 
          last_name as lastName, 
          username, 
          email, 
          phone, 
          address, 
          status, 
          created_at as joinDate
        FROM members
        WHERE mosque_id = ?
      `;
      
      db.query(query, [mosqueId], (err, results) => {
        if (err) return reject(err);
        
        // Format the results with additional fields
        const members = results.map(member => ({
          ...member,
          name: `${member.firstName} ${member.lastName}`,
          prayerAttendance: 0, // Default value, will be updated with real data later
          lastPrayer: 'N/A' // Default value, will be updated with real data later
        }));
        
        resolve(members);
      });
    });
  },
  
  // Delete a member
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM members WHERE id = ?', [id], (err, result) => {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  },
  
  // Update member status
  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE members SET status = ? WHERE id = ?', 
        [status, id], 
        (err, result) => {
          if (err) return reject(err);
          resolve({ success: true });
        }
      );
    });
  }
};

module.exports = Member;
