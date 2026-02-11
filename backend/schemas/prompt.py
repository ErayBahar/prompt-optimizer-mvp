import json
import uuid
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

# Handle imports for both direct execution and module import
import sys
from pathlib import Path


try:
    from ..services.nebius_ai import run_nebius_ai
    from ..services.firebase_db import get_firestore_client
    from ..services.token_counter import count_tokens
except ImportError:
    # Add parent directory to path when running directly
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from services.firebase_db import get_firestore_client
    from services.nebius_ai import run_nebius_ai
    from services.token_counter import count_tokens


def clean_json_response(content: str) -> str:
    """
    Clean malformed JSON responses from AI models.
    Handles cases like extra braces, markdown code blocks, quotes around JSON, etc.
    """
    if not content or not isinstance(content, str):
        return content
    
    # Strip whitespace
    content = content.strip()
    
    # Remove markdown code blocks if present
    if content.startswith("```"):
        # Remove ```json or ``` at the start
        content = re.sub(r'^```(?:json)?\s*\n?', '', content)
        # Remove ``` at the end
        content = re.sub(r'\n?```\s*$', '', content)
        content = content.strip()
    
    # Fix pattern: { "{ ... }" } - quote before inner brace
    # Check if after the first { and optional whitespace, there's a "{
    if content.startswith('{'):
        idx = 1
        # Skip whitespace
        while idx < len(content) and content[idx].isspace():
            idx += 1
        
        # Check for pattern: "{"  (quote followed by brace)
        if idx < len(content) - 1 and content[idx] == '"' and content[idx + 1] == '{':
            # Remove the quote before the inner {
            content = content[:idx] + content[idx + 1:]
            
            # Now check for matching closing pattern: }" at the end
            content = content.rstrip()
            if content.endswith('"}'):
                content = content[:-2] + '}'
        # Check if next char is just another brace (no quote)
        elif idx < len(content) and content[idx] == '{':
            # Skip the outer brace
            content = content[idx:]
    
    # Fix trailing extra closing brace
    # Count braces to detect imbalance
    open_count = content.count('{')
    close_count = content.count('}')
    
    if close_count > open_count:
        # Remove extra closing braces from the end
        for _ in range(close_count - open_count):
            last_brace_idx = content.rfind('}')
            if last_brace_idx != -1:
                content = content[:last_brace_idx] + content[last_brace_idx + 1:]
    
    return content.strip()


class PromptInput(BaseModel):
    userID: str
    inputPrompt: str
    targetRole: Optional[str] = ""


# 1. parsed data
class ParsedPrompt(BaseModel):
    role: Optional[str] = None
    role_score: Optional[float] = None
    task: Optional[str] = None
    task_score: Optional[float] = None
    style: Optional[str] = None
    style_score: Optional[float] = None
    output: Optional[str] = None
    output_score: Optional[float] = None
    rules: Optional[str] = None
    rules_score: Optional[float] = None

    def __init__(self, **data):
        super().__init__(**data)

    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "role_score": self.role_score,
            "task": self.task,
            "task_score": self.task_score,
            "style": self.style,
            "style_score": self.style_score,
            "output": self.output,
            "output_score": self.output_score,
            "rules": self.rules,
            "rules_score": self.rules_score,
        }


