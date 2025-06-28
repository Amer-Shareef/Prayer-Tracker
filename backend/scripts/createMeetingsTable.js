const { pool } = require("../config/database");

// Add error handling and better feedback
async function createMeetingsTable() {
  console.log("🛠️  Creating meetings and counselling tables...");

  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection established");

    // Check if the tables already exist
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('meetings', 'counselling_sessions', 'meeting_history')
    `);

    const existingTables = tables.map((t) => t.TABLE_NAME);
    console.log("📋 Existing tables:", existingTables);

    // Create meetings table for general meetings if not exists
    if (!existingTables.includes("meetings")) {
      await connection.query(`
        CREATE TABLE meetings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          location VARCHAR(255),
          meeting_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          organizer_id INT,
          mosque_id INT NOT NULL,
          meeting_type ENUM('general', 'counselling', 'committee') DEFAULT 'general',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
          meeting_link VARCHAR(512),
          is_virtual BOOLEAN DEFAULT FALSE,
          
          INDEX idx_organizer_id (organizer_id),
          INDEX idx_mosque_id (mosque_id),
          INDEX idx_meeting_date (meeting_date),
          INDEX idx_meeting_type (meeting_type),
          INDEX idx_status (status),
          
          FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log("✅ Created meetings table");
    } else {
      console.log("✅ Meetings table already exists");
    }

    // Create counselling_sessions table for individual member counselling
    if (!existingTables.includes("counselling_sessions")) {
      await connection.query(`
        CREATE TABLE counselling_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          member_id INT NOT NULL,
          counsellor_id INT NOT NULL,
          mosque_id INT NOT NULL,
          
          -- Member details at time of session
          member_name VARCHAR(100) NOT NULL,
          member_phone VARCHAR(20),
          member_email VARCHAR(100),
          attendance_rate DECIMAL(5,2),
          total_prayers INT DEFAULT 0,
          prayed_count INT DEFAULT 0,
          
          -- Session scheduling
          scheduled_date DATE NOT NULL,
          scheduled_time TIME NOT NULL,
          actual_start_time TIMESTAMP NULL,
          actual_end_time TIMESTAMP NULL,
          
          -- Session details
          priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
          status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
          session_type ENUM('phone_call', 'in_person', 'video_call') DEFAULT 'phone_call',
          
          -- Counselling notes and outcomes
          pre_session_notes TEXT,
          session_notes TEXT,
          issues_identified TEXT,
          action_items TEXT,
          follow_up_required BOOLEAN DEFAULT FALSE,
          follow_up_date DATE NULL,
          
          -- Session outcomes
          member_response ENUM('positive', 'neutral', 'negative', 'no_response') NULL,
          commitment_made TEXT,
          improvement_plan TEXT,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_member_id (member_id),
          INDEX idx_counsellor_id (counsellor_id),
          INDEX idx_mosque_id (mosque_id),
          INDEX idx_scheduled_date (scheduled_date),
          INDEX idx_status (status),
          INDEX idx_priority (priority),
          INDEX idx_attendance_rate (attendance_rate),
          
          FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (counsellor_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log("✅ Created counselling_sessions table");
    } else {
      console.log("✅ Counselling_sessions table already exists");
    }

    // Create meeting_history table for tracking all changes
    if (!existingTables.includes("meeting_history")) {
      await connection.query(`
        CREATE TABLE meeting_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id INT NOT NULL,
          changed_by INT NOT NULL,
          change_type ENUM('created', 'scheduled', 'started', 'completed', 'cancelled', 'rescheduled', 'notes_updated') NOT NULL,
          old_values JSON NULL,
          new_values JSON NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_session_id (session_id),
          INDEX idx_changed_by (changed_by),
          INDEX idx_change_type (change_type),
          INDEX idx_created_at (created_at),
          
          FOREIGN KEY (session_id) REFERENCES counselling_sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log("✅ Created meeting_history table");
    } else {
      console.log("✅ Meeting_history table already exists");
    }

    connection.release();
    console.log("✅ All meetings tables are ready");

    // Test query to verify tables work
    const testConnection = await pool.getConnection();
    await testConnection.query("SELECT COUNT(*) FROM counselling_sessions");
    testConnection.release();
    console.log("✅ Tables are functional");
  } catch (error) {
    console.error("❌ Error creating meetings tables:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Execute the function
createMeetingsTable()
  .then(() => {
    console.log("📋 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
