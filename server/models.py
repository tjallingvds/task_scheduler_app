from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    task_lists = db.relationship('TaskList', backref='owner', lazy=True, cascade="all, delete-orphan")

class TaskList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    is_folder = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('task_list.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship('Task', backref='task_list', lazy=True, cascade="all, delete-orphan")
    children = db.relationship('TaskList', backref=db.backref('parent', remote_side=[id]), lazy=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text, nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    level = db.Column(db.Integer, default=0)
    priority = db.Column(db.String(20), nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    tags = db.Column(db.String(255), nullable=True)
    task_list_id = db.Column(db.Integer, db.ForeignKey('task_list.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship for subtasks
    children = db.relationship('Task', 
                              backref=db.backref('parent', remote_side=[id]),
                              lazy=True, 
                              cascade="all, delete-orphan")