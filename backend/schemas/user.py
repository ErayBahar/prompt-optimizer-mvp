from typing import Optional, Dict, List, Any
from datetime import datetime

import uuid

# Handle imports for both direct execution and module import
import sys
from pathlib import Path

try:
    from ..services.firebase_db import get_firestore_client
    from ..schemas.prompt import PromptDBModel
except ImportError:
    # Add parent directory to path when running directly
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from services.firebase_db import get_firestore_client
    from schemas.prompt import PromptDBModel


class User:
    userID : str = ""
    name : str = ""  
    surname : str = ""
    username : str = ""
    createdAt : datetime = datetime.now()
    last50Prompts : List[Any] = []  # list of prompt objects or IDs
    email : str = ""
    profileImageURL : Optional[str] = None
    projectIDs : List[Dict[str, str]] = []  # list of {projectID, projectName} dictionaries

    def __init__(self, **data):
        for key, value in data.items():
            setattr(self, key, value)
    

    def to_firestore_dict(self) -> dict:
        # Handle last50Prompts - could be prompt objects or just IDs
        prompts_list = []
        for prompt in self.last50Prompts:
            if hasattr(prompt, 'promptID'):
                prompts_list.append(prompt.promptID)
            else:
                prompts_list.append(str(prompt))
        
        data = {
            "userID": self.userID,
            "name": self.name,
            "surname": self.surname,
            "username": self.username,
            "createdAt": self.createdAt,
            "last50Prompts": prompts_list,
            "email": self.email,
            "profileImageURL": self.profileImageURL,
            "projectIDs": self.projectIDs
        }
        return data
    
    def save_to_firestore(self) -> str:
        try:
            from services.firebase_db import get_firestore_client
            db = get_firestore_client()
            user_ref = db.collection("users").document(self.userID)
            user_ref.set(self.to_firestore_dict())
            
            return self.userID
        except Exception as e:
            return None
    
    def update_in_firestore(self) -> bool:
        try:
            from services.firebase_db import get_firestore_client
            db = get_firestore_client()
            user_ref = db.collection("users").document(self.userID)
            user_ref.update(self.to_firestore_dict())
            return True
        except Exception as e:
            return False
    
    def add_new_project(self, project_name: str, user_id: str) -> str:
        try:
            db = get_firestore_client()
            project_id = str(uuid.uuid4())
            project_entry = {"projectID": project_id, "projectName": project_name}
            self.projectIDs.append(project_entry)

            user_ref = db.collection("users").document(user_id)
            user_ref.update({"projectIDs": self.projectIDs})

            return project_id
        except Exception as e:
            return ""

    @staticmethod
    def get_user_from_firestore(user_id: str) -> Optional["User"]:
        from services.firebase_db import get_firestore_client
        db = get_firestore_client()
        user_ref = db.collection("users").document(user_id)
        doc = user_ref.get()
        if doc.exists:
            data = doc.to_dict()
            return User(**data)
        else:
            return None
    
    
