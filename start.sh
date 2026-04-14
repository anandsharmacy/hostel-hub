#!/bin/bash

# Hostel Hub - Unified Start Script
# This script starts the FastAPI Token Server, LiveKit Voice Agent, and Vite Frontend.

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Hostel Hub Voice Assistant System...${NC}"

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $AGENT_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 1. Start FastAPI Token Server
echo -e "${GREEN}📡 Starting FastAPI Token Server on port 8000...${NC}"
cd AI_Model_Creating_and_Traning/Ai1
python3 voice_api.py > ../../voice_api.log 2>&1 &
BACKEND_PID=$!
cd ../..

# 2. Start LiveKit Voice Agent
echo -e "${GREEN}🤖 Starting LiveKit Voice Agent...${NC}"
cd AI_Model_Creating_and_Traning/Ai1
python3 main.py dev > ../../livekit_agent.log 2>&1 &
AGENT_PID=$!
cd ../..

# 3. Start Vite Frontend
echo -e "${GREEN}💻 Starting Vite Frontend on port 5173...${NC}"
npm run dev > vite.log 2>&1 &
FRONTEND_PID=$!

echo -e "${BLUE}====================================================${NC}"
echo -e "${GREEN}✅ All services are starting up!${NC}"
echo -e "🔗 Frontend: http://localhost:5173"
echo -e "🔗 Backend API: http://localhost:8000"
echo -e "📝 Logs: voice_api.log, livekit_agent.log, vite.log"
echo -e "${BLUE}====================================================${NC}"
echo -e "Press ${RED}Ctrl+C${NC} to stop all services."

# Wait for all processes
wait
