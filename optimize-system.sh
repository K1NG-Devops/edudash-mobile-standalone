#!/bin/bash

echo "🚀 System Optimization for Development Environment"
echo "================================================"

# 1. Stop unnecessary Docker containers to free RAM
echo "📦 Managing Docker containers..."
docker-compose -f supabase/docker-compose.yml down 2>/dev/null || echo "Supabase not running"

# Keep only essential containers running
essential_containers=("supabase_db_edudash-mobile-final" "supabase_auth_edudash-mobile-final" "supabase_rest_edudash-mobile-final")
for container in "${essential_containers[@]}"; do
    if docker ps -q -f name="$container" | grep -q .; then
        echo "✅ Keeping essential container: $container"
    else
        docker start "$container" 2>/dev/null || echo "Container $container not found"
    fi
done

# 2. Disable unnecessary services during development
echo "⚙️  Disabling unnecessary services..."
services_to_stop=("snapd" "ModemManager" "cups" "bluetooth")
for service in "${services_to_stop[@]}"; do
    sudo systemctl stop "$service" 2>/dev/null && echo "Stopped $service" || echo "$service not running"
done

# 3. Optimize memory settings
echo "💾 Optimizing memory settings..."
# Increase swap usage threshold
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
# Optimize memory allocation
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 4. Clean system caches
echo "🧹 Cleaning system caches..."
sudo apt autoremove -y
sudo apt autoclean
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true

# 5. Set CPU governor to performance during builds
echo "⚡ Setting CPU to performance mode..."
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# 6. Create optimized build alias
echo "🔧 Creating optimized build commands..."
cat >> ~/.zshrc << 'EOF'

# Optimized build commands
alias build-apk="export NODE_OPTIONS='--max-old-space-size=8192' && npm run android"
alias build-apk-release="export NODE_OPTIONS='--max-old-space-size=8192' && npm run android -- --variant=release"
alias cleanup-dev="docker system prune -f && npm cache clean --force"

# Monitor system resources during builds
alias monitor="htop"
alias gpu-monitor="watch -n1 nvidia-smi"
EOF

echo "✅ Optimization complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your terminal or run: source ~/.zshrc"
echo "2. Install NVIDIA drivers: sudo apt install nvidia-driver"
echo "3. Restart your system"
echo "4. Use 'build-apk' command for optimized builds"
echo "5. Use 'monitor' to watch system resources during builds"
