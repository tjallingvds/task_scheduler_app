import os
import json
import base64
import traceback
from models import db, User, TaskList, Task
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from firebase_admin import credentials, initialize_app, auth
import firebase_admin
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

def initialize_firebase_app():
    try:
        # Check if Firebase credentials are in environment variable
        firebase_creds_str = os.environ.get('FIREBASE_CREDENTIALS')
        
        if not firebase_creds_str:
            raise ValueError("Firebase credentials not found in environment variables")
        
        try:
            # Try to decode base64 encoded credentials
            firebase_creds_json = json.loads(base64.b64decode(firebase_creds_str).decode('utf-8'))
        except Exception:
            # If base64 decoding fails, try direct JSON parsing
            try:
                firebase_creds_json = json.loads(firebase_creds_str)
            except Exception as json_error:
                print(f"Unable to parse Firebase credentials: {json_error}")
                raise ValueError("Unable to parse Firebase credentials")
        
        # Remove any existing Firebase apps before initializing
        try:
            firebase_admin.get_app()
            firebase_admin._apps.clear()
        except ValueError:
            pass
        
        # Create credentials
        cred = credentials.Certificate(firebase_creds_json)
        
        # Initialize Firebase Admin SDK
        firebase_admin.initialize_app(cred)
        
        print("Firebase Admin SDK initialized successfully")
    
    except Exception as e:
        print(f"Firebase Admin initialization error: {e}")
        traceback.print_exc()
        raise

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Firebase BEFORE creating other app extensions
initialize_firebase_app()

# Initialize extensions
CORS(app, supports_credentials=True)
bcrypt = Bcrypt(app)
db.init_app(app)
login_manager = LoginManager(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables
with app.app_context():
    db.create_all()

# Authentication routes
@app.route('/api/register', methods=['POST'])
def register():
    # Registration logic
    data = request.json
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create new user
    new_user = User(
        email=data['email'],
        password=hashed_password,
        name=data.get('name', '')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    
    if user and bcrypt.check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({
            "id": user.id,
            "email": user.email,
            "name": user.name
        }), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }), 200

# Task List routes
@app.route('/api/task-lists', methods=['GET'])
@login_required
def get_task_lists():
    task_lists = TaskList.query.filter_by(user_id=current_user.id, parent_id=None).all()
    result = []
    
    for task_list in task_lists:
        result.append({
            "id": task_list.id,
            "title": task_list.title,
            "is_folder": task_list.is_folder,
            "children": [{"id": child.id, "title": child.title, "is_folder": child.is_folder} 
                        for child in task_list.children] if task_list.is_folder else []
        })
    
    return jsonify(result), 200

@app.route('/api/task-lists', methods=['POST'])
@login_required
def create_task_list():
    data = request.json
    
    new_task_list = TaskList(
        title=data['title'],
        is_folder=data.get('is_folder', False),
        user_id=current_user.id,
        parent_id=data.get('parent_id')
    )
    
    db.session.add(new_task_list)
    db.session.commit()
    
    return jsonify({
        "id": new_task_list.id,
        "title": new_task_list.title,
        "is_folder": new_task_list.is_folder,
        "parent_id": new_task_list.parent_id
    }), 201

@app.route('/api/task-lists/<int:list_id>', methods=['GET'])
@login_required
def get_task_list(list_id):
    task_list = TaskList.query.filter_by(id=list_id, user_id=current_user.id).first()
    
    if not task_list:
        return jsonify({"error": "Task list not found"}), 404
    
    result = {
        "id": task_list.id,
        "title": task_list.title,
        "is_folder": task_list.is_folder,
        "description": task_list.description if hasattr(task_list, 'description') else None,
        "created_at": task_list.created_at.isoformat() if hasattr(task_list, 'created_at') else None
    }
    
    if task_list.is_folder:
        result["children"] = [
            {"id": child.id, "title": child.title, "is_folder": child.is_folder} 
            for child in task_list.children
        ]
    
    return jsonify(result), 200

@app.route('/api/task-lists/<int:list_id>', methods=['PUT'])
@login_required
def update_task_list(list_id):
    task_list = TaskList.query.filter_by(id=list_id, user_id=current_user.id).first()
    
    if not task_list:
        return jsonify({"error": "Task list not found"}), 404
    
    data = request.json
    
    if 'title' in data:
        task_list.title = data['title']
    
    if 'is_folder' in data:
        task_list.is_folder = data['is_folder']
    
    if 'parent_id' in data:
        task_list.parent_id = data['parent_id']
    
    if 'description' in data and hasattr(task_list, 'description'):
        task_list.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        "id": task_list.id,
        "title": task_list.title,
        "is_folder": task_list.is_folder,
        "parent_id": task_list.parent_id,
        "description": task_list.description if hasattr(task_list, 'description') else None
    }), 200

