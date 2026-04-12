#!/bin/bash

################################################################################
# OpenCMO Deployment Script
# Handles Python SSL certificates, dependencies, and deployment to BWG server
################################################################################

set -e  # Exit on error (disabled in sections with custom error handling)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
REMOTE_HOST="97.64.16.217"
REMOTE_PORT="2222"
REMOTE_USER="root"
REMOTE_PATH="/opt/OpenCMO"
SERVICE_NAME="opencmo"

################################################################################
# Logging functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

################################################################################
# Error handling functions
################################################################################

handle_ssl_error() {
    log_error "SSL 证书验证失败"
    echo "可能的原因："
    echo "  1. Python 未安装系统 CA 证书"
    echo "  2. certifi 包版本过旧"
    echo "  3. 系统时间不正确"
    echo ""
    echo "尝试修复..."

    # 尝试修复 1: 安装/更新 certifi
    log_info "更新 certifi 包..."
    if pip install --upgrade certifi pip setuptools 2>/dev/null; then
        log_success "certifi 更新成功"
    else
        log_warning "certifi 更新失败，尝试其他方法"
    fi

    # 尝试修复 2: 安装系统 CA 证书到 Python
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "检测到 macOS，运行 Install Certificates.command..."
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        CERT_SCRIPT="/Applications/Python ${PYTHON_VERSION}/Install Certificates.command"
        if [ -f "$CERT_SCRIPT" ]; then
            bash "$CERT_SCRIPT" 2>/dev/null || log_warning "证书安装脚本执行失败"
        else
            log_warning "未找到 Python 证书安装脚本"
            log_info "尝试手动安装证书..."
            pip install --upgrade certifi
            python3 -c "import certifi; print(certifi.where())"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "检测到 Linux，更新系统 CA 证书..."
        if command -v update-ca-certificates &> /dev/null; then
            sudo update-ca-certificates 2>/dev/null || log_warning "CA 证书更新失败"
        fi
    fi

    # 尝试修复 3: 设置环境变量
    log_info "配置 SSL 环境变量..."
    export REQUESTS_CA_BUNDLE=$(python3 -c "import certifi; print(certifi.where())" 2>/dev/null || echo "")
    export SSL_CERT_FILE=$REQUESTS_CA_BUNDLE

    if [ -n "$REQUESTS_CA_BUNDLE" ]; then
        log_success "SSL 证书路径: $REQUESTS_CA_BUNDLE"
    else
        log_error "无法获取 SSL 证书路径"
        return 1
    fi
}

handle_pip_install_error() {
    local exit_code=$1
    log_error "依赖安装失败 (退出码: $exit_code)"

    echo "可能的原因："
    echo "  1. 网络连接问题"
    echo "  2. PyPI 镜像源不可用"
    echo "  3. 依赖冲突"
    echo "  4. 磁盘空间不足"
    echo ""

    # 检查磁盘空间
    log_info "检查磁盘空间..."
    df -h . | tail -1

    # 尝试使用国内镜像源
    log_info "尝试使用清华大学 PyPI 镜像源..."
    if pip install -e ".[all]" -i https://pypi.tuna.tsinghua.edu.cn/simple 2>&1 | tee /tmp/pip_install.log; then
        log_success "使用镜像源安装成功"
        return 0
    fi

    log_warning "镜像源安装失败，尝试分步安装..."

    # 分步安装核心依赖
    local core_deps=("fastapi" "uvicorn" "aiosqlite" "openai" "anthropic")
    for dep in "${core_deps[@]}"; do
        log_info "安装 $dep..."
        if ! pip install "$dep" 2>/dev/null; then
            log_error "无法安装 $dep"
            return 1
        fi
    done

    log_info "安装项目（跳过可选依赖）..."
    pip install -e . 2>&1 | tee -a /tmp/pip_install.log
}

handle_git_error() {
    local exit_code=$1
    log_error "Git 操作失败 (退出码: $exit_code)"

    echo "可能的原因："
    echo "  1. 本地有未提交的更改"
    echo "  2. 远程仓库不可达"
    echo "  3. 分支冲突"
    echo ""

    log_info "检查 Git 状态..."
    git status

    echo ""
    echo "建议操作："
    echo "  1. 提交或暂存本地更改: git add . && git commit -m 'your message'"
    echo "  2. 或者放弃本地更改: git reset --hard HEAD"
    echo "  3. 检查远程连接: git remote -v"
}

