// 创建数据库表格
export async function onRequest(context) {
    const { request, env } = context;

    // 只允许 POST 请求
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            message: '只允许 POST 请求'
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
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
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 解析请求体
        const { tableName, sql } = await request.json();

        if (!tableName || !sql) {
            return new Response(JSON.stringify({
                success: false,
                message: '缺少必要参数: tableName 和 sql'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证表名（安全检查）
        const validTableNames = ['users', 'categories', 'bookmarks'];
        if (!validTableNames.includes(tableName)) {
            return new Response(JSON.stringify({
                success: false,
                message: '无效的表名'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 执行 SQL 创建表格
        try {
            const result = await env.DB.prepare(sql).run();
            
            console.log(`表格 ${tableName} 创建结果:`, result);

            return new Response(JSON.stringify({
                success: true,
                message: `表格 ${tableName} 创建成功`,
                data: {
                    tableName,
                    result: result.success
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (sqlError) {
            console.error(`创建表格 ${tableName} 失败:`, sqlError);
            
            // 如果是表已存在的错误，也算成功
            if (sqlError.message && sqlError.message.includes('already exists')) {
                return new Response(JSON.stringify({
                    success: true,
                    message: `表格 ${tableName} 已存在`,
                    data: {
                        tableName,
                        existed: true
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: false,
                message: `创建表格失败: ${sqlError.message}`
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('创建表格时发生错误:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '创建过程中发生错误: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
