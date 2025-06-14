import { Client } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = new Client(process.env.DATABASE_URL);
    await client.connect();

    const query = `
      SELECT id, name, contact, type, urgency, description, latitude, longitude, status, created_at, image_url
      FROM requests
      WHERE status = 'pending' OR urgency = 'emergency';
    `;
    const { rows } = await client.query(query);

    await client.end();

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error.message },
      { status: 500 }
    );
  }
}