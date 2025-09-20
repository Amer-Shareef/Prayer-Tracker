const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get all members - returns ALL members across all areas (SuperAdmin view)
// This route must be defined BEFORE the general /members route
router.get(
  "/members/all",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      console.log("📋 Fetching ALL members across all areas");

      // Check if pagination is requested
      const pageParam = req.query.page;
      const shouldPaginate = pageParam !== undefined;

      // Base query without WHERE restrictions - gets ALL members
      const baseQuery = `
        SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
               u.joined_date, u.last_login, u.created_at, u.date_of_birth as dateOfBirth, 
               u.address, u.area_id, u.sub_areas_id, u.mobility, u.living_on_rent as onRent, 
               u.zakath_eligible as zakathEligible, u.differently_abled as differentlyAbled, 
               u.muallafathil_quloob as MuallafathilQuloob, 
               u.place_of_birth as placeOfBirth, u.nic_no as nicNo, u.occupation, 
               u.workplace_address as workplaceAddress, u.family_status as familyStatus, 
               u.widow_assistance as widowAssistance,
               a.area_name as area, a.address as area_address,
               sa.address as subarea,
               CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
               COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as prayed_count,
               CASE 
                 WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN 200
                 ELSE (DATEDIFF(CURDATE(), u.joined_date) + 1) * 5
               END as total_prayers,
               CASE 
                 WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN 
                   ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / 200) * 100, 2)
                 ELSE 
                   CASE 
                     WHEN (DATEDIFF(CURDATE(), u.joined_date) + 1) * 5 > 0 THEN 
                       ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / ((DATEDIFF(CURDATE(), u.joined_date) + 1) * 5)) * 100, 2)
                     ELSE 0 
                   END
               END as attendance_rate
        FROM users u
        LEFT JOIN areas a ON u.area_id = a.area_id
        LEFT JOIN sub_areas sa ON u.sub_areas_id = sa.id
        LEFT JOIN prayers p ON u.id = p.user_id 
          AND p.prayer_date >= CASE 
            WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN DATE_SUB(CURDATE(), INTERVAL 39 DAY)
            ELSE u.joined_date
          END
          AND p.prayer_date <= CURDATE()
        GROUP BY u.id 
        ORDER BY u.created_at DESC
      `;

      const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u`;

      if (shouldPaginate) {
        // Apply pagination when page parameter is present
        const page = parseInt(pageParam) || 1;
        const limit = parseInt(req.query.limit) || 5; // PRODUCTION CONFIGURABLE: Default limit for /all endpoint
        const offset = (page - 1) * limit;

        const paginatedQuery = baseQuery + ` LIMIT ${limit} OFFSET ${offset}`;

        const [members] = await pool.execute(paginatedQuery);
        const [countResult] = await pool.execute(countQuery);

        const totalMembers = countResult[0].total;
        const totalPages = Math.ceil(totalMembers / limit);

        console.log(`✅ Fetched ${members.length} of ${totalMembers} members (page ${page}/${totalPages})`);

        res.json({
          success: true,
          data: members,
          pagination: {
            total: totalMembers,
            page,
            limit,
            totalPages,
          },
        });
      } else {
        // Return ALL members without any limit
        const [members] = await pool.execute(baseQuery);

        console.log(`✅ Fetched ALL ${members.length} members (no pagination)`);

        res.json({
          success: true,
          data: members,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching all members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch all members",
        error: error.message,
      });
    }
  }
);

// Get area-specific members
router.get(
  "/members",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;
      console.log(`📋 Fetching area-specific members for user role: ${user.role}`);

      // Check if pagination is requested
      const pageParam = req.query.page;
      const shouldPaginate = pageParam !== undefined;

      // Base query for area-specific members
      let baseQuery = `
        SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
               u.joined_date, u.last_login, u.created_at, u.date_of_birth as dateOfBirth, 
               u.address, u.area_id, u.sub_areas_id, u.mobility, u.living_on_rent as onRent, 
               u.zakath_eligible as zakathEligible, u.differently_abled as differentlyAbled, 
               u.muallafathil_quloob as MuallafathilQuloob, 
               u.place_of_birth as placeOfBirth, u.nic_no as nicNo, u.occupation, 
               u.workplace_address as workplaceAddress, u.family_status as familyStatus, 
               u.widow_assistance as widowAssistance,
               a.area_name as area, a.address as area_address,
               sa.address as subarea,
               CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
               COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as prayed_count,
               CASE 
                 WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN 200
                 ELSE (DATEDIFF(CURDATE(), u.joined_date) + 1) * 5
               END as total_prayers,
               CASE 
                 WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN 
                   ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / 200) * 100, 2)
                 ELSE 
                   CASE 
                     WHEN (DATEDIFF(CURDATE(), u.joined_date) + 1) * 5 > 0 THEN 
                       ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / ((DATEDIFF(CURDATE(), u.joined_date) + 1) * 5)) * 100, 2)
                     ELSE 0 
                   END
               END as attendance_rate
        FROM users u
        LEFT JOIN areas a ON u.area_id = a.area_id
        LEFT JOIN sub_areas sa ON u.sub_areas_id = sa.id
        LEFT JOIN prayers p ON u.id = p.user_id 
          AND p.prayer_date >= CASE 
            WHEN DATEDIFF(CURDATE(), u.joined_date) >= 39 THEN DATE_SUB(CURDATE(), INTERVAL 39 DAY)
            ELSE u.joined_date
          END
          AND p.prayer_date <= CURDATE()
      `;

      let countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u`;

      // Add area restriction based on user role
      if (user.role === "Founder" || user.role === "WCM" || user.role === "SuperAdmin") {
        baseQuery += ` WHERE u.area_id = (SELECT area_id FROM users WHERE id = ${user.id})`;
        countQuery += ` WHERE u.area_id = (SELECT area_id FROM users WHERE id = ${user.id})`;
      } else if (user.role === "Member") {
        baseQuery += ` WHERE u.id = ${user.id}`;
        countQuery += ` WHERE u.id = ${user.id}`;
      }

      baseQuery += ` GROUP BY u.id ORDER BY u.created_at DESC`;

      if (shouldPaginate) {
        // Apply pagination when page parameter is present
        const page = parseInt(pageParam) || 1;
        const limit = parseInt(req.query.limit) || 5; // PRODUCTION CONFIGURABLE: Default limit for area-specific endpoint
        const offset = (page - 1) * limit;

        const paginatedQuery = baseQuery + ` LIMIT ${limit} OFFSET ${offset}`;

        const [members] = await pool.execute(paginatedQuery);
        const [countResult] = await pool.execute(countQuery);

        const totalMembers = countResult[0].total;
        const totalPages = Math.ceil(totalMembers / limit);

        console.log(`✅ Fetched ${members.length} of ${totalMembers} area members (page ${page}/${totalPages})`);

        res.json({
          success: true,
          data: members,
          pagination: {
            total: totalMembers,
            page,
            limit,
            totalPages,
          },
        });
      } else {
        // Return ALL area members without any limit
        const [members] = await pool.execute(baseQuery);

        console.log(`✅ Fetched ALL ${members.length} area members (no pagination)`);

        res.json({
          success: true,
          data: members,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching area members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch members",
        error: error.message,
      });
    }
  }
);