handle_ssh_error() {
    local exit_code=$1
    log_error "SSH 连接失败 (退出码: $exit_code)"

    echo "可能的原因："
    echo "  1. SSH 密钥未配置"
    echo "  2. 服务器不可达"
    echo "  3. 端口被防火墙阻止"
    echo "  4. 用户权限不足"
    echo ""

    log_info "测试 SSH 连接..."
    if ssh -p "$REMOTE_PORT" -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH 连接成功'" 2>&1; then
        log_success "SSH 连接正常"
    else
        log_error "SSH 连接失败"
        echo ""
        echo "修复步骤："
        echo "  1. 检查 SSH 密钥: ssh-add -l"
        echo "  2. 添加密钥: ssh-add ~/.ssh/id_rsa"
        echo "  3. 测试连接: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        echo "  4. 检查防火墙: telnet $REMOTE_HOST $REMOTE_PORT"
        return 1
    fi
}

handle_frontend_build_error() {
    local exit_code=$1
    log_error "前端构建失败 (退出码: $exit_code)"

    echo "可能的原因："
    echo "  1. Node.js 版本不兼容"
    echo "  2. 依赖未安装或版本冲突"
    echo "  3. 内存不足 (需要 >2GB)"
    echo "  4. TypeScript 类型错误"
    echo ""

    log_info "检查 Node.js 版本..."
    node --version
    npm --version

    log_info "检查可用内存..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        vm_stat | grep "Pages free"
    else
        free -h | grep Mem
    fi

    echo ""
    echo "修复步骤："
    echo "  1. 清理缓存: cd frontend && rm -rf node_modules dist && npm install"
    echo "  2. 增加 Node 内存: export NODE_OPTIONS='--max-old-space-size=4096'"
    echo "  3. 检查类型错误: npm run type-check"
    echo "  4. 跳过类型检查构建: npm run build -- --mode production"
}

handle_service_error() {
    local exit_code=$1
    log_error "服务启动失败 (退出码: $exit_code)"

    echo "可能的原因："
    echo "  1. 端口 8080 已被占用"
    echo "  2. 环境变量未配置"
    echo "  3. 数据库文件损坏"
    echo "  4. 依赖缺失"
    echo ""

    log_info "检查服务状态..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "systemctl status $SERVICE_NAME" || true

    log_info "检查服务日志..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "journalctl -u $SERVICE_NAME -n 50 --no-pager" || true

    echo ""
    echo "修复步骤："
    echo "  1. 检查端口占用: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'lsof -i:8080'"
    echo "  2. 检查配置文件: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cat $REMOTE_PATH/.env'"
    echo "  3. 手动启动测试: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_PATH && opencmo-web'"
    echo "  4. 重置数据库: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'rm ~/.opencmo/data.db'"
}

################################################################################
# Pre-flight checks
################################################################################

preflight_checks() {
    log_step "执行部署前检查"

    local has_error=0

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是 Git 仓库"
        has_error=1
    else
        log_success "Git 仓库检查通过"
    fi

    # Check if we're on main branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_warning "当前分支是 '$current_branch'，不是 'main'"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    else
        log_success "分支检查通过 (main)"
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "存在未提交的更改"
        git status --short
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    else
        log_success "工作区检查通过 (无未提交更改)"
    fi

    # Check Python version
    if ! command -v python3 &> /dev/null; then
        log_error "未找到 python3"
        has_error=1
    else
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python 版本: $python_version"
    fi

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "未找到 node"
        has_error=1
    else
        local node_version=$(node --version)
        log_success "Node.js 版本: $node_version"
    fi

    # Check SSH connectivity
    log_info "测试 SSH 连接到服务器..."
    if ssh -p "$REMOTE_PORT" -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH OK'" > /dev/null 2>&1; then
        log_success "SSH 连接正常"
    else
        log_error "无法连接到服务器"
        handle_ssh_error 1
        has_error=1
    fi

    # Check SSL certificates
    log_info "检查 Python SSL 证书..."
    if python3 -c "import ssl; import certifi; print(certifi.where())" > /dev/null 2>&1; then
        local cert_path=$(python3 -c "import certifi; print(certifi.where())")
        log_success "SSL 证书路径: $cert_path"
    else
        log_warning "SSL 证书检查失败，将在安装时修复"
        handle_ssl_error || log_warning "SSL 证书修复失败，继续部署..."
    fi

    if [ $has_error -eq 1 ]; then
        log_error "部署前检查失败，请修复上述问题后重试"
        exit 1
    fi

    log_success "所有部署前检查通过"
}

################################################################################
# Fix SSL certificates
################################################################################

