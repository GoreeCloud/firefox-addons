# GoreeCloud Advanced Tab Manager — Planned Features

> **Authority:** Component-scoped repository-native planned-feature record under `extensions/advanced-tab-manager/`. The former Drive roadmap is retired after verified migration.

**Lifecycle:** Stable 0.1.13 · Accepted Stable: 0.1.13  
**Authoritative project record:** `GoreeCloud/Project Specifications/Project Specification — Advanced Tab Manager.docx`

| ID | Obligation | Priority | State |
| --- | --- | --- | --- |
| ATM-001 | Establish manifest identity, canonical directory, inventory, validation, and deterministic packaging. | High | Implemented and source-verified |
| ATM-002 | Reconstruct authoritative live Firefox tab/window/native-group state after background cold starts. | High | Implemented and source-verified |
| ATM-003 | Provide accessible sidebar and popup foundations with safe tab actions. | High | Implemented and source-verified |
| ATM-004 | Add durable tree relationships and restoration behavior. | High | Accepted in Stable 0.1.11 |
| ATM-004A | Add tree drag-and-drop, branch move/close/discard operations, and richer manual reparenting UX. | Medium | Branch close/discard plus guarded Move branch to new window are accepted in Stable 0.1.12. All branch actions require the whole branch to be visible and use two-snapshot drift rejection; discard has active/pinned/audible guards, while move is limited to non-private, unpinned, ungrouped, non-Split-View branches with post-move verification and rollback attempts. Drag-and-drop and richer reparenting remain planned. |
| ATM-005 | Add persistent Tab Sets and transactional stashing. | High | Accepted in Stable 0.1.11 |
| ATM-006 | Add duplicate review and policy-controlled cleanup. | Medium | Accepted in Stable 0.1.11 with exact-URL review and guarded cleanup |
| ATM-006A | Add optional conservative normalized-URL matching and durable protected-tab cleanup exclusions. | Medium | Opt-in tracking-normalized review/cleanup accepted in Stable 0.1.12 with exact URL still default, a bounded tracking-parameter allowlist, explicit keeper/confirmation, fresh-state recheck, and existing cleanup guards. Durable protected-tab cleanup exclusions remain planned. |
| ATM-007 | Add restart-safe snoozing and deadline reconstruction. | High | Accepted in Stable 0.1.11 with one-shot local deadlines, restart alarm reconstruction, rescheduling, and source-preserving restore |
| ATM-007A | Add richer arbitrary-date/time snooze scheduling, Later today/Tomorrow/Next week presets, explicit cancellation, and optional recurring schedules only after a separate policy/UX design. | Medium | Arbitrary future date/time, +1 hour, Later today, tomorrow morning, Next week, rescheduling, early restore, and explicit cancellation accepted in Stable 0.1.12; recurring schedules remain planned pending separate repeat-policy/UX design. |
| ATM-008 | Add rule engine, command palette, full manager, import/export, and large-session performance qualification. | Medium | Stable 0.1.11 release slice accepted — implemented rules/actions, command palette, manager diagnostics, portability, retained session snapshots, deterministic core-scale qualification, exact-candidate Firefox runtime, Glaze 1.5.1, security, signing, and restart gates passed; broader optional feature expansion remains planned |
| ATM-008A | Add explicit rule-action execution and user-facing rule management after separate mutation-safety and UX acceptance. | Medium | Accepted in Stable 0.1.11 |
| ATM-008B | Add a keyboard-first command-palette foundation without widening browser authority. | Medium | Accepted in Stable 0.1.11 |
| ATM-008C | Add a privacy-minimized full-window manager/diagnostics foundation without new mutation authority. | Medium | Accepted in Stable 0.1.11 |
| ATM-008D | Add versioned local backup export and validated source-preserving import for implemented extension-owned stores. | Medium | Accepted in Stable 0.1.11 |
| ATM-008E | Add retained local session snapshots and deterministic large-session core qualification without replacing the live Firefox session. | Medium | Accepted in Stable 0.1.11; additional representative rendered-scale/performance coverage remains future work |
| ATM-008F | Refine popup, sidebar, and Manager visual hierarchy/interaction quality; remove stale embedded lifecycle labels; requalify the material presentation delta against current Stable Glaze UI. | High | Accepted in Stable 0.1.12 and carried forward in Stable 0.1.13. Current shared GLAZE UI V1.6 / 1.6.0 consumer acceptance is established for the exact 0.1.13 runtime after fresh rendered, keyboard/assistive-technology, Forced Colors, Reduced Transparency, dark appearance, high zoom/text scaling, signing, and restart acceptance. |
| ATM-009 | Complete privacy/security review, Firefox runtime acceptance, Mozilla signing, and later Stable qualification. | High | Completed for Stable 0.1.11 — governed run `35350654198` passed signed-XPI parity/integrity, persistent installation, full Firefox restart, post-restart product acceptance, Glaze 1.5.1 consumer qualification, and Stable Security Blockers |

No roadmap entry is a release or Stable claim without exact implementation and acceptance evidence.
