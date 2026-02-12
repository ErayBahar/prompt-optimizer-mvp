from time import perf_counter
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

    
# from schemas.prompt import PromptInput, PromptDBModel
import sys
from pathlib import Path

try:
    from ..schemas.prompt import PromptDBModel, PromptInput
    from ..services.nebius_ai import  test_nebius_api
    from ..services.firebase_db import get_firestore_client
except ImportError:
    # Add parent directory to path when running directly
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from schemas.prompt import PromptDBModel, PromptInput
    from services.nebius_ai import test_nebius_api
    from services.firebase_db import get_firestore_client
    
import uuid

router = APIRouter()

@router.post("/parse", response_model=dict)
async def parse_only(request: PromptInput):
    """
    Step 1: Parse and analyze a prompt without optimization.
    Returns parsed data, scores, and promptID for later optimization.
    """
    try:
        start_time = perf_counter()
        
        # Create prompt model
        prompt_model = PromptDBModel(
            promptID=str(uuid.uuid4()),
            userID=request.userID,
            projectID="default-project",
            inputPrompt=request.inputPrompt,
        )
        
        # Parse and analyze
        parsed_result = prompt_model.get_parsed_data_and_scores_from_llm_returns_score()
        
        end_time = perf_counter()
        parse_latency = (end_time - start_time) * 1000
        
        # Save to Firestore with parsed data only
        prompt_model.set_to_firestore()
        
        return {
            "status": "success",
            "promptID": prompt_model.promptID,
            "parsedData": parsed_result.get("parsedData"),
            "overallScores": parsed_result.get("overallScores"),
            "completionTokens": parsed_result.get("completionTokens"),
            "promptTokens": parsed_result.get("promptTokens"),
            "parseLatencyMs": parse_latency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimizeExisting/{prompt_id}", response_model=dict)
async def optimize_existing(prompt_id: str, weights: dict = None, ai_model: str = "openai/gpt-oss-20b"):
    """
    Step 2: Optimize an already-parsed prompt.
    Takes a promptID from /parse endpoint and generates optimized version.
    """
    try:
        from services.firebase_db import get_firestore_client
        
        start_time = perf_counter()
        
        # Load prompt from Firestore
        prompt_model = PromptDBModel.get_prompt_from_firestore(prompt_id)
        if not prompt_model:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Optimize with optional weights
        if weights:
            optimized_result = prompt_model.optimize_new_prompt_with_llm(ai_model=ai_model, weights=weights)
        else:
            optimized_result = prompt_model.optimize_new_prompt_with_llm(ai_model=ai_model)
        
        end_time = perf_counter()
        optimize_latency = (end_time - start_time) * 1000
        
        # Only update Firestore if optimizedPrompt is not empty
        if not optimized_result.get("optimizedPrompt") or not optimized_result["optimizedPrompt"].strip():
            raise HTTPException(status_code=500, detail="AI failed to generate optimized prompt")
        
        # Save latency to Firestore
        prompt_model.save_latency_to_firestore(optimize_latency, optimized_result["optimizedPromptID"])
        
        # Update Firestore with optimized data
        prompt_model.update_in_firestore({
            "optimizedPrompts": prompt_model.optimizedPrompts,
            "finalTokenSizes": prompt_model.finalTokenSizes,
            "usedLLMs": prompt_model.usedLLMs
        })
        
        return {
            "status": "success",
            "promptID": prompt_id,
            "optimizedPromptID": optimized_result["optimizedPromptID"],
            "optimizedPrompt": optimized_result["optimizedPrompt"],
            "finalTokenSize": optimized_result["finalTokenSize"],
            "usedLLM": optimized_result["usedLLM"],
            "optimizeLatencyMs": optimize_latency
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OptimizeRequest(BaseModel):
    userID: str
    inputPrompt: str
    weights: Optional[dict[str, int]] = None
    ai_model: Optional[str] = "openai/gpt-oss-20b"


@router.post("/optimize", response_model=dict)
async def optimize_prompt(request: OptimizeRequest):
    """
    Combined workflow: Parse and optimize in one request.
    For quick optimization without UI interaction between steps.
    """
    try:
        total_start = perf_counter()
        
        # Create prompt model
        prompt_model = PromptDBModel(
            promptID=str(uuid.uuid4()),
            userID=request.userID,
            projectID="default-project",
            inputPrompt=request.inputPrompt,
            usedLLM=request.ai_model,
            weights=request.weights
        )

        
        # Step 1: Parse
        parsed_result = prompt_model.get_parsed_data_and_scores_from_llm_returns_score(ai_model=request.ai_model)

        # Step 2: Optimize
        optimized_result = prompt_model.optimize_new_prompt_with_llm(ai_model=request.ai_model)
        
        total_latency = (perf_counter() - total_start) * 1000
        
        # Save latency
        prompt_model.latencyMs = round(total_latency, 2)
        
        # Only save to Firestore if optimizedPrompt is not empty
        if prompt_model.optimizedPrompt and prompt_model.optimizedPrompt.strip():
            prompt_model.set_to_firestore()
        else:
            raise HTTPException(status_code=500, detail="AI failed to generate optimized prompt")
        
        return {
            "status": "success",
            "promptID": prompt_model.promptID,
            "parsedData": parsed_result.get("parsedData"),
            "originalScore": prompt_model.inputPromptScore,
            "optimizedScore": optimized_result.get("optimizedScore"),
            "optimizedPromptID": optimized_result.get("optimizedPromptID"),
            "optimizedPrompt": optimized_result.get("optimizedPrompt"),
            "initialTokenSize": parsed_result.get("completionTokens"),
            "finalTokenSize": optimized_result.get("finalTokenSize"),
            "totalLatencyMs": total_latency,
            "createdAt" : prompt_model.createdAt
        }
    except Exception as e:
        print("Error in optimize_prompt:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/savePrompt", response_model=PromptDBModel)
async def save_prompt(prompt: PromptDBModel):
    try:
        prompt_id = prompt.set_to_firestore()
        return prompt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/testNebius", response_model=dict)
async def test_nebius_ai(request : dict):
    """
    Test endpoint for Nebius AI integration.
    Expects a JSON body with 'user_input' and 'ai_model' fields.
    """
    try:
        user_input = request.get("user_input", "")
        ai_model = request.get("ai_model", "openai/gpt-oss-20b")
        
        user_response = test_nebius_api(user_input, ai_model)
        
        return user_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{user_id}")
async def get_prompt_history(user_id: str, limit: int = 50):
    """
    Get prompt history for a specific user
    """
    try:
        db = get_firestore_client()
        prompts_ref = db.collection("prompts")
        # Query prompts for this user, order by createdAt descending
        query = prompts_ref.where("userID", "==", user_id).limit(limit)
        docs = query.stream()
        
        history = []
        for doc in docs:
            data = doc.to_dict()
            # Handle timestamp conversion
            created_at = data.get("createdAt")
            if hasattr(created_at, 'isoformat'):
                created_at = created_at.isoformat()
            
            item = {
                "id": data.get("promptID"),
                "prompt": data.get("inputPrompt"),
                "optimizedPrompt": data.get("optimizedPrompt"),
                "timestamp": created_at,
                "tokenCount": data.get("initialTokenSize", 0),
                "finalTokenCount": data.get("finalTokenSize", 0),
                "latency": data.get("latencyMs"),
                "isFavorite": data.get("isFavorite", False),
                "usedLLM" : data.get("usedLLM", ""),
                "tokenCount" : data.get("finalTokenSize", 0),
                "weights" : data.get("weights", {}),
                "parsedData": data.get("parsedData", {}),
                "optimizedScore": data.get("overallScore", 0),
                "originalScore": data.get("inputPromptScore", 0),
                "projectID": data.get("projectID", "default-project")
            }
            
            # Only include rating if it exists (not 0 or None)
            if data.get("rating"):
                item["rating"] = data.get("rating")
            
            history.append(item)
        
        # Sort by timestamp in Python (descending)
        history.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        
        return {"status": "success", "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/prompt/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """
    Delete a prompt from history
    """
    try:
        db = get_firestore_client()
        prompt_ref = db.collection("prompts").document(prompt_id)
        prompt_ref.delete()
        return {"status": "success", "message": f"Prompt {prompt_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def save_feedback(feedback_data: dict):
    """
    Save user rating for a prompt (1-5)
    
    Request body:
    {
        "promptID": "...",
        "rating": 5  // number between 1-5
    }
    """
    try:
        db = get_firestore_client()
        
        # Validate rating
        rating = feedback_data.get("rating")
        if not rating or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be a number between 1 and 5")
        
        # Update prompt with rating directly
        if feedback_data.get("promptID"):
            prompt_ref = db.collection("prompts").document(feedback_data["promptID"])
            prompt_ref.update({
                "rating": int(rating)  
            })
            return {"status": "success", "promptID": feedback_data["promptID"]}
        else:
            raise HTTPException(status_code=400, detail="promptID is required")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/prompt/{prompt_id}/favorite")
async def toggle_favorite(prompt_id: str, data: dict):
    """
    Toggle favorite status of a prompt
    """
    try:
        db = get_firestore_client()
        prompt_ref = db.collection("prompts").document(prompt_id)
        prompt_ref.update({"isFavorite": data.get("isFavorite", False)})
        return {"status": "success", "message": "Favorite status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parsePrompt", response_model=dict)
async def parse_prompt(request: PromptDBModel):
    try:
        start_time = perf_counter()
        parsed_result = request.get_parsed_data_and_scores_from_llm_returns_score()
        
        optimized_result = request.optimize_new_prompt_with_llm()

        process_time = perf_counter() - start_time

        request.save_latency_to_firestore(process_time, optimized_result["optimizedPromptID"])
        
        return {
            "parsedData": parsed_result,
            "optimizedPrompt": optimized_result,
            "processTime" : process_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

