#!/bin/bash
# Script to start all backend API services

# Set the base directory
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to start an API service
start_api() {
  local service_dir="$1"
  local service_name="$(basename "$service_dir")"
  
  echo "Starting $service_name..."
  cd "$service_dir"
  
  # Check if node_modules exists, if not run npm install
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for $service_name..."
    npm install
  fi
  
  # Start the service in the background
  npm start &
  
  # Save the PID
  echo $! > "$service_dir/.pid"
  echo "$service_name started with PID: $!"
}

# Function to stop all API services
stop_apis() {
  echo "Stopping all API services..."
  
  for service_dir in "$BASE_DIR"/*/; do
    if [ -f "$service_dir/.pid" ]; then
      local pid=$(cat "$service_dir/.pid")
      local service_name="$(basename "$service_dir")"
      
      echo "Stopping $service_name (PID: $pid)..."
      kill -15 $pid 2>/dev/null || true
      rm "$service_dir/.pid"
    fi
  done
  
  echo "All API services stopped."
}

# Handle Ctrl+C
trap stop_apis EXIT

# Check if utils directory is initialized
if [ ! -d "$BASE_DIR/utils/wallet" ] || [ ! -f "$BASE_DIR/utils/connection-profile.json" ]; then
  echo "Initializing backend environment..."
  "$BASE_DIR/setup-backend-env.sh"
fi

# Start all API services
start_api "$BASE_DIR/identity-api"
start_api "$BASE_DIR/admin-api"
start_api "$BASE_DIR/voter-api"

echo "All API services started. Press Ctrl+C to stop all services."

# Keep the script running
while true; do
  sleep 1
done
