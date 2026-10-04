# Privacy

GoreeCloud Browser Hardening is local-only.

The extension does not request host permissions and does not use content scripts, web-request interception, page injection, remote configuration, analytics, telemetry, or a GoreeCloud service connection.

It reads only Firefox browser-setting values and their control metadata through the `privacy` and `browserSettings` extension APIs. The selected profile name is stored locally in Firefox extension storage so the dashboard can reopen in the same profile context.

Applying a profile changes only supported Firefox browser settings. Generating a `policies.json` file happens entirely inside the extension page. Saving or copying that file occurs only after an explicit user action. Existing policy text loaded or pasted for audit is parsed only in the current dashboard session, is not written to extension storage, is not transmitted, and is never applied automatically.

The extension does not collect, transmit, or retain browsing history, visited URLs, search terms, cookies, page contents, passwords, clipboard contents, account information, or user identifiers.
