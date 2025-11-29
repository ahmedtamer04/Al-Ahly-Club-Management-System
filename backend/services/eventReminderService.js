import Registration from "../models/Registration.js";
import Event from "../models/Events.js";
import Notification from "../models/Notification.js";

/**
 * Check and send reminders for events happening in approximately 1 day (24 hours)
 * Window: between 23-24 hours before event
 */
export const sendOneDayReminders = async () => {
  try {
    console.log('🔔 Checking for events happening in 1 day (23-24 hours)...');
    
    const now = new Date();
    const twentyThreeHoursFromNow = new Date(now.getTime() + (23 * 60 * 60 * 1000));
    const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    
    console.log(`📅 Current time (UTC): ${now.toISOString()}`);
    console.log(`📅 Looking for events between:`);
    console.log(`   ${twentyThreeHoursFromNow.toISOString()} - ${twentyFourHoursFromNow.toISOString()}`);
    
    const upcomingEvents = await Event.find({
      start_date: {
        $gte: twentyThreeHoursFromNow,
        $lte: twentyFourHoursFromNow
      },
      status: 'upcoming'
    });

    console.log(`📊 Found ${upcomingEvents.length} events happening in 1 day`);

    for (const event of upcomingEvents) {
      const hoursUntilEvent = (new Date(event.start_date) - now) / (1000 * 60 * 60);
      console.log(`📌 Processing event: ${event.name} (${hoursUntilEvent.toFixed(2)} hours away)`);
      
      const registrations = await Registration.find({
        event_id: event._id,
        status: 'registered'
      }).populate('user_id', '_id first_name last_name role');

      console.log(`👥 Found ${registrations.length} registrations for event: ${event.name}`);

      for (const registration of registrations) {
        if (!registration.user_id) {
          console.log('⚠️ Registration without user_id found, skipping...');
          continue;
        }

        const userId = registration.user_id._id;

        // Check if reminder already exists in database
        const existingReminder = await Notification.findOne({
          user_id: userId,
          event_id: event._id,
          type: 'event_reminder_1day'
        });

        if (existingReminder) {
          const timeSinceReminder = Math.floor((now - existingReminder.createdAt) / 1000);
          console.log(`⏭️ 1-day reminder already exists for ${registration.user_id.first_name} (sent ${timeSinceReminder}s ago)`);
          continue;
        }

        // Create reminder notification
        const userRole = registration.user_id.role || 'Student';
        const notification = await Notification.create({
          user_id: userId,
          type: 'event_reminder_1day',
          message: `⏰ Reminder: "${event.name}" starts tomorrow at ${event.time}!`,
          link: `/${userRole.toLowerCase()}/my-registrations`,
          event_id: event._id,
          registration_id: registration._id,
          metadata: {
            event_name: event.name,
            event_type: event.type,
            event_date: event.start_date,
            event_location: event.location,
            event_time: event.time
          }
        });

        console.log(`✅ Sent 1-day reminder to ${registration.user_id.first_name} ${registration.user_id.last_name} (ID: ${notification._id})`);
      }
    }

    console.log('✅ Completed 1-day reminder check\n');
  } catch (error) {
    console.error('❌ Error sending 1-day reminders:', error);
  }
};

/**
 * Check and send reminders for events happening in approximately 1 hour
 * Window: between 55-60 minutes before event
 */
export const sendOneHourReminders = async () => {
  try {
    console.log('🔔 Checking for events happening in 1 hour (55-60 minutes)...');
    
    const now = new Date();
    const fiftyFiveMinutesFromNow = new Date(now.getTime() + (55 * 60 * 1000));
    const sixtyMinutesFromNow = new Date(now.getTime() + (60 * 60 * 1000));
    
    console.log(`⏰ Current time (UTC): ${now.toISOString()}`);
    console.log(`⏰ Looking for events between:`);
    console.log(`   ${fiftyFiveMinutesFromNow.toISOString()} - ${sixtyMinutesFromNow.toISOString()}`);
    
    const upcomingEvents = await Event.find({
      start_date: {
        $gte: fiftyFiveMinutesFromNow,
        $lte: sixtyMinutesFromNow
      },
      status: 'upcoming'
    });

    console.log(`📊 Found ${upcomingEvents.length} events happening in 1 hour`);

    for (const event of upcomingEvents) {
      const minutesUntilEvent = (new Date(event.start_date) - now) / (1000 * 60);
      console.log(`📌 Processing event: ${event.name} (${minutesUntilEvent.toFixed(2)} minutes away)`);
      
      const registrations = await Registration.find({
        event_id: event._id,
        status: 'registered'
      }).populate('user_id', '_id first_name last_name role');

      console.log(`👥 Found ${registrations.length} registrations for event: ${event.name}`);

      for (const registration of registrations) {
        if (!registration.user_id) {
          console.log('⚠️ Registration without user_id found, skipping...');
          continue;
        }

        const userId = registration.user_id._id;

        // Check if reminder already exists in database
        const existingReminder = await Notification.findOne({
          user_id: userId,
          event_id: event._id,
          type: 'event_reminder_1hour'
        });

        if (existingReminder) {
          const timeSinceReminder = Math.floor((now - existingReminder.createdAt) / 1000);
          console.log(`⏭️ 1-hour reminder already exists for ${registration.user_id.first_name} (sent ${timeSinceReminder}s ago)`);
          continue;
        }

        // Create reminder notification
        const userRole = registration.user_id.role || 'Student';
        const notification = await Notification.create({
          user_id: userId,
          type: 'event_reminder_1hour',
          message: `🚨 Reminder: "${event.name}" starts in 1 hour at ${event.time}!`,
          link: `/${userRole.toLowerCase()}/my-registrations`,
          event_id: event._id,
          registration_id: registration._id,
          metadata: {
            event_name: event.name,
            event_type: event.type,
            event_date: event.start_date,
            event_location: event.location,
            event_time: event.time
          }
        });

        console.log(`✅ Sent 1-hour reminder to ${registration.user_id.first_name} ${registration.user_id.last_name} (ID: ${notification._id})`);
      }
    }

    console.log('✅ Completed 1-hour reminder check\n');
  } catch (error) {
    console.error('❌ Error sending 1-hour reminders:', error);
  }
};

/**
 * Start the reminder scheduler (runs every 2 minutes)
 */
export const startReminderScheduler = () => {
  console.log('🚀 Starting event reminder scheduler...');
  console.log(`📅 Current time (UTC): ${new Date().toISOString()}`);
  
  // Run immediately on startup (after 3 seconds delay for DB to be ready)
  setTimeout(() => {
    console.log('\n===== INITIAL REMINDER CHECK =====');
    sendOneDayReminders();
    sendOneHourReminders();
  }, 3000);
  
  // ✅ CHANGED: Run every 2 minutes instead of 5 minutes
  const interval = setInterval(() => {
    console.log('\n===== SCHEDULED REMINDER CHECK =====');
    console.log(`⏰ Running at (UTC): ${new Date().toISOString()}`);
    sendOneDayReminders();
    sendOneHourReminders();
  }, 2 * 60 * 1000); // 2 minutes
  
  console.log('✅ Reminder scheduler started (runs every 2 minutes)');
  
  // Return cleanup function
  return () => clearInterval(interval);
};