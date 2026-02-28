import * as crypto from "crypto";
import * as path from "path";
// @ts-ignore
import * as snarkjs from "snarkjs";

export class ZKAuthAgent {
    private repoId: number;
    private secretAuthToken: number;
    private gatewayUrl: string;

    constructor(repoId: number, secretAuthToken: number, gatewayUrl: string = "http://localhost:8000") {
        this.repoId = repoId;
        this.secretAuthToken = secretAuthToken;
        this.gatewayUrl = gatewayUrl;
    }

    private computePayloadHash(payload: any): string {
        const jsonStr = JSON.stringify(payload);
        const hashHex = crypto.createHash('sha256').update(jsonStr).digest('hex');
        const shortHex = hashHex.substring(0, 15);
        return BigInt('0x' + shortHex).toString();
    }

    public async pushSecureFile(repoPath: string, filename: string, content: string, commitMessage: string = "Automated SECURE commit via ZKAuth Agent 🚀"): Promise<any> {
        const base64Content = Buffer.from(content).toString('base64');

        const githubPayload = {
            message: commitMessage,
            content: base64Content
        };

        const pHash = this.computePayloadHash(githubPayload);

        const inputs = {
            repoId: this.repoId,
            payloadHash: pHash,
            authToken: this.secretAuthToken
        };

        const wasmPath = path.resolve(__dirname, "../../zk-circuits/commit_auth.wasm");
        const zkeyPath = path.resolve(__dirname, "../../zk-circuits/circuit_final.zkey");

        console.log(`[ZKAuth SDK] Generating ZK Proof for payload hash: ${pHash}...`);
        const { proof, publicSignals } = await snarkjs.plonk.fullProve(inputs, wasmPath, zkeyPath);
        console.log("[ZKAuth SDK] ✅ ZK Proof locally generated.");

        const targetEndpoint = `/repos/${repoPath}/contents/${filename}`;

        console.log(`[ZKAuth SDK] Sending Proof + Payload to Gateway (${this.gatewayUrl})...`);
        const response = await fetch(`${this.gatewayUrl}/api/proxy/github`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                repoId: this.repoId,
                proof: proof,
                publicSignals: publicSignals,
                targetEndpoint: targetEndpoint,
                method: "PUT", 
                requestBody: githubPayload                        
            })
        });

        const data = await response.json();
        return data;
    }
}
