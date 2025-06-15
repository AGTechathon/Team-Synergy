import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Error parsing request body:", err);
    return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
  }

  const { contact, password } = body;

  // Validate required fields
  if (!contact || !password) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    console.log("Database connection established");

    // Check if the staff member exists by contact (email or phone)
    const checkQuery = "SELECT * FROM staff WHERE contact = $1";
    const result = await client.query(checkQuery, [contact]);
    console.log("Check query result:", result.rows);

    if (result.rows.length === 0) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const staff = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, staff.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }    client.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: staff.id, 
        contact: staff.contact, 
        role: staff.role || 'staff',
        type: 'staff'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response with staff details and token
    const { password: _, ...staffWithoutPassword } = staff;
    return NextResponse.json(
      { 
        message: "Login successful.", 
        staff: staffWithoutPassword,
        token: token
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}