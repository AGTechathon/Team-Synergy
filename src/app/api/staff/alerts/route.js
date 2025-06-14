import { NextResponse } from 'next/server';
import pool from "../../../../../lib/db";

// POST /api/staff/alerts - Create and send an emergency alert
export async function POST(request) {
  let client;
  try {
    // Connect to the database
    client = await pool.connect();

    // Parse the request body
    const body = await request.json();
    const { latitude, longitude, message, timestamp } = body;

    // Validate required fields
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return NextResponse.json({ message: 'Invalid latitude. Must be a number between -90 and 90.' }, { status: 400 });
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return NextResponse.json({ message: 'Invalid longitude. Must be a number between -180 and 180.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ message: 'Message is required and must be a string.' }, { status: 400 });
    }

    if (!timestamp || isNaN(Date.parse(timestamp))) {
      return NextResponse.json({ message: 'Timestamp is required and must be a valid ISO date string.' }, { status: 400 });
    }

    // Find nearby volunteers within 10 km using PostGIS
    // ST_DWithin checks distance in meters; 10 km = 10,000 meters
    const nearbyVolunteersQuery = `
      SELECT id, name, contact
      FROM volunteers
      WHERE location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        10000
      );
    `;
    const nearbyVolunteersResult = await client.query(nearbyVolunteersQuery, [longitude, latitude]);

    const nearbyVolunteers = nearbyVolunteersResult.rows;

    if (!nearbyVolunteers || nearbyVolunteers.length === 0) {
      client.release();
      return NextResponse.json({ message: 'No volunteers found within 10 km of the specified location.' }, { status: 404 });
    }

    // Start a transaction to insert the alert and its recipients
    await client.query('BEGIN');

    // Insert the alert into the alerts table
    const insertAlertQuery = `
      INSERT INTO alerts (latitude, longitude, message, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at;
    `;
    const alertValues = [latitude, longitude, message, timestamp];
    const alertResult = await client.query(insertAlertQuery, alertValues);
    const alertId = alertResult.rows[0].id;
    const createdAt = alertResult.rows[0].created_at;

    // Insert recipients into the alert_recipients table
    const insertRecipientsQuery = `
      INSERT INTO alert_recipients (alert_id, volunteer_id, name, contact)
      VALUES ${nearbyVolunteers.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')};
    `;
    const recipientValues = nearbyVolunteers.flatMap((volunteer) => [
      alertId,
      volunteer.id,
      volunteer.name,
      volunteer.contact,
    ]);
    await client.query(insertRecipientsQuery, recipientValues);

    // Commit the transaction
    await client.query('COMMIT');

    // Prepare the recipients array for the response
    const recipients = nearbyVolunteers.map((volunteer) => ({
      volunteerId: volunteer.id,
      name: volunteer.name,
      contact: volunteer.contact,
    }));

    // Simulate sending alerts to recipients (in production, integrate with SMS, email, or push notification service)
    console.log(`Sending alert to ${recipients.length} volunteers:`);
    recipients.forEach((recipient) => {
      console.log(`- To: ${recipient.name} (${recipient.contact}): ${message}`);
    });

    client.release();

    // Return success response
    return NextResponse.json(
      {
        message: `Alert sent successfully to ${recipients.length} volunteer(s).`,
        alert: {
          id: alertId,
          latitude,
          longitude,
          recipients,
          message,
          timestamp,
          createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Error in POST /api/staff/alerts:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to send alert.' },
      { status: 500 }
    );
  }
}

// GET /api/staff/alerts - Retrieve all alerts (for debugging or admin purposes)
export async function GET() {
  let client;
  try {
    client = await pool.connect();

    // Fetch all alerts with their recipients
    const alertsQuery = `
      SELECT a.id, a.latitude, a.longitude, a.message, a.timestamp, a.created_at,
             json_agg(
               json_build_object(
                 'volunteerId', ar.volunteer_id,
                 'name', ar.name,
                 'contact', ar.contact
               )
             ) as recipients
      FROM alerts a
      LEFT JOIN alert_recipients ar ON a.id = ar.alert_id
      GROUP BY a.id;
    `;
    const alertsResult = await client.query(alertsQuery);
    const alerts = alertsResult.rows.map((row) => ({
      id: row.id,
      latitude: row.latitude,
      longitude: row.longitude,
      message: row.message,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      recipients: row.recipients.filter((r) => r.volunteerId !== null), // Filter out null recipients if no recipients exist
    }));

    client.release();

    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    if (client) {
      client.release();
    }
    console.error('Error in GET /api/staff/alerts:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve alerts.' },
      { status: 500 }
    );
  }
}