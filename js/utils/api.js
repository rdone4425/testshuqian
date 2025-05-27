// API 工具类 - 统一管理所有 API 调用
class ApiClient {
    constructor() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // 获取认证头
    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return token ? {
            ...this.defaultHeaders,
            'Authorization': `Bearer ${token}`
        } : this.defaultHeaders;
    }

    // 通用请求方法
    async request(url, options = {}) {
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(this.baseUrl + url, config);
            
            // 检查响应类型
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API 返回非 JSON 响应，请检查服务器配置');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API 请求失败 [${url}]:`, error);
            throw error;
        }
    }

    // GET 请求
    async get(url) {
        return this.request(url, { method: 'GET' });
    }

    // POST 请求
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 请求
    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // 系统状态检测 API
    async checkDatabase() {
        return this.get('/api/setup/check-database');
    }

    async checkAdmin() {
        return this.get('/api/auth/check-admin');
    }

    async verifyToken() {
        return this.get('/api/auth/verify');
    }

    // 安装相关 API
    async createTable(tableName, sql) {
        return this.post('/api/setup/create-table', { tableName, sql });
    }

    async createAdmin(userData) {
        return this.post('/api/setup/create-admin', userData);
    }

    // 认证相关 API
    async login(credentials) {
        return this.post('/api/auth/login', credentials);
    }

    async logout() {
        return this.post('/api/auth/logout');
    }

    // 书签相关 API
    async getBookmarks(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/api/bookmarks${query ? '?' + query : ''}`);
    }

    async createBookmark(bookmarkData) {
        return this.post('/api/bookmarks', bookmarkData);
    }

    async updateBookmark(id, bookmarkData) {
        return this.put(`/api/bookmarks/${id}`, bookmarkData);
    }

    async deleteBookmark(id) {
        return this.delete(`/api/bookmarks/${id}`);
    }

    // 分类相关 API
    async getCategories() {
        return this.get('/api/categories');
    }

    async createCategory(categoryData) {
        return this.post('/api/categories', categoryData);
    }

    async updateCategory(id, categoryData) {
        return this.put(`/api/categories/${id}`, categoryData);
    }

    async deleteCategory(id) {
        return this.delete(`/api/categories/${id}`);
    }

    // 统计相关 API
    async getStats() {
        return this.get('/api/stats');
    }

    async recordClick(bookmarkId) {
        return this.post('/api/stats/click', { bookmarkId });
    }
}

// 创建全局 API 实例
window.api = new ApiClient();
