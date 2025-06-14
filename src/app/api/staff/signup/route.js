import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    // Parse FormData
    const formData = await req.formData();
    const name = formData.get('name');
    const contact = formData.get('contact');
    const password = formData.get('password');
    const skills = formData.get('skills');
    const certifications = JSON.parse(formData.get('certifications') || '[]');
    const aadhaarImage = formData.get('aadhaarImage');

    // Validate required fields
    if (!name || !contact || !password) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Check if volunteer already exists
    const client = await pool.connect();
    const checkQuery = "SELECT * FROM volunteers WHERE contact = $1";
    const result = await client.query(checkQuery, [contact]);

    if (result.rows.length > 0) {
      client.release();
      return NextResponse.json({ message: "Volunteer already exists." }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload Aadhaar card image to Cloudinary if provided
    let aadhaarImageUrl = null;
    if (aadhaarImage && aadhaarImage instanceof File) {
      try {
        const arrayBuffer = await aadhaarImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'volunteer_aadhaar' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('Cloudinary upload successful:', result);
                resolve(result);
              }
            }
          );
          uploadStream.end(buffer);
        });

        aadhaarImageUrl = uploadResult.secure_url;
      } catch (err) {
        client.release();
        return NextResponse.json({ message: "Failed to upload Aadhaar card image to Cloudinary.", error: err.message }, { status: 500 });
      }
    }

    // Insert into database
    const insertQuery = `
      INSERT INTO volunteers (name, contact, password, skills, certifications, aadhaar_image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [name, contact, hashedPassword, skills || null, certifications, aadhaarImageUrl || null];
    const newVolunteer = await client.query(insertQuery, values);

    // Generate JWT token
    const token = jwt.sign(
      { id: newVolunteer.rows[0].id, contact: newVolunteer.rows[0].contact },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    client.release();
    return NextResponse.json(
      {
        message: "Volunteer created successfully.",
        volunteer: newVolunteer.rows[0],
        token: token
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}