// Add new member - ENHANCED for comprehensive data
router.post(
  "/members",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const {
        fullName,
        username,
        email,
        phone,
        password,
        confirmPassword,
        role = "Member",
        dateOfBirth,
        address,
        area,
        area_id,
        sub_areas_id,
        mobility,
        onRent = false,
        zakathEligible = false,
        differentlyAbled = false,
        MuallafathilQuloob = false,
        placeOfBirth,
        nicNo,
        occupation,
        workplaceAddress,
        familyStatus,
        widowAssistance = false,
      } = req.body;

      console.log("📝 Received member data:", {
        fullName,
        username,
        email,
        phone,
        role,
        dateOfBirth,
        address,
        area,
        mobility,
        onRent,
        zakathEligible,
        differentlyAbled,
        MuallafathilQuloob,
      });

      const { user } = req;

      // Enhanced validation
      if (!fullName || !username || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message:
            "Full name, username, email, phone number, and password are required",
        });
      }

      // Remove confirmPassword validation since it's frontend-only
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      // Phone number validation - must be in format +94XXXXXXXXX (exactly 9 digits after +94)
      const phoneRegex = /^\+94\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must be in format +94XXXXXXXXX (exactly 9 digits after +94)",
        });
      }

      // Check if username, email, or phone already exists
      const [existingUsers] = await pool.execute(
        "SELECT id, username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?",
        [username, email, phone]
      );

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        if (existing.username === username) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }
        if (existing.email === email) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
        if (existing.phone === phone) {
          return res.status(400).json({
            success: false,
            message: "Phone number already exists",
          });
        }
      }

      // Get area ID for new member - area_id is now mandatory
      let areaId = null;
      
      // Validate that area_id is provided
      if (!req.body.area_id) {
        return res.status(400).json({
          success: false,
          message: "Area selection is required. Please select an area."
        });
      }
      
      areaId = req.body.area_id;
      
      // Verify the area exists
      const [areaExists] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_id = ?",
        [areaId]
      );
      
      if (areaExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid area selected. Please select a valid area."
        });
      }

      // For Founders and WCMs, verify they can only add members to their own area
      if (user.role === "Founder" || user.role === "WCM") {
        const [userData] = await pool.execute(
          "SELECT area_id FROM users WHERE id = ?",
          [user.id]
        );
        
        if (userData[0]?.area_id && userData[0].area_id !== areaId) {
          return res.status(403).json({
            success: false,
            message: "You can only add members to your assigned area."
          });
        }
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert comprehensive member data with area_id (mandatory) and sub_areas_id (optional)
      const [result] = await pool.execute(
        `INSERT INTO users (
        full_name, username, email, phone, password, role, area_id, sub_areas_id,
        date_of_birth, address, mobility, living_on_rent, 
        zakath_eligible, differently_abled, muallafathil_quloob,
        place_of_birth, nic_no, occupation, workplace_address,
        family_status, widow_assistance, status, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
        [
          fullName,
          username,
          email,
          phone || null,
          hashedPassword,
          role,
          areaId,
          sub_areas_id || null,
          dateOfBirth || null,
          address || null,
          mobility || null,
          onRent,
          zakathEligible,
          differentlyAbled,
          MuallafathilQuloob,
          placeOfBirth || null,
          nicNo || null,
          occupation || null,
          workplaceAddress || null,
          familyStatus || null,
          widowAssistance || false,
        ]
      );

      console.log("✅ Member inserted with ID:", result.insertId);

      // Fetch the created member with area info and proper field mapping
      const [newMember] = await pool.execute(
        `SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
              u.joined_date, u.created_at, u.date_of_birth as dateOfBirth, u.address, u.area_id,
              u.mobility, u.living_on_rent as onRent, u.zakath_eligible as zakathEligible, 
              u.differently_abled as differentlyAbled, u.muallafathil_quloob as MuallafathilQuloob,
              u.place_of_birth as placeOfBirth, u.nic_no as nicNo, u.occupation, 
              u.workplace_address as workplaceAddress, u.family_status as familyStatus, 
              u.widow_assistance as widowAssistance,
              a.area_name, a.address as area_address
       FROM users u
       LEFT JOIN areas a ON u.area_id = a.area_id
       WHERE u.id = ?`,
        [result.insertId]
      );

      console.log("✅ Member created successfully:", newMember[0]);

      res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: newMember[0],
      });
    } catch (error) {
      console.error("❌ Error adding member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add member",
        error: error.message,
      });
    }
  }
);

// Update member
router.put(
  "/members/:id",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        username, 
        email, 
        phone, 
        role, 
        status,
        placeOfBirth,
        nicNo,
        occupation,
        workplaceAddress,
        familyStatus,
        widowAssistance
      } = req.body;
      const { user } = req;

      // Check if member exists and access permissions
      let checkQuery = "SELECT * FROM users WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder" || user.role === "WCM") {
        // Founders and WCMs can only edit members from their area
        checkQuery +=
          " AND area_id = (SELECT area_id FROM users WHERE id = ?)";
        checkParams.push(user.id);
      }
      // SuperAdmin can edit any member (no additional WHERE clause)

      const [existingMember] = await pool.execute(checkQuery, checkParams);

      if (existingMember.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found or access denied",
        });
      }

      // Build dynamic UPDATE query based on provided fields
      const updateFields = [];
      const updateValues = [];

      // Map of frontend field names to database column names
      const fieldMapping = {
        username: 'username',
        email: 'email', 
        phone: 'phone',
        role: 'role',
        status: 'status',
        placeOfBirth: 'place_of_birth',
        nicNo: 'nic_no',
        occupation: 'occupation',
        workplaceAddress: 'workplace_address',
        familyStatus: 'family_status',
        widowAssistance: 'widow_assistance'
      };

      // Only add fields that are provided in the request
      Object.keys(fieldMapping).forEach(frontendField => {
        if (req.body[frontendField] !== undefined) {
          const dbField = fieldMapping[frontendField];
          updateFields.push(`${dbField} = ?`);
          
          // Handle special cases for data conversion
          if (frontendField === 'widowAssistance') {
            updateValues.push(req.body[frontendField] ? 1 : 0);
          } else {
            updateValues.push(req.body[frontendField]);
          }
        }
      });

      // Always update the timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      if (updateFields.length === 1) { // Only timestamp was added
        return res.status(400).json({
          success: false,
          message: "No valid fields provided for update"
        });
      }

      // Execute the dynamic UPDATE query
      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      updateValues.push(id);
      
      const [result] = await pool.execute(updateQuery, updateValues);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      // Fetch updated member
      const [updatedMember] = await pool.execute(
        `SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.joined_date, u.created_at,
                u.place_of_birth as placeOfBirth,
                u.nic_no as nicNo,
                u.occupation,
                u.workplace_address as workplaceAddress,
                u.family_status as familyStatus,
                u.widow_assistance as widowAssistance,
                a.area_name, a.address as area_address
         FROM users u
         LEFT JOIN areas a ON u.area_id = a.area_id
         WHERE u.id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: "Member updated successfully",
        data: updatedMember[0],
      });
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update member",
        error: error.message,
      });
    }
  }
);

