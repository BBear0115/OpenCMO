#!/bin/bash

################################################################################
# OpenCMO Deployment Diagnostics Script
# Quick health check for deployment issues
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

REMOTE_HOST="97.64.16.217"
REMOTE_PORT="2222"
REMOTE_USER="root"
SERVICE_NAME="opencmo"

################################################################################
# Local diagnostics
################################################################################

diagnose_local() {
    log_section "本地环境诊断"

    # Git status
    echo -n "Git 仓库: "
    if git rev-parse --git-dir > /dev/null 2>&1; then
        log_success "正常"
        echo "  分支: $(git branch --show-current)"
        echo "  最新提交: $(git log -1 --oneline)"

        if git diff-index --quiet HEAD --; then
            log_success "工作区干净"
        else
            log_warning "存在未提交的更改"
            git status --short | head -10
        fi
    else
        log_error "不是 Git 仓库"
    fi

    # Python
    echo -n "Python: "
    if command -v python3 &> /dev/null; then
        local version=$(python3 --version)
        log_success "$version"
    else
        log_error "未安装"
    fi

    # Python SSL certificates
    echo -n "Python SSL 证书: "
    if python3 -c "import ssl; import certifi; print(certifi.where())" > /dev/null 2>&1; then
        local cert_path=$(python3 -c "import certifi; print(certifi.where())")
        log_success "$cert_path"

        # Test SSL connection
        echo -n "SSL 连接测试: "
        if python3 -c "import urllib.request; urllib.request.urlopen('https://pypi.org', timeout=5)" 2>/dev/null; then
            log_success "通过"
        else
            log_error "失败"
            echo "  修复: ./deploy.sh 会自动修复此问题"
        fi
    else
        log_error "未配置"
        echo "  修复: pip install --upgrade certifi"
    fi

    # Node.js
    echo -n "Node.js: "
    if command -v node &> /dev/null; then
        local version=$(node --version)
        log_success "$version"
    else
        log_error "未安装"
    fi

    # npm
    echo -n "npm: "
    if command -v npm &> /dev/null; then
        local version=$(npm --version)
        log_success "$version"
    else
        log_error "未安装"
    fi

    # Frontend build
    if [ -d "frontend/dist" ]; then
        echo -n "前端构建: "
        local file_count=$(find frontend/dist -type f | wc -l | tr -d ' ')
        log_success "存在 ($file_count 个文件)"
    else
        echo -n "前端构建: "
        log_warning "不存在 (需要运行 cd frontend && npm run build)"
    fi

    # Disk space
    echo -n "磁盘空间: "
    local available=$(df -h . | tail -1 | awk '{print $4}')
    log_info "$available 可用"

    # Memory
    echo -n "可用内存: "
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local free_mem=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local free_gb=$((free_mem * 4096 / 1024 / 1024 / 1024))
        log_info "${free_gb}GB"
    else
        local free_mem=$(free -h | grep Mem | awk '{print $4}')
        log_info "$free_mem"
    fi
}

################################################################################
# Remote diagnostics
################################################################################

diagnose_remote() {
    log_section "远程服务器诊断"

    # SSH connectivity
    echo -n "SSH 连接: "
    if ssh -p "$REMOTE_PORT" -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'OK'" > /dev/null 2>&1; then
        log_success "正常"
    else
        log_error "失败"
        echo "  检查: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        return 1
    fi

    # Server info
    log_info "服务器信息:"
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "
        echo '  操作系统: '$(cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2)
        echo '  内核: '$(uname -r)
        echo '  运行时间: '$(uptime -p)
    " 2>/dev/null

    # Service status
    echo -n "服务状态: "
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "systemctl is-active $SERVICE_NAME" > /dev/null 2>&1; then
        log_success "运行中"
    else
        log_error "未运行"
        echo "  查看详情: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'systemctl status $SERVICE_NAME'"
    fi

    # Service health
    echo -n "健康检查: "
    local health_code=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/v1/health" 2>/dev/null)
    if [ "$health_code" = "200" ]; then
        log_success "HTTP $health_code"
    else
        log_error "HTTP $health_code"
    fi

    # Port listening
    echo -n "端口 8080: "
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "lsof -i:8080" > /dev/null 2>&1; then
        log_success "监听中"
    else
        log_error "未监听"
    fi

    # Code version
    echo -n "代码版本: "
    local remote_commit=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "cd /opt/OpenCMO && git log -1 --oneline" 2>/dev/null)
    if [ -n "$remote_commit" ]; then
        log_info "$remote_commit"
    else
        log_error "无法获取"
    fi

    # Python SSL on server
    echo -n "服务器 SSL 证书: "
    local server_cert=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "python3 -c 'import certifi; print(certifi.where())'" 2>/dev/null)
    if [ -n "$server_cert" ]; then
        log_success "$server_cert"
    else
        log_error "未配置"
        echo "  修复: scp -P $REMOTE_PORT scripts/fix_ssl_server.sh $REMOTE_USER@$REMOTE_HOST:/tmp/ && ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'bash /tmp/fix_ssl_server.sh'"
    fi

    # Disk space on server
    echo -n "服务器磁盘: "
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "df -h / | tail -1 | awk '{print \"使用 \" \$3 \" / \" \$2 \" (\" \$5 \")\"}'" 2>/dev/null

    # Memory on server
    echo -n "服务器内存: "
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "free -h | grep Mem | awk '{print \"使用 \" \$3 \" / \" \$2}'" 2>/dev/null

    # Recent logs
    log_info "最近的服务日志 (最后 10 行):"
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "journalctl -u $SERVICE_NAME -n 10 --no-pager" 2>/dev/null | sed 's/^/  /'

    # Nginx status
    echo -n "Nginx 状态: "
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "systemctl is-active nginx" > /dev/null 2>&1; then
        log_success "运行中"
    else
        log_error "未运行"
    fi

    # SSL certificate expiry
    echo -n "HTTPS 证书: "
    local cert_expiry=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo | openssl s_client -servername aidcmo.com -connect aidcmo.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2" 2>/dev/null)
    if [ -n "$cert_expiry" ]; then
        log_info "过期时间: $cert_expiry"
    else
        log_warning "无法获取"
    fi
}

