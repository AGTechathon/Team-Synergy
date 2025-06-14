import db from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';

// Log Twilio credentials to verify they're loaded
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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
      'SELECT * FROM requests WHERE id = $1 AND assigned_to = $2 AND LOWER(status) = LOWER($3)',
      [requestId, volunteerId, 'accepted']
    );

    if (requestCheck.rowCount === 0) {
      client.release();
      return new Response(JSON.stringify({ error: 'Request not found, not assigned to you, or not in accepted status' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the request status to emergency
    const result = await client.query(
      'UPDATE requests SET status = $1 WHERE id = $2 AND assigned_to = $3 RETURNING *',
      ['emergency', requestId, volunteerId]
    );

    client.release();

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Failed to mark request as emergency' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
