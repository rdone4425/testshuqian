// 认证管理类 - 统一管理用户认证状态
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        // 从本地存储恢复认证状态
        this.token = localStorage.getItem('auth_token');
        const userInfo = localStorage.getItem('user_info');
        
        if (userInfo) {
            try {
                this.user = JSON.parse(userInfo);
            } catch (error) {
                console.error('用户信息解析失败:', error);
                this.clearAuth();
            }
        }
    }

    // 检查是否已登录
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    // 获取当前用户
    getCurrentUser() {
        return this.user;
    }

    // 获取认证令牌
    getToken() {
        return this.token;
    }

    // 设置认证信息
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        
        // 保存到本地存储
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_info', JSON.stringify(user));
        
        // 触发认证状态变化事件
        this.dispatchAuthEvent('login', { user, token });
    }

    // 清除认证信息
    clearAuth() {
        this.token = null;
        this.user = null;
        
        // 清除本地存储
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('remember_login');
        
        // 触发认证状态变化事件
        this.dispatchAuthEvent('logout');
    }

    // 登录
    async login(username, password, remember = false) {
        try {
            const result = await api.login({
                username,
                password,
                remember
            });

            if (result.success) {
                this.setAuth(result.data.token, result.data.user);
                
                if (remember) {
                    localStorage.setItem('remember_login', 'true');
                }
                
                return { success: true, user: result.data.user };
            } else {
                throw new Error(result.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 登出
    async logout() {
        try {
            // 调用服务器登出 API（如果需要）
            await api.logout();
        } catch (error) {
            console.error('服务器登出失败:', error);
        } finally {
            // 无论服务器响应如何，都清除本地认证信息
            this.clearAuth();
        }
    }

    // 验证令牌有效性
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const result = await api.verifyToken();
            
            if (result.success) {
                // 更新用户信息
                if (result.data.user) {
                    this.user = result.data.user;
                    localStorage.setItem('user_info', JSON.stringify(this.user));
                }
                return true;
            } else {
                // 令牌无效，清除认证信息
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('令牌验证失败:', error);
            this.clearAuth();
            return false;
        }
    }

    // 检查用户权限
    hasPermission(permission) {
        if (!this.user) return false;
        
        // 管理员拥有所有权限
        if (this.user.role === 'admin') return true;
        
        // 根据用户角色和权限进行检查
        const userPermissions = this.user.permissions || [];
        return userPermissions.includes(permission);
    }

    // 检查是否为管理员
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    // 触发认证事件
    dispatchAuthEvent(type, data = {}) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // 监听认证事件
    onAuthChange(callback) {
        document.addEventListener('auth:login', callback);
        document.addEventListener('auth:logout', callback);
    }

    // 页面访问控制
    requireAuth(redirectUrl = '/login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // 管理员页面访问控制
    requireAdmin(redirectUrl = '/') {
        if (!this.requireAuth()) return false;
        
        if (!this.isAdmin()) {
            alert('需要管理员权限才能访问此页面');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // 自动登录检查
    async autoLogin() {
        const rememberLogin = localStorage.getItem('remember_login');
        
        if (this.token && rememberLogin) {
            const isValid = await this.verifyToken();
            if (isValid) {
                this.dispatchAuthEvent('auto-login', { user: this.user });
                return true;
            }
        }
        
        return false;
    }
}

// 创建全局认证管理器实例
window.auth = new AuthManager();
