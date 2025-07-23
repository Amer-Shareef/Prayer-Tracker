const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// TEST ROUTE - GET /api/areas/test - Get all areas without authentication (for testing)
router.get("/areas/test", async (req, res) => {
  try {
    console.log("🧪 TEST: Fetching areas without authentication");

    const [areas] = await pool.execute(
      "SELECT area_id, area_name, address, coordinates, description FROM areas ORDER BY area_name ASC"
    );

    console.log(`✅ TEST: Found ${areas.length} areas`);

    res.json({
      success: true,
      message: "Test endpoint - areas fetched successfully",
      data: areas,
      total: areas.length,
    });
  } catch (error) {
    console.error("❌ TEST: Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
});

// GET /api/areas - Get all areas (for dropdown in member creation)
router.get("/areas", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Fetching areas for dropdown");

    const [areas] = await pool.execute(
      "SELECT area_id, area_name, address, coordinates, description FROM areas ORDER BY area_name ASC"
    );

    console.log(`✅ Found ${areas.length} active areas`);

    res.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("❌ Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
});

// POST /api/areas - Create new area (SuperAdmin only)
router.post(
  "/areas",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { area_name, address, coordinates, description } = req.body;

      console.log("➕ Creating new area:", {
        area_name,
        address,
        coordinates,
        description,
      });

      // Validation
      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Area name is required",
        });
      }

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area with same name already exists
      const [existing] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_name = ?",
        [area_name]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Area with this name already exists",
        });
      }

      // Insert new area
      const [result] = await pool.execute(
        "INSERT INTO areas (area_name, address, coordinates, description) VALUES (?, ?, ?, ?)",
        [area_name, address, coordinates || null, description || null]
      );

      // Fetch the created area
      const [newArea] = await pool.execute(
        "SELECT area_id, area_name, address, coordinates, description FROM areas WHERE area_id = ?",
        [result.insertId]
      );

      console.log(`✅ Area created successfully with ID: ${result.insertId}`);

      res.status(201).json({
        success: true,
        message: "Area created successfully",
        data: newArea[0],
      });
    } catch (error) {
      console.error("❌ Error creating area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create area",
        error: error.message,
      });
    }
  }
);

// PUT /api/areas/:id - Update existing area (SuperAdmin only)
router.put(
  "/areas/:id",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { area_name, address, coordinates, description } = req.body;

      console.log(`✏️ Updating area ID: ${id}`, {
        area_name,
        address,
        coordinates,
        description,
      });

      // Validation
      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Area name is required",
        });
      }

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area exists
      const [existing] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if another area with same name already exists (excluding current area)
      const [duplicateCheck] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_name = ? AND area_id != ?",
        [area_name, id]
      );

      if (duplicateCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Area with this name already exists",
        });
      }

      // Update area
      await pool.execute(
        "UPDATE areas SET area_name = ?, address = ?, coordinates = ?, description = ? WHERE area_id = ?",
        [area_name, address, coordinates || null, description || null, id]
      );

      // Fetch the updated area
      const [updatedArea] = await pool.execute(
        "SELECT area_id, area_name, address, coordinates, description FROM areas WHERE area_id = ?",
        [id]
      );

      console.log(`✅ Area updated successfully: ID ${id}`);

      res.json({
        success: true,
        message: "Area updated successfully",
        data: updatedArea[0],
      });
    } catch (error) {
      console.error("❌ Error updating area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update area",
        error: error.message,
      });
    }
  }
);

// DELETE /api/areas/:id - Delete area (SuperAdmin only)
router.delete(
  "/areas/:id",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`🗑️ Deleting area ID: ${id}`);

      // Check if area exists
      const [existing] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if any members are assigned to this area
      const [members] = await pool.execute(
        "SELECT COUNT(*) as count FROM members WHERE area_id = ?",
        [id]
      );

      if (members[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete area. ${members[0].count} member(s) are assigned to this area.`,
        });
      }

      // Delete the area
      await pool.execute("DELETE FROM areas WHERE area_id = ?", [id]);

      console.log(
        `✅ Area deleted successfully: ID ${id} (${
          existing[0].area_name || "N/A"
        })`
      );

      res.json({
        success: true,
        message: "Area deleted successfully",
        data: { area_id: parseInt(id) },
      });
    } catch (error) {
      console.error("❌ Error deleting area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete area",
        error: error.message,
      });
    }
  }
);

module.exports = router;
