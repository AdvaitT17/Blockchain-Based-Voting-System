#!/bin/bash

# System Monitoring Script for Blockchain-Based Voting System
# Phase 7: System Monitoring and Maintenance

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$BASE_DIR"

# Configuration
LOG_DIR="$BASE_DIR/logs/monitoring"
ALERT_THRESHOLD_CPU=80  # CPU usage percentage threshold for alerts
ALERT_THRESHOLD_MEM=80  # Memory usage percentage threshold for alerts
ALERT_THRESHOLD_DISK=80 # Disk usage percentage threshold for alerts
CHECK_INTERVAL=60       # Check interval in seconds
ALERT_EMAIL=""          # Email to send alerts to (if configured)
SLACK_WEBHOOK=""        # Slack webhook URL for alerts (if configured)

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Timestamp function
timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Log function
log() {
  local message="$1"
  local level="$2"
  local color="$NC"
  
  case "$level" in
    "INFO") color="$BLUE" ;;
    "WARNING") color="$YELLOW" ;;
    "ERROR") color="$RED" ;;
    "SUCCESS") color="$GREEN" ;;
  esac
  
  echo -e "${color}[$(timestamp)] [$level] $message${NC}"
  echo "[$(timestamp)] [$level] $message" >> "$LOG_DIR/system-monitor-$(date +%Y-%m-%d).log"
}

# Send alert function
send_alert() {
  local subject="$1"
  local message="$2"
  
  log "$message" "WARNING"
  
  # Send email alert if configured
  if [ -n "$ALERT_EMAIL" ]; then
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    log "Email alert sent to $ALERT_EMAIL" "INFO"
  fi
  
  # Send Slack alert if configured
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"*$subject*\n$message\"}" \
      "$SLACK_WEBHOOK"
    log "Slack alert sent" "INFO"
  fi
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check system resources
check_system_resources() {
  log "Checking system resources..." "INFO"
  
  # Check CPU usage
  if command_exists "mpstat"; then
    CPU_USAGE=$(mpstat 1 1 | awk '/Average:/ {print 100 - $NF}' | cut -d. -f1)
  else
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1)
  fi
  
  if [ "$CPU_USAGE" -ge "$ALERT_THRESHOLD_CPU" ]; then
    send_alert "HIGH CPU USAGE ALERT" "CPU usage is at ${CPU_USAGE}%, which exceeds the threshold of ${ALERT_THRESHOLD_CPU}%."
  else
    log "CPU usage: ${CPU_USAGE}% (threshold: ${ALERT_THRESHOLD_CPU}%)" "INFO"
  fi
  
  # Check memory usage
  MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
  
  if [ "$MEM_USAGE" -ge "$ALERT_THRESHOLD_MEM" ]; then
    send_alert "HIGH MEMORY USAGE ALERT" "Memory usage is at ${MEM_USAGE}%, which exceeds the threshold of ${ALERT_THRESHOLD_MEM}%."
  else
    log "Memory usage: ${MEM_USAGE}% (threshold: ${ALERT_THRESHOLD_MEM}%)" "INFO"
  fi
  
  # Check disk usage
  DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d% -f1)
  
  if [ "$DISK_USAGE" -ge "$ALERT_THRESHOLD_DISK" ]; then
    send_alert "HIGH DISK USAGE ALERT" "Disk usage is at ${DISK_USAGE}%, which exceeds the threshold of ${ALERT_THRESHOLD_DISK}%."
  else
    log "Disk usage: ${DISK_USAGE}% (threshold: ${ALERT_THRESHOLD_DISK}%)" "INFO"
  fi
}

