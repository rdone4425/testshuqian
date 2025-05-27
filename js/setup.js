// 安装系统 JavaScript
class SetupManager {
    constructor() {
        this.currentStep = 1;
        this.dbInfo = null;
        this.init();
    }

    init() {
        // 页面加载完成后开始检测数据库
        document.addEventListener('DOMContentLoaded', () => {
            console.log('SetupManager: DOM 加载完成，开始初始化');
            this.checkDatabase();
        });
    }

    // 检测数据库绑定
    async checkDatabase() {
        console.log('checkDatabase: 方法开始执行');

        const checkingEl = document.getElementById('db-checking');
        const successEl = document.getElementById('db-success');
        const errorEl = document.getElementById('db-error');
        const nextBtn = document.getElementById('btn-next-1');

        console.log('checkDatabase: DOM 元素查找结果', {
            checkingEl: !!checkingEl,
            successEl: !!successEl,
            errorEl: !!errorEl,
            nextBtn: !!nextBtn
        });

        // 显示检测状态
        if (checkingEl) checkingEl.classList.remove('hidden');
        if (successEl) successEl.classList.add('hidden');
        if (errorEl) errorEl.classList.add('hidden');
        if (nextBtn) nextBtn.disabled = true;

        this.log('开始检测数据库绑定...');

        try {
            this.log('正在调用 API: /api/setup/check-database');

            // 简化的 fetch 请求，移除超时控制
            const response = await fetch('/api/setup/check-database', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('checkDatabase: 收到响应', response);
            this.log(`API 响应状态: ${response.status} ${response.statusText}`);

            // 检查响应类型
            const contentType = response.headers.get('content-type');
            this.log(`响应头 Content-Type: ${contentType}`);

            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                this.log(`API 返回非 JSON 响应: ${responseText.substring(0, 200)}...`, 'error');
                throw new Error('API 配置错误：返回了 HTML 页面而不是 JSON 数据。');
            }

            const result = await response.json();
            console.log('checkDatabase: 解析的 JSON 数据', result);
            this.log(`API 响应数据: ${JSON.stringify(result)}`);

            if (result.success) {
                console.log('checkDatabase: 开始更新 UI - 成功状态');

                // 数据库绑定成功
                this.dbInfo = result.data;

                // 更新数据库名称
                const dbNameEl = document.getElementById('db-name');
                if (dbNameEl) {
                    dbNameEl.textContent = result.data.name || 'D1 Database';
                    console.log('checkDatabase: 数据库名称已更新');
                }

                // 隐藏检测状态
                if (checkingEl) {
                    checkingEl.classList.add('hidden');
                    console.log('checkDatabase: 隐藏检测状态');
                }

                // 显示成功状态
                if (successEl) {
                    successEl.classList.remove('hidden');
                    console.log('checkDatabase: 显示成功状态');
                }

                // 启用下一步按钮
                if (nextBtn) {
                    nextBtn.disabled = false;
                    console.log('checkDatabase: 启用下一步按钮');
                }

                this.log('数据库检测成功: ' + (result.data.name || 'D1 Database'));
                console.log('checkDatabase: UI 更新完成');
            } else {
                throw new Error(result.message || '数据库绑定检测失败');
            }
        } catch (error) {
            console.error('checkDatabase: 捕获到错误', error);

            if (checkingEl) checkingEl.classList.add('hidden');
            if (errorEl) errorEl.classList.remove('hidden');

            const errorMsgEl = document.getElementById('db-error-msg');
            if (errorMsgEl) {
                errorMsgEl.textContent = error.message;
            }

            this.log('数据库检测失败: ' + error.message, 'error');
        }
    }

    // 创建数据库表格
    async createTables() {
        const createBtn = document.getElementById('btn-create-tables');
        const nextBtn = document.getElementById('btn-next-2');

        createBtn.disabled = true;
        createBtn.textContent = '创建中...';

        const tables = [
            {
                name: 'users',
                sql: `CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT,
                    role TEXT DEFAULT 'admin',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'categories',
                sql: `CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    icon TEXT,
                    sort_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'bookmarks',
                sql: `CREATE TABLE IF NOT EXISTS bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    url TEXT NOT NULL,
                    description TEXT,
                    icon TEXT,
                    category_id INTEGER,
                    sort_order INTEGER DEFAULT 0,
                    is_featured BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories (id)
                )`
            }
        ];

        let successCount = 0;

        for (const table of tables) {
            try {
                this.updateTableStatus(table.name, '⏳ 创建中...');
                this.log(`正在创建表格: ${table.name}`);

                const response = await fetch('/api/setup/create-table', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tableName: table.name,
                        sql: table.sql
                    })
                });

