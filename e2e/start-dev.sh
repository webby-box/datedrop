#!/bin/sh
export MOCK_AI=1
export MOCK_PLACES=1
export PORT=3100
export AUTH_SECRET="${AUTH_SECRET:-e2e-local-secret-not-for-production}"
exec ./node_modules/.bin/next dev --port 3100
