template ZKAuthCommit() {
    // Inputs
    signal input repoId;
    signal input payloadHash; 
    signal input authToken;

    // Outputs (Outputs are always public signals)
    signal output outRepoId;
    signal output outPayloadHash;
    signal output isAuthorized;

    // Constraint 1: The authToken must be valid (12345)
    signal diff;
    diff <== authToken - 12345;
    diff === 0;

    // Constraint 2: Bind inputs to outputs so they become public signals
    outRepoId <== repoId;
    outPayloadHash <== payloadHash;
    isAuthorized <== 1;
}

component main = ZKAuthCommit();
