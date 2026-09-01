import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config — no R2/KV required for first deploy.
// Add r2IncrementalCache later when a NEXT_INC_CACHE_R2_BUCKET binding exists.
export default defineCloudflareConfig({});
