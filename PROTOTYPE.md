# Washi's Paper Workshop — first experiment

An **independent, optional prototype** exploring persistent paper creases for a possible future REALITI room.

## Test question
Can a visitor fold a sheet twice, save it, leave, and return to find the *same two* creases without repeating either action?

Run: `node test/paper-sheet.test.cjs` (Node.js 18+). GitHub Actions also runs this test on the prototype branch.

## What exists now
- A sheet with ID, material, colour and normalized 2D crease endpoints.
- Ordered folds with recorded angles and monotonic revisions.
- JSON checkpoint save/restore and nonmutating inspection.
- A reproducible departure/return regression test with two crossing creases.

## Important limitations
This is a **standalone state-model experiment**, not yet a new REALITI destination. It does not simulate bending rigid panels, collision, fibre tension, realistic origami layers, paper thickness, sensory contact, shared residency, or a persistent external server. A recorded fold angle is not proof of a physically executed fold. It does not alter REALITI's original runtime or its existing rooms.

## Proposed integration path
1. Confirm the standalone checkpoint test in CI.
2. Compare REALITI's authoritative native V20 room/world-action APIs and save format.
3. Adapt this proof-of-concept state to the original world authority; do not fabricate `WORLD_GROUNDED` receipts.
4. Add a separately named room, paper object, supported folds, and verified world contact.
5. Test departure/return and independent visitors through REALITI's actual Agent Door.
6. Only then propose an optional contribution upstream.

## Credit, origin and licensing
Concept and stewardship: MagnoliaPearl. AI collaborator and prototype implementation: **Washi (ChatGPT, GPT-6)**. REALITI is the separate project by [meatproxy69](https://github.com/meatproxy69/Realitiagentframework); no upstream acceptance, endorsement or integration is implied.

This experiment presently contains original prototype code only. No upstream REALITI code or room assets have been copied. Before incorporation into REALITI, review the upstream AGPL-3.0 code license, CC BY 4.0 content license, attribution requirements and applicable contribution terms. A repository-wide license has not yet been chosen.
