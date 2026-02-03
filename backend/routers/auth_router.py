from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth
from datetime import datetime
import sys
from pathlib import Path
import uuid
 
try:
    from services.firebase_db import initialize_firebase, get_firestore_client
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from services.firebase_db import initialize_firebase, get_firestore_client
 
router = APIRouter()
 
class TokenVerifyRequest(BaseModel):
    id_token: str
 
class EmailPasswordSignupRequest(BaseModel):
    email: str
    name: str = None
    surname : str = None
    username : str = None
    profileImageURL : str = None
    user_id : str = None

 
class EmailPasswordLoginRequest(BaseModel):
    email: str
    password: str
 
class PasswordResetRequest(BaseModel):
    email: str
 
from typing import Optional
 
class UserResponse(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    is_new_user: bool = False
    custom_token: Optional[str] = None  # For email/password auth
    surname: Optional[str] = None
    username: Optional[str] = None
    profileImageURL: Optional[str] = None
 
@router.post("/verify-token", response_model=UserResponse)
async def verify_firebase_token(request: TokenVerifyRequest):
    """
    Verify Firebase ID token from frontend and return user info.
    Creates user in Firestore if they don't exist.
    """
    try:
        # Initialize Firebase Admin if not already done
        initialize_firebase()
       
        # Verify the ID token
        decoded_token = auth.verify_id_token(request.id_token)
       
        uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        name = decoded_token.get('name', '')
        picture = decoded_token.get('picture', '')
       
        # Check if user exists in Firestore, create if not
        db = get_firestore_client()
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
       
        is_new_user = False
        if not user_doc.exists:
            # Create new user in Firestore
            is_new_user = True
            user_data = {
                'uid': uid,
                'email': email,
                'name': name,
                'profileImageURL': picture,
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            user_ref.set(user_data)
        else:
            # Update last login
            user_ref.update({
                'updatedAt': datetime.utcnow().isoformat()
            })
       
        return UserResponse(
            uid=uid,
            email=email,
            name=name,
            profileImageURL=picture,
            is_new_user=is_new_user
        )
       
    except auth.InvalidIdTokenError as e:
        print(f"Invalid ID token error: {e}")
        raise HTTPException(status_code=401, detail="Invalid ID token")
    except auth.ExpiredIdTokenError as e:
        print(f"Expired ID token error: {e}")
        raise HTTPException(status_code=401, detail="ID token has expired")
    except Exception as e:
        import traceback
        print(f"Error verifying token: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
 
@router.get("/user/{uid}")
async def get_user(uid: str):
    """Get user info from Firestore by UID"""
    try:
        initialize_firebase()
        db = get_firestore_client()
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
       
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
       
        return user_doc.to_dict()
       
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.post("/signup", response_model=UserResponse)
async def signup_with_email(request: EmailPasswordSignupRequest):
    """
    Create a new user with email and password.
    Returns user info and custom token for frontend authentication.
    """
    try:
        initialize_firebase()
       
        # Create user in Firestore
        db = get_firestore_client()
        user_data = {
            'userID': request.user_id or str(uuid.uuid4()),
            'email': request.email,
            'name': request.name or '',
            "surname": request.surname or '',
            "username": request.username or request.name,
            'profileImageURL': request.profileImageURL or "",
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
            "projectIDs": []
        }
        user_ref = db.collection('users').document(user_data['userID'])
        user_ref.set(user_data)
       
        # Generate custom token for frontend to use
        custom_token = auth.create_custom_token(user_data['userID'])
       
        return UserResponse(
            uid=user_data['userID'],
            email=request.email,
            name=request.name,
            profileImageURL=request.profileImageURL or "",
            is_new_user=True,
            custom_token=custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token
        )
       
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.post("/login", response_model=UserResponse)
async def login_with_email(request: EmailPasswordLoginRequest):
    """
    Login with email and password.
    Note: Password verification happens on the frontend with Firebase Client SDK.
    This endpoint verifies the user exists and returns user info.
    """
    try:
        initialize_firebase()
       
        # Get user by email
        user_record = auth.get_user_by_email(request.email)
        userID = user_record.uid
       
        # Get user from Firestore
        db = get_firestore_client()
        user_ref = db.collection('users').document(userID)
        user_doc = user_ref.get()
       
        if not user_doc.exists:
            # Create user in Firestore if doesn't exist
            user_data = {
                'userID': userID,
                'email': user_record.email,
                'name': user_record.display_name or '',
                'profileImageURL': user_record.photo_url or "",
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat(),
                "projectIDs": [],
            }
            user_ref.set(user_data)
        else:
            # Update last login
            user_ref.update({
                'updatedAt': datetime.utcnow().isoformat()
            })
            user_data = user_doc.to_dict()
       
        # Generate custom token
        custom_token = auth.create_custom_token(userID)
       
        return UserResponse(
            uid=user_data['userID'],
            email=user_record.email,
            name=user_data.get('name') or user_record.display_name,
            profileImageURL=user_data.get('profileImageURL') or user_record.photo_url,
            is_new_user=False,
            custom_token=custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token
        )
       
    except auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.post("/reset-password")
async def reset_password(request: PasswordResetRequest):
    """
    Send password reset email.
    Note: The actual email sending is handled by Firebase.
    This endpoint generates a password reset link.
    """
    try:
        initialize_firebase()
       
        # Verify user exists
        try:
            auth.get_user_by_email(request.email)
        except auth.UserNotFoundError:
            # Don't reveal if email exists for security
            return {"status": "success", "message": "If the email exists, a reset link will be sent"}
       
        # Generate password reset link (requires Firebase Admin SDK configuration)
        # Note: For production, you need to configure email templates in Firebase Console
        link = auth.generate_password_reset_link(request.email)
       
        return {
            "status": "success",
            "message": "Password reset link generated",
            "link": link  # In production, this should be sent via email, not returned
        }
       
    except Exception as e:
        print(f"Error resetting password: {e}")
        # Don't reveal if error occurred for security
        return {"status": "success", "message": "If the email exists, a reset link will be sent"}
 
 