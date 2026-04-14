#!/bin/bash
set -a
source /Users/anandsharma/Ai1/.env
set +a

export SSL_CERT_FILE=$(/Users/anandsharma/Ai1/.venv311/bin/python -c "import certifi; print(certifi.where())")

echo "Starting LiveKit Voice Agent Worker..."
/Users/anandsharma/Ai1/.venv311/bin/python /Users/anandsharma/Ai1/main.py dev &
WORKER_PID=$!

sleep 3

echo "Starting FastAPI Voice API Service..."
/Users/anandsharma/Ai1/.venv311/bin/python /Users/anandsharma/Ai1/voice_api.py &
API_PID=$!

echo "Services started:"
echo "  Worker PID: $WORKER_PID"
echo "  API PID: $API_PID"
echo ""
echo "Ready for connections!"
echo ""
echo "Test with:"
echo "  curl http://localhost:8000/health"

wait
