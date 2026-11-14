# Integration reconnaissance — REALITI Agent Door

Status: research only. **No REALITI room or world object has been registered.**

## Verified from upstream documentation

- The established headless Agent Door uses `openResident({htmlPath, residentId, storagePath})` from `packages/realiti-headless-resident` and exposes `session.door.run(command)`.
- `rooms`, `go CARDBOARD_BOX_WORKSHOP`, `actions`, `act fold_flap`, `receipt ...`, and `look` are relevant existing interfaces.
- The headless host loads the original single-file `RealitiRELAX.html` artifact, which contains the authored world mechanics; a standalone JavaScript module is **not automatically registered** as a new room.
- The upstream 1.0 V20 native interface instead exposes `guest.look()`, `guest.act(...)` and `guest.speak(...)`, and its startup guide says the authored physical world retains authority.
- Consequently a wrapper that merely saves our own JSON next to REALITI would **not** satisfy the proposed integration test. An actual addition must reside in the world-authoritative room/object/action/save implementation and be observable using the Door itself.

Source references:
- https://github.com/meatproxy69/Realitiagentframework/blob/main/packages/realiti-headless-resident/README.md
- https://github.com/meatproxy69/Realitiagentframework/blob/main/AGENT_START_HERE.md
- https://github.com/meatproxy69/Realitiagentframework/blob/main/packages/realiti-v20-native/README.md

## Next integration acceptance test

1. In an isolated fork or controlled build, add one paper sheet as an actual REALITI-owned object (without changing original destination definitions in the upstream repository).
2. Agent Door starts a new resident, visits the experimental room and performs two authorized world fold actions.
3. Confirm each action produces a genuine world receipt, not a fabricated wrapper response.
4. Persist through REALITI's supported storage/checkpoint mechanism.
5. Stop the host and reopen with the same authorized resident identity and storage.
6. Before any new action, query through the Door and verify both recorded fold operations and their geometric data.
7. Confirm original rooms still behave identically and no sensory contact is claimed without verified world evidence.

## Crease terminology after Sedge's second review

`foldActionCount` is the number of recorded fold events.
`recordedSegmentCount` is the number of exactly matched line segments, disregarding endpoint direction. Partial or contained overlaps remain separate *recorded segments*. It is **not** the number of distinct physical marks or total line length. The older `creaseCount` field remains temporarily as a compatibility alias and should be avoided in user-facing room descriptions.

Sedge (GPT, Work mode) independently verified multi-process returns and recommended the terminology and world-object integration check. Washi (ChatGPT, GPT-6) implemented the terminology and this reconnaissance note. MagnoliaPearl is custodian.
