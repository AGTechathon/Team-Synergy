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
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const GOVERNMENT_EMAIL = process.env.GOVERNMENT_EMAIL || 'government@example.com';

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

// Normalize phone number to E.164 format
const normalizePhoneNumber = (phone) => {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = `+1${cleaned}`; // Assuming US numbers; adjust country code as needed
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
      'UPDATE requests SET status = $1, assigned_to = $2 WHERE id = $3 AND LOWER(status) = LOWER($4) RETURNING *',
      ['accepted', volunteerId, requestId, 'pending']
    );

    client.release();

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Request not found or already accepted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    }

    const client = await pool.connect();

    // Check if the request exists and is assigned to the volunteer
    const requestCheck = await client.query(
      'SELECT contact FROM requests WHERE id = $1 AND assigned_to = $2 AND LOWER(status) = LOWER($3)',
      [requestId, volunteerId, 'accepted']
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Normalize the contact number
    const normalizedContact = normalizePhoneNumber(userContact);
    console.log('Normalized Contact:', normalizedContact);

    // Update the request status to completed
    const result = await client.query(
      'UPDATE requests SET status = $1 WHERE id = $2 AND assigned_to = $3 RETURNING *',
      ['completed', requestId, volunteerId]
    );

    if (result.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to mark request as completed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send SMS to the user
    try {
      const message = await twilioClient.messages.create({
        body: 'Your request has been completed by our volunteer. Thank you for using the Disaster Crisis Response Platform.',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: normalizedContact,
      });
      console.log('SMS sent successfully:', message.sid);
    } catch (smsError) {
      console.error('Detailed SMS Error:', smsError.message, smsError.code, smsError.status);
      client.release();
      return new Response(JSON.stringify({ 
        error: `Request marked as completed, but failed to send SMS: ${smsError.message}`,
        normalizedContact 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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
    }

    client = await pool.connect();

    // Check if the request exists and is assigned to the volunteer
    const requestCheckQuery = `
      SELECT r.*, v.name as volunteer_name
      FROM requests r
      JOIN volunteers v ON v.id = $1
      WHERE r.id = $2 AND r.status = 'accepted' AND r.assigned_to = $1;
    `;
    const requestCheckResult = await client.query(requestCheckQuery, [volunteerId, requestId]);
    if (requestCheckResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not accepted, or not assigned to you.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestData = requestCheckResult.rows[0];

    // Update the request status to emergency
    const updateRequestQuery = `
      UPDATE requests
      SET status = $1
      WHERE id = $2 AND assigned_to = $3
      RETURNING *;
    `;
    const updateRequestResult = await client.query(updateRequestQuery, ['emergency', requestId, volunteerId]);
    if (updateRequestResult.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Failed to mark request as emergency' }), {
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
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Emergency email sent to ${GOVERNMENT_EMAIL}`);

    // Trigger the /api/staff/alerts route to send alerts to nearby volunteers
    const alertResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/staff/alerts`, {
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

    client.release();

    return new Response(JSON.stringify({
      message: 'Request marked as emergency. Government notified and alerts sent to nearby volunteers.',
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}