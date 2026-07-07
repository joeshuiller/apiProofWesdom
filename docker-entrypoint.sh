#!/bin/sh
set -e

echo "Starting application entrypoint..."

# Wait for DB to be ready (optional if using docker-compose healthchecks, but good for robustness)
# Here we just start the app, but you could add migration logic:
# npm run migration:run

echo "Starting node application..."
exec "$@"
