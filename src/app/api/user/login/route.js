import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    // Parse FormData
    const formData = await req.formData();
    const contact = formData.get('contact');
    const password = formData.get('password');
    const contactMethod = formData.get('contactMethod') || 'email';

    // Validate required fields
    if (!contact || !password) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Validate contact based on contactMethod
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;

    if (contactMethod === 'email') {
      if (!emailRegex.test(contact)) {
        return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
      }
      if (phoneRegex.test(contact)) {
        return NextResponse.json({ message: "Please provide an email address, not a phone number." }, { status: 400 });
      }
    } else if (contactMethod === 'phone') {
      if (!phoneRegex.test(contact)) {
        return NextResponse.json({ message: "Please enter a valid phone number (e.g., +1234567890)." }, { status: 400 });
      }
      if (emailRegex.test(contact)) {
        return NextResponse.json({ message: "Please provide a phone number, not an email address." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: "Invalid contact method. Must be 'email' or 'phone'." }, { status: 400 });
    }

    // Check if user exists
    const client = await pool.connect();
    const queryText = "SELECT * FROM users WHERE contact = $1";
    const result = await client.query(queryText, [contact]);

    if (result.rows.length === 0) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      client.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, contact: user.contact, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    client.release();
    return NextResponse.json(
      {
        message: "Login successful.",
        user: { id: user.id, name: user.name, contact: user.contact },
        token: token
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}