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
    const contactMethod = formData.get('contactMethod') || 'email'; // Default to email if not provided

    // Validate required fields
    if (!name || !contact || !password) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Validate name (letters and spaces, min 2 characters)
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json({ message: "Name must contain only letters and spaces, minimum 2 characters." }, { status: 400 });
    }

    // Validate contact based on contactMethod
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
    if (contactMethod === 'email' && !emailRegex.test(contact)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }
    if (contactMethod === 'phone' && !phoneRegex.test(contact)) {
      return NextResponse.json({ message: "Please enter a valid phone number (e.g., +1234567890)." }, { status: 400 });
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const client = await pool.connect();
    const checkQuery = "SELECT * FROM users WHERE contact = $1";
    const result = await client.query(checkQuery, [contact]);

    if (result.rows.length > 0) {
      client.release();
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const insertQuery = `
      INSERT INTO users (name, contact, password, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [name, contact, hashedPassword, '2025-05-31 11:19:00']; // Current timestamp
    const newUser = await client.query(insertQuery, values);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.rows[0].id, contact: newUser.rows[0].contact },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    client.release();
    return NextResponse.json(
      {
        message: "User created successfully.",
        user: newUser.rows[0],
        token: token
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}