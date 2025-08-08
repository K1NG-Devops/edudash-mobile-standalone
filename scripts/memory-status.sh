#!/bin/bash

# Quick Memory Status for EduDash Pro Development

echo "🚀 EduDash Pro - Memory Status"
echo "================================"

# Memory overview
echo "📊 MEMORY OVERVIEW:"
free -h

echo ""
echo "🔥 TOP 5 MEMORY-CONSUMING PROCESSES:"
ps aux --sort=-%mem | head -6 | awk 'NR==1 {print "USER       PID %CPU %MEM COMMAND"} NR>1 {printf "%-10s %6s %4s %4s %s\n", $1, $2, $3, $4, $11}'

echo ""
echo "💿 SWAP STATUS:"
swapon --show
echo "Swappiness: $(cat /proc/sys/vm/swappiness)"

echo ""
echo "🎯 DEVELOPMENT PROCESSES:"
# Check for common development processes
EXPO_PID=$(pgrep -f "expo start" 2>/dev/null)
NODE_PIDS=$(pgrep -f "node" 2>/dev/null | head -3)
CHROME_PIDS=$(pgrep -f "chrome" 2>/dev/null | head -3)

if [ ! -z "$EXPO_PID" ]; then
    echo "  📱 Expo Dev Server: PID $EXPO_PID ($(ps -p $EXPO_PID -o %mem= | tr -d ' ')% mem)"
fi

if [ ! -z "$NODE_PIDS" ]; then
    echo "  🟢 Node.js processes:"
    for pid in $NODE_PIDS; do
        MEM=$(ps -p $pid -o %mem= 2>/dev/null | tr -d ' ')
        CMD=$(ps -p $pid -o comm= 2>/dev/null)
        if [ ! -z "$MEM" ]; then
            echo "    └── PID $pid: $CMD ($MEM% mem)"
        fi
    done
fi

if [ ! -z "$CHROME_PIDS" ]; then
    echo "  🌐 Chrome processes:"
    CHROME_COUNT=$(echo $CHROME_PIDS | wc -w)
    if [ "$CHROME_COUNT" -gt 0 ]; then
        TOTAL_CHROME_MEM=$(ps -p $(echo $CHROME_PIDS | tr ' ' ',') -o %mem= 2>/dev/null | awk '{sum+=$1} END {printf "%.1f", sum}' || echo "0.0")
        echo "    └── $CHROME_COUNT processes using ${TOTAL_CHROME_MEM}% total memory"
    fi
fi

echo ""
echo "📈 MEMORY RECOMMENDATIONS:"
USED_PERCENT=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
SWAP_USED_MB=$(free -m | awk 'NR==3{print $3}')

if [ "$USED_PERCENT" -gt 85 ]; then
    echo "  ⚠️  High memory usage (${USED_PERCENT}%) - Consider closing unused applications"
elif [ "$USED_PERCENT" -gt 70 ]; then
    echo "  ⚡ Moderate memory usage (${USED_PERCENT}%) - Monitor during intensive tasks"
else
    echo "  ✅ Good memory usage (${USED_PERCENT}%) - System has headroom"
fi

if [ "$SWAP_USED_MB" -gt 1000 ]; then
    echo "  ⚠️  High swap usage (${SWAP_USED_MB}MB) - Consider adding more RAM or optimizing"
elif [ "$SWAP_USED_MB" -gt 500 ]; then
    echo "  ⚡ Moderate swap usage (${SWAP_USED_MB}MB) - Monitor performance"
else
    echo "  ✅ Low swap usage (${SWAP_USED_MB}MB) - Good performance expected"
fi
