#!/bin/bash

################################################################################
# Server-side SSL Certificate Fix Script
# Run this on the BWG server to fix Python SSL certificate issues
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

log_step "修复服务器 Python SSL 证书"

# Update system CA certificates
log_info "更新系统 CA 证书..."
if command -v update-ca-certificates &> /dev/null; then
    update-ca-certificates 2>&1 || log_error "CA 证书更新失败"
    log_success "系统 CA 证书已更新"
fi

# Update certifi package
log_info "更新 Python certifi 包..."
pip install --upgrade certifi pip setuptools 2>&1 || log_error "certifi 更新失败"
log_success "certifi 已更新"

# Get certificate path
CERT_PATH=$(python3 -c "import certifi; print(certifi.where())" 2>/dev/null)

if [ -n "$CERT_PATH" ] && [ -f "$CERT_PATH" ]; then
    log_success "证书路径: $CERT_PATH"

    # Set environment variables in systemd service
    log_info "配置 systemd 服务环境变量..."

    SERVICE_FILE="/etc/systemd/system/opencmo.service"

    if [ -f "$SERVICE_FILE" ]; then
        # Backup original service file
        cp "$SERVICE_FILE" "${SERVICE_FILE}.backup"

        # Check if Environment variables already exist
        if grep -q "REQUESTS_CA_BUNDLE" "$SERVICE_FILE"; then
            log_info "环境变量已存在，更新中..."
            sed -i "s|Environment=\"REQUESTS_CA_BUNDLE=.*\"|Environment=\"REQUESTS_CA_BUNDLE=$CERT_PATH\"|g" "$SERVICE_FILE"
            sed -i "s|Environment=\"SSL_CERT_FILE=.*\"|Environment=\"SSL_CERT_FILE=$CERT_PATH\"|g" "$SERVICE_FILE"
        else
            log_info "添加环境变量到服务文件..."
            # Add Environment variables after [Service] section
            sed -i "/\[Service\]/a Environment=\"REQUESTS_CA_BUNDLE=$CERT_PATH\"\nEnvironment=\"SSL_CERT_FILE=$CERT_PATH\"" "$SERVICE_FILE"
        fi

        log_success "服务文件已更新"

        # Reload systemd
        log_info "重载 systemd 配置..."
        systemctl daemon-reload
        log_success "systemd 配置已重载"

    else
        log_error "未找到服务文件: $SERVICE_FILE"
    fi

    # Add to .bashrc for interactive sessions
    if [ -f ~/.bashrc ]; then
        if ! grep -q "REQUESTS_CA_BUNDLE" ~/.bashrc; then
            echo "" >> ~/.bashrc
            echo "# Python SSL certificates" >> ~/.bashrc
            echo "export REQUESTS_CA_BUNDLE=\"$CERT_PATH\"" >> ~/.bashrc
            echo "export SSL_CERT_FILE=\"$CERT_PATH\"" >> ~/.bashrc
            log_success "环境变量已添加到 ~/.bashrc"
        fi
    fi

else
    log_error "无法获取证书路径"
    exit 1
fi

# Test SSL connection
log_info "测试 SSL 连接..."
if python3 -c "import urllib.request; urllib.request.urlopen('https://pypi.org', timeout=10)" 2>/dev/null; then
    log_success "SSL 连接测试通过"
else
    log_error "SSL 连接测试失败"
    exit 1
fi

log_success "SSL 证书修复完成"
echo ""
echo "下一步:"
echo "  1. 重启服务: systemctl restart opencmo"
echo "  2. 检查状态: systemctl status opencmo"
echo "  3. 查看日志: journalctl -u opencmo -f"
