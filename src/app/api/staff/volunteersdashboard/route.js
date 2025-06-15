import pool from "../../../../../lib/db";
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

// Log Twilio credentials to verify they're loaded
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Set up Nodemailer transporter
let transporter = null;
if (process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD && 
    process.env.NODEMAILER_EMAIL !== 'your_email@example.com') {
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
} else {
  console.log('Email not configured - email notifications will be skipped');
}

const GOVERNMENT_EMAIL = process.env.GOVERNMENT_EMAIL || 'government@example.com';

const authenticateToken = (req) => {
  const authHeader = req.headers.get('authorization');
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    return { error: 'Authorization header missing', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Token extracted:', token ? 'Yes' : 'No');
  console.log('JWT_SECRET available:', process.env.JWT_SECRET ? 'Yes' : 'No');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, volunteer ID:', decoded.id);
    return { user: decoded, volunteerId: decoded.id };
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return { error: 'Invalid or expired token', status: 403 };
  }
};

// Normalize phone number to E.164 format for India
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a 10-digit number, assume India and add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it starts with 91 (India), add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // Default: add +91 for Indian numbers if not present
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    cleaned = `+91${cleaned}`;
  } else if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  
  return cleaned;
};

export async function GET(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();
    const result = await client.query('SELECT * FROM requests ORDER BY created_at DESC');
    client.release();

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();

    const result = await client.query(
      'UPDATE requests SET status = $1, assigned_volunteer_id = $2 WHERE id = $3 AND LOWER(status) = LOWER($4) RETURNING *',
      ['assigned', volunteerId, requestId, 'pending']
    );

    if (result.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found or already accepted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedRequest = result.rows[0];

    // Get volunteer information for the notification
    const volunteerResult = await client.query(
      'SELECT name, contact FROM volunteers WHERE id = $1',
      [volunteerId]
    );

    client.release();    // Send SMS notification to the requester
    console.log('🔍 Volunteer lookup result:', volunteerResult.rowCount, 'volunteers found');
    
    if (volunteerResult.rowCount > 0) {
      const volunteer = volunteerResult.rows[0];
      console.log('📱 Starting SMS notification process for volunteer:', volunteer.name);
      console.log('📞 Contact to notify:', updatedRequest.contact);
        try {
        // Check if Twilio is properly configured
        console.log('🔧 Checking Twilio configuration...');
        console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing');
        console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing');
        console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Missing');
        
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
          console.warn('❌ Twilio not configured properly - SMS notification skipped');
        } else {
          console.log('✅ Twilio configuration looks good!');
          const message = `Good news! Your emergency request (${updatedRequest.type}) has been accepted by volunteer ${volunteer.name}. They will contact you soon. Stay safe!`;
            // Check if contact is a phone number or email
          const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(updatedRequest.contact);
          console.log('📱 Contact analysis:', updatedRequest.contact, 'is phone:', isPhoneNumber);
          
          if (isPhoneNumber) {
            // Normalize phone number for SMS
            const normalizedPhone = normalizePhoneNumber(updatedRequest.contact);
            console.log(`📤 Attempting to send SMS to: ${normalizedPhone}`);
            
            const smsResult = await twilioClient.messages.create({
              body: message,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: normalizedPhone,
            });
            console.log('✅ SMS sent successfully:', smsResult.sid);

            console.log(`SMS sent successfully to ${normalizedPhone} about request acceptance. SID: ${smsResult.sid}`);
          } else {
            console.log(`Contact ${updatedRequest.contact} appears to be an email address - SMS notification skipped`);
            // TODO: Add email notification logic here if needed
          }
        }
      } catch (smsError) {        console.error('Error sending SMS notification:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    return new Response(JSON.stringify(updatedRequest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating request:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal Server Error';
    if (error.code === '23505') {
      errorMessage = 'Request has already been assigned to another volunteer';
    } else if (error.code === '23503') {
      errorMessage = 'Invalid request ID or volunteer ID';
    } else if (error.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await pool.connect();

    // Check if the request exists and is assigned to the volunteer
    const requestCheck = await client.query(
      'SELECT contact FROM requests WHERE id = $1 AND assigned_volunteer_id = $2 AND LOWER(status) = LOWER($3)',
      [requestId, volunteerId, 'assigned']
    );

    if (requestCheck.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not assigned to you, or not in accepted status' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userContact = requestCheck.rows[0].contact;

    // Validate contact number
    if (!userContact) {
      client.release();
      return new Response(JSON.stringify({ error: 'User contact number is missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },      });
    }

    // Check if contact is a phone number or email
    const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(userContact);

    // Update the request status to completed
    const result = await client.query(
      'UPDATE requests SET status = $1 WHERE id = $2 AND assigned_volunteer_id = $3 RETURNING *',
      ['resolved', requestId, volunteerId]
    );

    if (result.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to mark request as completed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedRequest = result.rows[0];

    // Send SMS notification to victim about completion
    console.log('✅ Sending completion SMS notification to victim...');
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('⚠️ Twilio not configured properly - SMS notification skipped');
      } else {
        // Get volunteer name for the message
        const volunteerQuery = await client.query('SELECT name FROM volunteers WHERE id = $1', [volunteerId]);
        const volunteerName = volunteerQuery.rows[0]?.name || 'Our volunteer';
        
        const message = `✅ GREAT NEWS! Your emergency request (${updatedRequest.type}) has been COMPLETED by volunteer ${volunteerName}. You are now safe! Thank you for using RakshaMitra AI. If you need further assistance, please don't hesitate to reach out.`;
        
        // Check if contact is a phone number
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (phoneRegex.test(updatedRequest.contact)) {
          const normalizedPhone = normalizePhoneNumber(updatedRequest.contact);
          console.log(`📱 Sending completion SMS to: ${normalizedPhone}`);
          
          const smsResult = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: normalizedPhone
          });
          
          console.log('✅ Completion SMS sent successfully:', smsResult.sid);
        } else {
          console.log('📧 Contact appears to be email, SMS skipped:', updatedRequest.contact);
        }
      }
    } catch (smsError) {
      console.error('❌ Completion SMS Error:', smsError.message);
      // Don't fail the request if SMS fails
    }

    client.release();

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Send SMS notification to the victim
    console.log('🔔 Sending SMS notification to victim...');
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('⚠️ Twilio not configured properly - SMS notification skipped');
      } else {
        const updatedRequest = result.rows[0];
        
        // Get volunteer name for the message
        const volunteerQuery = await pool.query('SELECT name FROM volunteers WHERE id = $1', [volunteerId]);
        const volunteerName = volunteerQuery.rows[0]?.name || 'A volunteer';
        
        const message = `🆘 GOOD NEWS! Your emergency request (${updatedRequest.type}) has been ACCEPTED by volunteer ${volunteerName}. They will contact you soon at ${updatedRequest.contact}. Please stay safe! - RakshaMitra AI`;
        
        // Check if contact is a phone number
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (phoneRegex.test(updatedRequest.contact)) {
          const normalizedPhone = normalizePhoneNumber(updatedRequest.contact);
          console.log(`📱 Sending SMS to: ${normalizedPhone}`);
          
          const smsResult = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: normalizedPhone
          });
          
          console.log('✅ SMS sent successfully:', smsResult.sid);
        } else {
          console.log('📧 Contact appears to be email, SMS skipped:', updatedRequest.contact);
        }
      }
    } catch (smsError) {
      console.error('❌ SMS Error:', smsError.message);
      // Don't fail the request if SMS fails
    }
  } catch (error) {
    console.error('Error marking request as completed:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  let client;
  try {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const volunteerId = authResult.volunteerId;
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }    client = await pool.connect();

    console.log('PUT Emergency Request - Debug Info:');
    console.log('- volunteerId:', volunteerId);
    console.log('- requestId:', requestId);

    // Check if the request exists and is assigned to the volunteer
    const requestCheckQuery = `
      SELECT r.*, v.name as volunteer_name
      FROM requests r
      JOIN volunteers v ON v.id = $1
      WHERE r.id = $2 AND r.status = 'assigned' AND r.assigned_volunteer_id = $1;
    `;
    const requestCheckResult = await client.query(requestCheckQuery, [volunteerId, requestId]);
    
    console.log('Query result rowCount:', requestCheckResult.rowCount);
    if (requestCheckResult.rowCount > 0) {
      console.log('Found request:', requestCheckResult.rows[0]);
    } else {
      // Let's also check what requests exist for this volunteer
      const debugQuery = 'SELECT * FROM requests WHERE assigned_volunteer_id = $1';
      const debugResult = await client.query(debugQuery, [volunteerId]);
      console.log('All requests for volunteer:', debugResult.rows);
      
      // And check the specific request
      const specificQuery = 'SELECT * FROM requests WHERE id = $1';
      const specificResult = await client.query(specificQuery, [requestId]);
      console.log('Specific request:', specificResult.rows);
    }

    if (requestCheckResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not assigned, or not assigned to you.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestData = requestCheckResult.rows[0];    // Update the request status to in_progress (since 'emergency' is not in allowed statuses)
    const updateRequestQuery = `
      UPDATE requests
      SET status = $1
      WHERE id = $2 AND assigned_volunteer_id = $3
      RETURNING *;
    `;
    const updateRequestResult = await client.query(updateRequestQuery, ['in_progress', requestId, volunteerId]);
    if (updateRequestResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to mark request as emergency (status updated to in_progress)' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedRequest = updateRequestResult.rows[0];

    // Send email to government email address using Nodemailer
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@disaster-response.com',
      to: GOVERNMENT_EMAIL,
      subject: `Emergency Alert: Incident Reported at (${requestData.latitude}, ${requestData.longitude})`,
      html: `
        <h2>Emergency Incident Report</h2>
        <p><strong>Reported by Volunteer:</strong> ${requestData.volunteer_name}</p>
        <p><strong>Incident Location:</strong> Latitude ${requestData.latitude}, Longitude ${requestData.longitude}</p>
        <p><strong>Google Maps Link:</strong> <a href="https://www.google.com/maps?q=${requestData.latitude},${requestData.longitude}">View on Map</a></p>
        <p><strong>Request Type:</strong> ${requestData.type}</p>
        <p><strong>Urgency:</strong> ${requestData.urgency}</p>
        <p><strong>Description:</strong> ${requestData.description || 'No description provided.'}</p>
        <p><strong>Contact:</strong> ${requestData.contact}</p>
        <p><strong>Reported At:</strong> ${new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'medium',
        })}</p>
        <p>Please take immediate action to address this emergency.</p>
      `,    };    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`Emergency email sent to ${GOVERNMENT_EMAIL}`);
    } else {
      console.log('Email transporter not configured - skipping email notification');
    }

    // Send SMS emergency notifications
    console.log('🚨 Sending emergency SMS notifications...');
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('⚠️ Twilio not configured properly - SMS notifications skipped');
      } else {
        // Send SMS to victim
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (phoneRegex.test(requestData.contact)) {
          const normalizedPhone = normalizePhoneNumber(requestData.contact);
          console.log(`📱 Sending emergency SMS to victim: ${normalizedPhone}`);
          
          const victimMessage = `🚨 EMERGENCY UPDATE: Your request (${requestData.type}) has been escalated to emergency status by volunteer ${requestData.volunteer_name}. Emergency services have been notified. Location: https://maps.google.com/maps?q=${requestData.latitude},${requestData.longitude} - RakshaMitra AI`;
          
          const victimSMS = await twilioClient.messages.create({
            body: victimMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: normalizedPhone
          });
          
          console.log('✅ Emergency SMS sent to victim:', victimSMS.sid);
        } else {
          console.log('📧 Victim contact appears to be email, SMS skipped:', requestData.contact);
        }

        // Get volunteer phone number and send SMS notification
        const volunteerQuery = await client.query('SELECT contact FROM volunteers WHERE id = $1', [volunteerId]);
        if (volunteerQuery.rows.length > 0) {
          const volunteerContact = volunteerQuery.rows[0].contact;
          if (phoneRegex.test(volunteerContact)) {
            const normalizedVolunteerPhone = normalizePhoneNumber(volunteerContact);
            console.log(`📱 Sending emergency confirmation SMS to volunteer: ${normalizedVolunteerPhone}`);
            
            const volunteerMessage = `🚨 EMERGENCY ESCALATION CONFIRMED: You have successfully escalated request #${requestId} (${requestData.type}) to emergency status. Emergency services have been notified. Victim location: https://maps.google.com/maps?q=${requestData.latitude},${requestData.longitude} - RakshaMitra AI`;
            
            const volunteerSMS = await twilioClient.messages.create({
              body: volunteerMessage,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: normalizedVolunteerPhone
            });
            
            console.log('✅ Emergency confirmation SMS sent to volunteer:', volunteerSMS.sid);
          } else {
            console.log('📧 Volunteer contact appears to be email, SMS skipped:', volunteerContact);
          }
        }
      }
    } catch (smsError) {
      console.error('❌ Emergency SMS Error:', smsError.message);
      // Don't fail the request if SMS fails
    }// Trigger the /api/staff/alerts route to send alerts to nearby volunteers
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const alertResponse = await fetch(`${baseUrl}/api/staff/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: requestData.latitude,
        longitude: requestData.longitude,
        message: `Emergency Alert: ${requestData.type} incident reported by ${requestData.volunteer_name}. Urgency: ${requestData.urgency}. Description: ${requestData.description || 'No description provided.'}`,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!alertResponse.ok) {
      const alertErrorData = await alertResponse.json();
      console.error('Failed to send alerts to nearby volunteers:', alertErrorData);
      // Not throwing an error here to avoid failing the request; the email was already sent
    } else {
      const alertData = await alertResponse.json();
      console.log('Alerts sent to nearby volunteers:', alertData);
    }

    client.release();    return new Response(JSON.stringify({
      message: 'Emergency reported successfully! Request status updated to in_progress. Government notified and alerts sent to nearby volunteers.',
      request: updatedRequest,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (client) {
      client.release();
    }
    console.error('Error marking request as emergency:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },    });
  }
}