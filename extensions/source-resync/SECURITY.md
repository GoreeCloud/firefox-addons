# GoreeCloud Source Resync Security

## Runtime boundary

Source Resync is limited to `https://chatgpt.com/*` and requires only Firefox `storage` and `tabs` permissions. It does not request broad all-site host access, native messaging, cookies, downloads, webRequest, or remote-code authority.

## Mutation safety

A resync run is accepted only when the active tab is a ChatGPT URL whose path contains a project and whose query parameter identifies the Sources tab.

Runs are serialized: if a run is already in progress, another request is rejected.

Failed-source retry is fail-closed. The background passes only distinct failed source display names from the previous result. The content script retries a requested source only when that exact displayed name is currently visible; it does not substitute another card by list position when retry mode is active.

## UI interaction boundary

The content script searches visible source cards for their local action menu and an exact visible **Resync** control. It does not submit prompts, read conversation messages, access ChatGPT credentials, or automate unrelated project controls.

## Release boundary

Changes to the supported ChatGPT DOM are compatibility-sensitive. Source validation and packaging do not establish Stable runtime acceptance; current-site Firefox verification remains required before any release claim.
