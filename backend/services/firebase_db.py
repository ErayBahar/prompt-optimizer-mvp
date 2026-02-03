import firebase_admin
from firebase_admin import credentials, firestore
 
import os
import json
from dotenv import load_dotenv
 
load_dotenv()
 
# starting firebase (singleton pattern)
def initialize_firebase():
    if not firebase_admin._apps:
        service_account_info = {
            "type": os.getenv("FIREBASE_TYPE"),
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
            "universe_domain": os.getenv("FIREBASE_UNIVERSE_DOMAIN"),
        }
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
 
def get_firestore_client():
    initialize_firebase()
    return firestore.client()