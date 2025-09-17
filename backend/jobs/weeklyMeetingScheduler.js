const cron = require("node-cron");
const { pool } = require("../config/database");

class WeeklyMeetingScheduler {
  constructor() {
    this.isRunning = false;
    this.task = null;
  }

  // Helper method to validate and parse dates
  parseDate(dateInput) {
    let date;
    if (dateInput instanceof Date) {
      date = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      // Handle different date formats
      date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        // Try parsing as YYYY-MM-DD format
        const dateParts = dateInput.split("-");
        if (dateParts.length === 3) {
          date = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );
        }
      }
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateInput}`);
    }

    return date;
  }

  // Helper method to safely format dates for database
  formatDateForDB(date) {
    try {
      console.log(`formatDateForDB input: ${date}, type: ${typeof date}`);

      if (!(date instanceof Date)) {
        console.warn(`formatDateForDB: Input is not a Date object: ${date}`);
        date = new Date();
      }

      if (isNaN(date.getTime())) {
        console.warn(`formatDateForDB: Invalid date object: ${date}`);
        date = new Date();
      }

      const formatted = date.toISOString().split("T")[0];
      console.log(`formatDateForDB formatted result: ${formatted}`);

      // Double-check the formatted date
      if (
        !formatted ||
        formatted.includes("0000") ||
        formatted === "0000-00-00" ||
        formatted.startsWith("0000")
      ) {
        console.warn(
          `formatDateForDB: Invalid formatted date: ${formatted}, using current date`
        );
        const today = new Date();
        const fallback = today.toISOString().split("T")[0];
        console.log(`formatDateForDB fallback result: ${fallback}`);
        return fallback;
      }

      return formatted;
    } catch (error) {
      console.error("formatDateForDB: Error formatting date for DB:", error);
      // Ultimate fallback - current date
      const today = new Date();
      const fallback = today.toISOString().split("T")[0];
      console.log(`formatDateForDB ultimate fallback: ${fallback}`);
      return fallback;
    }
  }

  // Create next week's meeting for a specific area
  async createNextWeekMeeting(
    areaId,
    createdBy = 1,
    location = null,
    agenda = null
  ) {
    try {
      // Calculate next week's Sunday using millisecond arithmetic
      const today = new Date();
      const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
      const nextSunday = new Date(
        today.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000
      );

      // Ensure the calculated date is valid
      if (isNaN(nextSunday.getTime())) {
        throw new Error("Invalid date calculated for next Sunday");
      }

      const meetingDate = nextSunday.toISOString().split("T")[0];

      // Use safe date formatting
      const finalDate = this.formatDateForDB(nextSunday);

      console.log(`Creating meeting for area ${areaId} on ${finalDate}`);

      // Check if meeting already exists (include time, location, and agenda in check)
      const [existing] = await pool.execute(
        `SELECT id FROM weekly_meetings WHERE area_id = ? AND meeting_date = ? AND meeting_time = ? AND location = ? AND agenda = ?`,
        [
          areaId,
          finalDate,
          "10:00:00",
          location || "Community Center",
          agenda || "Weekly committee meeting",
        ]
      );

      if (existing.length > 0) {
        console.log(
          `Meeting already exists for area ${areaId} on ${finalDate}`
        );
        return { success: true, exists: true, meetingId: existing[0].id };
      }

      // Create the meeting
      const [result] = await pool.execute(
        `INSERT INTO weekly_meetings (
          area_id, meeting_date, meeting_time, location, agenda, 
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW())`,
        [
          areaId,
          finalDate,
          "10:00:00",
          location || "Community Center",
          agenda || "Weekly committee meeting",
          createdBy,
        ]
      );

      console.log(
        `Created meeting for area ${areaId} on ${finalDate}, ID: ${result.insertId}`
      );
      return { success: true, exists: false, meetingId: result.insertId };
    } catch (error) {
      console.error(`Error creating meeting for area ${areaId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Generate meetings for all areas that have existing meetings
  async generateNextWeekMeetings() {
    if (this.isRunning) {
      console.log("Meeting generation already in progress...");
      return;
    }

    this.isRunning = true;
    console.log("Starting weekly meeting generation...");

    try {
      // Get all areas that have existing meetings
      const [areas] = await pool.execute(`
        SELECT DISTINCT a.area_id, a.area_name
        FROM areas a
        INNER JOIN weekly_meetings wm ON a.area_id = wm.area_id
        ORDER BY a.area_name ASC
      `);

      console.log(`Found ${areas.length} areas with existing meetings`);

      let successCount = 0;
      let existingCount = 0;
      let errorCount = 0;

      for (const area of areas) {
        try {
          const result = await this.createNextWeekMeeting(area.area_id);

          if (result.success) {
            if (result.exists) {
              existingCount++;
            } else {
              successCount++;
            }
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing area ${area.area_id}:`, error);
          errorCount++;
        }
      }

      console.log(`Meeting generation completed:
        Created: ${successCount}
        Already existed: ${existingCount}
        Errors: ${errorCount}`);
    } catch (error) {
      console.error("Fatal error in meeting generation:", error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start the cron job
  start() {
    try {
      if (this.task) {
        console.log("Cron job already running");
        return;
      }

      const schedule =
        process.env.NODE_ENV === "development"
          ? "*/5 * * * *" // Every 5 minutes for testing
          : "0 0 * * 0"; // Every Sunday at midnight for production

      console.log(`Creating cron job with schedule: ${schedule}`);

      this.task = cron.schedule(
        schedule,
        async () => {
          console.log(`=== CRON JOB TRIGGERED === ${new Date().toISOString()}`);
          try {
            await this.generateNextWeekMeetings();
            console.log(
              `=== CRON JOB COMPLETED === ${new Date().toISOString()}`
            );
          } catch (error) {
            console.error("Error during cron execution:", error);
          }
        },
        {
          scheduled: false,
          timezone: "Asia/Colombo",
        }
      );

      this.task.start();
      console.log(`Weekly meeting scheduler started successfully`);
      console.log(`Environment: ${process.env.NODE_ENV || "production"}`);
    } catch (error) {
      console.error("Failed to start cron job:", error);
      throw error;
    }
  }

  // Stop the cron job
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log("Weekly meeting scheduler stopped");
    }
  }

  // Manual trigger for testing
  async trigger() {
    console.log("Manual trigger: Generating next week meetings...");
    await this.generateNextWeekMeetings();
  }

  // Create recurring weekly meetings starting from a specific date
  async createRecurringMeetingsWithInitial(
    areaId,
    startDate,
    meetings,
    createdBy,
    weeksAhead = 4,
    forceCreate = false
  ) {
    try {
      const results = [];

      // Validate and parse the start date properly
      const baseDate = this.parseDate(startDate);

      for (let week = 0; week < weeksAhead; week++) {
        // Use millisecond arithmetic to avoid setDate() overflow issues
        const meetingDate = new Date(
          baseDate.getTime() + week * 7 * 24 * 60 * 60 * 1000
        );

        // Ensure the date is valid before formatting
        if (isNaN(meetingDate.getTime())) {
          console.error(
            `Invalid meeting date calculated for week ${week}: ${meetingDate}`
          );
          continue;
        }

        // Double-check that the date is reasonable (not too far in the past/future)
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const oneYearFromNow = new Date(
          now.getTime() + 365 * 24 * 60 * 60 * 1000
        );

        if (meetingDate < oneYearAgo || meetingDate > oneYearFromNow) {
          console.error(
            `Meeting date too far from current date: ${meetingDate.toISOString()}`
          );
          continue;
        }

        // Use safe date formatting
        const finalDate = this.formatDateForDB(meetingDate);

        // Additional check: ensure finalDate is not the zero date
        if (finalDate === "0000-00-00" || finalDate.includes("0000")) {
          console.error(
            `CRITICAL: finalDate is still invalid: ${finalDate}, skipping insertion`
          );
          console.error(
            `Original meetingDate: ${meetingDate}, timestamp: ${meetingDate.getTime()}`
          );
          continue;
        }

        console.log(
          `Creating meetings for area ${areaId} on ${finalDate} (week ${
            week + 1
          })`
        );

        // Create multiple meetings for this date
        for (const meeting of meetings) {
          console.log(
            `  - Meeting at ${meeting.meetingTime}: ${meeting.agenda}`
          );

          if (!forceCreate) {
            // Check if this specific meeting exists (by time, location, and agenda)
            const [existing] = await pool.execute(
              `SELECT id FROM weekly_meetings WHERE area_id = ? AND meeting_date = ? AND meeting_time = ? AND location = ? AND agenda = ?`,
              [
                areaId,
                finalDate,
                meeting.meetingTime,
                meeting.location,
                meeting.agenda,
              ]
            );

            if (existing.length > 0) {
              console.log(
                `    Meeting already exists for area ${areaId} on ${finalDate} at ${meeting.meetingTime}`
              );
              results.push({
                success: true,
                exists: true,
                meetingId: existing[0].id,
                date: finalDate,
                time: meeting.meetingTime,
              });
              continue;
            }
          }

          // Create the meeting
          console.log(
            `About to insert meeting with finalDate: ${finalDate}, time: ${meeting.meetingTime}`
          );

          const [result] = await pool.execute(
            `INSERT INTO weekly_meetings (
              area_id, meeting_date, meeting_time, location, agenda,
              status, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW())`,
            [
              areaId,
              finalDate,
              meeting.meetingTime,
              meeting.location,
              meeting.agenda,
              createdBy,
            ]
          );

          console.log(
            `Created meeting for area ${areaId} on ${finalDate} at ${meeting.meetingTime}, ID: ${result.insertId}`
          );
          results.push({
            success: true,
            exists: false,
            meetingId: result.insertId,
            date: finalDate,
            time: meeting.meetingTime,
          });
        }
      }

      return results;
    } catch (error) {
      console.error(
        `Error creating recurring meetings for area ${areaId}:`,
        error
      );
      return [];
    }
  }
}

module.exports = WeeklyMeetingScheduler;
