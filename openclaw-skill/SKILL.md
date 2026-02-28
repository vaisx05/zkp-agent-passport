# ZKAuth Secure Agent Protocol

This skill enables the AI Agent to securely interact with the ZKAuth Gateway, which proxies requests to platforms like GitHub using Zero-Knowledge Proofs. 
The agent does not hold real API keys; instead, it generates a mathematical proof that it is allowed to perform a certain action.

## Capabilities

- Securely push a file to a GitHub repository using ZKAuth constraints.

## Tools

### `zkauth_push_file`
Push a file securely to a GitHub repository. Generates a local ZKP, hashes the payload, and sends the proof + payload to the ZKAuth Gateway.

**Parameters:**
- `repoPath` (string, required): The target repository (e.g., `vaisx05/zkp-agent-passport`).
- `filename` (string, required): The name and path of the file to create/update (e.g., `ai-push.md`).
- `content` (string, required): The content to write into the file.

**Command:**
```bash
node ./zkauth.js <repoPath> <filename> <content>
```
*(Paths resolve relative to this skill folder)*

## Usage Instructions for AI

When a user asks to "push a file", "upload a file", or "commit code" securely via ZKAuth:
1. Extract the repository path, desired filename, and file content.
2. Call the `zkauth_push_file` tool using the `exec` tool.
3. If it succeeds, the script will output the GitHub URL of the newly created file. Relay this success to the user.