@app.route('/api/task-lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_task_list(list_id):
    task_list = TaskList.query.filter_by(id=list_id, user_id=current_user.id).first()
    
    if not task_list:
        return jsonify({"error": "Task list not found"}), 404
    
    db.session.delete(task_list)
    db.session.commit()
    
    return jsonify({"message": "Task list deleted successfully"}), 200

# Task routes
@app.route('/api/task-lists/<int:list_id>/tasks', methods=['GET'])
@login_required
def get_tasks(list_id):
    task_list = TaskList.query.filter_by(id=list_id, user_id=current_user.id).first()
    
    if not task_list:
        return jsonify({"error": "Task list not found"}), 404
    
    tasks = Task.query.filter_by(task_list_id=list_id).all()
    
    result = []
    for task in tasks:
        task_data = {
            "id": task.id,
            "title": task.title,
            "completed": task.completed,
            "parent_id": task.parent_id,
            "level": task.level if hasattr(task, 'level') else 0,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "description": task.description if hasattr(task, 'description') else None,
            "due_date": task.due_date.isoformat() if hasattr(task, 'due_date') and task.due_date else None,
            "priority": task.priority if hasattr(task, 'priority') else None,
            "tags": task.tags.split(',') if hasattr(task, 'tags') and task.tags else []
        }
        result.append(task_data)
    
    return jsonify(result), 200

@app.route('/api/task-lists/<int:list_id>/tasks', methods=['POST'])
@login_required
def create_task(list_id):
    task_list = TaskList.query.filter_by(id=list_id, user_id=current_user.id).first()
    
    if not task_list:
        return jsonify({"error": "Task list not found"}), 404
    
    data = request.json
    
    # Set parent_id and level
    parent_id = data.get('parent_id')
    level = 0
    
    if parent_id:
        # Verify parent exists and get its level
        parent_task = Task.query.filter_by(id=parent_id, task_list_id=list_id).first()
        if parent_task:
            level = parent_task.level + 1 if hasattr(parent_task, 'level') else 1
    
    # Create basic task with required fields
    new_task = Task(
        title=data['title'],
        completed=data.get('completed', False),
        task_list_id=list_id,
        parent_id=parent_id,
        level=level
    )
    
    # Add optional fields if they exist in the model
    if hasattr(Task, 'description') and 'description' in data:
        new_task.description = data['description']
    
    if hasattr(Task, 'due_date') and 'due_date' in data:
        new_task.due_date = data['due_date']
    
    if hasattr(Task, 'priority') and 'priority' in data:
        new_task.priority = data['priority']
    
    if hasattr(Task, 'tags') and 'tags' in data:
        new_task.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']
    
    db.session.add(new_task)
    db.session.commit()
    
    # Build response
    response = {
        "id": new_task.id,
        "title": new_task.title,
        "completed": new_task.completed,
        "parent_id": new_task.parent_id,
        "level": new_task.level if hasattr(new_task, 'level') else 0,
        "created_at": new_task.created_at.isoformat(),
        "updated_at": new_task.updated_at.isoformat()
    }
    
    # Add optional fields to response
    if hasattr(new_task, 'description'):
        response["description"] = new_task.description
    
    if hasattr(new_task, 'due_date'):
        response["due_date"] = new_task.due_date.isoformat() if new_task.due_date else None
    
    if hasattr(new_task, 'priority'):
        response["priority"] = new_task.priority
    
    if hasattr(new_task, 'tags'):
        response["tags"] = new_task.tags.split(',') if new_task.tags else []
    
    return jsonify(response), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.join(TaskList).filter(
        Task.id == task_id,
        TaskList.user_id == current_user.id
    ).first()
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.json
    
    # Update basic fields
    if 'title' in data:
        task.title = data['title']
    
    if 'completed' in data:
        task.completed = data['completed']
    
    # Handle parent-child relationship
    if 'parent_id' in data:
        if data['parent_id'] is not None:
            # Verify that parent task exists and belongs to the same task list
            parent_task = Task.query.filter_by(id=data['parent_id'], task_list_id=task.task_list_id).first()
            if not parent_task:
                return jsonify({"error": "Parent task not found or not in the same list"}), 400
            
            # Prevent circular references
            current_parent = parent_task
            while current_parent is not None:
                if current_parent.id == task.id:
                    return jsonify({"error": "Circular parent reference"}), 400
                current_parent = Task.query.get(current_parent.parent_id) if current_parent.parent_id else None
            
            task.parent_id = data['parent_id']
            
            # Update the level based on parent's level if level field exists
            if hasattr(task, 'level') and hasattr(parent_task, 'level'):
                task.level = parent_task.level + 1
        else:
            # Setting to null (making it a top-level task)
            task.parent_id = None
            if hasattr(task, 'level'):
                task.level = 0
    
    # Update optional fields if they exist in the model
    if hasattr(task, 'level') and 'level' in data:
        task.level = data['level']
    
    if hasattr(task, 'description') and 'description' in data:
        task.description = data['description']
    
    if hasattr(task, 'due_date') and 'due_date' in data:
        task.due_date = data['due_date']
    
    if hasattr(task, 'priority') and 'priority' in data:
        task.priority = data['priority']
    
    if hasattr(task, 'tags') and 'tags' in data:
        task.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']
    
    db.session.commit()
    
    # Build response
    response = {
        "id": task.id,
        "title": task.title,
        "completed": task.completed,
        "parent_id": task.parent_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat()
    }
    
    # Add optional fields to response
    if hasattr(task, 'level'):
        response["level"] = task.level
    
    if hasattr(task, 'description'):
        response["description"] = task.description
    
    if hasattr(task, 'due_date'):
        response["due_date"] = task.due_date.isoformat() if task.due_date else None
    
    if hasattr(task, 'priority'):
        response["priority"] = task.priority
    
    if hasattr(task, 'tags'):
        response["tags"] = task.tags.split(',') if task.tags else []
    
    return jsonify(response), 200

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.join(TaskList).filter(
        Task.id == task_id,
        TaskList.user_id == current_user.id
    ).first()
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    # Find all child tasks recursively and delete them
    def delete_children(parent_id):
        children = Task.query.filter_by(parent_id=parent_id).all()
        for child in children:
            delete_children(child.id)
            db.session.delete(child)
    
    delete_children(task.id)
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"message": "Task and all subtasks deleted successfully"}), 200

