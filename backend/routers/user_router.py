from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
import uuid
from passlib.context import CryptContext
import jwt
from pydantic import BaseModel

import sys
from pathlib import Path
 
try:
    from ..schemas.user import User
    from ..services.firebase_db import get_firestore_client
except ImportError:
    # Add parent directory to path when running directly
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from schemas.user import User
    from services.firebase_db import get_firestore_client
    

router = APIRouter(prefix="/users")

class ProjectCreateRequest(BaseModel):
    """Request model for creating a project"""
    project_name: str

class UserCreateRequest:
    """Request model for creating a new user"""
    def __init__(self, name: str, surname: str, username: str, email: str, profileImageURL: Optional[str] = None):
        self.name = name
        self.surname = surname
        self.username = username
        self.email = email
        self.profileImageURL = profileImageURL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Secret key for JWT
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
 
def get_password_hash(password):
    return pwd_context.hash(password)
 
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/create", response_model=dict)
async def create_user(user_data: dict):
    """
    Create a new user in Firebase database
    
    Request body:
    {
        "name": "John",
        "surname": "Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "profileImageURL": "https://example.com/image.jpg" (optional)
    }
    """
    try:
        # Validate required fields
        required_fields = ["name", "surname", "username", "email"]
        for field in required_fields:
            if field not in user_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create user instance with generated ID
        user = User(
            userID=user_data.get("userID", str(uuid.uuid4())),
            name=user_data["name"],
            surname=user_data["surname"],
            username=user_data["username"],
            email=user_data["email"],
            profileImageURL=user_data.get("profileImageURL"),
            createdAt=datetime.now(),
            projectIDs=[]
        )
        
        # Save to Firebase
        user_id = user.save_to_firestore()
        
        return {
            "status": "success",
            "userID": user_id,
            "message": f"User {user.username} created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_user(user_id: str):
    """
    Retrieve user information by user ID
    """
    try:
        user_doc = User.get_user_from_firestore(user_id)
    
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "user": user_doc.to_firestore_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(user_data: dict):
    """
    Login endpoint to authenticate users.
 
    Request body:
    {
        "username": "johndoe",
        "password": "password123"
    }
    """
    try:
        db = get_firestore_client()
 
        # Retrieve user by username
        users_ref = db.collection("users")
        query = users_ref.where("username", "==", user_data["username"]).stream()
        user_doc = next(query, None)
 
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
 
        user = user_doc.to_dict()
 
        # Verify password
        if not verify_password(user_data["password"], user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
 
        # Create JWT token
        token = create_access_token({"sub": user["username"]})
 
        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer"
        }
 
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/addProject", response_model=dict)
async def add_project_to_user(user_id: str, request: ProjectCreateRequest):
    """
    Add a new project to the user's project list.
    
    Request body:
    {
        "project_name": "New Project"
    }
    """
    try:
        user = User.get_user_from_firestore(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        project_id = user.add_new_project(request.project_name, user_id)
        
        if not project_id:
            raise HTTPException(status_code=500, detail="Failed to add project")
        
        return {
            "status": "success",
            "projectID": project_id,
            "message": f"Project '{request.project_name}' added successfully to user '{user.username}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/projects", response_model=dict)
async def get_user_projects(user_id: str):
    """
    Get all projects for a user with their prompts.
    Returns projects from user's projectIDs and classifies prompts by projectID.
    """
    try:
        db = get_firestore_client()
        
        # Get user to retrieve projectIDs
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return {"status": "success", "projects": []}
        
        user_data = user_doc.to_dict()
        project_ids_list = user_data.get("projectIDs", [])
        
        # Build project map: {projectID: projectName}
        project_map = {}
        for proj in project_ids_list:
            if isinstance(proj, dict):
                project_map[proj.get("projectID", "")] = proj.get("projectName", "Unnamed Project")
        
        # Get all prompts for this user
        prompts_ref = db.collection("prompts")
        query = prompts_ref.where("userID", "==", user_id)
        docs = query.stream()
        
        # Group prompts by projectID
        prompts_by_project = {}
        for doc in docs:
            data = doc.to_dict()
            prompt_project_id = data.get("projectID", "default-project")
            if prompt_project_id not in prompts_by_project:
                prompts_by_project[prompt_project_id] = []
            prompts_by_project[prompt_project_id].append(data.get("promptID", doc.id))
        
        # Build response with projects and their prompt IDs
        projects = []
        for proj in project_ids_list:
            if isinstance(proj, dict):
                proj_id = proj.get("projectID", "")
                projects.append({
                    "id": proj_id,
                    "name": proj.get("projectName", "Unnamed Project"),
                    "promptIds": prompts_by_project.get(proj_id, []),
                    "createdAt": proj.get("createdAt", datetime.utcnow().isoformat()),
                    "updatedAt": proj.get("updatedAt", datetime.utcnow().isoformat())
                })
        
        return {"status": "success", "projects": projects}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}/projects/{project_id}", response_model=dict)
async def rename_project(user_id: str, project_id: str, new_name: str):
    """
    Rename a project.
    """
    try:
        db = get_firestore_client()
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        project_ids_list = user_data.get("projectIDs", [])
        
        # Find and update the project name
        updated = False
        for proj in project_ids_list:
            if isinstance(proj, dict) and proj.get("projectID") == project_id:
                proj["projectName"] = new_name
                proj["updatedAt"] = datetime.utcnow().isoformat()
                updated = True
                break
        
        if not updated:
            raise HTTPException(status_code=404, detail="Project not found")
        
        user_ref.update({"projectIDs": project_ids_list})
        
        return {"status": "success", "message": "Project renamed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}/projects/{project_id}", response_model=dict)
async def delete_project(user_id: str, project_id: str):
    """
    Delete a project. Prompts remain in history with projectID reset to default.
    """
    try:
        db = get_firestore_client()
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        project_ids_list = user_data.get("projectIDs", [])
        
        # Remove project from list
        new_project_list = [p for p in project_ids_list if not (isinstance(p, dict) and p.get("projectID") == project_id)]
        
        if len(new_project_list) == len(project_ids_list):
            raise HTTPException(status_code=404, detail="Project not found")
        
        user_ref.update({"projectIDs": new_project_list})
        
        # Reset prompts with this projectID to default-project
        prompts_ref = db.collection("prompts")
        query = prompts_ref.where("projectID", "==", project_id)
        docs = query.stream()
        
        for doc in docs:
            doc.reference.update({"projectID": "default-project"})
        
        return {"status": "success", "message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/projects/{project_id}/prompts/{prompt_id}", response_model=dict)
async def add_prompt_to_project(user_id: str, project_id: str, prompt_id: str):
    """
    Add a prompt to a project by updating the prompt's projectID.
    """
    try:
        db = get_firestore_client()
        
        # Verify user owns this project
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        project_ids_list = user_data.get("projectIDs", [])
        
        project_exists = any(isinstance(p, dict) and p.get("projectID") == project_id for p in project_ids_list)
        if not project_exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update prompt's projectID
        prompt_ref = db.collection("prompts").document(prompt_id)
        prompt_doc = prompt_ref.get()
        
        if not prompt_doc.exists:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        prompt_ref.update({"projectID": project_id})
        
        return {"status": "success", "message": "Prompt added to project"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}/projects/{project_id}/prompts/{prompt_id}", response_model=dict)
async def remove_prompt_from_project(user_id: str, project_id: str, prompt_id: str):
    """
    Remove a prompt from a project by resetting its projectID to default.
    """
    try:
        db = get_firestore_client()
        
        # Update prompt's projectID to default
        prompt_ref = db.collection("prompts").document(prompt_id)
        prompt_doc = prompt_ref.get()
        
        if not prompt_doc.exists:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        prompt_ref.update({"projectID": "default-project"})
        
        return {"status": "success", "message": "Prompt removed from project"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))