                const result = await response.json();

                if (result.success) {
                    this.updateTableStatus(table.name, '✅ 创建成功');
                    this.log(`表格 ${table.name} 创建成功`);
                    successCount++;
                } else {
                    throw new Error(result.message || '创建失败');
                }

                // 添加延迟，让用户看到进度
                await this.delay(500);

            } catch (error) {
                this.updateTableStatus(table.name, '❌ 创建失败');
                this.log(`表格 ${table.name} 创建失败: ${error.message}`, 'error');
            }
        }

        createBtn.textContent = '创建表格';
        createBtn.disabled = false;

        if (successCount === tables.length) {
            this.log('所有表格创建完成！');
            createBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        } else {
            this.log(`创建完成，成功: ${successCount}/${tables.length}`, 'warning');
        }
    }

    // 创建管理员账号
    async createAdmin() {
        const form = document.getElementById('admin-form');
        const formData = new FormData(form);
        const createBtn = document.getElementById('btn-create-admin');

        // 表单验证
        const username = formData.get('username');
        const password = formData.get('password');
        const passwordConfirm = formData.get('passwordConfirm');
        const email = formData.get('email');

        if (!username || username.length < 3) {
            alert('用户名至少需要3个字符');
            return;
        }

        if (!password || password.length < 6) {
            alert('密码至少需要6个字符');
            return;
        }

        if (password !== passwordConfirm) {
            alert('两次输入的密码不一致');
            return;
        }

        createBtn.disabled = true;
        createBtn.textContent = '创建中...';

        try {
            const response = await fetch('/api/setup/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    email
                })
            });

            const result = await response.json();

            if (result.success) {
                this.log('管理员账号创建成功');
                this.nextStep(4);
            } else {
                throw new Error(result.message || '管理员账号创建失败');
            }

        } catch (error) {
            console.error('创建管理员失败:', error);
            alert('创建管理员失败: ' + error.message);
            this.log('管理员账号创建失败: ' + error.message, 'error');
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = '创建管理员';
        }
    }

    // 更新表格状态
    updateTableStatus(tableName, status) {
        const statusEl = document.getElementById(`${tableName}-status`);
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    // 步骤导航
    nextStep(step) {
        this.hideAllSteps();
        this.showStep(step);
        this.updateStepIndicator(step);
        this.currentStep = step;
    }

    prevStep(step) {
        this.hideAllSteps();
        this.showStep(step);
        this.updateStepIndicator(step);
        this.currentStep = step;
    }

    hideAllSteps() {
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`content-step${i}`).classList.add('hidden');
        }
    }

    showStep(step) {
        document.getElementById(`content-step${step}`).classList.remove('hidden');
    }

    updateStepIndicator(currentStep) {
        for (let i = 1; i <= 4; i++) {
            const stepEl = document.getElementById(`step${i}`);
            stepEl.classList.remove('active', 'completed');

            if (i < currentStep) {
                stepEl.classList.add('completed');
            } else if (i === currentStep) {
                stepEl.classList.add('active');
            }
        }
    }

    // 日志记录
    log(message, type = 'info') {
        // 总是输出到控制台
        console.log(`[Setup] ${message}`);

        // 尝试输出到页面日志区域（如果存在）
        const logEl = document.getElementById('creation-log');
        if (logEl) {
            const timestamp = new Date().toLocaleTimeString();
            const logLine = `[${timestamp}] ${message}\n`;

            logEl.textContent += logLine;
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    // 工具函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 前往登录页面
    goToLogin() {
        window.location.href = '/login.html';
    }
}

// 全局函数（供 HTML 调用）
let setupManager;

document.addEventListener('DOMContentLoaded', () => {
    setupManager = new SetupManager();
});

function checkDatabase() {
    setupManager.checkDatabase();
}

function createTables() {
    setupManager.createTables();
}

function createAdmin() {
    setupManager.createAdmin();
}

function nextStep(step) {
    setupManager.nextStep(step);
}

function prevStep(step) {
    setupManager.prevStep(step);
}

function goToLogin() {
    setupManager.goToLogin();
}