fix_ssl_certificates() {
    log_step "修复 Python SSL 证书"

    set +e  # Disable exit on error for this section

    # Update certifi
    log_info "更新 certifi 包..."
    if pip install --upgrade certifi pip setuptools 2>&1 | tee /tmp/certifi_install.log; then
        log_success "certifi 更新成功"
    else
        log_warning "certifi 更新失败"
        cat /tmp/certifi_install.log
        handle_ssl_error
    fi

    # Platform-specific certificate installation
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "macOS 系统，安装证书到 Python..."

        # Find Python installation
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        CERT_SCRIPT="/Applications/Python ${PYTHON_VERSION}/Install Certificates.command"

        if [ -f "$CERT_SCRIPT" ]; then
            log_info "运行 Python 证书安装脚本..."
            bash "$CERT_SCRIPT" 2>&1 | tee /tmp/cert_install.log || log_warning "证书安装脚本执行失败"
        else
            log_warning "未找到证书安装脚本: $CERT_SCRIPT"
            log_info "使用 certifi 作为证书源..."
        fi

    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "Linux 系统，更新系统证书..."
        if command -v update-ca-certificates &> /dev/null; then
            sudo update-ca-certificates 2>&1 | tee /tmp/cert_update.log || log_warning "证书更新失败"
        fi
    fi

    # Set environment variables
    log_info "配置 SSL 环境变量..."
    CERT_PATH=$(python3 -c "import certifi; print(certifi.where())" 2>/dev/null)

    if [ -n "$CERT_PATH" ] && [ -f "$CERT_PATH" ]; then
        export REQUESTS_CA_BUNDLE="$CERT_PATH"
        export SSL_CERT_FILE="$CERT_PATH"
        export CURL_CA_BUNDLE="$CERT_PATH"

        log_success "SSL 证书配置完成"
        log_info "证书路径: $CERT_PATH"

        # Add to shell profile for persistence
        if [ -f ~/.zshrc ]; then
            if ! grep -q "REQUESTS_CA_BUNDLE" ~/.zshrc; then
                echo "" >> ~/.zshrc
                echo "# OpenCMO SSL certificates" >> ~/.zshrc
                echo "export REQUESTS_CA_BUNDLE=\"$CERT_PATH\"" >> ~/.zshrc
                echo "export SSL_CERT_FILE=\"$CERT_PATH\"" >> ~/.zshrc
                log_info "已添加环境变量到 ~/.zshrc"
            fi
        fi

    else
        log_error "无法获取有效的证书路径"
        return 1
    fi

    # Test SSL connection
    log_info "测试 SSL 连接..."
    if python3 -c "import urllib.request; urllib.request.urlopen('https://pypi.org')" 2>/dev/null; then
        log_success "SSL 连接测试通过"
    else
        log_warning "SSL 连接测试失败，但继续部署..."
    fi

    set -e  # Re-enable exit on error
}

################################################################################
# Install dependencies
################################################################################

install_dependencies() {
    log_step "安装 Python 依赖"

    set +e  # Disable exit on error

    log_info "安装项目依赖 (包含所有可选依赖)..."
    if pip install -e ".[all]" 2>&1 | tee /tmp/pip_install.log; then
        log_success "依赖安装成功"
    else
        local exit_code=$?
        log_error "依赖安装失败"
        cat /tmp/pip_install.log
        handle_pip_install_error $exit_code

        # Check if installation succeeded after retry
        if [ $? -ne 0 ]; then
            log_error "依赖安装失败，无法继续部署"
            exit 1
        fi
    fi

    # Initialize crawl4ai
    log_info "初始化 crawl4ai..."
    if command -v crawl4ai-setup &> /dev/null; then
        if crawl4ai-setup 2>&1 | tee /tmp/crawl4ai_setup.log; then
            log_success "crawl4ai 初始化成功"
        else
            log_warning "crawl4ai 初始化失败，但继续部署..."
            cat /tmp/crawl4ai_setup.log
        fi
    else
        log_warning "未找到 crawl4ai-setup 命令，跳过初始化"
    fi

    set -e  # Re-enable exit on error
}

################################################################################
# Build frontend
################################################################################

build_frontend() {
    log_step "构建前端"

    if [ ! -d "frontend" ]; then
        log_error "未找到 frontend 目录"
        exit 1
    fi

    cd frontend

    set +e  # Disable exit on error

    # Install npm dependencies
    log_info "安装 npm 依赖..."
    if npm install 2>&1 | tee /tmp/npm_install.log; then
        log_success "npm 依赖安装成功"
    else
        log_error "npm 依赖安装失败"
        cat /tmp/npm_install.log
        cd ..
        exit 1
    fi

    # Build frontend
    log_info "构建前端 (这可能需要几分钟)..."

    # Increase Node.js memory limit
    export NODE_OPTIONS="--max-old-space-size=4096"

    if npm run build 2>&1 | tee /tmp/npm_build.log; then
        log_success "前端构建成功"
    else
        local exit_code=$?
        log_error "前端构建失败"
        cat /tmp/npm_build.log
        handle_frontend_build_error $exit_code
        cd ..
        exit 1
    fi

    # Verify build output
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        log_error "构建输出目录为空"
        cd ..
        exit 1
    fi

    log_success "前端构建完成，输出目录: frontend/dist"

    cd ..

    set -e  # Re-enable exit on error
}

