"""
claude_client.py — Subprocess wrapper around the `claude` CLI (Claude Code).

Uses the Claude Code OAuth session — no separate Anthropic API key required.

Binary discovery order (first match wins):
  1. CLAUDE_BINARY_PATH in backend/.env — explicit path, fully portable across machines
  2. `claude` on PATH — works after running `claude doctor` in a terminal
  3. VS Code extension bundle  (~/.vscode/extensions/anthropic.claude-code-*)
  4. Cursor editor bundle      (~/.cursor/extensions/anthropic.claude-code-*)

To make this project portable, set in backend/.env:
  CLAUDE_BINARY_PATH=/absolute/path/to/claude
Find the path with:
  find ~/.vscode ~/.cursor -name 'claude' -type f 2>/dev/null | sort | tail -1

Usage:
    client = ClaudeClient()
    text = client.generate(system_prompt="...", user_message="...", model="sonnet")
"""
from __future__ import annotations

import glob
import logging
import os
import shutil
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# IDE extension install locations checked when claude is not on PATH.
# Both VS Code and Cursor ship the Claude Code extension with a native binary.
_FALLBACK_GLOBS = [
    str(Path.home() / ".vscode" / "extensions" / "anthropic.claude-code-*"
        / "resources" / "native-binary" / "claude"),
    str(Path.home() / ".cursor" / "extensions" / "anthropic.claude-code-*"
        / "resources" / "native-binary" / "claude"),
]


class ClaudeClientError(RuntimeError):
    """Raised when the claude CLI call fails or returns unusable output."""


def _find_claude_binary() -> str:
    """
    Locate the `claude` binary using a portable, multi-strategy search.

    Resolution order:
      1. CLAUDE_BINARY_PATH env var  (set in backend/.env — survives machine moves)
      2. `claude` on PATH            (run `claude doctor` to add it)
      3. Known IDE extension bundles (VS Code, Cursor)

    Raises ClaudeClientError with actionable instructions if nothing is found.
    """
    # 1. Explicit path from .env — recommended for portability
    env_path = os.getenv("CLAUDE_BINARY_PATH", "").strip()
    if env_path:
        if os.path.isfile(env_path) and os.access(env_path, os.X_OK):
            logger.debug("claude binary from CLAUDE_BINARY_PATH: %s", env_path)
            return env_path
        raise ClaudeClientError(
            f"CLAUDE_BINARY_PATH='{env_path}' but the file does not exist or is not "
            "executable. Check backend/.env."
        )

    # 2. claude on PATH
    on_path = shutil.which("claude")
    if on_path:
        logger.debug("claude binary on PATH: %s", on_path)
        return on_path

    # 3. IDE extension bundles
    for pattern in _FALLBACK_GLOBS:
        matches = sorted(glob.glob(pattern))
        if matches:
            path = matches[-1]  # newest version (lexicographic sort)
            logger.debug("claude binary via extension bundle: %s", path)
            return path

    raise ClaudeClientError(
        "Could not locate the `claude` binary.\n\n"
        "Fix options (choose one):\n"
        "  A) Add to backend/.env:\n"
        "       CLAUDE_BINARY_PATH=/path/to/claude\n"
        "     Find it with:\n"
        "       find ~/.vscode ~/.cursor -name 'claude' -type f 2>/dev/null | sort | tail -1\n"
        "  B) Add claude to PATH:  run `claude doctor` in a terminal\n"
        "  C) Install Claude Code: https://claude.ai/download\n"
    )


class ClaudeClient:
    """
    Thin wrapper that invokes `claude --print` for single-shot text generation.

    No API key needed — uses the existing Claude Code OAuth session.
    """

    def __init__(self) -> None:
        self._binary = _find_claude_binary()
        logger.debug("Using claude binary: %s", self._binary)

    def generate(
        self,
        *,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        agent_id: str | None = None,
        timeout: int = 120,
    ) -> str:
        """
        Call claude non-interactively and return the response text.

        Args:
            system_prompt: System instructions for the model.
            user_message:  The user turn content.
            model:         Model alias or full ID. If None, resolved from settings DB.
            agent_id:      Agent ID for per-agent model lookup in settings.
            timeout:       Subprocess timeout in seconds (default 120).

        Returns:
            The raw text response from Claude.

        Raises:
            ClaudeClientError: On non-zero exit, timeout, or empty response.
        """
        # Resolve model from settings DB if not explicitly provided
        if model is None:
            try:
                from db.sqlite_client import DatabaseClient
                db = DatabaseClient()
                if agent_id:
                    model = db.get_setting(f"agent_{agent_id}_model")
                if not model:
                    model = db.get_setting("default_model") or "sonnet"
            except Exception:
                model = "sonnet"

        cmd = [
            self._binary,
            "--print",
            "--model", model,
            "--system-prompt", system_prompt,
            "--tools", "",               # pure text generation — no tool use
            "--no-session-persistence",  # don't write sessions to ~/.claude
            "--permission-mode", "bypassPermissions",
            "--output-format", "text",
            user_message,
        ]

        # Strip CLAUDECODE so the CLI doesn't refuse to start when called from
        # inside an active Claude Code session (common during development).
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

        logger.debug("Running claude CLI (model=%s, msg_len=%d)", model, len(user_message))

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env,
            )
        except subprocess.TimeoutExpired as exc:
            raise ClaudeClientError(
                f"claude CLI timed out after {timeout}s"
            ) from exc

        if result.returncode != 0:
            stderr_snippet = (result.stderr or "")[:500]
            raise ClaudeClientError(
                f"claude CLI exited with code {result.returncode}. stderr: {stderr_snippet}"
            )

        output = result.stdout.strip()
        if not output:
            stderr_snippet = (result.stderr or "")[:500]
            raise ClaudeClientError(
                f"claude CLI returned empty output. stderr: {stderr_snippet}"
            )

        if result.stderr:
            logger.debug("claude CLI stderr: %s", result.stderr[:300])

        return output
