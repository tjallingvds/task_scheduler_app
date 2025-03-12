# SimpleTask - Task Management Application

A modern, full-stack task management application built with React/TypeScript and Vite for the frontend and Flask/Python for the backend.

## Features

- 📋 Create and manage task lists and folders
- ✅ Add, edit, and complete tasks
- 🗂️ Organize tasks with drag-and-drop functionality
- 📊 Dashboard with productivity statistics
- 🔐 Secure authentication with email/password or Google
- 👤 User profiles with customization options

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Firebase Authentication
- Tailwind CSS
- Shadcn UI Components
- Recharts & Chart.js for data visualization

### Backend
- Python 3
- Flask
- SQLAlchemy
- Flask-Login
- Firebase Admin SDK
- SQLite (default database)

## Prerequisites

Before you begin, ensure you have:
- Node.js 18.x or higher
- Python 3.10 or higher
- npm or yarn

## Installation

### Clone the repository
```bash
git clone https://github.com/yourusername/simpletask.git
cd simpletask
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
# or with yarn
yarn install
```

3. Create a `.env.local` file with your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Start the Vite development server:
```bash
npm run dev
# or with yarn
yarn dev
```

The development server will start at `http://localhost:5173` by default.

### Backend Setup

1. Navigate to the server directory:
```bash
cd ../server
```

2. Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with the necessary configuration:
```
SECRET_KEY=your-secret-key
FIREBASE_CREDENTIALS=your-base64-encoded-credentials
```

5. Run the Flask server:
```bash
python app.py
```

## Project Structure

```
simpletask/
├── client/                   # Frontend React application (Vite)
│   ├── public/               # Static files
│   ├── src/
│   │   ├── assets/           # Images, fonts, etc.
│   │   ├── components/       # React components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # UI components
│   │   ├── contexts/         # React context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and configuration
│   │   ├── pages/            # Page components
│   │   └── services/         # API and external services
│   ├── vite.config.ts        # Vite configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Frontend dependencies and scripts
├── server/                   # Backend Flask application
│   ├── static/               # Static files (user uploads)
│   ├── app.py                # Main Flask application
│   ├── models.py             # Database models
│   └── requirements.txt      # Python dependencies
```

## Usage

After starting both the frontend and backend servers:

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account or login with Google
3. Create task lists and start adding tasks
4. Use the sidebar to navigate between different lists
5. View your productivity stats on the dashboard

## Development

### Frontend Development

Vite provides a fast development experience with Hot Module Replacement (HMR):

- Start development server: `npm run dev`
- Run type checking: `npm run tsc -b`
- Run linting: `npm run lint`
- Build for production: `npm run build`
- Preview production build: `npm run preview` (serves the built files locally)

### Backend Development

- The Flask server runs in debug mode by default
- API endpoints are available at `http://localhost:5001/api/`

## Deployment

### Frontend Deployment

1. Build the production version:
```bash
cd client
npm run build
```

2. Deploy the `dist` directory to your web hosting service

### Backend Deployment

1. Set up a production web server (e.g., Gunicorn, uWSGI)
2. Configure your web server to serve the Flask application
3. Set environment variables for production settings
4. Consider using PostgreSQL or MySQL instead of SQLite in production

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Demo 

See the demo video here:
```
https://www.loom.com/share/85006c22ba63459d96683c31a461e5b0?sid=c3fd6b27-4794-4003-af7b-3e04a873d9fe
```