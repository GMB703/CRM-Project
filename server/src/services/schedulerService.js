import cron from 'node-cron';
import LeadReminderService from './leadReminderService.js';

/**
 * Service for managing scheduled tasks
 */
class SchedulerService {
  static jobs = [];

  /**
   * Initialize all scheduled tasks
   */
  static initializeScheduledTasks() {
    // Check for inactive leads daily at 9 AM
    const inactivityCheck = cron.schedule('0 9 * * *', async () => {
      console.log('Running lead inactivity check...');
      try {
        const result = await LeadReminderService.checkInactiveLeads();
        console.log(`Processed ${result.processedLeads} leads for inactivity`);
      } catch (error) {
        console.error('Error in lead inactivity check:', error);
      }
    });

    this.jobs.push(inactivityCheck);
    console.log('✅ Scheduled tasks initialized');
  }

  /**
   * Stop all scheduled tasks
   */
  static stopAllTasks() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('Scheduled tasks stopped');
  }
} 