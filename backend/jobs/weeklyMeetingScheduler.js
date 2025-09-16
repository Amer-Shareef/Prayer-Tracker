const cron = require("node-cron");
const { pool } = require("../config/database");

class WeeklyMeetingScheduler {
  constructor() {
    this.isRunning = false;
    this.task = null;
    this._skipInitialDuplicateCheck = false;
  }

  // Create next week's meeting for a specific area
  async createNextWeekMeeting(
    areaId,
    createdBy = 1,
    location = null,
    agenda = null
  ) {
    try {
      // Calculate next week's Sunday
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday
      const daysUntilNextSunday = currentDay === 0 ? 7 : 7 - currentDay;

      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + daysUntilNextSunday);
      const weekOf = nextSunday.toISOString().split("T")[0];
      const meetingDate = weekOf; // Meeting on Sunday

      // Enhanced duplicate check
      const [existing] = await pool.execute(
        `SELECT id FROM weekly_meetings 
         WHERE area_id = ? 
         AND (
           (week_of = ? AND week_of != '0000-00-00') 
           OR (meeting_date = ? AND meeting_date != '0000-00-00')
         )`,
        [areaId, weekOf, meetingDate]
      );

      if (existing.length > 0) {
        console.log(
          `📅 Meeting already exists for area ${areaId}, week ${weekOf}, ID: ${existing[0].id}`
        );
        return { success: true, exists: true, meetingId: existing[0].id };
      }

      // Use provided values or defaults - no database lookups needed
      const finalLocation = location || "Community Center";
      const finalAgenda = agenda || "Weekly committee meeting and area updates";

      console.log(`📍 Using location: ${finalLocation}`);
      console.log(`📋 Using agenda: ${finalAgenda}`);

      // Create the meeting
      const [result] = await pool.execute(
        `INSERT INTO weekly_meetings (
          area_id, week_of, meeting_date, meeting_time, location, agenda, 
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())
        ON DUPLICATE KEY UPDATE
          meeting_date = VALUES(meeting_date),
          meeting_time = VALUES(meeting_time),
          location = VALUES(location),
          agenda = VALUES(agenda),
          updated_at = NOW()`,
        [
          areaId,
          weekOf,
          meetingDate,
          "10:00:00", // Default meeting time
          finalLocation,
          finalAgenda,
          createdBy,
        ]
      );

      const meetingId = result.insertId || (await this.getMeetingIdByWeek(areaId, weekOf));
      const wasUpdated = result.affectedRows > 0 && result.insertId === 0;

      console.log(
        `✅ ${wasUpdated ? 'Updated' : 'Created'} meeting for area ${areaId}, week ${weekOf}, ID: ${meetingId}`
      );
      return { success: true, exists: wasUpdated, meetingId: meetingId };
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
    weeksAhead = 4,
    location = null,
    agenda = null,
    parentId = null
  ) {
    try {
      const results = [];
      const startDateObj = new Date(startDate);

      // Validate the startDate is a proper date
      if (isNaN(startDateObj.getTime())) {
        console.error(`❌ Invalid start date provided: ${startDate}`);
        return [];
      }

      console.log(
        `🔄 Creating recurring meetings for area ${areaId} starting from ${startDate} for ${weeksAhead} weeks`
      );

      // Use provided values or defaults - no database lookups needed
      const finalLocation = location || "Community Center";
      const finalAgenda = agenda || "Weekly committee meeting and area updates";

      console.log(`📍 Using location: ${finalLocation}`);
      console.log(`📋 Using agenda: ${finalAgenda}`);
      if (parentId) {
        console.log(`👨‍👧‍👦 Using parent meeting ID: ${parentId}`);
      }

      for (let i = 0; i < weeksAhead; i++) {
        // Calculate the meeting date for this week
        const meetingDate = new Date(startDateObj);
        meetingDate.setDate(startDateObj.getDate() + i * 7); // Add weeks
        const formattedMeetingDate = meetingDate.toISOString().split("T")[0];

        // Use Sunday of the week as the week_of date (consistent with convention)
        const weekOfDate = new Date(meetingDate);
        const dayOfWeek = weekOfDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        weekOfDate.setDate(weekOfDate.getDate() - dayOfWeek); // Go back to Sunday
        const weekOf = weekOfDate.toISOString().split("T")[0];

        // Smart duplicate check for cron-generated meetings
        const [existing] = await pool.execute(
          `SELECT id, location, agenda, meeting_time FROM weekly_meetings
           WHERE area_id = ? AND week_of = ?`,
          [areaId, weekOf]
        );

        if (existing.length > 0) {
          const existingMeeting = existing[0];
          // Check if it's essentially the same meeting
          const sameLocation = existingMeeting.location === finalLocation;
          const sameAgenda = existingMeeting.agenda === finalAgenda;
          const sameTime = existingMeeting.meeting_time === meetingTime;

          if (sameLocation && sameAgenda && sameTime) {
            console.log(
              `📅 Identical meeting already exists for week ${weekOf}, ID: ${existingMeeting.id}`
            );
            results.push({
              success: true,
              exists: true,
              meetingId: existingMeeting.id,
              weekOf,
              meetingDate: formattedMeetingDate,
              parentId: parentId,
            });
            continue;
          } else {
            console.log(
              `🔄 Different meeting details found, creating new meeting`
            );
            // Different details, so allow creation
          }
        }

        // Create or update the meeting with consistent details and ensure proper date formats
        const [result] = await pool.execute(
          `INSERT INTO weekly_meetings (
            area_id, week_of, meeting_date, meeting_time, location, agenda,
            status, created_by, parent_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            meeting_date = VALUES(meeting_date),
            meeting_time = VALUES(meeting_time),
            location = VALUES(location),
            agenda = VALUES(agenda),
            parent_id = VALUES(parent_id),
            updated_at = NOW()`,
          [
            areaId,
            weekOf,
            formattedMeetingDate,
            meetingTime,
            finalLocation,
            finalAgenda,
            createdBy,
            parentId, // Set parent_id for recurring meetings
          ]
        );

        const meetingId = result.insertId || (await this.getMeetingIdByWeek(areaId, weekOf));
        const wasUpdated = result.affectedRows > 0 && result.insertId === 0;

        console.log(
          `✅ ${wasUpdated ? 'Updated' : 'Created'} recurring meeting for area ${areaId}, week ${weekOf}, date ${formattedMeetingDate}, ID: ${meetingId}`
        );
        results.push({
          success: true,
          exists: wasUpdated, // true if updated, false if created
          meetingId: meetingId,
          weekOf,
          meetingDate: formattedMeetingDate,
          parentId: parentId,
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
      // Return empty array on error to maintain consistency
      return [];
    }
  }

  // Create recurring meetings including the initial one with all provided details
  async createRecurringMeetingsWithInitial(
    areaId,
    startDate,
    meetingTime = "10:00:00",
    location = null,
    agenda = null,
    createdBy = 1,
    weeksAhead = 8,
    skipDuplicateCheck = false
  ) {
    // Set flag to skip duplicate check for the initial meeting if requested
    this._skipInitialDuplicateCheck = skipDuplicateCheck;

    try {
      const results = [];
      const startDateObj = new Date(startDate);

      // Validate the startDate is a proper date
      if (isNaN(startDateObj.getTime())) {
        console.error(`❌ Invalid start date provided: ${startDate}`);
        return [];
      }

      console.log(
        `🔄 Creating ${weeksAhead} meetings for area ${areaId} starting from ${startDate}`
      );

      // Use provided values or defaults - NO database lookups for templates
      const finalLocation = location || "Community Center";
      const finalAgenda = agenda || "Weekly committee meeting and area updates";

      console.log(`📍 Using location: ${finalLocation}`);
      console.log(`📋 Using agenda: ${finalAgenda}`);

      let parentMeetingId = null;

      for (let i = 0; i < weeksAhead; i++) {
        // Calculate the meeting date for this week
        const meetingDate = new Date(startDateObj);
        meetingDate.setDate(startDateObj.getDate() + i * 7); // Add weeks
        const formattedMeetingDate = meetingDate.toISOString().split("T")[0];

        // Use Sunday of the week as the week_of date (consistent with convention)
        const weekOfDate = new Date(meetingDate);
        const dayOfWeek = weekOfDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        weekOfDate.setDate(weekOfDate.getDate() - dayOfWeek); // Go back to Sunday
        const weekOf = weekOfDate.toISOString().split("T")[0];

        console.log(
          `⏱️ Processing week ${i}: Meeting date=${formattedMeetingDate}, week_of=${weekOf}`
        );

        // Smart duplicate check - only prevent true duplicates
        // For first meeting: respect force_create flag
        // For subsequent meetings: only skip if same parent series already exists
        let shouldSkipDuplicateCheck = false;

        if (i === 0 && this._skipInitialDuplicateCheck) {
          // Force create requested for first meeting
          shouldSkipDuplicateCheck = true;
          console.log(`🔄 Force creating initial meeting as requested`);
        } else if (i > 0 && parentMeetingId) {
          // For subsequent meetings, check if we already have this meeting in the same series
          const [existingInSeries] = await pool.execute(
            `SELECT id FROM weekly_meetings
             WHERE area_id = ? AND parent_id = ? AND meeting_date = ?`,
            [areaId, parentMeetingId, formattedMeetingDate]
          );
          if (existingInSeries.length > 0) {
            console.log(
              `📅 Meeting already exists in this series for date ${formattedMeetingDate}, ID: ${existingInSeries[0].id}`
            );
            results.push({
              success: true,
              exists: true,
              meetingId: existingInSeries[0].id,
              weekOf,
              meetingDate: formattedMeetingDate,
              parentId: parentMeetingId,
            });
            continue;
          }
          shouldSkipDuplicateCheck = true; // Skip general duplicate check for series meetings
        }

        if (!shouldSkipDuplicateCheck) {
          // General duplicate check - check for existing meeting in the same week
          // This respects the unique constraint on area_id + week_of
          const [existing] = await pool.execute(
            `SELECT id, location, agenda, meeting_time FROM weekly_meetings
             WHERE area_id = ? AND week_of = ?`,
            [areaId, weekOf]
          );

          if (existing.length > 0) {
            const existingMeeting = existing[0];
            // Check if it's essentially the same meeting
            const sameLocation = existingMeeting.location === finalLocation;
            const sameAgenda = existingMeeting.agenda === finalAgenda;
            const sameTime = existingMeeting.meeting_time === meetingTime;

            if (sameLocation && sameAgenda && sameTime) {
              console.log(
                `📅 Identical meeting already exists for week ${weekOf}, ID: ${existingMeeting.id}`
              );
              results.push({
                success: true,
                exists: true,
                meetingId: existingMeeting.id,
                weekOf,
                meetingDate: formattedMeetingDate,
                parentId: parentMeetingId,
              });
              continue;
            } else {
              console.log(
                `🔄 Different meeting details found for week ${weekOf}, allowing creation`
              );
              // Different details, so allow creation (this will update the existing meeting)
            }
          }
        } // Create meeting with EXACT provided values and ensure proper date formats
        const [result] = await pool.execute(
          `INSERT INTO weekly_meetings (
            area_id, week_of, meeting_date, meeting_time, location, agenda,
            status, created_by, parent_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            meeting_date = VALUES(meeting_date),
            meeting_time = VALUES(meeting_time),
            location = VALUES(location),
            agenda = VALUES(agenda),
            parent_id = VALUES(parent_id),
            updated_at = NOW()`,
          [
            areaId,
            weekOf,
            formattedMeetingDate,
            meetingTime,
            finalLocation,
            finalAgenda,
            createdBy,
            parentMeetingId, // Set parent_id (null for first meeting, then the first meeting's ID)
          ]
        );

        const meetingId = result.insertId || (await this.getMeetingIdByWeek(areaId, weekOf));
        const wasUpdated = result.affectedRows > 0 && result.insertId === 0;

        console.log(
          `✅ ${wasUpdated ? 'Updated' : 'Created'} meeting for area ${areaId}, week ${weekOf}, date ${formattedMeetingDate}, ID: ${meetingId}`
        );

        // Set parentMeetingId to the first created/updated meeting's ID
        if (i === 0) {
          parentMeetingId = meetingId;
          console.log(`👨‍👧‍👦 Set parent meeting ID to: ${parentMeetingId}`);

          // Update the first meeting to reference itself as parent (optional, but good for consistency)
          await pool.execute(
            `UPDATE weekly_meetings SET parent_id = ? WHERE id = ?`,
            [parentMeetingId, parentMeetingId]
          );
        }

        results.push({
          success: true,
          exists: wasUpdated, // true if updated, false if created
          meetingId: meetingId,
          weekOf,
          meetingDate: formattedMeetingDate,
          parentId: parentMeetingId,
        });

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const newMeetings = results.filter((r) => !r.exists).length;
      const updatedMeetings = results.filter((r) => r.exists).length;
      console.log(`🎯 Successfully processed ${results.length} meetings (${newMeetings} created, ${updatedMeetings} updated)`);
      return results;
    } catch (error) {
      console.error(`❌ Error creating meetings for area ${areaId}:`, error);
      return [];
    } finally {
      // Reset the flag regardless of success or failure
      this._skipInitialDuplicateCheck = false;
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

  // Get parent meeting details for an area (uses parent_id approach)
  async getParentMeetingDetails(areaId, systemUserId) {
    try {
      // Step 1: Try to find meetings that have a parent_id (part of a series)
      const [meetingsWithParent] = await pool.execute(
        `SELECT
          wm.id,
          wm.parent_id,
          wm.location,
          wm.agenda,
          wm.meeting_time,
          wm.meeting_date,
          parent.location as parent_location,
          parent.agenda as parent_agenda,
          parent.meeting_time as parent_meeting_time
         FROM weekly_meetings wm
         LEFT JOIN weekly_meetings parent ON wm.parent_id = parent.id
         WHERE wm.area_id = ? AND wm.parent_id IS NOT NULL
         ORDER BY wm.meeting_date DESC
         LIMIT 1`,
        [areaId]
      );

      if (meetingsWithParent.length > 0) {
        const meeting = meetingsWithParent[0];
        console.log(
          `🎯 Found meeting with parent reference (ID: ${meeting.id}, Parent: ${meeting.parent_id})`
        );

        // Use parent meeting details if available, otherwise use the current meeting
        const location = meeting.parent_location || meeting.location;
        const agenda = meeting.parent_agenda || meeting.agenda;
        const meetingTime = meeting.parent_meeting_time || meeting.meeting_time;

        return {
          parentId: meeting.parent_id,
          location: location,
          agenda: agenda,
          meetingTime: meetingTime,
          latestMeetingDate: meeting.meeting_date,
        };
      }

      // Step 2: If no meetings with parent_id, find the most recent meeting
      // and treat it as the parent for future meetings
      const [latestMeeting] = await pool.execute(
        `SELECT
          id,
          location,
          agenda,
          meeting_time,
          meeting_date
         FROM weekly_meetings
         WHERE area_id = ?
         ORDER BY meeting_date DESC
         LIMIT 1`,
        [areaId]
      );

      if (latestMeeting.length > 0) {
        const meeting = latestMeeting[0];
        console.log(
          `📅 Found latest meeting (ID: ${meeting.id}) - treating as parent`
        );

        // Validate that the data looks reasonable
        if (
          this.isValidMeetingDetail(meeting.location) &&
          this.isValidMeetingDetail(meeting.agenda)
        ) {
          return {
            parentId: meeting.id, // Use this meeting as the parent
            location: meeting.location,
            agenda: meeting.agenda,
            meetingTime: meeting.meeting_time || "10:00:00",
            latestMeetingDate: meeting.meeting_date,
          };
        }
      }

      // Step 3: If no valid meetings found, return null
      console.log(`⚠️ No valid meetings found for area ${areaId}`);
      return null;
    } catch (error) {
      console.error(
        `❌ Error getting parent meeting details for area ${areaId}:`,
        error
      );
      return null;
    }
  }

  // Validate that meeting details look reasonable (not test data or garbage)
  isValidMeetingDetail(value) {
    if (!value || typeof value !== "string") return false;

    const str = value.trim();

    // Check length - too short or too long is suspicious
    if (str.length < 3 || str.length > 200) return false;
    return true;
  }

  // Generate meetings for areas that already have meetings (maintains continuity)
  async generateNextWeekMeetings(systemUserId = null) {
    if (this.isRunning) {
      console.log("⏳ Meeting generation already in progress...");
      return;
    }

    // Use the provided user ID, the class's system user ID, or default to 1
    const creatorId = systemUserId || this.systemUserId || 1;
    console.log(`👤 Using user ID ${creatorId} for system-generated meetings`);

    this.isRunning = true;
    console.log("🚀 Starting weekly meeting generation...");

    try {
      // Get ONLY areas that already have meetings (don't create meetings for areas without any)
      const [areas] = await pool.execute(`
        SELECT DISTINCT a.area_id, a.area_name
        FROM areas a
        INNER JOIN weekly_meetings wm ON a.area_id = wm.area_id
        ORDER BY a.area_name ASC
      `);

      console.log(`📍 Found ${areas.length} areas with existing meetings`);

      if (areas.length === 0) {
        console.log(
          "ℹ️ No areas have meetings yet. Cron job will check again later."
        );
        return;
      }

      let successCount = 0;
      let existingCount = 0;
      let errorCount = 0;

      for (const area of areas) {
        try {
          console.log(
            `🔍 Processing area: ${area.area_name} (ID: ${area.area_id})`
          );
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

            // Get parent meeting details for this area
            const parentDetails = await this.getParentMeetingDetails(
              area.area_id,
              creatorId
            );

            if (parentDetails) {
              // Continue from the week after the latest meeting
              const startDate = new Date(parentDetails.latestMeetingDate);
              startDate.setDate(startDate.getDate() + 7); // Next week

              console.log(
                `👨‍👧‍👦 Using parent meeting details from meeting ID: ${parentDetails.parentId}`
              );
              console.log(`📍 Using location: ${parentDetails.location}`);
              console.log(`📋 Using agenda: ${parentDetails.agenda}`);
              console.log(
                `⏰ Using meeting time: ${parentDetails.meetingTime}`
              );

              const results = await this.createRecurringMeetings(
                area.area_id,
                startDate,
                parentDetails.meetingTime,
                creatorId,
                weeksToCreate,
                parentDetails.location,
                parentDetails.agenda,
                parentDetails.parentId // Pass parent_id for recurring meetings
              );

              // Handle results safely - check if it's an array and has content
              if (Array.isArray(results) && results.length > 0) {
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
              } else if (!Array.isArray(results)) {
                // If results is not an array, it means there was an error
                console.log(
                  `⚠️ No results returned for area ${area.area_id} (likely due to error)`
                );
                errorCount++;
              }
            } else {
              console.log(
                `⚠️ No parent meeting details found for area ${area.area_id}, skipping`
              );
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
  start(systemUserId = 1) {
    try {
      if (this.task) {
        console.log("⏰ Cron job already running");
        return;
      }

      // Store the system user ID for use in the scheduler
      this.systemUserId = systemUserId;
      console.log(
        `👤 Weekly meeting scheduler will use user ID ${this.systemUserId} for system operations`
      );

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
  async trigger(userId = null) {
    const triggerUserId = userId || this.systemUserId || 1;
    console.log(
      `🔧 Manual trigger: Generating next week meetings using user ID ${triggerUserId}...`
    );
    await this.generateNextWeekMeetings(triggerUserId);
  }

  // Helper method to get meeting ID by area and week
  async getMeetingIdByWeek(areaId, weekOf) {
    try {
      const [result] = await pool.execute(
        'SELECT id FROM weekly_meetings WHERE area_id = ? AND week_of = ?',
        [areaId, weekOf]
      );
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error getting meeting ID by week:', error);
      return null;
    }
  }
}

module.exports = WeeklyMeetingScheduler;
