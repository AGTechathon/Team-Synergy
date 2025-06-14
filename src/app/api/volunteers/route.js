import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET(req) {
  try {
    const client = await pool.connect();
    
    const query = `
      SELECT id, name, contact, skills, location, availability, status, created_at
      FROM volunteers 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(query);
    client.release();

    return NextResponse.json(
      { 
        message: "Volunteers retrieved successfully.",
        volunteers: result.rows,
        count: result.rows.length
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    return NextResponse.json(
      { 
        message: "Failed to fetch volunteers.",
        error: err.message,
        volunteers: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    const contact = formData.get('contact');
    const skills = formData.get('skills');
    const location = formData.get('location');
    const availability = formData.get('availability') || 'available';

    // Validate required fields
    if (!name || !contact) {
      return NextResponse.json(
        { message: "Name and contact are required fields." },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    const insertQuery = `
      INSERT INTO volunteers (name, contact, skills, location, availability, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *;
    `;
    
    const values = [name, contact, skills || null, location || null, availability];
    const result = await client.query(insertQuery, values);
    
    client.release();

    return NextResponse.json(
      {
        message: "Volunteer registered successfully.",
        volunteer: result.rows[0]
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error registering volunteer:", err);
    return NextResponse.json(
      { message: "Failed to register volunteer.", error: err.message },
      { status: 500 }
    );
  }
}