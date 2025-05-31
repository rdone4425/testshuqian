// 检测数据库表完整性
export async function onRequest(context) {
    const { request, env } = context;

    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Content-Type': 'application/json'
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // 只允许 GET 请求
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({
            success: false,
            message: '只允许 GET 请求'
        }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        // 检查数据库绑定
        if (!env.DB) {
            return new Response(JSON.stringify({
                success: false,
                message: '数据库未绑定'
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // 定义必需的表和它们的结构
        const requiredTables = {
            users: {
                name: 'users',
                displayName: '用户表',
                description: '存储用户账号信息',
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
            categories: {
                name: 'categories',
                displayName: '分类表',
                description: '存储书签分类信息',
                sql: `CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    icon TEXT,
                    sort_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            bookmarks: {
                name: 'bookmarks',
                displayName: '书签表',
                description: '存储书签数据',
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
        };

        const tableStatus = {};
        const missingTables = [];
        const existingTables = [];

        // 检查每个表是否存在
        for (const [key, tableInfo] of Object.entries(requiredTables)) {
            try {
                // 首先使用 sqlite_master 查询表是否存在（最可靠的方法）
                const tableExists = await env.DB.prepare(
                    'SELECT name FROM sqlite_master WHERE type="table" AND name=?'
                ).bind(tableInfo.name).first();

                if (tableExists && tableExists.name) {
                    // 表存在，再尝试查询确认表结构正常
                    try {
                        await env.DB.prepare(`SELECT 1 FROM ${tableInfo.name} LIMIT 1`).first();
                        tableStatus[key] = {
                            exists: true,
                            name: tableInfo.name,
                            displayName: tableInfo.displayName,
                            description: tableInfo.description
                        };
                        existingTables.push(key);
                    } catch (queryError) {
                        // 表存在但查询失败，可能是表结构问题
                        console.warn(`表 ${tableInfo.name} 存在但查询异常:`, queryError.message);
                        tableStatus[key] = {
                            exists: true,
                            name: tableInfo.name,
                            displayName: tableInfo.displayName,
                            description: tableInfo.description,
                            warning: '表存在但查询异常'
                        };
                        existingTables.push(key);
                    }
                } else {
                    // 表不存在
                    console.log(`表 ${tableInfo.name} 不存在`);
                    tableStatus[key] = {
                        exists: false,
                        name: tableInfo.name,
                        displayName: tableInfo.displayName,
                        description: tableInfo.description,
                        sql: tableInfo.sql
                    };
                    missingTables.push(key);
                }

            } catch (error) {
                // sqlite_master 查询失败，可能是数据库连接问题
                console.error(`检查表 ${tableInfo.name} 时出错:`, error);
                tableStatus[key] = {
                    exists: false,
                    name: tableInfo.name,
                    displayName: tableInfo.displayName,
                    description: tableInfo.description,
                    sql: tableInfo.sql,
                    error: error.message
                };
                missingTables.push(key);
            }
        }

        // 计算完整性状态
        const totalTables = Object.keys(requiredTables).length;
        const existingCount = existingTables.length;
        const missingCount = missingTables.length;
        const completeness = Math.round((existingCount / totalTables) * 100);

        const result = {
            success: true,
            message: `数据库表检测完成`,
            data: {
                totalTables,
                existingCount,
                missingCount,
                completeness,
                allTablesExist: missingCount === 0,
                needsSetup: missingCount > 0,
                tables: tableStatus,
                existingTables,
                missingTables,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('检测数据库表时发生错误:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '检测过程中发生错误: ' + error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
