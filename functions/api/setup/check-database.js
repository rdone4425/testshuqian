// 检测 D1 数据库绑定
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
        // 检查 D1 数据库是否绑定
        if (!env.DB) {
            return new Response(JSON.stringify({
                success: false,
                message: '未检测到 D1 数据库绑定。请在 Cloudflare Pages 设置中绑定 D1 数据库。'
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // 尝试执行一个简单的查询来验证连接
        try {
            // 使用更安全的连接测试方式
            let connectionTest = false;
            try {
                await env.DB.prepare('SELECT 1 as test').first();
                connectionTest = true;
            } catch (testError) {
                // 如果简单查询失败，尝试查询 sqlite_master 表
                try {
                    await env.DB.prepare('SELECT name FROM sqlite_master LIMIT 1').first();
                    connectionTest = true;
                } catch (masterError) {
                    console.error('数据库连接测试失败:', masterError);
                    throw new Error('数据库连接失败');
                }
            }

            // 检查必需的表是否存在
            const requiredTables = ['users', 'categories', 'bookmarks'];
            const tableStatus = {};
            const missingTables = [];

            for (const tableName of requiredTables) {
                try {
                    // 使用 sqlite_master 查询表是否存在（更可靠）
                    const tableExists = await env.DB.prepare(
                        'SELECT name FROM sqlite_master WHERE type="table" AND name=?'
                    ).bind(tableName).first();

                    if (tableExists) {
                        // 表存在，再尝试查询确认表结构正常
                        try {
                            await env.DB.prepare(`SELECT 1 FROM ${tableName} LIMIT 1`).first();
                            tableStatus[tableName] = true;
                        } catch (queryError) {
                            // 表存在但查询失败，可能是表结构问题
                            console.warn(`表 ${tableName} 存在但查询异常:`, queryError.message);
                            tableStatus[tableName] = true; // 仍然认为表存在
                        }
                    } else {
                        // 表不存在
                        console.log(`表 ${tableName} 不存在`);
                        tableStatus[tableName] = false;
                        missingTables.push(tableName);
                    }
                } catch (error) {
                    // 查询失败，认为表不存在
                    console.log(`检查表 ${tableName} 时出错:`, error.message);
                    tableStatus[tableName] = false;
                    missingTables.push(tableName);
                }
            }

            // 获取数据库信息
            const dbInfo = {
                name: env.DB.name || 'D1 Database',
                connected: connectionTest,
                timestamp: new Date().toISOString(),
                tables: tableStatus,
                missingTables: missingTables,
                allTablesExist: missingTables.length === 0,
                isEmpty: missingTables.length === requiredTables.length
            };

            return new Response(JSON.stringify({
                success: true,
                message: connectionTest ? '数据库连接成功' : '数据库连接异常',
                data: dbInfo
            }), {
                status: 200,
                headers: corsHeaders
            });

        } catch (dbError) {
            console.error('数据库连接测试失败:', dbError);
            return new Response(JSON.stringify({
                success: false,
                message: '数据库连接失败: ' + dbError.message
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

    } catch (error) {
        console.error('检测数据库绑定时发生错误:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '检测过程中发生错误: ' + error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
