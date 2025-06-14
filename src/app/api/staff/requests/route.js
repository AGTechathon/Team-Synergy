import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import { v2 as cloudinary } from 'cloudinary';

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
    const type = formData.get('type');
    const urgency = formData.get('urgency');
    const description = formData.get('description');
    const latitude = parseFloat(formData.get('latitude'));
    const longitude = parseFloat(formData.get('longitude'));
    const image = formData.get('image');

    // Validate required fields
    if (!name || !contact || !type || !urgency || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Validate latitude and longitude
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ message: "Latitude must be a number between -90 and 90." }, { status: 400 });
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ message: "Longitude must be a number between -180 and 180." }, { status: 400 });
    }

    // Validate type and urgency against allowed values
    const validTypes = ['Medical', 'Rescue', 'Supplies', 'Shelter', 'Other'];
    const validUrgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: "Invalid request type." }, { status: 400 });
    }
    if (!validUrgencyLevels.includes(urgency)) {
      return NextResponse.json({ message: "Invalid urgency level." }, { status: 400 });
    }

    // Connect to the database
    const client = await pool.connect();
    console.log("Database connection established for unauthenticated request");

    try {
      // Check for existing request with the same latitude and longitude
      const checkQuery = `
        SELECT * FROM requests 
        WHERE latitude = $1 AND longitude = $2;
      `;
      const checkResult = await client.query(checkQuery, [latitude, longitude]);
      console.log("Check for duplicate coordinates:", checkResult.rows);

      if (checkResult.rows.length > 0) {
        client.release();
        return NextResponse.json(
          { message: "A request with the same latitude and longitude already exists." },
          { status: 400 }
        );
      }

      let imageUrl = null;
      if (image && image instanceof File) {
        try {
          // Convert the File to a Buffer
          const arrayBuffer = await image.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'disaster_requests' },
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

          imageUrl = uploadResult.secure_url;
        } catch (err) {
          client.release();
          return NextResponse.json({ message: "Failed to upload image to Cloudinary.", error: err.message }, { status: 500 });
        }
      }

      // Insert into database
      const insertQuery = `
        INSERT INTO requests (name, contact, type, urgency, description, latitude, longitude, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const values = [name, contact, type, urgency, description || null, latitude, longitude, imageUrl || null];
      const result = await client.query(insertQuery, values);
      console.log("New request inserted (unauthenticated):", result.rows[0]);

      client.release();

      return NextResponse.json(
        { message: "Request created successfully.", request: result.rows[0] },
        { status: 201 }
      );
    } catch (err) {
      client.release();
      throw err; // Re-throw the error to be caught by the outer try-catch
    }
  } catch (err) {
    console.error("Request creation error:", err);
    return NextResponse.json({ message: "Server error.", error: err.message }, { status: 500 });
  }
}