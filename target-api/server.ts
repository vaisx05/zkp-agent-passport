import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
// @ts-ignore
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Load the .env file immediately
dotenv.config();

const app = express();
app.use(express.json());

function computePayloadHash(payload: any): string {
    const jsonStr = JSON.stringify(payload);
    const hashHex = crypto.createHash('sha256').update(jsonStr).digest('hex');
    const shortHex = hashHex.substring(0, 15);
    return BigInt('0x' + shortHex).toString();
}

// ---------------------------------------------------------
// THE VAULT: This represents the user's secure environment.
// The AI NEVER sees these keys.
// ---------------------------------------------------------
const SECRETS = {
    // We now securely load this from the .env file!
    GITHUB_API_KEY: process.env.GITHUB_API_KEY 
};

// Load the verification key generated during the setup phase
const vKey = JSON.parse(fs.readFileSync('../zk-circuits/verification_key.json', 'utf8'));

// Strict Typing for the Incoming Payload
interface AIProxyRequest {
    repoId: number;
    proof: any;
    publicSignals: string[];
    targetEndpoint: string;
    method?: string; // Optional HTTP method, defaults to POST
    requestBody: any;
}

// ---------------------------------------------------------
// THE GATEWAY: The bulletproof glass wall.
// ---------------------------------------------------------
app.post('/api/proxy/github', async (req: Request, res: Response): Promise<any> => {
    const { repoId, proof, publicSignals, targetEndpoint, requestBody } = req.body as AIProxyRequest;

    console.log(`\n[GATEWAY] AI is attempting to access GitHub API: ${targetEndpoint}`);
    console.log(`[GATEWAY] Verifying mathematical constraints...`);
    
    // 1. Verify the repo matches what the AI claims it is committing to
    if (publicSignals[0] !== String(repoId)) {
        console.log("[GATEWAY] ❌ Proof repoId does not match request repoId.");
        return res.status(400).json({ error: "Constraint mismatch: Repo ID." });
    }

    // 2. Verify Payload Hash (Cryptographic Payload Binding)
    const expectedHash = computePayloadHash(requestBody);
    if (publicSignals[1] !== expectedHash) {
        console.log(`[GATEWAY] 🚨 SECURITY ALERT: Payload tampering detected!`);
        console.log(`[GATEWAY] Expected Hash: ${expectedHash}, Proof Hash: ${publicSignals[1]}`);
        return res.status(400).json({ error: "Constraint mismatch: Payload Hash. Tampering detected." });
    }

    try {
        // 3. Cryptographic Verification using snarkjs
        const isValid = await snarkjs.plonk.verify(vKey, publicSignals, proof);
        
        if (isValid === true) {
            console.log("[GATEWAY] ✅ ZK Proof Verified! AI is mathematically authorized.");
            console.log("[GATEWAY] Injecting real API keys and forwarding to GitHub...");

            // 3. THE PROXY ACTION: Inject the real key and hit the REAL internet
            const githubUrl = `https://api.github.com${targetEndpoint}`;
            const httpMethod = req.body.method || 'POST';
            
            const githubResponse = await fetch(githubUrl, {
                method: httpMethod,
                headers: {
                    'Authorization': `Bearer ${SECRETS.GITHUB_API_KEY}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ZKAuth-Agent-Proxy',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await githubResponse.json();

            if (githubResponse.ok) {
                console.log("[GATEWAY] 🌐 Real API Call Executed Successfully.");
                return res.status(200).json({ 
                    success: true, 
                    gateway_action: "API Key Injected & Forwarded",
                    github_response: responseData
                });
            } else {
                console.log("[GATEWAY] ❌ GitHub API rejected the request.", responseData);
                return res.status(githubResponse.status).json({ 
                    error: "GitHub API Error", 
                    details: responseData 
                });
            }

        } else {
            console.log("[GATEWAY] ❌ Invalid ZK Proof! Dropping request.");
            return res.status(401).json({ error: "Invalid Zero-Knowledge Proof. Access Denied." });
        }
    } catch (err) {
        console.error("[GATEWAY] ❌ Verification error:", err);
        return res.status(500).json({ error: "Server error during verification." });
    }
});

app.listen(8000, () => {
    console.log("🛡️  ZKAuth Gateway (TypeScript) listening on http://localhost:8000");
    console.log("🔒 Waiting for mathematically constrained AI requests...");
});
