;; Soulbound Tokens (SBTs) Implementation in Clarity
;; Non-transferable tokens representing achievements or credentials
;; Authored: May 11, 2025

;; Define constants
(define-constant ERR_UNAUTHORIZED (err u403))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_ALREADY_EXISTS (err u409)) 
(define-constant CONTRACT_OWNER tx-sender)

;; Define data structures
;; Credential structure to store achievement details
(define-map credentials
  { credential-id: uint }
  {
    name: (string-ascii 100),
    description: (string-utf8 500),
    issuer: principal,
    metadata-uri: (optional (string-ascii 256)),
    revocable: bool
  }
)

;; Map to track which principals have which credentials
(define-map principal-credentials
  { owner: principal, credential-id: uint }
  { 
    issue-height: uint,
    issue-time: uint,
    revoked: bool
  }
)

;; Counter for credential IDs
(define-data-var credential-id-nonce uint u0)

;; Read-only functions

;; Get the total number of credential types that exist
(define-read-only (get-credential-count)
  (var-get credential-id-nonce)
)

;; Get credential details by ID
(define-read-only (get-credential-by-id (credential-id uint))
  (map-get? credentials { credential-id: credential-id })
)

;; Check if a principal has a specific credential
(define-read-only (has-credential (owner principal) (credential-id uint))
  (match (map-get? principal-credentials { owner: owner, credential-id: credential-id })
    credential (and (not (get revoked credential)) true)
    false
  )
)

;; Get all credentials for a specific principal (this would need pagination in a real implementation)
(define-read-only (get-principal-credentials (owner principal))
  ;; In a real implementation, you would need to use a more complex approach to return all credentials
  ;; This is just a placeholder function 
  (ok "Use indexer or off-chain service to get all credentials for a principal")
)

;; Is the credential revoked?
(define-read-only (is-credential-revoked (owner principal) (credential-id uint))
  (match (map-get? principal-credentials { owner: owner, credential-id: credential-id })
    credential (get revoked credential)
    true
  )
)

;; Public functions

;; Create a new credential type (only contract owner)
(define-public (create-credential-type 
    (name (string-ascii 100)) 
    (description (string-utf8 500)) 
    (metadata-uri (optional (string-ascii 256)))
    (revocable bool))
  (begin
    ;; Check that caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    ;; Get and increment the credential ID
    (let ((new-id (var-get credential-id-nonce)))
      ;; Update the nonce for the next credential ID
      (var-set credential-id-nonce (+ new-id u1))
      
      ;; Save the new credential type
      (map-set credentials
        { credential-id: new-id }
        {
          name: name,
          description: description,
          issuer: tx-sender,
          metadata-uri: metadata-uri,
          revocable: revocable
        }
      )
      
      ;; Return the new credential ID
      (ok new-id)
    )
  )
)

;; Issue a credential to a principal
(define-public (issue-credential (credential-id uint) (recipient principal))
  (begin
    ;; Check if the credential type exists
    (asserts! (is-some (map-get? credentials { credential-id: credential-id })) ERR_NOT_FOUND)
    
    ;; Check if the caller is the contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    ;; Check if the credential is already issued to the recipient
    (asserts! (is-none (map-get? principal-credentials { owner: recipient, credential-id: credential-id })) ERR_ALREADY_EXISTS)
    
    ;; Issue the credential - using current block information
    ;; For older Clarinet versions that don't support the quote syntax
    (map-set principal-credentials
      { owner: recipient, credential-id: credential-id }
      {
        issue-height: u0, ;; Using a default since we can't access block height in this version
        issue-time: u0,   ;; Using a default since we can't access block time in this version
        revoked: false
      }
    )
    
    ;; Return success
    (ok true)
  )
)

;; Revoke a credential (if it's revocable)
(define-public (revoke-credential (credential-id uint) (from principal))
  (begin
    ;; Check if the caller is the contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    
    ;; Get the credential
    (match (map-get? credentials { credential-id: credential-id })
      credential
        (begin
          ;; Check if the credential is revocable
          (asserts! (get revocable credential) ERR_UNAUTHORIZED)
          
          ;; Check if the credential is issued to the recipient
          (match (map-get? principal-credentials { owner: from, credential-id: credential-id })
            issued-credential
              (begin
                ;; Update the revocation status
                (map-set principal-credentials
                  { owner: from, credential-id: credential-id }
                  {
                    issue-height: (get issue-height issued-credential),
                    issue-time: (get issue-time issued-credential),
                    revoked: true
                  }
                )
                (ok true)
              )
            ERR_NOT_FOUND
          )
        )
      ERR_NOT_FOUND
    )
  )
)

;; Initialize the contract
(begin
  ;; Any initialization logic can go here
  (ok "SBT contract initialized")
)