# Soulbound Tokens (SBTs) in Clarity

A Clarity smart contract implementation of Soulbound Tokens for the Stacks blockchain ecosystem. SBTs are non-transferable tokens that represent achievements, credentials, or qualifications that are bound to a specific address/identity.

## Overview

Soulbound Tokens, first proposed by Vitalik Buterin in early 2022, represent a new type of blockchain token that is permanently bound to a specific address and cannot be transferred. This implementation in Clarity provides a framework for creating, issuing, and managing SBTs on the Stacks blockchain.

## Features

- **Non-transferable credentials**: Tokens are permanently bound to recipient addresses
- **Credential management**: Create, issue, and verify credentials
- **Revocable credentials**: Optional revocation for credentials when necessary
- **On-chain verification**: Easily verify if an address holds a specific credential
- **Metadata support**: Link to off-chain metadata for credential details

## Technical Implementation

The contract includes:

- Credential type management
- Credential issuance to Stacks addresses
- Verification functions to check credential ownership
- Optional revocation functionality for credentials marked as revocable
- Timestamp and block height tracking for issuance

## Functions

### Read-Only Functions

- `get-credential-count`: Get the total number of credential types that exist
- `get-credential-by-id`: Get details for a specific credential type
- `has-credential`: Check if a principal has a specific credential
- `get-principal-credentials`: Get all credentials for a specific principal
- `is-credential-revoked`: Check if a credential has been revoked

### Public Functions

- `create-credential-type`: Create a new credential type (contract owner only)
- `issue-credential`: Issue a credential to a principal (contract owner only)
- `revoke-credential`: Revoke a previously issued credential (if revocable)

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) for local development and testing
- Basic understanding of the Stacks blockchain and Clarity language

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/soulbound-tokens-clarity.git
cd soulbound-tokens-clarity
```

2. Install dependencies
```bash
npm install
```

3. Run tests
```bash
clarinet test
```

## Usage Examples

### Creating a credential type

```clarity
(contract-call? .soulbound-tokens create-credential-type "University Degree" "Bachelor of Computer Science" (some "ipfs://QmHash") true)
```

### Issuing a credential

```clarity
(contract-call? .soulbound-tokens issue-credential u0 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Checking if a principal has a credential

```clarity
(contract-call? .soulbound-tokens has-credential 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u0)
```

### Revoking a credential

```clarity
(contract-call? .soulbound-tokens revoke-credential u0 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Applications

Soulbound Tokens can be used for:

- Academic credentials and certifications
- Professional qualifications
- Community achievements
- Event attendance verification
- Governance and voting rights
- Proof of humanity/identity
- Access control to exclusive content or communities

## Future Improvements

- Integration with decentralized identity systems
- Batch issuance for multiple credentials
- Enhanced privacy features
- Extended metadata support
- On-chain credential verification logic

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Vitalik Buterin's proposal on Soulbound Tokens
- Built for the Stacks blockchain ecosystem using Clarity