#!/bin/bash

# EduDash Pro Development Memory Monitor
# Usage: ./scripts/monitor-memory.sh [interval_seconds]

INTERVAL=${1:-5}  # Default 5 seconds
LOG_FILE="/tmp/edudash-memory.log"

echo "🚀 EduDash Pro Memory Monitor (Interval: ${INTERVAL}s)"
echo "📊 Monitoring memory usage for development processes..."
echo "💾 Log file: ${LOG_FILE}"
echo "Press Ctrl+C to stop"
echo "----------------------------------------"

# Create log file with headers
echo "timestamp,total_mem_gb,used_mem_gb,free_mem_gb,swap_used_mb,top_process" > "${LOG_FILE}"

while true; do
    # Get memory info
    MEMORY_INFO=$(free -m | awk 'NR==2{printf "%.1f,%.1f,%.1f", $2/1024, $3/1024, $7/1024}')
    SWAP_USED=$(free -m | awk 'NR==3{printf "%d", $3}')
    
    # Get top memory process (excluding kernel processes)
    TOP_PROCESS=$(ps aux --sort=-%mem | awk 'NR==2 && !/\[.*\]$/ {printf "%s(%.1f%%)", $11, $4}')
    
    # Current timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Display current status
    echo "⏰ ${TIMESTAMP}"
    echo "💾 Memory: $(echo ${MEMORY_INFO} | cut -d',' -f2)GB used / $(echo ${MEMORY_INFO} | cut -d',' -f1)GB total"
    echo "💿 Swap: ${SWAP_USED}MB used"
    echo "🔥 Top Process: ${TOP_PROCESS}"
    
    # Log to file
    echo "${TIMESTAMP},${MEMORY_INFO},${SWAP_USED},${TOP_PROCESS}" >> "${LOG_FILE}"
    
    # Check for high memory usage (>80%)
    USED_PERCENT=$(echo "${MEMORY_INFO}" | awk -F',' '{printf "%.0f", ($2/$1)*100}')
    if [ "${USED_PERCENT}" -gt 80 ]; then
        echo "⚠️  HIGH MEMORY USAGE: ${USED_PERCENT}%"
    fi
    
    # Check for high swap usage (>500MB)
    if [ "${SWAP_USED}" -gt 500 ]; then
        echo "⚠️  HIGH SWAP USAGE: ${SWAP_USED}MB"
    fi
    
    echo "----------------------------------------"
    sleep "${INTERVAL}"
done
