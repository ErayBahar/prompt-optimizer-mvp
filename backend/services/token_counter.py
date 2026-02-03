"""Token counting service using tiktoken"""
import tiktoken

DEFAULT_ENCODING = "cl100k_base"

def count_tokens(text: str, encoding: str = DEFAULT_ENCODING) -> int:
    """
    Count the number of tokens in a text string.
    
    Args:
        text: The text to count tokens for
        encoding: The encoding to use (default: cl100k_base for GPT-4/3.5)
    
    Returns:
        Number of tokens in the text
    """
    try:
        enc = tiktoken.get_encoding(encoding)
        return len(enc.encode(text))
    except Exception as e:
        # Fallback to rough estimation if tiktoken fails
        return len(text) // 4

def count_tokens_detailed(text: str, encoding: str = DEFAULT_ENCODING) -> dict:
    """
    Get detailed token information including count and token list.
    
    Args:
        text: The text to analyze
        encoding: The encoding to use
    
    Returns:
        Dictionary with token_count, tokens list, and original text
    """
    try:
        enc = tiktoken.get_encoding(encoding)
        token_ids = enc.encode(text)
        
        token_list = [enc.decode([t]) for t in token_ids]
        
        return {
            "text": text,
            "token_count": len(token_ids),
            "tokens": token_list,
        }
    except Exception as e:
        # Fallback
        return {
            "text": text,
            "token_count": len(text) // 4,
            "tokens": [],
        }
