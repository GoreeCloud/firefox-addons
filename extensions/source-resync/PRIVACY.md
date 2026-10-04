# GoreeCloud Source Resync Privacy

GoreeCloud Source Resync is a local Firefox utility for user-initiated resync actions on ChatGPT Project Google Drive sources.

## Data handled

The extension reads the visible ChatGPT Project Sources interface only to locate Google Drive source cards, their displayed source names, and the visible **Resync** action needed to fulfill an explicit user request.

The background runtime stores a bounded local history of up to ten runs in Firefox extension storage. A run record can contain:

- completion time;
- number of sources requested;
- number successfully requested;
- source display names for failed items;
- local failure messages;
- run duration; and
- whether the run was a normal manual run or an explicit failed-source retry.

This information is not transmitted by Source Resync.

## What is not stored

Source Resync does not store ChatGPT conversation contents, prompt text, Google Drive file contents, credentials, cookies, authentication tokens, or a persistent project URL for unattended operation.

## Network boundary

The extension does not contact a GoreeCloud backend, analytics endpoint, remote rule service, or third-party telemetry service. It operates inside the already-open `https://chatgpt.com/*` page and uses Firefox extension messaging between its popup, background runtime, and content script.

## Manual-only boundary

Source Resync does not schedule resync actions, use Firefox alarms, automatically open projects, or run unattended. Both **Resync all now** and **Retry failed sources** require explicit user action and an active ChatGPT Project Sources page.
