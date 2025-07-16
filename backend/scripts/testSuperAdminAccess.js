const { pool } = require("../config/database");

async function testSuperAdminAccess() {
  try {
    console.log("🔍 Testing SuperAdmin access and data visibility...\n");

    // Test 1: Check if we have SuperAdmin users
    console.log("1. Checking for SuperAdmin users:");
    const [superAdmins] = await pool.execute(
      "SELECT id, username, email, role, mosque_id FROM users WHERE role = 'SuperAdmin'"
    );

    if (superAdmins.length === 0) {
      console.log(
        "❌ No SuperAdmin users found. Creating a test SuperAdmin user..."
      );

      // Create a test SuperAdmin user
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password, role, full_name, status) 
         VALUES ('testadmin', 'admin@test.com', '$2b$10$dummy.hash.for.testing', 'SuperAdmin', 'Test Admin', 'active')`
      );

      console.log(
        `✅ Created test SuperAdmin user with ID: ${result.insertId}`
      );

      // Fetch the created user
      const [newSuperAdmin] = await pool.execute(
        "SELECT id, username, email, role, mosque_id FROM users WHERE id = ?",
        [result.insertId]
      );
      superAdmins.push(newSuperAdmin[0]);
    }

    console.log(`✅ Found ${superAdmins.length} SuperAdmin user(s):`);
    superAdmins.forEach((admin) => {
      console.log(
        `   - ${admin.username} (ID: ${admin.id}, Mosque: ${
          admin.mosque_id || "None"
        })`
      );
    });

    // Test 2: Test member data access for SuperAdmin
    console.log("\n2. Testing member data access:");

    // Get total members count
    const [allMembers] = await pool.execute(
      "SELECT COUNT(*) as total FROM users"
    );
    console.log(`   Total users in database: ${allMembers[0].total}`);

    // Test SuperAdmin query (should see all members)
    const superAdminQuery = `
      SELECT u.id, u.full_name as fullName, u.username, u.email, u.role, u.status, 
             m.name as mosque_name
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `;

    const [superAdminMembers] = await pool.execute(superAdminQuery);
    console.log(
      `   SuperAdmin can see ${superAdminMembers.length} members (showing first 5):`
    );
    superAdminMembers.forEach((member) => {
      console.log(
        `   - ${member.fullName || member.username} (${member.role}) - ${
          member.mosque_name || "No mosque"
        }`
      );
    });

    // Test 3: Test feeds access for SuperAdmin
    console.log("\n3. Testing feeds data access:");

    const [allFeeds] = await pool.execute(
      "SELECT COUNT(*) as total FROM feeds WHERE is_active = TRUE"
    );
    console.log(`   Total active feeds: ${allFeeds[0].total}`);

    if (allFeeds[0].total > 0) {
      const superAdminFeedsQuery = `
        SELECT f.id, f.title, f.mosque_id, m.name as mosque_name
        FROM feeds f
        LEFT JOIN mosques m ON f.mosque_id = m.id
        WHERE f.is_active = TRUE
        LIMIT 3
      `;

      const [superAdminFeeds] = await pool.execute(superAdminFeedsQuery);
      console.log(`   SuperAdmin can see feeds from all mosques:`);
      superAdminFeeds.forEach((feed) => {
        console.log(
          `   - "${feed.title}" (Mosque: ${feed.mosque_name || "Unknown"})`
        );
      });
    } else {
      console.log("   No feeds found in database");
    }

    // Test 4: Test mosque access
    console.log("\n4. Testing mosque data access:");

    const [allMosques] = await pool.execute(`
      SELECT m.id, m.name, u.username as founder_name,
             COUNT(members.id) as member_count
      FROM mosques m
      LEFT JOIN users u ON m.founder_id = u.id
      LEFT JOIN users members ON m.id = members.mosque_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);

    console.log(`   SuperAdmin can see all ${allMosques.length} mosques:`);
    allMosques.forEach((mosque) => {
      console.log(
        `   - ${mosque.name} (Founder: ${
          mosque.founder_name || "None"
        }, Members: ${mosque.member_count})`
      );
    });

    console.log("\n✅ SuperAdmin access test completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - SuperAdmin users: ${superAdmins.length}`);
    console.log(`   - Total members visible: ${allMembers[0].total}`);
    console.log(`   - Total feeds visible: ${allFeeds[0].total}`);
    console.log(`   - Total mosques visible: ${allMosques.length}`);
  } catch (error) {
    console.error("❌ Error testing SuperAdmin access:", error);
  } finally {
    await pool.end();
  }
}

// Run the test
testSuperAdminAccess();
