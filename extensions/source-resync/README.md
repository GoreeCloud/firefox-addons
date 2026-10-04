# GoreeCloud Source Resync

GoreeCloud Source Resync is the Firefox extension for manually refreshing resyncable Google Drive sources attached to ChatGPT Projects.

This directory is the canonical source location for active Firefox development of Source Resync. The former standalone repository is retained only as a legacy migration and history source.

**Current source version:** `1.1.3`  
**Source state:** `canonical-source`  
**Firefox add-on ID:** `source-resync@goreecloud.com`  
**Canonical repository:** `GoreeCloud/firefox-addons`

## Included runtime

- Firefox Manifest V3 metadata
- background runtime with bounded local run history
- explicit **Retry failed sources** action that replays only source names reported failed by the immediately previous run and fails closed if a named card is no longer present
- ChatGPT Project Sources content integration
- Glaze UI-styled floating action and popup interface
- canonical first-party extension icon

## Maintenance

New Source Resync Firefox changes belong in this directory. Release and validation automation should be maintained from the parent `firefox-addons` repository so that shared extension engineering rules remain consistent across the GoreeCloud extension portfolio.

The legacy repository may remain available for historical reference, but it is no longer the preferred location for new Firefox extension development after this migration is merged.


## 1.1.3 source boundary

1.1.3 remains manual-only: it does not add alarms, background scheduling, automatic project opening, or unattended resync. Retry still requires an active ChatGPT Project Sources page and targets only exact failed source names visible on that page. Recent run history is bounded to ten local records and is not transmitted by the extension.
