// 登录页面 JavaScript
class LoginManager {
    constructor() {
        this.form = document.getElementById('login-form');
        this.loginBtn = document.getElementById('login-btn');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.btnText = this.loginBtn.querySelector('.btn-text');
        this.btnLoading = this.loginBtn.querySelector('.btn-loading');
        
        this.init();
    }

    init() {
        // 绑定表单提交事件
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 输入框变化时隐藏错误信息
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.hideError();
            });
        });

        // 检查是否已登录
        this.checkLoginStatus();
    }

    // 检查登录状态
    async checkLoginStatus() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            if (result.success) {
                // 已登录，跳转到主页
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            console.log('登录状态检查失败:', error);
            // 清除无效的 token
            localStorage.removeItem('auth_token');
        }
    }

    // 处理登录
    async handleLogin() {
        const formData = new FormData(this.form);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const remember = formData.get('remember') === 'on';

        // 基本验证
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }

        // 显示加载状态
        this.setLoading(true);
        this.hideError();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    remember
                })
            });

            const result = await response.json();

            if (result.success) {
                // 登录成功
                const { token, user } = result.data;
                
                // 保存认证信息
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user_info', JSON.stringify(user));
                
                if (remember) {
                    // 如果选择记住我，设置更长的过期时间
                    localStorage.setItem('remember_login', 'true');
                }

                // 跳转到主页
                window.location.href = '/dashboard.html';
                
            } else {
                // 登录失败
                this.showError(result.message || '登录失败，请检查用户名和密码');
            }

        } catch (error) {
            console.error('登录请求失败:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.setLoading(false);
        }
    }

    // 设置加载状态
    setLoading(loading) {
        this.loginBtn.disabled = loading;
        
        if (loading) {
            this.btnText.classList.add('hidden');
            this.btnLoading.classList.remove('hidden');
        } else {
            this.btnText.classList.remove('hidden');
            this.btnLoading.classList.add('hidden');
        }
    }

    // 显示错误信息
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // 自动隐藏错误信息
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    // 隐藏错误信息
    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

// 初始化登录管理器
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