# 2. prompt object data to be stored in firestore
class PromptDBModel(BaseModel):
    promptID: str = ""
    userID: str = ""
    projectID: str = "default-project"
    inputPrompt: str = ""

    parsedData: Optional[ParsedPrompt] = None  # role, task, context
    optimizedPrompt: Optional[str] = None
    usedLLM: Optional[str] = None

    # metrics
    initialTokenSize: int = 0
    finalTokenSize: int = 0
    latencyMs: float = 0.0
    copyCount: int = 0
    inputPromptScore: Optional[float] = None
    overallScore: Optional[float] = None
    weights: Optional[Dict[str, float]] = {
        "task": 2,
        "role": 2,
        "style": 2,
        "output": 2,
        "rules": 2,
    }

    # metadata
    createdAt: datetime = Field(default_factory=datetime.now)
    isFavorite: bool = False
    rating: Optional[int] = None  # [1,5]

    def __init__(self, **data):
        super().__init__(**data)

    def to_firestore_dict(self) -> dict:
        data = {
            "promptID": self.promptID,
            "userID": self.userID,
            "projectID": self.projectID,
            "inputPrompt": self.inputPrompt,
            "parsedData": self.parsedData.model_dump() if self.parsedData else None,
            "optimizedPrompt": self.optimizedPrompt,
            "usedLLM": self.usedLLM,
            "inputPromptScore": self.inputPromptScore,
            "initialTokenSize": self.initialTokenSize,
            "finalTokenSize": self.finalTokenSize,
            "latencyMs": self.latencyMs,
            "copyCount": self.copyCount,
            "overallScore": self.overallScore,
            "createdAt": self.createdAt,  # Firestore handles datetime objects
            "isFavorite": self.isFavorite,
            "rating": self.rating,
            "weights": self.weights,
        }
        return data

    def set_to_firestore(self) -> str:
        from services.firebase_db import get_firestore_client

        db = get_firestore_client()
        prompt_ref = db.collection("prompts").document(self.promptID)
        prompt_ref.set(self.to_firestore_dict())

        return self.promptID

    def delete_from_firestore(self) -> bool:
        try:
            from services.firebase_db import get_firestore_client

            db = get_firestore_client()
            prompt_ref = db.collection("prompts").document(self.promptID)
            prompt_ref.delete()
            return True
        except Exception as e:
            return False

    def update_in_firestore(self, update_data: dict) -> bool:
        try:
            from services.firebase_db import get_firestore_client

            db = get_firestore_client()
            prompt_ref = db.collection("prompts").document(self.promptID)
            prompt_ref.update(update_data)
            return True
        except Exception as e:
            return False

    def get_parsed_data_and_scores_from_llm_returns_score(
        self,
        ai_model: str = "openai/gpt-oss-20b",
    ) -> Optional[Dict[str, Any]]:
        system_prompt = """
        You are an expert Prompt Engineer. Analyze the provided prompt and parse it into six components: Task, Role, Style, Output, and Rules.

        ### Instructions
        1. **Extraction:** Extract the *verbatim* text for each component. Do not summarize or alter the text.
        2. **Scoring:** Rate each component from 0-10 based on the "Scoring Rubric" below.
        3. **Missing Data:** If a component is not found, set its text aspect to "" (empty string) and its score to 0.

        ### Scoring Rubric
        * **0:** Component is completely missing.
        * **1-4:** Vague or implied (e.g., "write something").
        * **5-7:** Clear but generic (e.g., "write a blog post").
        * **8-10:** Highly specific, detailed, and constraint-driven.

        ### Output Format
        Return valid JSON only. Adhere strictly to this schema:
        {
        "task": "extracted text", "task_score": int,
        "role": "extracted text", "role_score": int,
        "style": "extracted text", "style_score": int,
        "output": "extracted text", "output_score": int,
        "rules": "extracted text", "rules_score": int
        }
        """
        response = run_nebius_ai(
            prompt=self.inputPrompt, system_prompt=system_prompt, ai_model=ai_model
        )

        # Get parsed data and scores
        content = response["choices"][0]["message"]["content"]
        
        if isinstance(content, str):
            if not content.strip():
                raise ValueError("AI returned empty response")
            try:
                # Clean the JSON response before parsing
                content = clean_json_response(content)
                content = json.loads(content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Content that failed to parse: {content}")
                raise ValueError(f"AI returned invalid JSON: {str(e)}")
        
        self.parsedData = ParsedPrompt(**content)
        self.initialTokenSize = count_tokens(self.inputPrompt)

        # Calculate overall score
        total_weight = sum(self.weights.values())
        self.inputPromptScore = round(10 * (
            (self.parsedData.task_score * self.weights.get("task", 0) / total_weight)
            + (self.parsedData.role_score * self.weights.get("role", 0) / total_weight)
            + (self.parsedData.style_score * self.weights.get("style", 0) / total_weight)
            + (self.parsedData.output_score * self.weights.get("output", 0) / total_weight)
            + (self.parsedData.rules_score * self.weights.get("rules", 0) / total_weight)
        ), 2)

        return {
            "parsedData": self.parsedData.to_dict() if self.parsedData else None,
            "inputPromptScore": self.inputPromptScore,
            "completionTokens": self.initialTokenSize,
            "promptTokens": response.get("usage").get("prompt_tokens", 0),
        }

    def optimize_new_prompt_with_llm(
        self,
        ai_model: str = "openai/gpt-oss-20b",
    ) -> dict[str, Any]:
        system_prompt = f"""
        You are a world-class Prompt Engineering expert. Using given the parsed components of the user's prompt, rewrite it into a highly optimized, professional prompt that will yield the best results from an AI model.
        Analyze the optimized prompt and grade it into six components and return those 'score' values: Task, Role, Style, Output, and Rules.

        ### Instructions
        1. **Incorporate Components:** Seamlessly integrate the Task, Role, Style, Output, and Rules into a coherent prompt.
        2. **Enhance Clarity:** Use precise language and structure to ensure the prompt is clear and unambiguous.
        3. **Maximize Effectiveness:** Tailor the prompt to leverage the strengths of AI models, focusing on specificity and detail.
        4. **Weighted Approach:** Prioritize components based on the following weights when crafting the prompt:
        {self.weights}

        Parsed Prompt : {self.parsedData.to_dict() if self.parsedData else {}}

        ### Scoring Rubric
        * **0:** Component is completely missing.
        * **1-4:** Vague or implied (e.g., "write something").
        * **5-7:** Clear but generic (e.g., "write a blog post").
        * **8-10:** Highly specific, detailed, and constraint-driven.
        
        ### Output
        Return valid JSON only. Adhere strictly to this schema:
        {{
        "optimizedPrompt": "optimized_prompt", "task_score": int, "role_score": int, "style_score": int, "output_score": int, "rules_score": int
        }}

        """
        response = run_nebius_ai(
            prompt=self.inputPrompt, system_prompt=system_prompt, ai_model=ai_model
        )

        response_content = response["choices"][0]["message"]["content"]


        if isinstance(response_content, str):
            # Clean the JSON response before parsing
            response_content = clean_json_response(response_content)
            if not response_content.strip():
                raise ValueError("AI returned empty response for optimization")
            try:
                response_content = json.loads(response_content)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Content that failed to parse: {response_content}")
                raise ValueError(f"AI returned invalid JSON for optimization: {str(e)}")
        

        new_optimized_id = str(uuid.uuid4())
        self.optimizedPrompt = response_content.get("optimizedPrompt", "")
        self.finalTokenSize = count_tokens(self.optimizedPrompt)
        self.usedLLM = ai_model

        # Calculate optimized score using same weights
        total_weight = sum(self.weights.values())
        optimized_score = round(10*(
            (response_content.get("task_score", 0) * self.weights.get(  "task", 0) / total_weight)
            + (response_content.get("role_score", 0) * self.weights.get("role", 0) / total_weight)
            + (response_content.get("style_score", 0) * self.weights.get("style", 0) / total_weight)
            + (response_content.get("output_score", 0) * self.weights.get("output", 0) / total_weight)
            + (response_content.get("rules_score", 0) * self.weights.get("rules", 0) / total_weight)
        ), 2)
        
        # Assign to overallScore so it gets saved to Firestore
        self.overallScore = optimized_score

        return {
            "optimizedPromptID": new_optimized_id,
            "optimizedPrompt": self.optimizedPrompt,
            "finalTokenSize": self.finalTokenSize,
            "usedLLM": ai_model,
            "optimizedScore": optimized_score,
            "optimizedParsedData": self.parsedData.to_dict() if self.parsedData else None,
        }

    def save_rating_to_firestore(self, rating: float) -> bool:
        try:
            self.rating = rating

            db = get_firestore_client()
            prompt_ref = db.collection("prompts").document(self.promptID)
            prompt_ref.update({"rating": self.rating})

            return True
        except:
            return False

    def save_latency_to_firestore(self, latency) -> bool:
        try:
            self.latencyMs = round(latency, 2)

            db = get_firestore_client()
            prompt_ref = db.collection("prompts").document(self.promptID)
            prompt_ref.update({"latencyMs": self.latencyMs})

            return True
        except:
            return False

    def toggle_favorite_in_firestore(self) -> bool:
        try:
            self.isFavorite = not self.isFavorite

            db = get_firestore_client()
            prompt_ref = db.collection("prompts").document(self.promptID)
            prompt_ref.update({"isFavorite": self.isFavorite})

            return True
        except:
            return False

    @staticmethod
    def get_prompt_from_firestore(prompt_id: str) -> Optional["PromptDBModel"]:
        from services.firebase_db import get_firestore_client

        db = get_firestore_client()
        prompt_ref = db.collection("prompts").document(prompt_id)
        doc = prompt_ref.get()
        if doc.exists:
            data = doc.to_dict()
            # Convert parsedData back to ParsedPrompt model
            if data.get("parsedData"):
                data["parsedData"] = ParsedPrompt(**data["parsedData"])
            return PromptDBModel(**data)
        else:
            return None
