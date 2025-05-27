# 书签导航网站

一个基于 Cloudflare Pages + D1 数据库的书签导航网站，类似 hao123 的个人书签管理系统。

## 功能特性

- 🚀 **智能安装系统** - 自动检测 D1 绑定，一键创建数据库表格
- 🔐 **安全认证** - 密码加密存储，JWT Token 认证
- 📚 **书签管理** - 分类管理，拖拽排序，图标支持
- 🎨 **响应式设计** - 适配桌面和移动设备
- ☁️ **无服务器部署** - 基于 Cloudflare Pages + D1，零运维成本

## 技术架构

- **前端**: HTML + CSS + JavaScript (原生，无框架依赖)
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: JWT Token
- **部署**: Cloudflare Pages

## 安装部署

### 1. 准备工作

1. 注册 Cloudflare 账号
2. 创建 D1 数据库
3. Fork 或下载本项目

### 2. 部署到 Cloudflare Pages

1. 在 Cloudflare Dashboard 中创建 Pages 项目
2. 连接你的 Git 仓库
3. 设置构建配置：
   - 构建命令: 留空
   - 构建输出目录: `website`
   - 根目录: `/`

### 3. 绑定 D1 数据库

1. 在 Pages 项目设置中找到 "Functions" 选项卡
2. 在 "D1 database bindings" 中添加绑定：
   - 变量名: `DB`
   - D1 数据库: 选择你创建的数据库

### 4. 完成安装

1. 访问你的 Pages 域名
2. 系统会自动检测并跳转到安装页面
3. 按照引导完成数据库初始化和管理员账号设置

## 文件结构

```
website/
├── index.html              # 入口页面 (自动检测系统状态)
├── setup.html              # 安装页面
├── login.html              # 登录页面
├── _routes.json            # Cloudflare Pages 路由配置
├── css/                    # 样式文件
│   ├── setup.css          # 安装页面样式
│   └── login.css          # 登录页面样式
├── js/                     # 前端脚本
│   ├── setup.js           # 安装逻辑
│   ├── login.js           # 登录逻辑
│   └── utils/             # 工具模块
│       ├── api.js         # API 调用工具
│       ├── auth.js        # 认证工具
│       └── ui.js          # UI 工具
└── functions/              # Cloudflare Pages Functions
    └── api/
        ├── setup/          # 安装相关 API
        │   ├── check-database.js
        │   ├── create-table.js
        │   └── create-admin.js
        └── auth/           # 认证相关 API
            ├── check-admin.js
            └── login.js
```

## 数据库结构

### users (用户表)
- `id` - 主键
- `username` - 用户名 (唯一)
- `password` - 密码 (SHA-256 加密)
- `email` - 邮箱 (可选)
- `role` - 角色 (admin/user)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### categories (分类表)
- `id` - 主键
- `name` - 分类名称
- `description` - 分类描述
- `icon` - 分类图标
- `sort_order` - 排序
- `created_at` - 创建时间

### bookmarks (书签表)
- `id` - 主键
- `title` - 书签标题
- `url` - 书签链接
- `description` - 书签描述
- `icon` - 书签图标
- `category_id` - 所属分类
- `sort_order` - 排序
- `is_featured` - 是否推荐
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 安装流程

1. **检测数据库绑定** - 验证 D1 数据库是否正确绑定
2. **创建数据库表格** - 自动执行 SQL 创建必要的表格
3. **设置管理员账号** - 创建第一个管理员用户
4. **完成安装** - 跳转到登录页面

## 安全特性

- 密码使用 SHA-256 加密存储
- JWT Token 认证，支持过期时间设置
- SQL 注入防护
- XSS 防护
- CSRF 防护

## 开发计划

- [ ] 书签管理界面
- [ ] 分类管理功能
- [ ] 拖拽排序
- [ ] 图标上传
- [ ] 数据导入/导出
- [ ] 主题切换
- [ ] 搜索功能
- [ ] 统计分析

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
