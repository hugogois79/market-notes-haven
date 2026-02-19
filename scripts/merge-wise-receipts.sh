#!/bin/bash
# Merge Wise Receipts - Cron Job
# Runs every 5 min (8h-23h) to merge unmerged Wise receipts with documents
# Calls the Supabase edge function merge-wise-receipts

SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emlvbGlrdWRvY3pzdGh5b2phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTMyMDEzMCwiZXhwIjoyMDU0ODk2MTMwfQ.GcYnQqjiGq-mgU_PqwlQV2UAQKm59xfRYRL1b9jRqEw"
BASE="https://zyziolikudoczsthyoja.supabase.co"
LOG="/tmp/merge-wise-receipts.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting merge check..." >> "$LOG"

result=$(curl -s -X POST "$BASE/functions/v1/merge-wise-receipts" \
  -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Result: $result" >> "$LOG"

# Keep log file from growing too large (last 500 lines)
tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
