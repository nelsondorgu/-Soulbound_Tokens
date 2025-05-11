import { describe, expect, it } from "vitest";

// Mock contract functions
const mockContract = {
  credentials: new Map(),
  principalCredentials: new Map(),
  credentialIdNonce: 0,
  
  // Owner for access control
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',

  // Error codes
  errorUnauthorized: 403,
  errorNotFound: 404,
  errorAlreadyExists: 409,

  // Credential functions
  createCredentialType(caller, name, description, metadataUri, revocable) {
    // Check authorization
    if (caller !== this.contractOwner) {
      return { type: 'error', value: this.errorUnauthorized };
    }
    
    const newId = this.credentialIdNonce;
    this.credentialIdNonce++;
    
    this.credentials.set(newId, {
      name,
      description,
      issuer: caller,
      metadataUri,
      revocable
    });
    
    return { type: 'ok', value: newId };
  },
  
  getCredentialById(credentialId) {
    return this.credentials.get(credentialId) || null;
  },
  
  issueCredential(caller, credentialId, recipient) {
    // Check authorization
    if (caller !== this.contractOwner) {
      return { type: 'error', value: this.errorUnauthorized };
    }
    
    // Check if credential exists
    if (!this.credentials.has(credentialId)) {
      return { type: 'error', value: this.errorNotFound };
    }
    
    // Check if already issued
    const key = `${recipient}-${credentialId}`;
    if (this.principalCredentials.has(key)) {
      return { type: 'error', value: this.errorAlreadyExists };
    }
    
    // Issue credential
    this.principalCredentials.set(key, {
      issueHeight: 0,
      issueTime: Date.now(),
      revoked: false
    });
    
    return { type: 'ok', value: true };
  },
  
  hasCredential(owner, credentialId) {
    const key = `${owner}-${credentialId}`;
    const credential = this.principalCredentials.get(key);
    return credential && !credential.revoked;
  },
  
  isCredentialRevoked(owner, credentialId) {
    const key = `${owner}-${credentialId}`;
    const credential = this.principalCredentials.get(key);
    return credential ? credential.revoked : true;
  },
  
  revokeCredential(caller, credentialId, from) {
    // Check authorization
    if (caller !== this.contractOwner) {
      return { type: 'error', value: this.errorUnauthorized };
    }
    
    // Check if credential exists
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      return { type: 'error', value: this.errorNotFound };
    }
    
    // Check if revocable
    if (!credential.revocable) {
      return { type: 'error', value: this.errorUnauthorized };
    }
    
    // Check if issued
    const key = `${from}-${credentialId}`;
    const issuedCredential = this.principalCredentials.get(key);
    if (!issuedCredential) {
      return { type: 'error', value: this.errorNotFound };
    }
    
    // Revoke
    this.principalCredentials.set(key, {
      ...issuedCredential,
      revoked: true
    });
    
    return { type: 'ok', value: true };
  },
  
  // Reset state for tests
  reset() {
    this.credentials.clear();
    this.principalCredentials.clear();
    this.credentialIdNonce = 0;
  }
};

