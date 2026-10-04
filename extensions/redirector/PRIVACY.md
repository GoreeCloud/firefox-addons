# GoreeCloud Redirector Privacy

GoreeCloud Redirector is local-first. It does not include analytics, advertising, telemetry, remote code, or a GoreeCloud network service.

## Data handled

The extension stores custom redirect definitions and enabled/disabled state in Firefox extension storage. A redirect definition contains the user-supplied rule name, source URL prefix, destination URL, enabled state, and the source origin needed for Firefox permission checks.

The built-in Google Keep → GoreeCloud Memos redirect is packaged with the extension and evaluated by Firefox Declarative Net Request.

## Permissions

The extension requires access only to `https://keep.google.com/*` for its packaged built-in redirect. Custom redirects use optional HTTP/HTTPS host permissions. Firefox is asked for a custom source origin only when the user explicitly enables or saves a rule that requires that origin.

Imported rules do not silently request new origin access. If an imported rule was enabled in the backup but its source permission is not already granted, it is restored paused until the user explicitly enables it and Firefox can present the permission request.

## Portability

Redirect backup export is explicitly user-triggered and writes a local JSON file containing redirect definitions only. It does not export cookies, credentials, browsing history, page contents, request logs, or Firefox permission grants.

Import is explicitly user-triggered, bounded to 1 MiB before parsing, validates the product/schema, and accepts at most 200 rules.

## Network boundary

Redirector does not fetch remote rule lists or contact a telemetry endpoint. Firefox performs redirect matching internally. The local rule preview evaluates entered test URLs inside the extension settings page and does not navigate or transmit the URL.
