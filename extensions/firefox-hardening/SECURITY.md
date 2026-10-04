# Security

GoreeCloud Browser Hardening deliberately keeps a narrow trust boundary.

- No host permissions or content scripts.
- No remote code, remote configuration, update feed, or runtime network request.
- No browsing-data or account-data access.
- Browser settings are changed only through Firefox's supported BrowserSetting interfaces.
- A setting controlled by another extension or locked by another authority is not overwritten.
- Restore releases only settings Firefox reports as controlled by this extension.
- Maximum mode requires an additional user confirmation because it can break WebRTC applications and changes password-saving behavior.
- Enterprise policy output is generated locally and is never installed automatically; deployment remains an explicit operating-system action.
- Existing-policy audit parses JSON locally, does not execute imported content, does not persist the imported document, and never applies audit input automatically.
- Platform deployment guides are text-only and do not write files.

The generated policy intentionally avoids disabling Firefox application updates, Safe Browsing, TLS validation, sandboxing, certificate checks, or other security-update mechanisms.
