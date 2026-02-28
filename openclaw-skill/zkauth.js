#!/usr/bin/env node
const path = require('path');
// We use ts-node to run the TypeScript SDK directly for this skill
require('ts-node').register();

const { ZKAuthAgent } = require('../agent-sdk/index.ts');

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Usage: node zkauth.js <repoPath> <filename> <content>");
        process.exit(1);
    }

    const repoPath = args[0]; // e.g. vaisx05/zkp-agent-passport
    const filename = args[1]; // e.g. openclaw-hello.md
    const content = args[2];  // e.g. "Hello from OpenClaw via ZKAuth"

    // Hardcoded for MVP, would normally be loaded from agent's internal secure memory
    const repoId = 1;
    const secretAuthToken = 12345;

    const agent = new ZKAuthAgent(repoId, secretAuthToken);
    
    try {
        const result = await agent.pushSecureFile(repoPath, filename, content);
        if (result.success) {
            console.log(`✅ Success! File securely pushed to ${repoPath}/${filename}.`);
            console.log(`GitHub URL: ${result.github_response?.content?.html_url}`);
        } else {
            console.error(`❌ Gateway rejected the request: ${JSON.stringify(result)}`);
        }
    } catch (error) {
        console.error(`❌ Error during ZKAuth execution: ${error}`);
    }
}

main();