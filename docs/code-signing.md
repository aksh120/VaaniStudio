# Code Signing

## Current state

Windows releases are signed at build time by `electron-builder` using the
`CSC_LINK` and `CSC_KEY_PASSWORD` values that the Release workflow injects from
GitHub Actions secrets.

| Item | Value |
|---|---|
| Signer subject | `CN=Vaani Studio, O=Akshat Apoorv, C=IN` |
| Public certificate | `certs/vaani-studio.cer` (committed, safe to distribute) |
| Private key | `certs/vaani-codesign.pfx` (never committed, ignored by `.gitignore`) |
| Algorithm | RSA 3072 / SHA-256 |
| Validity | 3 years from issue |

## Repository secrets

Both values are encrypted with the repository's public key and stored as
Actions secrets, so no signing credential exists in git history:

| Secret | Contents |
|---|---|
| `CSC_LINK` | Base64-encoded `.pfx` (single line) |
| `CSC_KEY_PASSWORD` | Password protecting that `.pfx` |

To rotate the certificate:

1. Issue or generate the new `.pfx` and its public `.cer`.
2. Replace `certs/vaani-studio.cer` with the new public certificate and commit it.
3. Store the new `.pfx` as `CSC_LINK` and its password as `CSC_KEY_PASSWORD`
   (Settings > Secrets and variables > Actions).
4. Tag a new release so the workflow signs with the new identity.

Generate the base64 secret value on Windows with:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certs\vaani-codesign.pfx"))
```

## Trust limitations

The current certificate is **self-signed**. Binaries carry a valid Authenticode
signature, but because the signing certificate does not chain to a trusted root,
Windows reports **Unknown publisher** and SmartScreen warns until each user
installs `certs/vaani-studio.cer`.

For warning-free distribution, replace it with a certificate issued by a
commercial CA:

| Type | Effect |
|---|---|
| Self-signed (current) | Signature present; Unknown publisher warning |
| OV (organization validation) | Publisher shown by name; SmartScreen reputation builds over time |
| EV (extended validation) | Publisher shown by name; SmartScreen reputation starts immediately |

The process is the same for all three: point `CSC_LINK` / `CSC_KEY_PASSWORD` at the
CA-issued `.pfx`. No workflow or configuration change is required.

## Rotating a leaked certificate

If a signing credential is ever exposed, treat it as permanently compromised:

1. Revoke the certificate with its issuer immediately.
2. Issue a replacement and update `CSC_LINK` / `CSC_KEY_PASSWORD`.
3. Remove the exposed key from the working tree and ignore it.
4. Rewrite git history so the key and its password exist in no commit.
5. Cut a new release signed with the replacement.
6. Ask GitHub Support to purge cached and unreachable objects.
