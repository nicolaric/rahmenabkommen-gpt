from functools import wraps
from hmac import compare_digest

from flask import current_app, jsonify, request


def require_internal_token(view):
    """Allow only the UI server to call write endpoints.

    The UI server sends the shared INTERNAL_API_TOKEN as a bearer token. Without
    it, anyone could write made-up answers into the feed. When no token is
    configured (local development) the check is skipped.
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = current_app.config.get("INTERNAL_API_TOKEN")
        if expected:
            provided = request.headers.get("Authorization", "").removeprefix("Bearer ")
            if not compare_digest(provided, expected):
                return jsonify({"error": "Unauthorized"}), 401
        return view(*args, **kwargs)

    return wrapper
