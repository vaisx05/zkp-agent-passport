# ZKAuth Protocol: Zero-Knowledge AI Proxy

ZKAuth is a Zero-Knowledge Proof (ZKP) based Universal Agent Protocol. It provides a secure, mathematical "bulletproof glass" between an AI Agent and sensitive external platforms (like GitHub, Slack, Stripe, etc.).

Instead of giving an AI direct access to your API keys (which is vulnerable to prompt injections and hallucinations), you give the AI a mathematical constraint file. The AI generates a ZKP to prove its intent, and a local Gateway securely holds your real API keys, injecting them only if the math checks out.

## What We Built Today

1. **The ZKAuth Circom Math:** Built a Zero-Knowledge Circuit (`commit_auth.circom`) that verifies authorization tokens and strongly binds the ZKP to a **cryptographic hash of the payload**, ensuring no hacker can tamper with the AI's intent.
2. **The ZKAuth Gateway:** Built an Express-based TypeScript proxy server that holds the real GitHub Personal Access Token (PAT) securely inside a local `.env` vault.
3. **The Universal SDK:** Packaged the ZKP generation logic into a clean `ZKAuthAgent` TypeScript class.
4. **OpenClaw Integration:** Built a setup script (`setup.sh`) that installs a bridge directly into the OpenClaw AI's brain, allowing the AI to use natural language to generate proofs and securely interact with the GitHub API.
5. **Real World Test:** The AI successfully pushed a file to a live GitHub repository purely by generating a Zero-Knowledge Proof, without ever possessing the repository's access token!

## Folder Structure

- `/zk-circuits` - Circom math files generating the constraints and `wasm`/`zkey` compiled files.
- `/target-api` - The TypeScript Gateway Server acting as the reverse proxy (reads real API keys).
- `/agent-sdk` - The Universal Typescript SDK for AI platforms to generate mathematical proofs.
- `/openclaw-skill` - The skill files linking the SDK directly into an OpenClaw Agent workspace.

## Quick Start

1. Start the ZKAuth Gateway:
```bash
cd target-api
npm install
npx ts-node server.ts
```

2. Setup SDK & AI integration:
```bash
./setup.sh
```

## Security Guarantees
- The AI never has your API key.
- The proof is mathematically locked to the file payload using a SHA256 hash. If the payload is modified in transit, the Gateway's math check fails and immediately rejects the API call.

*(Note: API keys and generated proving keys are safely ignored in `.gitignore` and are not committed to this repo!)*