################################################################################
# Network diagnostics
################################################################################

diagnose_network() {
    log_section "网络诊断"

    # Public site accessibility
    echo -n "公网访问 (https://aidcmo.com): "
    local http_code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 https://aidcmo.com 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        log_success "HTTP $http_code"
    else
        log_error "HTTP $http_code"
    fi

    # API health endpoint
    echo -n "API 健康检查: "
    local api_code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 https://aidcmo.com/api/v1/health 2>/dev/null)
    if [ "$api_code" = "200" ]; then
        log_success "HTTP $api_code"
    else
        log_error "HTTP $api_code"
    fi

    # DNS resolution
    echo -n "DNS 解析: "
    local resolved_ip=$(dig +short aidcmo.com | tail -1)
    if [ "$resolved_ip" = "$REMOTE_HOST" ]; then
        log_success "$resolved_ip"
    else
        log_warning "解析为 $resolved_ip (期望 $REMOTE_HOST)"
    fi

    # Ping test
    echo -n "Ping 测试: "
    if ping -c 1 -W 2 "$REMOTE_HOST" > /dev/null 2>&1; then
        log_success "可达"
    else
        log_error "不可达"
    fi
}

################################################################################
# Common issues and fixes
################################################################################

show_common_fixes() {
    log_section "常见问题修复"

    echo "1. SSL 证书问题"
    echo "   本地修复: ./deploy.sh 会自动修复"
    echo "   服务器修复: scp -P $REMOTE_PORT scripts/fix_ssl_server.sh $REMOTE_USER@$REMOTE_HOST:/tmp/ && ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'bash /tmp/fix_ssl_server.sh'"
    echo ""

    echo "2. 服务未运行"
    echo "   重启服务: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'systemctl restart $SERVICE_NAME'"
    echo "   查看日志: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'journalctl -u $SERVICE_NAME -f'"
    echo ""

    echo "3. 前端构建失败"
    echo "   清理重建: cd frontend && rm -rf node_modules dist && npm install && npm run build"
    echo "   增加内存: export NODE_OPTIONS='--max-old-space-size=4096' && npm run build"
    echo ""

    echo "4. 端口被占用"
    echo "   查看占用: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'lsof -i:8080'"
    echo "   杀死进程: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'kill -9 \$(lsof -t -i:8080)'"
    echo ""

    echo "5. Git 推送失败"
    echo "   查看状态: git status"
    echo "   提交更改: git add . && git commit -m 'your message' && git push"
    echo "   强制推送: git push -f origin main (谨慎使用)"
    echo ""

    echo "6. 数据库问题"
    echo "   备份数据库: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cp ~/.opencmo/data.db ~/.opencmo/data.db.backup'"
    echo "   重置数据库: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'rm ~/.opencmo/data.db && systemctl restart $SERVICE_NAME'"
    echo ""

    echo "7. Nginx 配置问题"
    echo "   测试配置: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'nginx -t'"
    echo "   重载配置: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'systemctl reload nginx'"
    echo ""
}

################################################################################
# Main
################################################################################

main() {
    echo "================================"
    echo "OpenCMO 部署诊断工具"
    echo "================================"

    case "${1:-all}" in
        local)
            diagnose_local
            ;;
        remote)
            diagnose_remote
            ;;
        network)
            diagnose_network
            ;;
        fixes)
            show_common_fixes
            ;;
        all)
            diagnose_local
            diagnose_remote
            diagnose_network
            show_common_fixes
            ;;
        *)
            echo "用法: $0 [local|remote|network|fixes|all]"
            echo ""
            echo "选项:"
            echo "  local   - 仅诊断本地环境"
            echo "  remote  - 仅诊断远程服务器"
            echo "  network - 仅诊断网络连接"
            echo "  fixes   - 显示常见问题修复方法"
            echo "  all     - 完整诊断 (默认)"
            exit 1
            ;;
    esac

    echo ""
    log_success "诊断完成"
}

main "$@"
