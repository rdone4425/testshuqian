// 检查是否存在管理员账号
export async function onRequest(context) {
    const { request, env } = context;

    // 只允许 GET 请求
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({
            success: false,
            message: '只允许 GET 请求'
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

        try {
            // 检查 users 表是否存在
            const tableCheck = await env.DB.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='users'
            `).first();

            if (!tableCheck) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '用户表不存在，需要初始化系统',
                    data: { hasAdmin: false, tableExists: false }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 检查是否存在管理员账号
            const adminUser = await env.DB.prepare(`
                SELECT id, username FROM users 
                WHERE role = 'admin' 
                LIMIT 1
            `).first();

            const hasAdmin = !!adminUser;

            return new Response(JSON.stringify({
                success: true,
                message: hasAdmin ? '管理员账号已存在' : '未找到管理员账号',
                data: {
                    hasAdmin,
                    tableExists: true,
                    adminInfo: hasAdmin ? {
                        id: adminUser.id,
                        username: adminUser.username
                    } : null
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (dbError) {
            console.error('数据库查询失败:', dbError);
            
            // 如果是表不存在的错误
            if (dbError.message && dbError.message.includes('no such table')) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '数据表不存在，需要初始化系统',
                    data: { hasAdmin: false, tableExists: false }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: false,
                message: '数据库查询失败: ' + dbError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('检查管理员账号时发生错误:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '检查过程中发生错误: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
