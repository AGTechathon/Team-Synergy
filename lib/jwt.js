import jwt from 'jsonwebtoken';

// Secret key for signing JWTs (store this in an environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Generate a JWT token
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
}

// Verify a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}