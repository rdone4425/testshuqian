// UI 工具类 - 统一管理界面交互
class UIManager {
    constructor() {
        this.loadingElements = new Set();
        this.init();
    }

    init() {
        // 初始化全局 UI 组件
        this.initToast();
        this.initModal();
        this.initLoading();
    }

    // 初始化 Toast 通知
    initToast() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.innerHTML = `
                <style>
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    pointer-events: none;
                }
                .toast {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    padding: 16px 20px;
                    margin-bottom: 10px;
                    min-width: 300px;
                    pointer-events: auto;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    border-left: 4px solid #4299e1;
                }
                .toast.show {
                    transform: translateX(0);
                }
                .toast.success {
                    border-left-color: #48bb78;
                }
                .toast.error {
                    border-left-color: #f56565;
                }
                .toast.warning {
                    border-left-color: #f6ad55;
                }
                .toast-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: #2d3748;
                }
                .toast-message {
                    color: #4a5568;
                    font-size: 14px;
                }
                </style>
            `;
            document.body.appendChild(container);
        }
    }

    // 显示 Toast 通知
    showToast(message, type = 'info', title = '', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const titleHtml = title ? `<div class="toast-title">${title}</div>` : '';
        toast.innerHTML = `
            ${titleHtml}
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // 显示动画
        setTimeout(() => toast.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);

        return toast;
    }

    // 成功通知
    showSuccess(message, title = '成功') {
        return this.showToast(message, 'success', title);
    }

    // 错误通知
    showError(message, title = '错误') {
        return this.showToast(message, 'error', title);
    }

    // 警告通知
    showWarning(message, title = '警告') {
        return this.showToast(message, 'warning', title);
    }

    // 信息通知
    showInfo(message, title = '提示') {
        return this.showToast(message, 'info', title);
    }

    // 初始化模态框
    initModal() {
        if (!document.getElementById('modal-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    display: none;
                    align-items: center;
                    justify-content: center;
                }
                .modal {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                .modal-overlay.show .modal {
                    transform: scale(1);
                }
                .modal-header {
                    padding: 20px 24px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .modal-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 16px;
                }
                .modal-body {
                    padding: 20px 24px;
                }
                .modal-footer {
                    padding: 0 24px 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                </style>
                <div class="modal" id="modal-content"></div>
            `;
            document.body.appendChild(overlay);

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideModal();
                }
            });
        }
    }

    // 显示模态框
    showModal(title, content, buttons = []) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('modal-content');

        const buttonsHtml = buttons.map(btn => 
            `<button class="btn ${btn.class || 'btn-primary'}" onclick="${btn.onclick || ''}">${btn.text}</button>`
        ).join('');

        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${buttons.length > 0 ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
        `;

        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // 隐藏模态框
    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    // 确认对话框
    confirm(title, message, onConfirm, onCancel) {
        this.showModal(title, `<p>${message}</p>`, [
            {
                text: '取消',
                class: 'btn-secondary',
                onclick: `ui.hideModal(); ${onCancel ? onCancel + '()' : ''}`
            },
            {
                text: '确认',
                class: 'btn-primary',
                onclick: `ui.hideModal(); ${onConfirm}()`
            }
        ]);
    }

    // 初始化加载状态
    initLoading() {
        if (!document.getElementById('loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <style>
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.8);
                    z-index: 9998;
                    display: none;
                    align-items: center;
                    justify-content: center;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #4299e1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                </style>
                <div class="loading-spinner"></div>
            `;
            document.body.appendChild(overlay);
        }
    }

    // 显示全局加载
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'flex';
    }

    // 隐藏全局加载
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    }

    // 设置元素加载状态
    setLoading(element, loading = true, text = '加载中...') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;

        if (loading) {
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.textContent = text;
            this.loadingElements.add(element);
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || element.textContent;
            this.loadingElements.delete(element);
        }
    }

    // 清除所有加载状态
    clearAllLoading() {
        this.loadingElements.forEach(element => {
            this.setLoading(element, false);
        });
        this.hideLoading();
    }

    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 创建全局 UI 管理器实例
window.ui = new UIManager();
