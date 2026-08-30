#!/bin/sh
export MOCK_AI=1
export MOCK_PLACES=1
export PORT=3100
exec ./node_modules/.bin/next dev --port 3100
