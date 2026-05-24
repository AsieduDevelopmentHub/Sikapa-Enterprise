# Git hooks — strip commit trailers

These hooks remove **all** `Co-authored-by` lines and other attribution/git trailer lines from commit messages (including Cursor, Copilot, and similar tooling).

## Enable (required once per clone)

```bash
git config core.hooksPath .githooks
```

On Windows (Git Bash or PowerShell from repo root):

```powershell
git config core.hooksPath .githooks
```

`core.hooksPath` is local to this repository and does not change your global git config.

## What runs

| Hook | When |
|------|------|
| `prepare-commit-msg` | Before the editor opens / message is finalized |
| `commit-msg` | After the full message is assembled (catches late-injected trailers) |

Both call `strip_commit_trailers.py`, which:

- Deletes every `Co-authored-by: …` line
- Deletes common attribution trailers (`Made-with`, `Made-by`, `Signed-off-by`, etc.)
- Deletes any other `Key: value` trailer except project refs (`Fixes:`, `Closes:`, `Refs:`, etc.)
- Deletes any trailer whose value mentions Cursor/Copilot agent addresses

## Verify

```bash
git config core.hooksPath
# should print: .githooks

echo -e "feat: test\n\nCo-authored-by: Cursor <cursoragent@cursor.com>" > /tmp/msg.txt
python .githooks/strip_commit_trailers.py /tmp/msg.txt
cat /tmp/msg.txt
# should be only: feat: test
```