# Basic test route
@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Hello from Flask!")

# Add this route to your app.py
@app.route('/api/tasks/<int:task_id>/delete-keep-children', methods=['POST'])
@login_required
def delete_task_keep_children(task_id):
    # Find the task
    task = Task.query.join(TaskList).filter(
        Task.id == task_id,
        TaskList.user_id == current_user.id
    ).first()
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    # Get children and parent info
    children = Task.query.filter_by(parent_id=task.id).all()
    parent_id = task.parent_id
    task_list_id = task.task_list_id
    
    # Update children's parent to the task's parent (moving them up one level)
    for child in children:
        child.parent_id = parent_id
        if hasattr(child, 'level') and parent_id is None:
            # If moving to root level, set level to 0
            child.level = 0
        elif hasattr(child, 'level') and parent_id is not None:
            # If moving to another parent, adjust level
            parent_level = Task.query.get(parent_id).level if Task.query.get(parent_id) else 0
            child.level = parent_level + 1
    
    # Delete the task
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"message": "Task deleted and children preserved"}), 200
    
@app.route('/api/login/firebase', methods=['POST'])
def firebase_login():  # Changed method name to be unique
    # Existing implementation from previous response
    data = request.json
    
    print("Firebase Login Endpoint Reached!")  # Debug print
    print("Received Data:", data)  # Print received data
    
    # Rest of the previous implementation...
        
    # Ensure all required data is present
    id_token = data.get('idToken')
    email = data.get('email')
    name = data.get('name', '')

    if not id_token or not email:
        return jsonify({"error": "Missing authentication credentials"}), 400

    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(
            id_token, 
            check_revoked=True,  # Check if the token has been revoked
            clock_skew_seconds=60  # Reduced clock skew to recommended max
        )
        
        # Additional token validation
        if decoded_token.get('email') != email:
            print(f"Email mismatch: token email {decoded_token.get('email')} vs provided {email}")
            return jsonify({"error": "Email verification failed"}), 401

        # Check if user already exists in our database
        user = User.query.filter_by(email=email).first()

        if not user:
            # Create new user if not exists
            new_user = User(
                email=email,
                name=name or decoded_token.get('name', ''),
                # Use a placeholder for password since Firebase handles authentication
                password=bcrypt.generate_password_hash('firebase_auth').decode('utf-8')
            )
            db.session.add(new_user)
            db.session.commit()
            user = new_user

        # Log the user in
        login_user(user)

        return jsonify({
            "id": user.id,
            "email": user.email,
            "name": user.name
        }), 200

    except ValueError as e:
        # Invalid token specific errors
        print(f"Firebase token verification error: {str(e)}")
        return jsonify({"error": f"Invalid authentication token: {str(e)}"}), 401
    except Exception as e:
        # Catch-all for any other unexpected errors
        print(f"Unexpected Firebase login error: {str(e)}")
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({"error": "Authentication failed"}), 500
if __name__ == '__main__':
    app.run(debug=True, port=5001)