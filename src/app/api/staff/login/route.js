import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";

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
    }

    client.release();

    // Return success response with staff details (excluding password)
    const { password: _, ...staffWithoutPassword } = staff;
    return NextResponse.json(
      { message: "Login successful.", staff: staffWithoutPassword },
      { status: 200 }
    );

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}