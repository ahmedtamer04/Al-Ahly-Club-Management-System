import Waitlist from "../models/Waitlist.js";
import Notification from "../models/Notification.js";
import Event from "../models/Events.js";
import mongoose from "mongoose";
import { promoteNextInWaitlist } from "../controllers/waitlistController.js";

export const checkExpiredPromotions = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('Running expired promotions check...');
    
    const now = new Date();
    
    // Find all promoted entries where confirmation deadline has passed
    const expiredPromotions = await Waitlist.find({
      status: 'promoted',
      confirmationDeadline: { $lt: now }
    }).session(session);
    
    console.log(`Found ${expiredPromotions.length} expired promotions`);
    
    for (const expired of expiredPromotions) {
      try {
        // Update status to expired
        expired.status = 'expired';
        await expired.save({ session });
        
        // Get event details
        const event = await Event.findById(expired.event).select('name type').session(session);
        
        // Create expiration notification
        await Notification.create([{
          user_id: expired.user,
          type: 'waitlist_expired',
          message: `Your promotion for ${event.name} has expired. You didn't confirm within the 24-hour window.`,
          link: `/student/my-waitlist`,
          event_id: expired.event,
          metadata: {
            event_name: event.name,
            expired_at: now
          }
        }], { session });
        
        // Promote the next person in line
        try {
          const nextPromotion = await promoteNextInWaitlist(expired.event, session);
          if (nextPromotion) {
            console.log(`Promoted next person (${nextPromotion.user}) after expiration for event ${expired.event}`);
          } else {
            console.log(`No more people waiting for event ${expired.event}`);
          }
        } catch (promoteError) {
          console.error('Error promoting next person:', promoteError);
          // Continue processing other expired promotions
        }
        
        console.log(`Processed expired promotion for user ${expired.user} event ${expired.event}`);
        
      } catch (itemError) {
        console.error(`Error processing expired promotion ${expired._id}:`, itemError);
        // Continue with other items
      }
    }
    
    await session.commitTransaction();
    console.log('Expired promotions check completed successfully');
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in checkExpiredPromotions:', error);
  } finally {
    session.endSession();
  }
};