// Delete member
router.delete(
  "/members/:id",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      // Check if member exists and access permissions
      let checkQuery = "SELECT * FROM users WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder" || user.role === "WCM") {
        // Founders and WCMs can only delete members from their area
        checkQuery +=
          " AND area_id = (SELECT area_id FROM users WHERE id = ?)";
        checkParams.push(user.id);
      }
      // SuperAdmin can delete any member (no additional WHERE clause)

      const [existingMember] = await pool.execute(checkQuery, checkParams);

      if (existingMember.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found or access denied",
        });
      }

      // Delete member
      const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      res.json({
        success: true,
        message: "Member deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete member",
        error: error.message,
      });
    }
  }
);

// Get founders from the same mosque (for mentor selection)
router.get(
  "/founders",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;

      let query = `
      SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
             u.joined_date, u.last_login, u.created_at, u.area_id,
             a.area_name, a.address as area_address
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.area_id
      WHERE u.role = 'Founder' AND u.status = 'active'
    `;
      let queryParams = [];

      // If founder, only show founders from their area (excluding themselves)
      if (user.role === "Founder" || user.role === "WCM") {
        query += ` AND u.area_id = (SELECT area_id FROM users WHERE id = ?) AND u.id != ?`;
        queryParams.push(user.id, user.id);
      }
      // SuperAdmin can see all founders (no additional WHERE clause needed)

      query += ` ORDER BY u.full_name, u.username`;

      const [founders] = await pool.execute(query, queryParams);

      console.log(`✅ Found ${founders.length} founders for mentor selection`);
      res.json({
        success: true,
        data: founders,
      });
    } catch (error) {
      console.error("❌ Error fetching founders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch founders",
        details: error.message,
      });
    }
  }
);

