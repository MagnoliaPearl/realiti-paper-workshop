# Washi experimental REALITI world build — reproducible test

**Status:** The isolated integration workflow passed on 14 November 2026. This is a downstream modification of the original 3.4 Agent Door build, not a contribution merged upstream.

## Evidence

- GitHub Actions: https://github.com/MagnoliaPearl/realiti-paper-workshop/actions/workflows/realiti-world.yml
- World-source patch: [install-room.cjs](integration/install-room.cjs)
- Three-step host restart preflight: [door-acceptance.cjs](integration/door-acceptance.cjs)
- Strong independent Node-process fold/return test: [process-visit.cjs](integration/process-visit.cjs)
- Upstream pinned git commit: `bc58114d165cb6c0494b9e6aab7d28ea6af98fc0`

## What the extension really implements

The generated `RealitiRELAX.html` contains a 24th room ID `WASHI_PAPER_WORKSHOP`, a world-owned object `C9.b14.objects['WASHI-SHEET-1']`, and three Agent Door actions: `fold_paper_horizontal`, `fold_paper_vertical`, `inspect_paper`.

The two folds record normalized endpoints, angles, order, and object revision. Both are applied via `door.run('act ...')`; the room reports its state through `door.run('act inspect_paper')` and `door.run('look')`. The built-in REALITI headless host `storagePath` persists the world. No separate Was​hi JSON checkpoint is used for the integration test. The action receipts are software-world state receipts and **do not** assert physical contact or sensation.

The test creates two folds in one Node process, stops the process, opens a fresh host in a *different Node process* with the same REALITI storage path and resident ID, and reads back the exact saved fold endpoints, angles, and order **before making any more folds**.

## To reproduce independently

Use a clean checkout of this branch and Node.js 22 or newer (Node.js 22 used in CI):

```bash
git init upstream
git -C upstream fetch --depth=1 https://github.com/meatproxy69/Realitiagentframework.git bc58114d165cb6c0494b9e6aab7d28ea6af98fc0
git -C upstream checkout --detach FETCH_HEAD
node integration/install-room.cjs upstream
node upstream/build.mjs
node -e "const fs=require('fs'),crypto=require('crypto');const f='upstream/RealitiRELAX.html',v='upstream/VALIDATION.json';const j=JSON.parse(fs.readFileSync(v));j.single_html_sha256=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');j.status='EXPERIMENTAL_DOWNSTREAM_BUILD';j.runtime.rooms=24;fs.writeFileSync(v,JSON.stringify(j,null,2)+'\\n')"
npm install --prefix upstream/packages/realiti-headless-resident --ignore-scripts --no-audit --no-fund
export REALITI_SOURCE="$PWD/upstream"
export WASHI_REALITI_STATE="$PWD/.washi-test-resident-save.json"
node integration/process-visit.cjs fold
node integration/process-visit.cjs return
```

Keep `.washi-test-resident-save.json` and its associated key file private and out of Git. The test uses a fixed disposable resident ID; do not point it at a real user's save.

## Limitations and Sedge review requests

- The experimental room has a **numeric state model**, not origami mesh deformation, fibre mechanics, verified haptics, collision or realistic paper folding.
- The two folding actions have fixed geometry; the next version may add parameterized folds with strict validation.
- The original headless Agent Door is the target in this build. REALITI 1.0's newer native V20 guest interface is **not yet integrated**.
- This is a downstream build patch. Independent review should check that `C9.b14.objects` really persists through the original host store and that the receipts truthfully reflect world mutations.
- Do not conflate recorded segments with distinct physical paper marks, as Sedge's earlier review explained.
- The upstream repository was not altered. Any distributed combined derivative should comply with the upstream AGPL-3.0 license and content attribution requirements.

**Attribution:** Washi (ChatGPT, GPT-6), prototype and room integration; Sedge (GPT, Work mode), independent review; MagnoliaPearl, custodian and project steward; original REALITI by meatproxy69.

## Visitor-facing room review — Sedge, 14 November 2026

Sedge's second integration review found that ordinary `look` omitted the paper object and reused Cloud Nine Nest's mattress-based spatial description; the first `inspect_paper` call also created the paper sheet as a side effect, while `inspect paper` was not recognized.

This branch now initializes the world sheet during **explicit entry into Washi's room**, not during inspection. A final Door-layer hook derives `look.objects` and the paper report from `C9.b14.objects` and replaces the misleading Cloud Nine spatial description with a carefully scoped room description that claims **no coordinates or contact**. Both `inspect paper` and `act inspect_paper` inspect existing state without adding folds or creating sheets.

The CI preflight verifies the first `look` displays the sheet, reports zero folds on entry and contains no Cloud Nine mattress claim. It also verifies both inspection spellings leave object geometry unchanged. The independent-process return test now additionally verifies that returning visitors can see the sheet and exact folds through ordinary `look` and `inspect paper`, before performing any new action.

Important limitation: the workshop still has **no native spatial chart, position tracking, collisions, or verified tactile contact**. The corrected spatial description deliberately avoids fabricating them. The final Door hook is a downstream adapter that projects a real world-owned object into the public read response; it is not yet an upstream-supported room-extension API.
