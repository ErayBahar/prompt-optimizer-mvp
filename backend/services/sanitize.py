"""
Input sanitization utilities for XSS and injection prevention
TC-87: Güvenlik & Spam Önlemi
"""

import re
import html
from typing import Dict, List, Tuple, Optional


# HTML entities that need escaping
HTML_ESCAPE_TABLE = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
}


def escape_html(text: str) -> str:
    """
    Escape HTML special characters to prevent XSS attacks.
    
    Args:
        text: The input string to sanitize
        
    Returns:
        Sanitized string with HTML entities escaped
    """
    if not text or not isinstance(text, str):
        return ""
    
    return html.escape(text, quote=True)


def strip_dangerous_tags(text: str) -> str:
    """
    Remove potentially dangerous HTML tags and scripts.
    
    Args:
        text: The input string to sanitize
        
    Returns:
        Sanitized string with dangerous content removed
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Remove script tags and their content
    text = re.sub(r'<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>', '', text, flags=re.IGNORECASE)
    
    # Remove event handlers (onclick, onerror, onload, etc.)
    text = re.sub(r'\s*on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*on\w+\s*=\s*[^\s>]*', '', text, flags=re.IGNORECASE)
    
    # Remove javascript: protocol
    text = re.sub(r'javascript\s*:', '', text, flags=re.IGNORECASE)
    
    # Remove data: protocol for potential XSS
    text = re.sub(r'data\s*:\s*text/html', '', text, flags=re.IGNORECASE)
    
    # Remove iframe, object, embed tags
    text = re.sub(r'<(iframe|object|embed|form)[^>]*>.*?</\1>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<(iframe|object|embed|form)[^>]*/?\s*>', '', text, flags=re.IGNORECASE)
    
    # Remove style tags with expressions
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove meta, link, base tags
    text = re.sub(r'<(meta|link|base)[^>]*/?\s*>', '', text, flags=re.IGNORECASE)
    
    return text


# SQL injection patterns to detect and block
SQL_INJECTION_PATTERNS = [
    re.compile(r'\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE|GRANT|REVOKE)\b', re.IGNORECASE),
    re.compile(r'(--)|(;)|(\/\*)|(\*\/)'),
    re.compile(r"'(\s*)(OR|AND)(\s*)'?(\s*)(\d+|')", re.IGNORECASE),
    re.compile(r'"(\s*)(OR|AND)(\s*)"?(\s*)(\d+|")', re.IGNORECASE),
    re.compile(r'\b(OR|AND)\b\s+\d+\s*=\s*\d+', re.IGNORECASE),
    re.compile(r"\b(OR|AND)\b\s+'[^']*'\s*=\s*'[^']*'", re.IGNORECASE),
]


def detect_sql_injection(text: str) -> Tuple[bool, List[str]]:
    """
    Check if input contains potential SQL injection patterns.
    
    Args:
        text: The input string to check
        
    Returns:
        Tuple of (is_valid, detected_patterns)
    """
    if not text or not isinstance(text, str):
        return True, []
    
    detected_patterns = []
    
    for pattern in SQL_INJECTION_PATTERNS:
        matches = pattern.findall(text)
        if matches:
            detected_patterns.extend([str(m) if isinstance(m, str) else str(m[0]) for m in matches])
    
    return len(detected_patterns) == 0, detected_patterns


# XSS patterns to detect
XSS_PATTERNS = [
    re.compile(r'<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>', re.IGNORECASE),
    re.compile(r'javascript\s*:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),
    re.compile(r'<iframe', re.IGNORECASE),
    re.compile(r'<object', re.IGNORECASE),
    re.compile(r'<embed', re.IGNORECASE),
    re.compile(r'<svg\s+onload', re.IGNORECASE),
    re.compile(r'<img\s+[^>]*onerror', re.IGNORECASE),
    re.compile(r'expression\s*\(', re.IGNORECASE),
    re.compile(r'url\s*\(\s*["\']?\s*javascript', re.IGNORECASE),
]


def detect_xss(text: str) -> Tuple[bool, List[str]]:
    """
    Check if input contains potential XSS patterns.
    
    Args:
        text: The input string to check
        
    Returns:
        Tuple of (is_valid, detected_patterns)
    """
    if not text or not isinstance(text, str):
        return True, []
    
    detected_patterns = []
    
    for pattern in XSS_PATTERNS:
        matches = pattern.findall(text)
        if matches:
            detected_patterns.extend(matches)
    
    return len(detected_patterns) == 0, detected_patterns


def sanitize_input(text: str) -> str:
    """
    Comprehensive input sanitization that handles XSS and common injection patterns.
    
    Args:
        text: The input string to sanitize
        
    Returns:
        Sanitized string safe for display and storage
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Step 1: Trim whitespace
    sanitized = text.strip()
    
    # Step 2: Remove dangerous HTML tags and scripts
    sanitized = strip_dangerous_tags(sanitized)
    
    # Step 3: Escape remaining HTML entities
    sanitized = escape_html(sanitized)
    
    return sanitized


def validate_and_sanitize(
    text: str,
    max_length: int = 10000,
    min_length: int = 0,
    allow_html: bool = False,
    check_sql_injection: bool = True,
    check_xss: bool = True,
) -> Dict:
    """
    Validate and sanitize user input for forms.
    
    Args:
        text: The input string to validate and sanitize
        max_length: Maximum allowed length
        min_length: Minimum required length
        allow_html: Whether to allow HTML content
        check_sql_injection: Whether to check for SQL injection
        check_xss: Whether to check for XSS
        
    Returns:
        Dictionary with validation result
    """
    errors = []
    warnings = []
    
    if not text or not isinstance(text, str):
        return {
            "is_valid": min_length == 0,
            "sanitized_value": "",
            "errors": ["Input is required"] if min_length > 0 else [],
            "warnings": [],
        }
    
    # Check length constraints
    if len(text) < min_length:
        errors.append(f"Input must be at least {min_length} characters")
    
    if len(text) > max_length:
        errors.append(f"Input must be no more than {max_length} characters")
    
    # Check for XSS patterns
    if check_xss:
        xss_valid, xss_patterns = detect_xss(text)
        if not xss_valid:
            warnings.append("Potentially unsafe content detected and removed")
    
    # Check for SQL injection patterns
    if check_sql_injection:
        sql_valid, sql_patterns = detect_sql_injection(text)
        if not sql_valid:
            warnings.append("Potentially unsafe patterns detected")
    
    # Sanitize the input
    sanitized_value = text
    if not allow_html:
        sanitized_value = sanitize_input(text)
    
    # Enforce max length on sanitized value
    if len(sanitized_value) > max_length:
        sanitized_value = sanitized_value[:max_length]
    
    return {
        "is_valid": len(errors) == 0,
        "sanitized_value": sanitized_value,
        "errors": errors,
        "warnings": warnings,
    }


def safe_text(text: str) -> str:
    """
    Safe text display - use when rendering user-generated content.
    
    Args:
        text: The text to make safe for display
        
    Returns:
        Safe text for rendering
    """
    return escape_html(text or "")
