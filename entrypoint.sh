#!/bin/sh

# Default to localhost if not set
export BACKEND_URL=${BACKEND_URL:-http://host.docker.internal:3000}

# Replace placeholder in nginx.conf with the actual environment variable
# We use a temp file to avoid issues with sed editing in place on some systems
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD from the Dockerfile (nginx)
exec "$@"
