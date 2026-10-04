# GoreeCloud Redirector Security

## Runtime boundary

GoreeCloud Redirector uses Firefox Manifest V3 Declarative Net Request and local extension storage. It does not inject content scripts into websites and does not load remote executable code.

Custom source-site authority is optional and origin-scoped. The extension requests only the origin needed for an enabled custom redirect and attempts to release optional origin permissions when no stored enabled rule still requires them.

## Rule validation

Custom and imported rules:

- accept only `http://` or `https://` sources and destinations;
- normalize source prefixes before dynamic-rule installation;
- reject duplicate source definitions;
- reject destinations that fall back inside the same source rule and would create a redirect loop;
- use bounded rule IDs reserved for extension-managed dynamic rules.

Imported backups are product/schema bound, limited to 1 MiB before JSON parsing, and limited to 200 rules. Permission state is never trusted from the backup.

## Failure behavior

A custom rule is installed only after required source permission exists. Imported rules missing permission are restored disabled rather than widening authority automatically. If Firefox dynamic-rule updates fail, the settings operation reports the failure instead of claiming the rule is active.

## Reporting

Security-sensitive changes should preserve the no-remote-code, no-content-script, and least-origin-authority boundaries and must pass the repository source validator and applicable Firefox release gates before Stable promotion.
