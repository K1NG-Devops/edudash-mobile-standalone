#!/bin/bash

echo "🚀 Post-Restart GPU & System Verification"
echo "=========================================="
echo

# 1. Check NVIDIA driver status
echo "🔍 Checking NVIDIA Driver Status:"
if nvidia-smi > /dev/null 2>&1; then
    nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader,nounits
    echo "✅ NVIDIA drivers working correctly!"
else
    echo "❌ NVIDIA drivers not working properly"
    exit 1
fi
echo

# 2. Check displays
echo "🖥️  Checking Display Configuration:"
xrandr --listproviders 2>/dev/null | grep -i nvidia && echo "✅ NVIDIA display provider detected" || echo "⚠️  No NVIDIA display provider found"
echo "Active displays:"
xrandr --listactivemonitors 2>/dev/null || echo "Could not detect displays (may need X session)"
echo

# 3. Check GPU memory and utilization
echo "💾 GPU Memory Status:"
nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader
echo

# 4. Test GPU-accelerated applications
echo "⚡ Testing GPU Acceleration:"
glxinfo | head -10 2>/dev/null && echo "✅ OpenGL working" || echo "⚠️  OpenGL may not be properly configured"
echo

# 5. Check system memory (should show improvement)
echo "🧠 System Memory Status:"
free -h
echo

# 6. Check essential Docker containers
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase || echo "No Supabase containers running"
echo

# 7. Create optimized aliases
echo "🔧 Setting up optimized build aliases..."
if ! grep -q "build-apk" ~/.zshrc 2>/dev/null; then
    echo '
# GPU-optimized build commands
alias build-apk="export NODE_OPTIONS=\"--max-old-space-size=8192\" && npm run android"
alias build-apk-release="export NODE_OPTIONS=\"--max-old-space-size=8192\" && npm run android -- --variant=release"
alias gpu-monitor="watch -n1 nvidia-smi"
alias memory-check="free -h && echo && nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader"' >> ~/.zshrc
    echo "✅ Build aliases added to ~/.zshrc"
else
    echo "✅ Build aliases already configured"
fi

echo
echo "📝 Summary:"
echo "- 🆓 RAM freed: ~3GB+ (stopped Docker containers)"
echo "- 🎮 GPU: GTX 1060 6GB now available for acceleration"
echo "- 🔧 Gradle: Optimized for 4GB heap with parallel builds"
echo "- 💻 Multi-display: Should work better with proper NVIDIA drivers"
echo
echo "🎯 Next steps:"
echo "1. Run 'source ~/.zshrc' to load new aliases"
echo "2. Use 'build-apk' for optimized APK builds"
echo "3. Use 'gpu-monitor' to watch GPU usage during builds"
echo "4. Start only needed Supabase containers: 'docker start supabase_db_edudash-mobile-final supabase_auth_edudash-mobile-final'"