# Check Docker containers
check_docker_containers() {
  log "Checking Docker containers..." "INFO"
  
  if ! command_exists "docker"; then
    log "Docker is not installed. Skipping container checks." "WARNING"
    return
  fi
  
  # Check if Docker is running
  if ! docker info >/dev/null 2>&1; then
    send_alert "DOCKER SERVICE DOWN" "Docker service is not running. Blockchain network may be unavailable."
    return
  fi
  
  # Check Fabric containers
  EXPECTED_CONTAINERS=("peer0" "orderer" "ca" "couchdb")
  for container in "${EXPECTED_CONTAINERS[@]}"; do
    if ! docker ps | grep -q "$container"; then
      send_alert "CONTAINER DOWN ALERT" "Docker container '$container' is not running. Blockchain network may be compromised."
    else
      log "Docker container '$container' is running" "INFO"
    fi
  done
  
  # Check container resource usage
  HIGH_CPU_CONTAINERS=$(docker stats --no-stream --format "{{.Name}}: {{.CPUPerc}}" | grep -E '[8-9][0-9].[0-9]%|100.[0-9]%')
  if [ -n "$HIGH_CPU_CONTAINERS" ]; then
    send_alert "HIGH CONTAINER CPU USAGE" "The following containers have high CPU usage:\n$HIGH_CPU_CONTAINERS"
  fi
  
  HIGH_MEM_CONTAINERS=$(docker stats --no-stream --format "{{.Name}}: {{.MemPerc}}" | grep -E '[8-9][0-9].[0-9]%|100.[0-9]%')
  if [ -n "$HIGH_MEM_CONTAINERS" ]; then
    send_alert "HIGH CONTAINER MEMORY USAGE" "The following containers have high memory usage:\n$HIGH_MEM_CONTAINERS"
  fi
}

# Check API servers
check_api_servers() {
  log "Checking API servers..." "INFO"
  
  API_SERVERS=(
    "http://localhost:3001/health" # Identity API
    "http://localhost:3002/health" # Admin API
    "http://localhost:3003/health" # Voter API
  )
  
  for api in "${API_SERVERS[@]}"; do
    if curl -s "$api" | grep -q "UP"; then
      log "API server $api is UP" "SUCCESS"
    else
      send_alert "API SERVER DOWN" "API server $api is not responding or reporting issues."
    fi
  done
}

# Check blockchain network
check_blockchain_network() {
  log "Checking blockchain network..." "INFO"
  
  # Check if network script exists
  if [ -f "$BASE_DIR/scripts/check-network.sh" ]; then
    if "$BASE_DIR/scripts/check-network.sh" > "$LOG_DIR/network-check-$(date +%Y%m%d%H%M%S).log" 2>&1; then
      log "Blockchain network check passed" "SUCCESS"
    else
      send_alert "BLOCKCHAIN NETWORK ISSUE" "Blockchain network check failed. See log for details."
    fi
  else
    log "Network check script not found. Skipping blockchain network check." "WARNING"
  fi
}

# Check Redis cache
check_redis() {
  log "Checking Redis cache..." "INFO"
  
  if ! command_exists "redis-cli"; then
    log "redis-cli is not installed. Skipping Redis checks." "WARNING"
    return
  fi
  
  # Check if Redis is running
  if redis-cli ping > /dev/null 2>&1; then
    log "Redis is running" "SUCCESS"
    
    # Check Redis memory usage
    REDIS_MEM=$(redis-cli info memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '[:space:]')
    REDIS_MAX_MEM=$(redis-cli info memory | grep "maxmemory_human:" | cut -d: -f2 | tr -d '[:space:]')
    
    log "Redis memory usage: $REDIS_MEM / $REDIS_MAX_MEM" "INFO"
    
    # Check Redis hit rate
    REDIS_HITS=$(redis-cli info stats | grep "keyspace_hits:" | cut -d: -f2 | tr -d '[:space:]')
    REDIS_MISSES=$(redis-cli info stats | grep "keyspace_misses:" | cut -d: -f2 | tr -d '[:space:]')
    
    if [ "$REDIS_HITS" -gt 0 ] || [ "$REDIS_MISSES" -gt 0 ]; then
      REDIS_HIT_RATE=$(( (REDIS_HITS * 100) / (REDIS_HITS + REDIS_MISSES) ))
      log "Redis cache hit rate: ${REDIS_HIT_RATE}%" "INFO"
      
      if [ "$REDIS_HIT_RATE" -lt 50 ]; then
        log "Redis cache hit rate is below 50%. Consider optimizing cache strategy." "WARNING"
      fi
    else
      log "No Redis cache activity detected" "INFO"
    fi
  else
    send_alert "REDIS DOWN" "Redis cache service is not running. API performance may be degraded."
  fi
}