// Get prayer statistics for a specific member
router.get(
  "/members/:id/prayer-stats",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const { user } = req;

      console.log(`📊 Fetching prayer statistics for member ${id} from ${startDate} to ${endDate}`);

      // Check if member exists and access permissions
      let checkQuery = "SELECT * FROM users WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder" || user.role === "WCM") {
        // Founders and WCMs can only view stats for members from their area
        checkQuery += " AND area_id = (SELECT area_id FROM users WHERE id = ?)";
        checkParams.push(user.id);
      }
      // SuperAdmin can view any member's stats (no additional WHERE clause)

      const [existingMember] = await pool.execute(checkQuery, checkParams);

      if (existingMember.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found or access denied",
        });
      }

      // Build prayer query with date filters
      let prayerQuery = `
        SELECT 
          prayer_date,
          fajr,
          dhuhr,
          asr,
          maghrib,
          isha,
          daily_completion_rate,
          notes,
          zikr_count,
          zikr_count_2,
          quran_minutes
        FROM prayers 
        WHERE user_id = ?
      `;
      let prayerParams = [id];

      // Add date filters if provided
      if (startDate) {
        prayerQuery += " AND prayer_date >= ?";
        prayerParams.push(startDate);
      }
      if (endDate) {
        prayerQuery += " AND prayer_date <= ?";
        prayerParams.push(endDate);
      }

      prayerQuery += " ORDER BY prayer_date ASC";

      const [prayerData] = await pool.execute(prayerQuery, prayerParams);

      console.log(`✅ Found ${prayerData.length} prayer records for member ${id}`);

      res.json({
        success: true,
        data: prayerData,
        member: {
          id: existingMember[0].id,
          fullName: existingMember[0].full_name,
          username: existingMember[0].username
        },
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      });
    } catch (error) {
      console.error("❌ Error fetching member prayer statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch prayer statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
