#!/bin/bash
set -e

echo "==============================================="
echo " ZKAuth Universal SDK & Gateway Setup"
echo "==============================================="

# Detect if the script is being run in the Workspace root
if [ ! -d "agent-sdk" ] || [ ! -d "target-api" ]; then
  echo "❌ Please run this script from the ZKAuth-Workspace root directory."
  exit 1
fi

echo "📦 1. Installing dependencies..."
cd agent-sdk
npm install > /dev/null 2>&1
cd ../target-api
npm install > /dev/null 2>&1
cd ..
echo "✅ Dependencies installed."

echo ""
echo "🔐 2. Configuring the ZKAuth Gateway"
ENV_FILE="target-api/.env"

if [ -f "$ENV_FILE" ]; then
    echo "✅ Existing .env found in target-api. Skipping token prompt."
else
    echo "The Gateway needs API tokens to perform actions on your behalf."
    echo "These tokens stay locally on your machine and are NEVER given to the AI."
    echo ""
    read -p "Enter your GitHub Personal Access Token (Classic, public_repo scope): " github_token
    
    if [ ! -z "$github_token" ]; then
        echo "GITHUB_API_KEY=$github_token" > "$ENV_FILE"
        echo "✅ Saved token to $ENV_FILE safely."
    else
        echo "⚠️ No token provided. You will need to manually create target-api/.env later."
    fi
fi

echo ""
echo "🔗 3. Connecting to AI Agents..."

# OpenClaw Skill Installation
if [ -d "$HOME/.openclaw/workspace" ]; then
  echo "✅ OpenClaw detected on this system."
  echo "Copying ZKAuth Skill to OpenClaw workspace..."
  
  SKILL_DIR="$HOME/.openclaw/workspace/skills/zkauth"
  mkdir -p "$SKILL_DIR"
  cp openclaw-skill/SKILL.md "$SKILL_DIR/SKILL.md"
  cp openclaw-skill/zkauth.js "$SKILL_DIR/zkauth.js"
  
  ln -sfn "$(pwd)/agent-sdk" "$SKILL_DIR/agent-sdk"
  ln -sfn "$(pwd)/zk-circuits" "$SKILL_DIR/zk-circuits"
  
  echo "✅ ZKAuth Skill installed to OpenClaw!"
else
  echo "⚠️ OpenClaw workspace not found at $HOME/.openclaw/workspace."
fi

echo ""
echo "==============================================="
echo "🎉 Setup Complete!"
echo "1. Start your Gateway in a new terminal:"
echo "   cd target-api && npx ts-node server.ts"
echo "2. Tell your AI: 'Securely push a file to github via ZKAuth'."
echo "==============================================="