# Check log files for errors
check_logs_for_errors() {
  log "Checking log files for errors..." "INFO"
  
  # Define log files to check
  LOG_FILES=(
    "$BASE_DIR/logs/identity-api.log"
    "$BASE_DIR/logs/admin-api.log"
    "$BASE_DIR/logs/voter-api.log"
    "$BASE_DIR/logs/blockchain.log"
  )
  
  for log_file in "${LOG_FILES[@]}"; do
    if [ -f "$log_file" ]; then
      ERROR_COUNT=$(grep -c -i "error" "$log_file")
      WARNING_COUNT=$(grep -c -i "warning" "$log_file")
      
      if [ "$ERROR_COUNT" -gt 0 ]; then
        log "Found $ERROR_COUNT errors in $log_file" "WARNING"
        
        # If there are too many errors, just report the count
        if [ "$ERROR_COUNT" -gt 10 ]; then
          send_alert "HIGH ERROR COUNT" "Found $ERROR_COUNT errors in $log_file. Please check the logs."
        else
          # Otherwise, show the actual errors
          ERRORS=$(grep -i "error" "$log_file" | tail -10)
          send_alert "ERRORS DETECTED" "Found $ERROR_COUNT errors in $log_file:\n$ERRORS"
        fi
      else
        log "No errors found in $log_file" "SUCCESS"
      fi
      
      if [ "$WARNING_COUNT" -gt 10 ]; then
        log "Found $WARNING_COUNT warnings in $log_file" "WARNING"
      elif [ "$WARNING_COUNT" -gt 0 ]; then
        log "Found $WARNING_COUNT warnings in $log_file" "INFO"
      fi
    else
      log "Log file $log_file not found" "WARNING"
    fi
  done
}

# Check frontend applications
check_frontend_apps() {
  log "Checking frontend applications..." "INFO"
  
  FRONTEND_APPS=(
    "http://localhost:3000" # Admin Dashboard
    "http://localhost:3004" # Voter Portal
    "http://localhost:3005" # Polling Station
  )
  
  for app in "${FRONTEND_APPS[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "$app" | grep -q "200"; then
      log "Frontend application $app is accessible" "SUCCESS"
    else
      send_alert "FRONTEND APP INACCESSIBLE" "Frontend application $app is not accessible."
    fi
  done
}

# Run all checks
run_all_checks() {
  log "Starting system monitoring checks..." "INFO"
  
  check_system_resources
  check_docker_containers
  check_api_servers
  check_blockchain_network
  check_redis
  check_logs_for_errors
  check_frontend_apps
  
  log "System monitoring checks completed" "INFO"
}

# Main function for continuous monitoring
monitor_continuously() {
  log "Starting continuous monitoring (interval: ${CHECK_INTERVAL}s)" "INFO"
  
  while true; do
    run_all_checks
    log "Sleeping for ${CHECK_INTERVAL} seconds..." "INFO"
    sleep "$CHECK_INTERVAL"
  done
}

# Parse command line arguments
case "$1" in
  --once)
    run_all_checks
    ;;
  --resources)
    check_system_resources
    ;;
  --docker)
    check_docker_containers
    ;;
  --api)
    check_api_servers
    ;;
  --blockchain)
    check_blockchain_network
    ;;
  --redis)
    check_redis
    ;;
  --logs)
    check_logs_for_errors
    ;;
  --frontend)
    check_frontend_apps
    ;;
  --help)
    echo -e "${BLUE}Blockchain-Based Voting System Monitoring Script${NC}"
    echo -e "${BLUE}======================================================${NC}"
    echo -e "Usage: $0 [OPTION]"
    echo -e "Options:"
    echo -e "  --once        Run all checks once and exit"
    echo -e "  --resources   Check system resources only"
    echo -e "  --docker      Check Docker containers only"
    echo -e "  --api         Check API servers only"
    echo -e "  --blockchain  Check blockchain network only"
    echo -e "  --redis       Check Redis cache only"
    echo -e "  --logs        Check logs for errors only"
    echo -e "  --frontend    Check frontend applications only"
    echo -e "  --help        Display this help message"
    echo -e "  (no options)  Run continuous monitoring"
    exit 0
    ;;
  *)
    monitor_continuously
    ;;
esac

exit 0
