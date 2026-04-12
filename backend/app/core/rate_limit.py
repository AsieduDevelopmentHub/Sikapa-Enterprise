"""
Shared SlowAPI limiter for middleware and route decorators.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

login_limiter = limiter.limit("10/minute")
register_limiter = limiter.limit("5/minute")
password_reset_limiter = limiter.limit("2/minute")
auth_limiter = limiter.limit("10/minute")
password_reset_request_limiter = limiter.limit("3/minute")
password_reset_confirm_limiter = limiter.limit("5/minute")
token_refresh_limiter = limiter.limit("5/minute")
