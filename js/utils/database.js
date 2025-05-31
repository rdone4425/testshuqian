// 数据库监控工具模块
class DatabaseMonitor {
    constructor() {
        this.requiredTables = ['users', 'categories', 'bookmarks'];
        this.checkInterval = null;
        this.isMonitoring = false;
    }

    // 检查数据库连接
    async checkConnection() {
        try {
            const response = await fetch('/api/setup/check-database');
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('数据库连接检查失败:', error);
            return {
                success: false,
                message: '连接检查失败: ' + error.message
            };
        }
    }

    // 检查表完整性
    async checkTables() {
        try {
            const response = await fetch('/api/setup/check-tables');
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('表完整性检查失败:', error);
            return {
                success: false,
                message: '表检查失败: ' + error.message
            };
        }
    }

    // 检查系统完整性
    async checkSystemIntegrity() {
        const connectionResult = await this.checkConnection();
        if (!connectionResult.success) {
            return {
                status: 'error',
                type: 'connection',
                message: connectionResult.message,
                action: 'check_database_binding'
            };
        }

        const tablesResult = await this.checkTables();
        if (!tablesResult.success) {
            return {
                status: 'error',
                type: 'tables',
                message: tablesResult.message,
                action: 'check_tables'
            };
        }

        if (!tablesResult.data.allTablesExist) {
            return {
                status: 'incomplete',
                type: 'missing_tables',
                message: `缺失 ${tablesResult.data.missingCount} 个数据库表`,
                missingTables: tablesResult.data.missingTables,
                completeness: tablesResult.data.completeness,
                action: 'repair_tables'
            };
        }

        return {
            status: 'healthy',
            type: 'complete',
            message: '数据库系统完整',
            completeness: 100,
            action: 'none'
        };
    }

    // 启动监控
    startMonitoring(interval = 30000, callback = null) {
        if (this.isMonitoring) {
            console.log('数据库监控已在运行');
            return;
        }

        this.isMonitoring = true;
        console.log('启动数据库监控，检查间隔:', interval + 'ms');

        this.checkInterval = setInterval(async () => {
            const result = await this.checkSystemIntegrity();

            if (callback && typeof callback === 'function') {
                callback(result);
            }

            // 如果发现问题，记录日志
            if (result.status !== 'healthy') {
                console.warn('数据库监控发现问题:', result);
            }
        }, interval);
    }

    // 停止监控
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.isMonitoring = false;
            console.log('数据库监控已停止');
        }
    }

    // 自动修复
    async autoRepair(showConfirm = true) {
        const integrity = await this.checkSystemIntegrity();

        if (integrity.status === 'incomplete' && integrity.type === 'missing_tables') {
            console.log('检测到缺失表，准备自动修复...');

            // 跳转到修复页面
            const missingTables = integrity.missingTables;
            const repairUrl = `/setup.html?mode=repair&missing=${encodeURIComponent(JSON.stringify(missingTables))}`;

            if (!showConfirm || confirm(`检测到缺失的数据库表: ${missingTables.join(', ')}\\n完整性: ${integrity.completeness}%\\n\\n是否立即修复？`)) {
                window.location.href = repairUrl;
                return true;
            }
        } else if (integrity.status === 'error') {
            console.error('数据库系统错误:', integrity.message);
            if (!showConfirm || confirm(`数据库系统错误: ${integrity.message}\\n\\n是否前往安装页面检查？`)) {
                window.location.href = '/setup.html';
                return true;
            }
        } else if (integrity.status === 'healthy') {
            if (showConfirm) {
                alert('数据库系统完整，无需修复！');
            }
        }

        return false;
    }

    // 强制自动修复（不显示确认对话框）
    async forceAutoRepair() {
        return this.autoRepair(false);
    }

    // 获取数据库状态摘要
    async getStatusSummary() {
        const integrity = await this.checkSystemIntegrity();

        const summary = {
            timestamp: new Date().toISOString(),
            status: integrity.status,
            message: integrity.message,
            completeness: integrity.completeness || 0
        };

        if (integrity.missingTables) {
            summary.missingTables = integrity.missingTables;
            summary.missingCount = integrity.missingTables.length;
        }

        return summary;
    }

    // 创建状态指示器
    createStatusIndicator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('状态指示器容器未找到:', containerId);
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'db-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        container.appendChild(indicator);

        // 定期更新状态
        this.updateStatusIndicator();
        setInterval(() => this.updateStatusIndicator(), 60000); // 每分钟更新一次

        return indicator;
    }

    // 更新状态指示器
    async updateStatusIndicator() {
        const indicator = document.getElementById('db-status-indicator');
        if (!indicator) return;

        const status = await this.getStatusSummary();

        let bgColor, textColor, icon, text;

        switch (status.status) {
            case 'healthy':
                bgColor = '#d4edda';
                textColor = '#155724';
                icon = '✅';
                text = '数据库正常';
                break;
            case 'incomplete':
                bgColor = '#fff3cd';
                textColor = '#856404';
                icon = '⚠️';
                text = `数据库不完整 (${status.completeness}%)`;
                break;
            case 'error':
                bgColor = '#f8d7da';
                textColor = '#721c24';
                icon = '❌';
                text = '数据库错误';
                break;
            default:
                bgColor = '#e2e3e5';
                textColor = '#383d41';
                icon = '❓';
                text = '状态未知';
        }

        indicator.style.backgroundColor = bgColor;
        indicator.style.color = textColor;
        indicator.innerHTML = `${icon} ${text}`;
        indicator.title = status.message;

        // 点击事件
        indicator.onclick = () => {
            if (status.status === 'incomplete') {
                this.autoRepair();
            } else {
                alert(status.message);
            }
        };
    }
}

// 导出单例
window.DatabaseMonitor = DatabaseMonitor;
window.dbMonitor = new DatabaseMonitor();

// 自动初始化（如果在浏览器环境中）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // 在管理后台页面自动启动监控和检测
        if (window.location.pathname.includes('dashboard')) {
            // 立即检查一次数据库完整性
            setTimeout(async () => {
                try {
                    const integrity = await window.dbMonitor.checkSystemIntegrity();
                    if (integrity.status === 'incomplete') {
                        console.warn('页面加载时检测到数据库不完整:', integrity);

                        // 显示立即修复的提示
                        const shouldRepair = confirm(
                            `检测到数据库不完整！\n\n` +
                            `完整性: ${integrity.completeness}%\n` +
                            `缺失表: ${integrity.missingTables ? integrity.missingTables.join(', ') : '未知'}\n\n` +
                            `是否立即跳转到修复页面？`
                        );

                        if (shouldRepair) {
                            const missingTables = integrity.missingTables || [];
                            const repairUrl = `/setup.html?mode=repair&missing=${encodeURIComponent(JSON.stringify(missingTables))}`;
                            window.location.href = repairUrl;
                            return;
                        }
                    }
                } catch (error) {
                    console.error('初始数据库检测失败:', error);
                }
            }, 2000); // 延迟2秒进行检测，确保页面完全加载

            // 启动定期监控
            window.dbMonitor.startMonitoring(60000, (result) => {
                if (result.status === 'incomplete') {
                    console.warn('检测到数据库表缺失，建议修复');
                }
            });
        }
    });
}
