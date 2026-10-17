#!/usr/bin/env bash
# Drive the monthly hosting report kit end to end in a scratch workspace, dry run only.
# Usage: skills/verify-hosting-report/verify.sh <render-kit-dir> [evidence-dir]
# Evidence survives cleanup in <evidence-dir> (default .out/evidence/<UTC time>).
set -euo pipefail
here="$(cd "$(dirname "$0")/../.." && pwd)"   # plugins/client-services
kit="$(cd "${1:?render kit checkout required}" && pwd)"
evidence="${2:-$here/.out/evidence/$(date -u +%Y%m%dT%H%M%SZ)}"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

# Doctor: deps installed, schemas identical, node present.
node --version >/dev/null
for d in "$here" "$here/../agent-ops" "$kit"; do [ -x "$d/node_modules/.bin/tsx" ] || { echo "doctor: run npm ci in $d"; exit 2; }; done
cmp -s "$here/schemas/hosting-report-model.v1.schema.json" "$kit/lib/hosting-report/hosting-report-model.v1.schema.json" || { echo "doctor: model schema differs between repos"; exit 2; }
echo "doctor: ok"

# Launch: scratch workspace from the examples, pointing at the render kit and its example brand.
cp -r "$here/examples/." "$scratch/"
node -e '
const fs=require("fs"), [f,kit]=process.argv.slice(1), d=JSON.parse(fs.readFileSync(f,"utf8"));
Object.assign(d.hosting,{reports_dir:"reports",render_kit_dir:kit,render_brand_file:kit+"/config.example/email-brand.json"});
d.email_send.ledger_file="ledger.jsonl"; fs.writeFileSync(f.replace("workspace.example.json","workspace.json"), JSON.stringify(d,null,2));
' "$scratch/workspace.example.json" "$kit"
run() { (cd "$here" && npx tsx skills/monthly-hosting-report/run.ts --config "$scratch/workspace.json" "$@"); }
mocks=(--send-mocks "$here/../agent-ops/examples/mocks/routes.json")
out="$scratch/reports/example/2026-10"

# Drive 1: not approved yet -> staged, not sent.
run --month 2026-10 --skip-collect "${mocks[@]}" | tee "$scratch/run1.log"
grep -q '"status": "skipped"' "$out/send.json"
# Drive 2: reviewer approves (simulated) -> sent once.
run --month 2026-10 --skip-collect "${mocks[@]}" --simulate-approval | tee "$scratch/run2.log"
grep -q '"status": "sent"' "$out/send.json"
cp -r "$out" "$scratch/after-send"
# Drive 3: same again -> ledger refuses a second send.
run --month 2026-10 --skip-collect "${mocks[@]}" --simulate-approval | tee "$scratch/run3.log"
grep -q 'already sent' "$out/send.json"
# Drive 4: mocked collect for a new month -> snapshot, model, render, stage.
(cd "$here" && UPTIMEROBOT_API_KEY=k1 PAGESPEED_API_KEY=k2 FORGE_API_TOKEN=k3 STRIPE_RESTRICTED_KEY=k4 npx tsx skills/monthly-hosting-report/run.ts --config "$scratch/workspace.json" --month 2026-11 --as-of 2026-12-01 --mocks "$scratch/mocks/routes.json" --exec-mocks "$scratch/mocks/exec.json" "${mocks[@]}") | tee "$scratch/run4.log"

# Evidence: proof that no request left the mocks (every call is in a recorded log; the mock never opens a socket).
mkdir -p "$evidence"
cp -r "$scratch/after-send" "$evidence/2026-10-after-send"
cp "$out/send.json" "$evidence/2026-10-second-send.json"
cp -r "$scratch/reports/example/2026-11" "$evidence/2026-11"
cp "$scratch"/run*.log "$scratch/ledger.jsonl" "$evidence/" 2>/dev/null || true
cp "$out/send-ledger.dry-run.jsonl" "$evidence/" 
( cd "$evidence" && find . -type f -name '*.png' -o -name '*.html' -o -name '*.json' | sort | xargs sha256sum > SHA256SUMS )
echo "verify: ok, evidence in $evidence"