################################################################################
# Deploy to server
################################################################################

deploy_to_server() {
    log_step "部署到服务器"

    set +e  # Disable exit on error

    # Push code to git
    log_info "推送代码到 Git 仓库..."
    if git push origin main 2>&1 | tee /tmp/git_push.log; then
        log_success "代码推送成功"
    else
        local exit_code=$?
        log_warning "代码推送失败"
        cat /tmp/git_push.log
        handle_git_error $exit_code

        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi

    # Deploy backend
    log_info "部署后端代码到服务器..."

    local deploy_cmd="
        set -e
        cd $REMOTE_PATH || exit 1
        echo '拉取最新代码...'
        git pull origin main || exit 1
        echo '安装依赖...'
        pip install -e '.[all]' -q || exit 1
        echo '重启服务...'
        systemctl restart $SERVICE_NAME || exit 1
        sleep 2
        echo '检查服务状态...'
        systemctl is-active $SERVICE_NAME || exit 1
    "

    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "$deploy_cmd" 2>&1 | tee /tmp/deploy_backend.log; then
        log_success "后端部署成功"
    else
        local exit_code=$?
        log_error "后端部署失败"
        cat /tmp/deploy_backend.log
        handle_service_error $exit_code
        exit 1
    fi

    # Deploy frontend
    log_info "部署前端静态文件到服务器..."

    if rsync -avz --delete frontend/dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/frontend/dist/" -e "ssh -p $REMOTE_PORT" 2>&1 | tee /tmp/deploy_frontend.log; then
        log_success "前端部署成功"
    else
        log_error "前端部署失败"
        cat /tmp/deploy_frontend.log
        exit 1
    fi

    set -e  # Re-enable exit on error
}

################################################################################
# Verify deployment
################################################################################

verify_deployment() {
    log_step "验证部署"

    set +e  # Disable exit on error

    # Check service status
    log_info "检查服务状态..."
    if ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "systemctl is-active $SERVICE_NAME" > /dev/null 2>&1; then
        log_success "服务运行正常"
    else
        log_error "服务未运行"
        ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "systemctl status $SERVICE_NAME"
        exit 1
    fi

    # Check HTTP endpoint
    log_info "检查 HTTP 端点..."
    local health_check=$(ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/v1/health" 2>/dev/null)

    if [ "$health_check" = "200" ]; then
        log_success "健康检查通过 (HTTP 200)"
    else
        log_warning "健康检查返回: HTTP $health_check"
    fi

    # Show recent logs
    log_info "最近的服务日志:"
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "journalctl -u $SERVICE_NAME -n 20 --no-pager"

    set -e  # Re-enable exit on error

    log_success "部署验证完成"
}

################################################################################
# Main deployment flow
################################################################################

main() {
    echo "================================"
    echo "OpenCMO 部署脚本"
    echo "================================"
    echo ""

    # Parse command line arguments
    local skip_checks=0
    local skip_frontend=0
    local skip_backend=0

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                skip_checks=1
                shift
                ;;
            --skip-frontend)
                skip_frontend=1
                shift
                ;;
            --skip-backend)
                skip_backend=1
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --skip-checks     跳过部署前检查"
                echo "  --skip-frontend   跳过前端构建"
                echo "  --skip-backend    跳过后端部署"
                echo "  --help            显示此帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                echo "使用 --help 查看帮助"
                exit 1
                ;;
        esac
    done

    # Run deployment steps
    if [ $skip_checks -eq 0 ]; then
        preflight_checks
    else
        log_warning "跳过部署前检查"
    fi

    fix_ssl_certificates

    if [ $skip_backend -eq 0 ]; then
        install_dependencies
    else
        log_warning "跳过后端依赖安装"
    fi

    if [ $skip_frontend -eq 0 ]; then
        build_frontend
    else
        log_warning "跳过前端构建"
    fi

    deploy_to_server
    verify_deployment

    echo ""
    log_success "========================================="
    log_success "部署完成！"
    log_success "========================================="
    echo ""
    echo "访问地址: https://aidcmo.com"
    echo ""
    echo "有用的命令:"
    echo "  查看日志: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'journalctl -u $SERVICE_NAME -f'"
    echo "  重启服务: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'systemctl restart $SERVICE_NAME'"
    echo "  检查状态: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'systemctl status $SERVICE_NAME'"
    echo ""
}

# Run main function
main "$@"
