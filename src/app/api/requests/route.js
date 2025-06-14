import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    const query = `
      SELECT id, name, contact, type, urgency, description, latitude, longitude, status, created_at, image_url
      FROM requests
      WHERE status = 'pending' OR urgency = 'Critical'
      ORDER BY created_at DESC, urgency DESC;
    `;
    const result = await client.query(query);
    client.release();

    return NextResponse.json(
      {
        message: "Requests retrieved successfully.",
        requests: result.rows,
        count: result.rows.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch requests',
        error: error.message,
        requests: [],
        count: 0
      },
      { status: 500 }
    );
  }
}