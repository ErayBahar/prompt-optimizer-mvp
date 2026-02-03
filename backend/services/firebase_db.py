import firebase_admin
from firebase_admin import credentials, firestore

import os
import json
from dotenv import load_dotenv

load_dotenv()

# starting firebase (singleton pattern)
def initialize_firebase():
    if not firebase_admin._apps:
        # Use absolute path based on this file's location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        local_path = os.path.join(current_dir, "serviceAccountKey.json")
        cred = credentials.Certificate(local_path)
        firebase_admin.initialize_app(cred)

def get_firestore_client():
    initialize_firebase()
    return firestore.client()
