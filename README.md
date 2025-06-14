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
Create a .env.local file in the root directory and add the following:
```bash
NEXT_PUBLIC_CONVEX_URL=your-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-key
CLERK_SECRET_KEY=your-secret
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

3️⃣ Run Locally
```bash
npm run dev
```

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
