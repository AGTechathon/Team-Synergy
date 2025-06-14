#!/usr/bin/env node

/**
 * Database Initialization Script for RescueConnect AI
 * Run this script to set up the database schema and sample data
 * 
 * Usage: node scripts/init-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../lib/init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('📋 Creating tables and indexes...');
    await client.query(sql);
    
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Database Schema Summary:');
    
    // Get table information
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📦 Tables created:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check for sample data
    const volunteerCount = await client.query('SELECT COUNT(*) FROM volunteers');
    const disasterCount = await client.query('SELECT COUNT(*) FROM disasters');
    
    console.log('\n📈 Sample Data:');
    console.log(`   ✓ Volunteers: ${volunteerCount.rows[0].count}`);
    console.log(`   ✓ Disasters: ${disasterCount.rows[0].count}`);
    
    console.log('\n🎉 Database is ready for RescueConnect AI!');
    console.log('💡 You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if DATABASE_URL is set in .env.local');
    console.error('   2. Verify database connection and credentials');
    console.error('   3. Ensure the database exists and is accessible');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };