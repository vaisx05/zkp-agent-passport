/// <reference types="node" />
// @ts-ignore
import * as snarkjs from "snarkjs";
const path = require("path");

import * as crypto from "crypto";

interface AgentInputs {
    repoId: number;
    payloadHash: string;
    authToken: number;
}

function computePayloadHash(payload: any): string {
    const jsonStr = JSON.stringify(payload);
    const hashHex = crypto.createHash('sha256').update(jsonStr).digest('hex');
    const shortHex = hashHex.substring(0, 15);
    return BigInt('0x' + shortHex).toString();
}

async function runAIAgent(repoId: number, secretAuthToken: number) {
    console.log(`\n[Agent] Goal: I need to create an issue on GitHub Repo #${repoId}.`);
    console.log(`[Agent] Generating Zero-Knowledge Proof to satisfy Gateway constraints...`);

    // 1. Prepare the payload we ACTUALLY want to send to GitHub
    const fileContent = "Hello from ZKAuth! This file was mathematically bound to the proof.\\n\\nIf a hacker changes this text, the proof will fail verification at the Gateway.";
    const base64Content = Buffer.from(fileContent).toString('base64');

    const githubPayload = {
        message: "Automated SECURE commit via ZKAuth Agent 🚀",
        content: base64Content
    };

    // 2. Hash the payload to bind it to the ZKP
    const pHash = computePayloadHash(githubPayload);
    console.log(`[Agent] Computed Payload Hash: ${pHash}`);

    // The inputs to the circuit
    const inputs: AgentInputs = {
        repoId: repoId,
        payloadHash: pHash,
        authToken: secretAuthToken
    };

    const wasmPath = path.resolve(__dirname, "../zk-circuits/commit_auth.wasm");
    const zkeyPath = path.resolve(__dirname, "../zk-circuits/circuit_final.zkey");

    try {
        // 3. Generate the ZKP locally on the AI's machine
        const { proof, publicSignals } = await snarkjs.plonk.fullProve(inputs, wasmPath, zkeyPath);
        console.log("[Agent] ✅ Math checks out locally. Proof generated!");
        console.log(`[Agent] Public Signals: ${JSON.stringify(publicSignals)}`);

        console.log("[Agent] Sending payload + proof to the ZKAuth Gateway...");

        // 4. Send it to our Gateway (NOT directly to GitHub)
        const response = await fetch("http://localhost:8000/api/proxy/github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                repoId: repoId,
                proof: proof,
                publicSignals: publicSignals,
                targetEndpoint: "/repos/vaisx05/zkp-agent-passport/contents/zkauth-secure-demo.md", // NEW FILE
                method: "PUT", 
                requestBody: githubPayload                        
            })
        });

        const data = await response.json();
        console.log("\n[Agent] Gateway Response:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.log("[Agent] ❌ Error generating proof: I do not have the mathematical right to do this!");
    }
}

// We know the valid authToken constraint in the circuit is 12345
const REPO_ID = 1;
const VALID_TOKEN = 12345;

async function execute() {
    console.log("=== AI AGENT INITIATED (Real GitHub Test) ===");
    await runAIAgent(REPO_ID, VALID_TOKEN);
}

execute();
