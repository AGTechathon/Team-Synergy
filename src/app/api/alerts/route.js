import { Pool } from 'pg';
import twilio from 'twilio';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function POST(request) {
  try {
    const { emergencyType, description, message } = await request.json();
    
    // 1. Get all volunteers and users
    const { rows: volunteers } = await pool.query(`
      SELECT id, name, contact, skills 
      FROM volunteers
    `);

    const { rows: users } = await pool.query(`
      SELECT id, name, contact 
      FROM users
    `);

    const allRecipients = [
      ...volunteers.map(v => ({ ...v, type: 'volunteer' })),
      ...users.map(u => ({ ...u, type: 'user' }))
    ];

    if (allRecipients.length === 0) {
      return Response.json(
        { message: 'No recipients (volunteers or users) available to notify' },
        { status: 400 }
      );
    }

    // 2. Send notifications
    const sentResults = [];
    
    if (twilioClient) {
      for (const recipient of allRecipients) {
        try {
          await twilioClient.messages.create({
            body: message || `EMERGENCY: ${emergencyType}\n${description || ''}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipient.contact
          });
          sentResults.push({ success: true, contact: recipient.contact, type: recipient.type });
        } catch (error) {
          console.error(`Failed to notify ${recipient.type} ${recipient.contact}:`, error);
          sentResults.push({ success: false, contact: recipient.contact, type: recipient.type, error: error.message });
        }
      }
    } else {
      console.log('=== SIMULATED ALERT ===');
      console.log('Message:', message || `EMERGENCY: ${emergencyType}\n${description || ''}`);
      allRecipients.forEach(r => {
        console.log(`-> To ${r.type}: ${r.contact}`);
        sentResults.push({ success: true, contact: r.contact, type: r.type });
      });
    }

    // 3. Return results
    const successfulSends = sentResults.filter(r => r.success).length;
    const successfulVolunteerSends = sentResults.filter(r => r.success && r.type === 'volunteer').length;
    const successfulUserSends = sentResults.filter(r => r.success && r.type === 'user').length;

    return Response.json({ 
      message: 'Alert processing completed',
      totalRecipients: allRecipients.length,
      totalVolunteers: volunteers.length,
      totalUsers: users.length,
      successfulSends,
      successfulVolunteerSends,
      successfulUserSends,
      failedSends: allRecipients.length - successfulSends,
      details: sentResults
    });

  } catch (error) {
    console.error('Error processing alert:', error);
    return Response.json(
      { message: 'Error processing alert', error: error.message },
      { status: 500 }
    );
  }
}