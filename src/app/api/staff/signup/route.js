import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    // Parse FormData
    const formData = await req.formData();
    const name = formData.get('name');
    const contact = formData.get('contact');
    const password = formData.get('password');
    const role = formData.get('role') || 'responder';
    const department = formData.get('department');
    const certification = formData.get('certification');

    // Validate required fields
    if (!name || !contact || !password) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ message: "Server configuration error. Please contact administrator." }, { status: 500 });
    }

    // Check if staff already exists
    const client = await pool.connect();
    const checkQuery = "SELECT * FROM staff WHERE contact = $1";
    const result = await client.query(checkQuery, [contact]);

    if (result.rows.length > 0) {
      client.release();
      return NextResponse.json({ message: "Staff member already exists." }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into staff database
    const insertQuery = `
      INSERT INTO staff (name, contact, password, role, department, certification)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [name, contact, hashedPassword, role, department || null, certification || null];
    const newStaff = await client.query(insertQuery, values);

    // Generate JWT token
    const token = jwt.sign(
      { id: newStaff.rows[0].id, contact: newStaff.rows[0].contact, name: newStaff.rows[0].name, role: newStaff.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    client.release();
    return NextResponse.json(
      {
        message: "Staff member created successfully.",
        staff: newStaff.rows[0],
        token: token
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}