# 🌍 RescueConnect AI

**AI-Powered Disaster Relief Coordination System**  
A cutting-edge platform built to streamline disaster response through intelligent mapping, instant alerts, automated damage assessment, and secure coordination. Real-time coordination between victims, volunteers, and authorities via live mapping (Leaflet.js) and secure communication.

**By : Team Synergy**
---

## 🚀 Key Features

### ✅ Real-Time Disaster Mapping
- Interactive live maps powered by **Leaflet.js**
- Visualize affected zones, resource locations, and volunteer positions

### ✅ AI-Powered Evacuation Plans
- Personalized, adaptive evacuation routes using AI
- Considers live terrain, road status, and infrastructural data

### ✅ Instant Multi-Channel Alerts
- Emergency SMS alerts via **Twilio**
- Email updates and in-app notifications

### ✅ Automated Damage Assessment
- Analyzes satellite & social media data post-disaster
- Generates real-time damage and impact reports using AI/ML

### ✅ Secure Coordination Platform
- Match victims with volunteers using smart filters
- Role-based access with **Clerk** authentication

---

## 🛠 How to Setup

### 1️⃣ Clone & Install Dependencies

```bash
git clone https://github.com/your-username/rescueconnect-ai.git
npm install
```

2️⃣ Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:
```bash
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# JWT Secret for Authentication (Required)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Cloudinary Configuration (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio SMS Configuration (Optional - for emergency alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Email Configuration (Optional - for notifications)
NODEMAILER_EMAIL=your_email@example.com
NODEMAILER_PASSWORD=your_app_password
```

3️⃣ Initialize Database
```bash
npm run init-db
```

4️⃣ Run Locally
```bash
npm run dev
# OR for complete setup:
npm run setup
```

5️⃣ Access Application
```bash
Visit: http://localhost:3000
```

## 🚀 Tech Stack

### 🖥️ Frontend
- **Next.js** – React-based framework for SSR & SSG
- **Tailwind CSS** – Utility-first CSS framework for rapid UI development
- **Framer Motion** – Smooth and powerful animations for React

### 🔧 Backend
- **Express.js** – Minimal and flexible Node.js web application framework
- **PostgreSQL** – Powerful, open-source relational database
- **NeonDB** – Serverless PostgreSQL database with autoscaling and branching support

### 🔐 Authentication
- **JWT (JSON Web Tokens)** – For stateless and secure authentication

### 📡 APIs & Integrations
- **Cloudinary** – Image storage and transformation
- **Twilio** – SMS notification system
- **Nodemailer** – For email services
- **Leaflet** – Interactive map implementation

---

## 🔧 Backend Status & Recent Improvements

### ✅ **Fixed Issues**
- **Database Connection**: Standardized PostgreSQL connection pooling across all API routes
- **API Endpoints**: Fixed missing `/api/volunteers` endpoint (was causing 404 errors)
- **Request Processing**: Improved `/api/requests` with consistent database handling
- **Alert System**: Enhanced `/api/alerts` with proper resource management
- **Code Quality**: Removed syntax errors and improved error handling

### ✅ **Database Schema**
- Complete schema with users, staff, volunteers, requests, disasters, alerts tables
- Proper indexing for optimal performance
- Foreign key constraints for data integrity
- Sample data included for immediate testing

### ✅ **Development Tools**
- Automated database initialization: `npm run init-db`
- Complete setup command: `npm run setup`
- Environment template provided
- Comprehensive error handling and logging

### 🔄 **API Endpoints Status**
- ✅ `GET/POST /api/volunteers` - Volunteer management
- ✅ `GET /api/requests` - Emergency requests
- ✅ `POST /api/alerts` - Multi-channel emergency alerts
- ✅ `POST /api/user/login` - User authentication
- ✅ `POST /api/staff/login` - Staff authentication
- ✅ `POST /api/staff/requests` - Request submission

### 🚀 **Ready for Hackathon Demo**
The backend is now fully functional and ready for presentation with:
- Real-time disaster tracking
- Volunteer coordination system
- Emergency alert distribution
- Image upload capabilities
- Geolocation-based services

---

🤝 Contributing
# 1. Fork the repository
# (Click the "Fork" button on the top right of the GitHub page)

# 2. Clone your fork locally
git clone https://github.com/your-username/project-name.git
cd project-name

# 3. Create a new branch for your feature
git checkout -b feature-name

# 4. Make your changes and commit
git add .
git commit -m "Add feature"

# 5. Push to your forked repository
git push origin feature-name

---

**By : Team Synergy**
