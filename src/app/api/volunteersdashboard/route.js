import db from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Helper function to check if SMS can be sent in trial mode
const canSendSMS = (phoneNumber) => {
  if (process.env.TWILIO_TRIAL_MODE !== 'true') {
    return true; // Not in trial mode, can send to any number
  }
  
  const verifiedNumbers = (process.env.TWILIO_VERIFIED_NUMBERS || '').split(',').map(n => n.trim());
  return verifiedNumbers.includes(phoneNumber);
};

// Helper function to send SMS with trial mode handling
const sendSMSWithTrialHandling = async (to, body, context = '') => {
  const normalizedPhone = normalizePhoneNumber(to);
  
  if (!canSendSMS(normalizedPhone)) {
    console.log(`⚠️ TRIAL MODE: Skipping SMS to ${normalizedPhone} (not verified) - ${context}`);
    console.log(`📝 Would have sent: "${body}"`);
    return { skipped: true, reason: 'unverified_trial_number' };
  }
  
  try {
    console.log(`📱 Sending SMS to: ${normalizedPhone} - ${context}`);
    const result = await twilioClient.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });
    console.log(`✅ SMS sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ SMS Error to ${normalizedPhone}:`, error.message);
    return { error: error.message, code: error.code };
  }
};

const authenticateToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Authorization header missing', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded, volunteerId: decoded.id };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
};

// Normalize phone number to E.164 format for India
const normalizePhoneNumber = (phone) => {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = `+91${cleaned}`; // Indian country code
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
    }    const client = await db.connect();
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
    }    const client = await db.connect();

    // Get the request details for SMS notification
    const requestCheck = await client.query(
      'SELECT r.*, u.contact as user_contact FROM requests r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND LOWER(r.status) = LOWER($2)',
      [requestId, 'pending']
    );

    if (requestCheck.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found or already accepted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });    }    const requestData = requestCheck.rows[0];
    // Try to get user contact from users table first, fall back to request contact
    const userContact = requestData.user_contact || requestData.contact;
    
    console.log('🔍 Request acceptance debug:');
    console.log('Request ID:', requestId);
    console.log('Volunteer ID:', volunteerId);
    console.log('User contact from users table:', requestData.user_contact);
    console.log('User contact from request:', requestData.contact);
    console.log('Final user contact:', userContact);

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
    }    // Send SMS notification to the victim
    if (userContact) {
      try {        console.log(`📱 Sending acceptance SMS to victim: ${normalizedContact}`);
        const message = await sendSMSWithTrialHandling(
          normalizedContact,
          `✅ Good news! Your emergency request has been accepted by a volunteer. They will be contacting you shortly to assist with: ${requestData.description || 'your request'}.`,
          'Request Acceptance - Victim'
        );
        if (message.success) {
          console.log('SMS sent to victim successfully:', message.sid);
        }
      } catch (smsError) {
        console.error('Failed to send SMS to victim:', smsError.message);
        // Don't fail the request acceptance if SMS fails
      }
    }

    // Send SMS notification to the volunteer for confirmation
    const volunteerQuery = await client.query(
      'SELECT contact FROM volunteers WHERE id = $1',
      [volunteerId]
    );
    const volunteerContact = volunteerQuery.rows[0]?.contact;
    
    if (volunteerContact) {
      try {
        console.log(`📱 Sending acceptance confirmation SMS to volunteer: ${volunteerContact}`);
        const volunteerMessage = await sendSMSWithTrialHandling(
          volunteerContact,
          `✅ REQUEST ACCEPTED: You have successfully accepted emergency request ID ${requestId}. Location: ${requestData.location || 'Not specified'}. Description: ${requestData.description || 'No description'}. Please contact the victim immediately.`,
          'Request Acceptance - Volunteer'
        );
        if (volunteerMessage.success) {
          console.log('SMS sent to volunteer successfully:', volunteerMessage.sid);
        }
      } catch (smsError) {
        console.error('Failed to send SMS to volunteer:', smsError.message);
        // Don't fail the request acceptance if SMS fails
      }
    }

    client.release();

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
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
    }    const client = await db.connect();

    // Check if the request exists and is assigned to the volunteer
    const requestCheck = await client.query(
      'SELECT r.*, u.contact as user_contact FROM requests r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND r.assigned_volunteer_id = $2 AND LOWER(r.status) = LOWER($3)',
      [requestId, volunteerId, 'assigned']
    );

    if (requestCheck.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not assigned to you, or not in accepted status' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });    }

    // Try to get user contact from users table first, fall back to request contact
    const userContact = requestCheck.rows[0].user_contact || requestCheck.rows[0].contact;
    
    console.log('🔍 Request completion debug:');
    console.log('Request ID:', requestId);
    console.log('Volunteer ID:', volunteerId);
    console.log('User contact from users table:', requestCheck.rows[0].user_contact);
    console.log('User contact from request:', requestCheck.rows[0].contact);
    console.log('Final user contact:', userContact);

    // Validate contact number
    if (!userContact) {
      client.release();
      return new Response(JSON.stringify({ error: 'User contact number is missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },      });
    }

    // Normalize the contact number
    const normalizedContact = normalizePhoneNumber(userContact);

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
    }    // Send SMS to the victim
    try {
      console.log(`📱 Sending completion SMS to victim: ${userContact}`);
      const victimResult = await sendSMSWithTrialHandling(
        userContact,
        '✅ Your request has been completed by our volunteer. Thank you for using the Disaster Crisis Response Platform.',
        'Request Completion - Victim'
      );
      if (victimResult.success) {
        console.log('SMS sent to victim successfully:', victimResult.sid);
      }
    } catch (smsError) {
      console.error('Failed to send SMS to victim:', smsError.message);
      // Continue even if SMS fails
    }

    // Send SMS confirmation to the volunteer
    const volunteerQuery = await client.query(
      'SELECT contact FROM volunteers WHERE id = $1',
      [volunteerId]
    );
    const volunteerContact = volunteerQuery.rows[0]?.contact;
    
    if (volunteerContact) {
      try {
        console.log(`📱 Sending completion confirmation SMS to volunteer: ${volunteerContact}`);
        const volunteerResult = await sendSMSWithTrialHandling(
          volunteerContact,
          `✅ TASK COMPLETED: You have successfully completed request ID ${requestId}. Thank you for your service! The victim has been notified of the completion.`,
          'Request Completion - Volunteer'
        );
        if (volunteerResult.success) {
          console.log('SMS sent to volunteer successfully:', volunteerResult.sid);
        }
      } catch (smsError) {
        console.error('Failed to send SMS to volunteer:', smsError.message);
        // Continue even if SMS fails
      }
    }

    client.release();

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error marking request as completed:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
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
    }    const client = await db.connect();    // Check if the request exists and is assigned to the volunteer
    const requestCheck = await client.query(
      'SELECT r.*, u.contact as user_contact FROM requests r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND r.assigned_volunteer_id = $2 AND LOWER(r.status) = LOWER($3)',
      [requestId, volunteerId, 'assigned']
    );

    if (requestCheck.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not assigned to you, or not in accepted status' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestData = requestCheck.rows[0];
    // Try to get user contact from users table first, fall back to request contact
    const userContact = requestData.user_contact || requestData.contact;
    
    console.log('🔍 Emergency escalation debug:');
    console.log('Request ID:', requestId);
    console.log('Volunteer ID:', volunteerId);
    console.log('Request data:', requestData);
    console.log('User contact from users table:', requestData.user_contact);
    console.log('User contact from request:', requestData.contact);
    console.log('Final user contact:', userContact);

    // Update the request status to emergency
    const result = await client.query(
      'UPDATE requests SET status = $1 WHERE id = $2 AND assigned_volunteer_id = $3 RETURNING *',
      ['emergency', requestId, volunteerId]
    );

    if (result.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to mark request as emergency' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }    // Send SMS notifications for emergency escalation
    console.log('🚨 Sending emergency SMS notifications...');

    // Get volunteer contact information
    const volunteerQuery = await client.query(
      'SELECT contact FROM volunteers WHERE id = $1',
      [volunteerId]
    );
    const volunteerContact = volunteerQuery.rows[0]?.contact;
    
    console.log('Volunteer contact from DB:', volunteerContact);
    console.log('🔍 Will send SMS to:');
    console.log('- Victim (from request):', userContact);
    console.log('- Volunteer (from volunteers table):', volunteerContact);

    // SMS to the victim
    if (userContact) {
      try {
        console.log(`📱 Sending emergency SMS to victim: ${userContact}`);
        const victimResult = await sendSMSWithTrialHandling(
          userContact,
          `🚨 EMERGENCY ALERT: Your request has been escalated to emergency status. Emergency services have been notified and will respond immediately. Stay safe and follow any instructions from responders.`,
          'Emergency Escalation - Victim'
        );
        if (victimResult.success) {
          console.log(`✅ Emergency SMS sent to victim: ${victimResult.sid}`);
        }
      } catch (error) {
        console.error('Failed to send SMS to victim for emergency:', error.message);
      }
    }    // SMS to the volunteer who escalated
    if (volunteerContact) {
      try {
        console.log(`📱 Sending emergency confirmation SMS to volunteer: ${volunteerContact}`);
        const volunteerResult = await sendSMSWithTrialHandling(
          volunteerContact,
          `🚨 EMERGENCY ESCALATION CONFIRMED: You have successfully escalated request ID ${requestId} to emergency status. Emergency services have been notified. Continue monitoring the situation and provide updates as needed.`,
          'Emergency Escalation - Volunteer'
        );
        if (volunteerResult.success) {
          console.log(`✅ Emergency SMS sent to volunteer: ${volunteerResult.sid}`);
        }
      } catch (error) {
        console.error('Failed to send SMS to volunteer for emergency:', error.message);
      }
    }

    client.release();

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error marking request as emergency:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
