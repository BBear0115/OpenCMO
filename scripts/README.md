# OpenCMO 部署脚本使用指南

本目录包含 OpenCMO 项目的部署和诊断脚本，重点解决 Python SSL 证书问题。

## 脚本列表

### 1. `deploy.sh` - 主部署脚本

完整的自动化部署脚本，包含详细的错误处理和修复流程。

**功能：**
- 部署前检查（Git、Python、Node.js、SSH 连接）
- 自动修复 Python SSL 证书问题
- 安装 Python 依赖
- 构建前端
- 部署到 BWG 服务器
- 部署后验证

**使用方法：**

```bash
# 完整部署
./deploy.sh

# 跳过部署前检查
./deploy.sh --skip-checks

# 仅部署后端（跳过前端构建）
./deploy.sh --skip-frontend

# 仅部署前端（跳过后端）
./deploy.sh --skip-backend

# 查看帮助
./deploy.sh --help
```

**部署流程：**

1. **部署前检查**
   - 验证 Git 仓库状态
   - 检查 Python/Node.js 版本
   - 测试 SSH 连接
   - 检查 SSL 证书配置

2. **修复 SSL 证书**
   - 更新 certifi 包
   - macOS: 运行 Python 证书安装脚本
   - Linux: 更新系统 CA 证书
   - 设置环境变量（REQUESTS_CA_BUNDLE, SSL_CERT_FILE）
   - 测试 SSL 连接

3. **安装依赖**
   - 安装 Python 包（包含所有可选依赖）
   - 初始化 crawl4ai
   - 失败时自动尝试国内镜像源

4. **构建前端**
   - 安装 npm 依赖
   - 构建生产版本（增加 Node.js 内存限制）
   - 验证构建输出

5. **部署到服务器**
   - 推送代码到 Git
   - SSH 到服务器拉取最新代码
   - 安装服务器端依赖
   - 重启 systemd 服务
   - rsync 前端静态文件

6. **验证部署**
   - 检查服务状态
   - HTTP 健康检查
   - 显示最近日志

### 2. `scripts/fix_ssl_server.sh` - 服务器端 SSL 修复

在 BWG 服务器上运行，修复 Python SSL 证书问题。

**使用方法：**

```bash
# 上传并运行
scp -P 2222 scripts/fix_ssl_server.sh root@97.64.16.217:/tmp/
ssh -p 2222 root@97.64.16.217 'bash /tmp/fix_ssl_server.sh'
```

**功能：**
- 更新系统 CA 证书
- 更新 Python certifi 包
- 配置 systemd 服务环境变量
- 添加环境变量到 ~/.bashrc
- 测试 SSL 连接

### 3. `scripts/diagnose.sh` - 诊断工具

快速诊断部署问题，提供详细的系统状态和修复建议。

**使用方法：**

```bash
# 完整诊断
./scripts/diagnose.sh

# 仅诊断本地环境
./scripts/diagnose.sh local

# 仅诊断远程服务器
./scripts/diagnose.sh remote

# 仅诊断网络连接
./scripts/diagnose.sh network

# 显示常见问题修复方法
./scripts/diagnose.sh fixes
```

**诊断内容：**

**本地环境：**
- Git 仓库状态
- Python 版本和 SSL 证书
- Node.js/npm 版本
- 前端构建状态
- 磁盘空间和内存

**远程服务器：**
- SSH 连接状态
- 服务运行状态
- 健康检查端点
- 端口监听状态
- 代码版本
- SSL 证书配置
- 磁盘和内存使用
- 最近的服务日志
- Nginx 状态
- HTTPS 证书过期时间

**网络连接：**
- 公网访问测试
- API 健康检查
- DNS 解析
- Ping 测试

## 常见问题和解决方案

### 1. SSL 证书验证失败

**错误信息：**
```
SSL: CERTIFICATE_VERIFY_FAILED
```

**原因：**
- Python 未安装系统 CA 证书
- certifi 包版本过旧
- 系统时间不正确

**解决方案：**

本地修复：
```bash
# 方法 1: 运行部署脚本（自动修复）
./deploy.sh

# 方法 2: 手动修复
pip install --upgrade certifi pip setuptools

# macOS 特定
/Applications/Python\ 3.x/Install\ Certificates.command

# 设置环境变量
export REQUESTS_CA_BUNDLE=$(python3 -c "import certifi; print(certifi.where())")
export SSL_CERT_FILE=$REQUESTS_CA_BUNDLE
```

服务器修复：
```bash
scp -P 2222 scripts/fix_ssl_server.sh root@97.64.16.217:/tmp/
ssh -p 2222 root@97.64.16.217 'bash /tmp/fix_ssl_server.sh'
ssh -p 2222 root@97.64.16.217 'systemctl restart opencmo'
```

### 2. 依赖安装失败

**错误信息：**
```
ERROR: Could not find a version that satisfies the requirement
```

**解决方案：**

```bash
# 使用国内镜像源
pip install -e ".[all]" -i https://pypi.tuna.tsinghua.edu.cn/simple

# 检查磁盘空间
df -h

# 清理 pip 缓存
pip cache purge

# 分步安装
pip install fastapi uvicorn aiosqlite openai anthropic
pip install -e .
```

### 3. 前端构建内存不足

**错误信息：**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**解决方案：**

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS='--max-old-space-size=4096'
cd frontend && npm run build

# 清理后重建
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### 4. SSH 连接失败

**错误信息：**
```
Permission denied (publickey)
```

**解决方案：**

