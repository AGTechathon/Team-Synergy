import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import twilio from 'twilio';

console.log('🔧 Twilio Configuration Check:');
console.log(`Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing'}`);
console.log(`Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing'}`);
console.log(`Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Missing'}`);

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (twilioClient) {
  console.log('✅ Twilio client initialized successfully');
} else {
  console.log('❌ Twilio client not initialized - missing credentials');
}

// Twilio trial mode configuration
const isTrialMode = process.env.TWILIO_TRIAL_MODE === 'true';
const verifiedNumbers = process.env.TWILIO_VERIFIED_NUMBERS 
  ? process.env.TWILIO_VERIFIED_NUMBERS.split(',').map(num => num.trim())
  : [];

export async function POST(request) {
  try {
    const { emergencyType, description, message } = await request.json();
    
    const client = await pool.connect();
      // 1. Get all volunteers and users
    const { rows: volunteers } = await client.query(`
      SELECT id, name, contact, skills
      FROM volunteers
      WHERE status IN ('active', 'verified')
    `);

    const { rows: users } = await client.query(`
      SELECT id, name, contact
      FROM users
    `);
    
    client.release();

    const allRecipients = [
      ...volunteers.map(v => ({ ...v, type: 'volunteer' })),
      ...users.map(u => ({ ...u, type: 'user' }))
    ];

    if (allRecipients.length === 0) {
      return NextResponse.json(
        { message: 'No recipients (volunteers or users) available to notify' },
        { status: 400 }
      );
    }    // Helper function to normalize phone numbers for comparison
    const normalizePhoneNumber = (phone) => {
      return phone.replace(/[\s\-\(\)]/g, '');
    };

    // 2. Send notifications
    const sentResults = [];
    const skippedResults = [];
    
    if (twilioClient) {
      console.log(`=== SMS ALERT SYSTEM ${isTrialMode ? '(TRIAL MODE)' : '(PRODUCTION)'} ===`);
      console.log('Message:', message || `EMERGENCY: ${emergencyType}\n${description || ''}`);
      
      for (const recipient of allRecipients) {
        const normalizedContact = normalizePhoneNumber(recipient.contact);
        const isVerified = verifiedNumbers.some(verifiedNum => 
          normalizePhoneNumber(verifiedNum) === normalizedContact
        );
        
        // In trial mode, only send to verified numbers
        if (isTrialMode && !isVerified) {
          console.log(`⚠️  Skipping ${recipient.type} ${recipient.contact} (not verified for trial mode)`);
          skippedResults.push({ 
            contact: recipient.contact, 
            type: recipient.type, 
            reason: 'Not verified for Twilio trial mode' 
          });
          continue;
        }        try {
          console.log(`📱 Sending SMS to ${recipient.type}: ${recipient.contact}`);
          console.log(`📝 Message body: ${message || `EMERGENCY: ${emergencyType}\n${description || ''}`}`);
          console.log(`📞 From: ${process.env.TWILIO_PHONE_NUMBER}`);
          console.log(`📞 To: ${recipient.contact}`);
          
          const messageResult = await twilioClient.messages.create({
            body: message || `EMERGENCY: ${emergencyType}\n${description || ''}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipient.contact
          });
          
          console.log(`✅ SMS sent successfully to ${recipient.contact} (SID: ${messageResult.sid})`);
          sentResults.push({ 
            success: true, 
            contact: recipient.contact, 
            type: recipient.type,
            messageSid: messageResult.sid 
          });
        } catch (error) {
          console.error(`❌ Failed to notify ${recipient.type} ${recipient.contact}`);
          console.error(`❌ Error details:`, error);
          console.error(`❌ Error message:`, error.message);
          console.error(`❌ Error code:`, error.code);
          console.error(`❌ Error status:`, error.status);
          sentResults.push({ 
            success: false, 
            contact: recipient.contact, 
            type: recipient.type, 
            error: error.message || 'Unknown SMS error',
            errorCode: error.code,
            errorStatus: error.status
          });
        }
      }    } else {
      console.log('=== SIMULATED ALERT (NO TWILIO CONFIG) ===');
      console.log('Message:', message || `EMERGENCY: ${emergencyType}\n${description || ''}`);
      allRecipients.forEach(r => {
        console.log(`-> To ${r.type}: ${r.contact}`);
        sentResults.push({ success: true, contact: r.contact, type: r.type, simulated: true });
      });
    }

    // 3. Return results
    const successfulSends = sentResults.filter(r => r.success).length;
    const successfulVolunteerSends = sentResults.filter(r => r.success && r.type === 'volunteer').length;
    const successfulUserSends = sentResults.filter(r => r.success && r.type === 'user').length;

    return NextResponse.json({
      message: 'Alert processing completed',
      trialMode: isTrialMode,
      totalRecipients: allRecipients.length,
      totalVolunteers: volunteers.length,
      totalUsers: users.length,
      successfulSends,
      successfulVolunteerSends,
      successfulUserSends,
      failedSends: allRecipients.length - successfulSends,
      skippedSends: skippedResults.length,
      verifiedNumbers: isTrialMode ? verifiedNumbers : 'N/A (Production mode)',
      details: sentResults,
      skipped: skippedResults
    });

  } catch (error) {
    console.error('Error processing alert:', error);
    return NextResponse.json(
      { message: 'Error processing alert', error: error.message },
      { status: 500 }
    );
  }
}