describe("Soulbound Tokens (SBTs) Contract Tests", () => {
  // Test accounts
  const deployer = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const user1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const user2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
  
  // Reset state before each test
  beforeEach(() => {
    mockContract.reset();
    mockContract.contractOwner = deployer;
  });
  
  describe("Credential Type Management", () => {
    it("should allow contract owner to create a new credential type", () => {
      const result = mockContract.createCredentialType(
        deployer,
        "Clarity Developer",
        "Certified Clarity programming skills",
        "ipfs://QmExample",
        true // revocable
      );
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(0);
    });
    
    it("should prevent non-owners from creating credential types", () => {
      const result = mockContract.createCredentialType(
        user1, // not the owner
        "Invalid Credential",
        "Should fail due to access control",
        "ipfs://QmInvalid",
        true
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorUnauthorized);
    });
    
    it("should correctly increment credential IDs", () => {
      const result1 = mockContract.createCredentialType(
        deployer,
        "First Credential",
        "First test credential",
        "ipfs://Qm1",
        true
      );
      
      const result2 = mockContract.createCredentialType(
        deployer,
        "Second Credential",
        "Second test credential",
        "ipfs://Qm2",
        false
      );
      
      expect(result1.value).toBe(0);
      expect(result2.value).toBe(1);
    });
    
    it("should allow querying credential details by ID", () => {
      const credName = "Query Test Credential";
      const credDesc = "Testing get-credential-by-id function";
      const metadataUri = "ipfs://QmTest";
      
      mockContract.createCredentialType(
        deployer,
        credName,
        credDesc,
        metadataUri,
        true
      );
      
      const result = mockContract.getCredentialById(0);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe(credName);
      expect(result.description).toBe(credDesc);
      expect(result.metadataUri).toBe(metadataUri);
    });
  });
  
  describe("Credential Issuance", () => {
    it("should allow contract owner to issue credentials", () => {
      // Create a credential type
      mockContract.createCredentialType(
        deployer,
        "Issuance Test",
        "Testing credential issuance",
        "ipfs://QmIssue",
        true
      );
      
      // Issue the credential
      const result = mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
    });
    
    it("should prevent issuing non-existent credentials", () => {
      // Try to issue a credential that doesn't exist
      const result = mockContract.issueCredential(
        deployer,
        999, // Non-existent ID
        user1
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorNotFound);
    });
    
    it("should prevent non-owners from issuing credentials", () => {
      // Create a credential
      mockContract.createCredentialType(
        deployer,
        "Auth Test",
        "Testing authorization for issuance",
        "ipfs://QmAuth",
        true
      );
      
      // Try to issue as non-owner
      const result = mockContract.issueCredential(
        user1, // not the owner
        0,
        user2
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorUnauthorized);
    });
    
    it("should prevent issuing the same credential twice", () => {
      // Create a credential
      mockContract.createCredentialType(
        deployer,
        "Duplicate Test",
        "Testing duplicate issuance prevention",
        "ipfs://QmDup",
        true
      );
      
      // Issue once
      mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      // Try to issue again
      const result = mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorAlreadyExists);
    });
  });
  
  describe("Credential Verification", () => {
    it("should correctly verify if a principal has a credential", () => {
      // Create a credential
      mockContract.createCredentialType(
        deployer,
        "Verification Test",
        "Testing credential verification",
        "ipfs://QmVerify",
        true
      );
      
      // Issue to user1 only
      mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      // Check verification
      const hasUser1Credential = mockContract.hasCredential(user1, 0);
      const hasUser2Credential = mockContract.hasCredential(user2, 0);
      
      expect(hasUser1Credential).toBe(true);
      expect(hasUser2Credential).toBe(false);
    });
  });
  
  describe("Credential Revocation", () => {
    it("should allow revoking a revocable credential", () => {
      // Create a revocable credential
      mockContract.createCredentialType(
        deployer,
        "Revocable Credential",
        "Testing credential revocation",
        "ipfs://QmRevoke",
        true // revocable
      );
      
      // Issue to user1
      mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      // Verify before revocation
      const hasBefore = mockContract.hasCredential(user1, 0);
      expect(hasBefore).toBe(true);
      
      // Revoke
      const result = mockContract.revokeCredential(
        deployer,
        0,
        user1
      );
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      
      // Verify after revocation
      const hasAfter = mockContract.hasCredential(user1, 0);
      const isRevoked = mockContract.isCredentialRevoked(user1, 0);
      
      expect(hasAfter).toBe(false);
      expect(isRevoked).toBe(true);
    });
    
    it("should prevent revoking non-revocable credentials", () => {
      // Create a non-revocable credential
      mockContract.createCredentialType(
        deployer,
        "Permanent Credential",
        "Testing non-revocable credential",
        "ipfs://QmPermanent",
        false // not revocable
      );
      
      // Issue to user1
      mockContract.issueCredential(
        deployer,
        0,
        user1
      );
      
      // Try to revoke
      const result = mockContract.revokeCredential(
        deployer,
        0,
        user1
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorUnauthorized);
    });
    
    it("should prevent non-owners from revoking credentials", () => {
      // Create a revocable credential
      mockContract.createCredentialType(
        deployer,
        "Auth Revoke Test",
        "Testing revocation authorization",
        "ipfs://QmAuthRevoke",
        true // revocable
      );
      
      // Issue to user2
      mockContract.issueCredential(
        deployer,
        0,
        user2
      );
      
      // Try to revoke as user1 (not owner)
      const result = mockContract.revokeCredential(
        user1, // not owner
        0,
        user2
      );
      
      expect(result.type).toBe('error');
      expect(result.value).toBe(mockContract.errorUnauthorized);
    });
  });
});