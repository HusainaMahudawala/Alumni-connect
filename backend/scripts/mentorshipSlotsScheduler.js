const User = require("../models/User");
const Notification = require("../models/Notification");

let lastProcessedMonthlyKey = "";

function getMonthlyKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function runMentorshipSlotsMonthlyMaintenance(options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  const forceRun = Boolean(options.forceRun);

  // Execute only on the first day of each month.
  if (!forceRun && now.getDate() !== 1) {
    return {
      ran: false,
      reason: "not-first-day",
      monthlyKey: getMonthlyKey(now),
      processedAlumni: 0,
      notificationsCreated: 0,
      slotsAutoUpdated: 0
    };
  }

  const monthlyKey = getMonthlyKey(now);
  if (!forceRun && monthlyKey === lastProcessedMonthlyKey) {
    return {
      ran: false,
      reason: "already-processed",
      monthlyKey,
      processedAlumni: 0,
      notificationsCreated: 0,
      slotsAutoUpdated: 0
    };
  }

  try {
    let notificationsCreated = 0;
    let slotsAutoUpdated = 0;

    const alumniWithZeroSlots = await User.find({
      role: "alumni",
      mentorshipSlots: 0
    }).select("_id name mentorshipSlots");

    if (!alumniWithZeroSlots.length) {
      lastProcessedMonthlyKey = monthlyKey;
      return {
        ran: true,
        reason: "no-alumni-with-zero-slots",
        monthlyKey,
        processedAlumni: 0,
        notificationsCreated: 0,
        slotsAutoUpdated: 0
      };
    }

    for (const alumni of alumniWithZeroSlots) {
      const existingReminder = await Notification.findOne({
        userId: alumni._id,
        type: "mentorship_slots_update",
        "data.monthlyKey": monthlyKey
      });

      if (!existingReminder) {
        await Notification.create({
          userId: alumni._id,
          type: "mentorship_slots_update",
          message: "Please update your mentorship slots for this month. Minimum allowed value is 1.",
          isRead: false,
          data: {
            actionUrl: "/mentorship-requests",
            isAction: true,
            monthlyKey,
            slotsValue: 1
          }
        });
        notificationsCreated += 1;
      } else if (existingReminder.isRead) {
        await Notification.updateOne(
          { _id: existingReminder._id },
          { $set: { isRead: false } }
        );
      }

      // Auto-correct zero slot value to 1 to keep profile available for mentorship.
      const updateResult = await User.updateOne(
        { _id: alumni._id, mentorshipSlots: 0 },
        { $set: { mentorshipSlots: 1 } },
        { runValidators: true }
      );

      if (updateResult && updateResult.modifiedCount > 0) {
        slotsAutoUpdated += 1;
      }
    }

    console.log(`[MentorshipSlotsScheduler] Processed ${alumniWithZeroSlots.length} alumni for ${monthlyKey}`);
    lastProcessedMonthlyKey = monthlyKey;

    return {
      ran: true,
      reason: "success",
      monthlyKey,
      processedAlumni: alumniWithZeroSlots.length,
      notificationsCreated,
      slotsAutoUpdated
    };
  } catch (error) {
    console.error("[MentorshipSlotsScheduler] Failed monthly maintenance:", error.message);
    return {
      ran: false,
      reason: "error",
      monthlyKey,
      processedAlumni: 0,
      notificationsCreated: 0,
      slotsAutoUpdated: 0,
      error: error.message
    };
  }
}

function startMentorshipSlotsScheduler() {
  runMentorshipSlotsMonthlyMaintenance();

  // Run hourly; handler itself gates execution to day 1 and once per month.
  setInterval(runMentorshipSlotsMonthlyMaintenance, 60 * 60 * 1000);
}

module.exports = {
  startMentorshipSlotsScheduler,
  runMentorshipSlotsMonthlyMaintenance
};
