const cron = require("node-cron");
const { pool } = require("../config/database");

class WeeklyMeetingScheduler {
  constructor() {
    this.isRunning = false;
    this.task = null;
  }

  // Create next week's meeting for a specific area
  async createNextWeekMeeting(areaId, createdBy = 1) {
    try {
      // Calculate next week's Sunday
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday
      const daysUntilNextSunday = currentDay === 0 ? 7 : 7 - currentDay;

      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilNextSunday);
      const weekOf = nextSunday.toISOString().split("T")[0];
      const meetingDate = weekOf; // Meeting on Sunday

      // Check if meeting already exists for this area and week
      const [existing] = await pool.execute(
        "SELECT id FROM weekly_meetings WHERE area_id = ? AND week_of = ?",
        [areaId, weekOf]
      );

      if (existing.length > 0) {
        console.log(
          `📅 Meeting already exists for area ${areaId}, week ${weekOf}`
        );
        return { success: true, exists: true, meetingId: existing[0].id };
      }

      // Get area details for default location
      const [areaInfo] = await pool.execute(
        "SELECT area_name FROM areas WHERE area_id = ?",
        [areaId]
      );

      const defaultLocation =
        areaInfo.length > 0
          ? `${areaInfo[0].area_name} Mosque`
          : "Community Center";

      // Create the meeting
      const [result] = await pool.execute(
        `INSERT INTO weekly_meetings (
          area_id, week_of, meeting_date, meeting_time, location, agenda, 
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())`,
        [
          areaId,
          weekOf,
          meetingDate,
          "10:00:00", // Default meeting time
          defaultLocation,
          "Weekly committee meeting and area updates",
          createdBy,
        ]
      );

      console.log(
        `✅ Created meeting for area ${areaId}, week ${weekOf}, ID: ${result.insertId}`
      );
      return { success: true, exists: false, meetingId: result.insertId };
    } catch (error) {
      console.error(`❌ Error creating meeting for area ${areaId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Create recurring meetings for an area starting from a specific date/time
  async createRecurringMeetings(
    areaId,
    startDate,
    meetingTime = "10:00:00",
    createdBy = 1,
    weeksAhead = 4
  ) {
    try {
      const results = [];
      const startDateObj = new Date(startDate);

      console.log(
        `🔄 Creating recurring meetings for area ${areaId} starting from ${startDate} for ${weeksAhead} weeks`
      );

      for (let i = 0; i < weeksAhead; i++) {
        // Calculate the meeting date for this week
        const meetingDate = new Date(startDateObj);
        meetingDate.setDate(startDateObj.getDate() + i * 7); // Add weeks
        const weekOf = meetingDate.toISOString().split("T")[0];

        // Check if meeting already exists
        const [existing] = await pool.execute(
          "SELECT id FROM weekly_meetings WHERE area_id = ? AND week_of = ?",
          [areaId, weekOf]
        );

        if (existing.length > 0) {
          console.log(
            `📅 Meeting already exists for area ${areaId}, week ${weekOf}`
          );
          results.push({
            success: true,
            exists: true,
            meetingId: existing[0].id,
            weekOf,
          });
          continue;
        }

        // Get area details for location
        const [areaInfo] = await pool.execute(
          "SELECT area_name FROM areas WHERE area_id = ?",
          [areaId]
        );

        const location =
          areaInfo.length > 0
            ? `${areaInfo[0].area_name} Mosque`
            : "Community Center";

        // Create the meeting
        const [result] = await pool.execute(
          `INSERT INTO weekly_meetings (
            area_id, week_of, meeting_date, meeting_time, location, agenda,
            status, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())`,
          [
            areaId,
            weekOf,
            weekOf,
            meetingTime,
            location,
            "Weekly committee meeting and area updates",
            createdBy,
          ]
        );

        console.log(
          `✅ Created recurring meeting for area ${areaId}, week ${weekOf}, ID: ${result.insertId}`
        );
        results.push({
          success: true,
          exists: false,
          meetingId: result.insertId,
          weekOf,
        });

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return results;
    } catch (error) {
      console.error(
        `❌ Error creating recurring meetings for area ${areaId}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Optional: Create attendance records for committee members
  async createAttendanceForMeeting(meetingId, areaId) {
    try {
      // Get all committee members for this area
      const [members] = await pool.execute(
        `SELECT id FROM users 
         WHERE role IN ('Founder', 'SuperAdmin') 
         AND status = 'active'
         AND (area_id = ? OR role = 'SuperAdmin')`,
        [areaId]
      );

      if (members.length === 0) {
        console.log(`📝 No committee members found for area ${areaId}`);
        return { success: true, attendanceCreated: 0 };
      }

      // Create attendance records
      const attendanceValues = members
        .map((member) => `(${meetingId}, ${member.id}, 'pending', NOW())`)
        .join(", ");

      await pool.execute(
        `INSERT INTO weekly_meeting_attendance (weekly_meeting_id, user_id, status, created_at)
         VALUES ${attendanceValues}`
      );

      console.log(
        `✅ Created attendance for ${members.length} members, meeting ${meetingId}`
      );
      return { success: true, attendanceCreated: members.length };
    } catch (error) {
      console.error(
        `❌ Error creating attendance for meeting ${meetingId}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Generate meetings for all active areas (maintains 12 weeks of future meetings)
  async generateNextWeekMeetings() {
    if (this.isRunning) {
      console.log("⏳ Meeting generation already in progress...");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting weekly meeting generation...");

    try {
      // Get all areas
      const [areas] = await pool.execute(
        "SELECT area_id, area_name FROM areas ORDER BY area_name ASC"
      );

      console.log(`📍 Found ${areas.length} areas`);

      let successCount = 0;
      let existingCount = 0;
      let errorCount = 0;

      for (const area of areas) {
        try {
          // Check how many future meetings already exist for this area
          const today = new Date();
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + 90); // 90 days = ~12 weeks into future

          const [existingMeetings] = await pool.execute(
            "SELECT COUNT(*) as count FROM weekly_meetings WHERE area_id = ? AND meeting_date >= ? AND meeting_date <= ?",
            [
              area.area_id,
              today.toISOString().split("T")[0],
              futureDate.toISOString().split("T")[0],
            ]
          );

          const futureMeetingsCount = existingMeetings[0].count;
          console.log(
            `📅 Area ${area.area_id} has ${futureMeetingsCount} future meetings scheduled`
          );

          // If we have fewer than 8 weeks of meetings, create more
          if (futureMeetingsCount < 8) {
            const weeksToCreate = 12 - futureMeetingsCount; // Maintain 12 weeks buffer
            console.log(
              `🔄 Creating ${weeksToCreate} additional weeks of meetings for area ${area.area_id}`
            );

            // Find the latest meeting date for this area to continue from there
            const [latestMeeting] = await pool.execute(
              "SELECT meeting_date FROM weekly_meetings WHERE area_id = ? ORDER BY meeting_date DESC LIMIT 1",
              [area.area_id]
            );

            let startDate;
            if (latestMeeting.length > 0) {
              // Continue from the week after the latest meeting
              startDate = new Date(latestMeeting[0].meeting_date);
              startDate.setDate(startDate.getDate() + 7); // Next week
            } else {
              // No existing meetings, start from next Sunday
              startDate = new Date(today);
              const currentDay = startDate.getDay();
              const daysUntilNextSunday = currentDay === 0 ? 7 : 7 - currentDay;
              startDate.setDate(today.getDate() + daysUntilNextSunday);
            }

            const results = await this.createRecurringMeetings(
              area.area_id,
              startDate,
              "10:00:00",
              1,
              weeksToCreate
            );

            for (const result of results) {
              if (result.success) {
                if (result.exists) {
                  existingCount++;
                } else {
                  successCount++;
                }
              } else {
                errorCount++;
              }
            }
          } else {
            console.log(
              `✅ Area ${area.area_id} already has sufficient future meetings (${futureMeetingsCount})`
            );
          }
        } catch (areaError) {
          console.error(`❌ Error processing area ${area.area_id}:`, areaError);
          errorCount++;
        }

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`📊 Meeting generation completed:
        ✅ Created: ${successCount}
        📅 Already existed: ${existingCount}
        ❌ Errors: ${errorCount}`);
    } catch (error) {
      console.error("❌ Fatal error in meeting generation:", error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start the cron job
  start() {
    try {
      if (this.task) {
        console.log("⏰ Cron job already running");
        return;
      }

      // Production schedule: Every Sunday at 23:59
      const schedule =
        process.env.NODE_ENV === "development"
          ? "* * * * *" // Every 1 minute for testing
          : "59 23 * * 0"; // Sunday 23:59 for production

      console.log(`🔧 Creating cron job with schedule: ${schedule}`);

      this.task = cron.schedule(
        schedule,
        async () => {
          const now = new Date().toISOString();
          console.log(`⏰ === CRON JOB TRIGGERED === ${now}`);
          console.log(`⏰ Starting scheduled weekly meeting generation...`);
          try {
            await this.generateNextWeekMeetings();
            console.log(
              `⏰ === CRON JOB COMPLETED === ${new Date().toISOString()}`
            );
          } catch (error) {
            console.error("❌ Error during cron execution:", error);
            console.log(
              `⏰ === CRON JOB FAILED === ${new Date().toISOString()}`
            );
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Colombo", // Adjust to your timezone
        }
      );

      this.task.start();
      console.log(
        `⏰ Weekly meeting scheduler started successfully (${schedule})`
      );
      console.log(`🌍 Timezone: Asia/Colombo`);
      console.log(`🔄 Environment: ${process.env.NODE_ENV || "not set"}`);
      console.log(
        `⏳ Next run: ${
          schedule === "* * * * *" ? "Every 1 minute" : "Every Sunday at 23:59"
        }`
      );
    } catch (error) {
      console.error("❌ Failed to start cron job:", error);
      throw error;
    }
  }

  // Stop the cron job
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log("⏰ Weekly meeting scheduler stopped");
    }
  }

  // Manual trigger for testing
  async trigger() {
    console.log("🔧 Manual trigger: Generating next week meetings...");
    await this.generateNextWeekMeetings();
  }
}

module.exports = WeeklyMeetingScheduler;
