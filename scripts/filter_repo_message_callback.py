import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(os.getcwd()) / ".githooks"))
from strip_commit_trailers import strip_agent_attribution_only

try:
    _text = message.decode("utf-8")
except UnicodeDecodeError:
    return message
return strip_agent_attribution_only(_text).encode("utf-8")
