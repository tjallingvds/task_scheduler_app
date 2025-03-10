# SimpleTask 📋

SimpleTask is a powerful, hierarchical task management application built with React, TypeScript, Flask, and Firebase authentication.

## 🌟 Features

- **Hierarchical Task Management**
  - Create nested tasks up to 10 levels deep
  - Drag and drop tasks to reorder or create subtasks
  - Expand and collapse task hierarchies

- **User Authentication**
  - Email/Password Registration
  - Google and GitHub OAuth Login
  - Secure Firebase Authentication

- **Task List Organization**
  - Create task lists and folders
  - Drag task lists into folders
  - Filter and search tasks

- **Task Customization**
  - Add descriptions
  - Set priorities
  - Add due dates
  - Add tags

## 🛠 Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- React Router
- Firebase Authentication

### Backend
- Flask
- SQLAlchemy
- Firebase Admin SDK
- Flask-Login
- Bcrypt

## 📦 Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- pip
- Firebase Project

## 🚀 Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/simpletask.git
cd simpletask
```

### 2. Frontend Setup
```bash
cd client
npm install
```

### 3. Backend Setup
```bash
cd ../server
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 4. Firebase Configuration
1. Create a Firebase project
2. Enable Authentication (Email/Password, Google, GitHub)
3. Create a service account and download credentials
4. Set up environment variables:

#### Client (.env in client folder)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Server (.env in server folder)
```
FIREBASE_CREDENTIALS=base64_encoded_service_account_json
SECRET_KEY=your_secret_key
```

### 5. Run the Application

#### Frontend
```bash
cd client
npm run dev
```

#### Backend
```bash
cd server
python app.py
```

## 🧪 Testing
- Frontend: `npm test`
- Backend: `python -m pytest`

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact
Your Name - youremail@example.com

Project Link: [https://github.com/yourusername/simpletask](https://github.com/yourusername/simpletask)
