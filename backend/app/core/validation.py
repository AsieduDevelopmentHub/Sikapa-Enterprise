"""
Input validation and sanitization utilities.
"""
import re
from typing import Optional
from bleach import clean


class ValidationRules:
    """Common validation patterns."""
    
    # Email regex (simplified but practical)
    EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Phone number (international +1-999-999-9999)
    PHONE_REGEX = r'^\+?1?\d{9,15}$'
    
    # URL pattern
    URL_REGEX = r'^https?://[^\s/$.?#].[^\s]*$'
    
    # Username (alphanumeric, underscore, hyphen, 3-50 chars)
    USERNAME_REGEX = r'^[a-zA-Z0-9_-]{3,50}$'
    
    # SKU pattern (alphanumeric and hyphens, max 10 chars for production)
    SKU_REGEX = r'^[A-Z0-9-]{3,10}$'


def validate_email(email: str) -> str:
    """
    Validate and normalize email.
    
    Args:
        email: Email to validate
    
    Returns:
        Normalized email (lowercase, trimmed)
    
    Raises:
        ValueError: If email is invalid
    """
    email = email.strip().lower()
    
    if not email or len(email) > 254:
        raise ValueError("Email must be between 1 and 254 characters")
    
    if not re.match(ValidationRules.EMAIL_REGEX, email):
        raise ValueError("Email format is invalid")
    
    return email


def validate_phone(phone: str) -> str:
    """
    Validate and normalize phone number.
    
    Args:
        phone: Phone number to validate
    
    Returns:
        Normalized phone number
    
    Raises:
        ValueError: If phone is invalid
    """
    # Remove common formatting characters
    phone = re.sub(r'[\s\-\.\(\)]+', '', phone)
    
    if not re.match(ValidationRules.PHONE_REGEX, phone):
        raise ValueError("Phone number format is invalid")
    
    return phone


def validate_password(password: str) -> None:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
    
    Raises:
        ValueError: If password doesn't meet requirements
    """
    if not password:
        raise ValueError("Password is required")
    
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    
    if len(password) > 128:
        raise ValueError("Password must be at most 128 characters")
    
    # Check for variety
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()-_=+[]{}|;:,.<>?' for c in password)
    
    variety = sum([has_lower, has_upper, has_digit, has_special])
    
    if variety < 3:
        raise ValueError(
            "Password must contain at least 3 of: lowercase, uppercase, digits, special characters"
        )


def validate_username(username: str) -> str:
    """
    Validate and normalize username.
    
    Args:
        username: Username to validate
    
    Returns:
        Normalized username
    
    Raises:
        ValueError: If username is invalid
    """
    username = username.strip()
    
    if not re.match(ValidationRules.USERNAME_REGEX, username):
        raise ValueError("Username must be 3-50 alphanumeric characters (underscore/hyphen allowed)")
    
    return username


def validate_url(url: str) -> str:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
    
    Returns:
        Validated URL
    
    Raises:
        ValueError: If URL is invalid
    """
    url = url.strip()
    
    if not re.match(ValidationRules.URL_REGEX, url):
        raise ValueError("Invalid URL format")
    
    if len(url) > 2048:
        raise ValueError("URL is too long (max 2048 characters)")
    
    return url


def validate_sku(sku: str) -> str:
    """
    Validate product SKU.
    
    Args:
        sku: SKU to validate
    
    Returns:
        Validated SKU
    
    Raises:
        ValueError: If SKU is invalid
    """
    sku = sku.strip().upper()
    
    if not re.match(ValidationRules.SKU_REGEX, sku):
        raise ValueError("SKU must be 3-15 characters (alphanumeric and hyphens)")
    
    return sku


def abbreviate_sku(full_name: str, target_length: int = 10) -> str:
    """
    Generate abbreviated SKU from product name (10-15 chars).
    
    Uses initials of words + suffix combination to create unique identifiers.
    
    Args:
        full_name: Product name to abbreviate
        target_length: Target SKU length (3-10, default 10)
    
    Returns:
        Abbreviated SKU in format like "CLKR-BLUE-001" or "TC-LG-RED-001"
    """
    if target_length < 3 or target_length > 10:
        target_length = 10
    
    # Clean input
    full_name = full_name.strip().upper()
    full_name = re.sub(r'[^A-Z0-9\s]', '', full_name)
    
    words = [w for w in full_name.split() if w]
    
    if not words:
        raise ValueError("Product name must contain at least one word")
    
    # Strategy: Use first letters of meaningful words
    # Take up to 3 words' initials, join with hyphens
    abbrev_parts = []
    
    for word in words[:3]:
        if len(word) > 2:
            abbrev_parts.append(word[:3])  # First 3 chars of each word
        elif len(word) >= 2:
            abbrev_parts.append(word[:2])
        else:
            abbrev_parts.append(word)
    
    abbrev = '-'.join(abbrev_parts)
    
    # Trim if too long
    if len(abbrev) > target_length:
        abbrev = abbrev[:target_length]
    
    return abbrev


def sanitize_html(html: str, allowed_tags: Optional[set] = None) -> str:
    """
    Sanitize HTML content to prevent XSS.
    
    Args:
        html: HTML content to sanitize
        allowed_tags: Set of allowed tags (default: basic safe tags)
    
    Returns:
        Sanitized HTML
    """
    if allowed_tags is None:
        allowed_tags = {
            'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        }
    
    # Strip everything by default, only allow specified tags
    return clean(
        html,
        tags=allowed_tags,
        strip=True,
        strip_comments=True,
    )


def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize plain text (remove XSS attempts, trim whitespace).
    
    Args:
        text: Text to sanitize
        max_length: Optional maximum length
    
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove control characters and trim
    text = ''.join(c for c in text if ord(c) >= 32 or c in '\n\t')
    text = text.strip()
    
    # Enforce max length
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def validate_amount(amount: float, min_amount: float = 0.01, max_amount: float = 999999.99) -> float:
    """
    Validate monetary amount.
    
    Args:
        amount: Amount to validate
        min_amount: Minimum allowed amount
        max_amount: Maximum allowed amount
    
    Returns:
        Validated amount
    
    Raises:
        ValueError: If amount is invalid
    """
    if not isinstance(amount, (int, float)):
        raise ValueError("Amount must be a number")
    
    if amount < min_amount:
        raise ValueError(f"Amount must be at least {min_amount}")
    
    if amount > max_amount:
        raise ValueError(f"Amount cannot exceed {max_amount}")
    
    # Round to 2 decimal places
    return round(amount, 2)


def validate_pagination(page: int = 1, limit: int = 20) -> tuple[int, int]:
    """
    Validate pagination parameters.
    
    Args:
        page: Page number (1-indexed)
        limit: Items per page
    
    Returns:
        Tuple of (page, limit)
    
    Raises:
        ValueError: If parameters are invalid
    """
    if page < 1:
        raise ValueError("Page must be >= 1")
    
    if limit < 1 or limit > 100:
        raise ValueError("Limit must be between 1 and 100")
    
    return page, limit
