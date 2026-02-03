from openai import OpenAI
import json
from core.config import settings
import json

client = OpenAI(
    base_url="https://api.studio.nebius.ai/v1",
    api_key=settings.NEBIUS_API_KEY,
)

def test_nebius_api(prompt :str, ai_model: str = "openai/gpt-oss-20b") -> str: 
    response = client.chat.completions.create(
        model= ai_model,
        messages=[
            {
                "role" : "user",
                "content" : prompt
            }
        ]
    )

    return json.loads(response.to_json())

def run_nebius_ai(prompt: str, system_prompt: str, ai_model: str = "openai/gpt-oss-20b") -> str:
    response = client.chat.completions.create(
        model= ai_model,
        messages=[
            {
                "role" : "system",
                "content" : system_prompt
            },
            {
                "role" : "user",
                "content" : f"Given prompt:{prompt}"
            },
        ],
        
    )

    return json.loads(response.to_json())