```bash
# 检查 SSH 密钥
ssh-add -l

# 添加密钥
ssh-add ~/.ssh/id_rsa

# 测试连接
ssh -p 2222 root@97.64.16.217

# 使用密码登录（如果密钥失败）
ssh -p 2222 -o PreferredAuthentications=password root@97.64.16.217
```

### 5. 服务启动失败

**错误信息：**
```
Job for opencmo.service failed
```

**解决方案：**

```bash
# 查看详细日志
ssh -p 2222 root@97.64.16.217 'journalctl -u opencmo -n 100 --no-pager'

# 检查端口占用
ssh -p 2222 root@97.64.16.217 'lsof -i:8080'

# 手动启动测试
ssh -p 2222 root@97.64.16.217 'cd /opt/OpenCMO && opencmo-web'

# 检查配置文件
ssh -p 2222 root@97.64.16.217 'cat /opt/OpenCMO/.env'

# 重置数据库（谨慎使用）
ssh -p 2222 root@97.64.16.217 'cp ~/.opencmo/data.db ~/.opencmo/data.db.backup'
ssh -p 2222 root@97.64.16.217 'rm ~/.opencmo/data.db'
ssh -p 2222 root@97.64.16.217 'systemctl restart opencmo'
```

### 6. Git 推送失败

**错误信息：**
```
error: failed to push some refs
```

**解决方案：**

```bash
# 查看状态
git status

# 提交本地更改
git add .
git commit -m "your message"
git push

# 拉取远程更改
git pull --rebase origin main
git push

# 强制推送（谨慎使用）
git push -f origin main
```

### 7. Nginx 502 错误

**原因：**
- 后端服务未运行
- 端口配置错误
- 其他 server block 冲突

**解决方案：**

```bash
# 检查服务状态
ssh -p 2222 root@97.64.16.217 'systemctl status opencmo'

# 检查 Nginx 配置
ssh -p 2222 root@97.64.16.217 'nginx -t'

# 查看 Nginx 错误日志
ssh -p 2222 root@97.64.16.217 'tail -50 /var/log/nginx/error.log'

# 检查冲突的 server block
ssh -p 2222 root@97.64.16.217 'grep -r "server_name.*aidcmo.com" /etc/nginx/conf.d/'

# 重启 Nginx
ssh -p 2222 root@97.64.16.217 'systemctl restart nginx'
```

## 部署检查清单

部署前确认：

- [ ] 本地代码已提交到 Git
- [ ] 所有测试通过
- [ ] .env 文件配置正确
- [ ] Python 版本 >= 3.9
- [ ] Node.js 版本 >= 18
- [ ] SSH 密钥已配置
- [ ] 磁盘空间充足（本地 >5GB，服务器 >2GB）

部署后验证：

- [ ] 服务状态正常：`systemctl status opencmo`
- [ ] 健康检查通过：`curl http://127.0.0.1:8080/api/v1/health`
- [ ] 公网可访问：`curl https://aidcmo.com`
- [ ] 前端加载正常
- [ ] 登录功能正常
- [ ] 查看日志无错误：`journalctl -u opencmo -n 50`

## 有用的命令

```bash
# 查看实时日志
ssh -p 2222 root@97.64.16.217 'journalctl -u opencmo -f'

# 重启服务
ssh -p 2222 root@97.64.16.217 'systemctl restart opencmo'

# 检查服务状态
ssh -p 2222 root@97.64.16.217 'systemctl status opencmo'

# 查看端口占用
ssh -p 2222 root@97.64.16.217 'lsof -i:8080'

# 查看磁盘使用
ssh -p 2222 root@97.64.16.217 'df -h'

# 查看内存使用
ssh -p 2222 root@97.64.16.217 'free -h'

# 备份数据库
ssh -p 2222 root@97.64.16.217 'cp ~/.opencmo/data.db ~/.opencmo/data.db.$(date +%Y%m%d_%H%M%S)'

# 查看 Nginx 日志
ssh -p 2222 root@97.64.16.217 'tail -f /var/log/nginx/access.log'
ssh -p 2222 root@97.64.16.217 'tail -f /var/log/nginx/error.log'

# 测试 Nginx 配置
ssh -p 2222 root@97.64.16.217 'nginx -t'

# 重载 Nginx
ssh -p 2222 root@97.64.16.217 'systemctl reload nginx'
```

## 紧急回滚

如果部署后出现严重问题：

```bash
# 1. 回滚代码
ssh -p 2222 root@97.64.16.217 "
  cd /opt/OpenCMO &&
  git log --oneline -5 &&
  git reset --hard <previous-commit-hash> &&
  systemctl restart opencmo
"

# 2. 恢复数据库备份
ssh -p 2222 root@97.64.16.217 "
  ls -lh ~/.opencmo/data.db* &&
  cp ~/.opencmo/data.db.backup ~/.opencmo/data.db &&
  systemctl restart opencmo
"

# 3. 恢复前端
rsync -avz --delete frontend/dist.backup/ root@97.64.16.217:/opt/OpenCMO/frontend/dist/ -e "ssh -p 2222"
```

## 技术支持

如果遇到脚本无法解决的问题：

1. 运行诊断工具：`./scripts/diagnose.sh`
2. 查看详细日志：`ssh -p 2222 root@97.64.16.217 'journalctl -u opencmo -n 200'`
3. 检查 GitHub Issues：https://github.com/anthropics/opencmo/issues
4. 联系开发团队

## 脚本维护

这些脚本会随着项目演进而更新。如果发现问题或有改进建议，请提交 PR 或 Issue。

**最后更新：** 2026-04-12
