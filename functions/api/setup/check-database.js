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
            const result = await env.DB.prepare('SELECT 1 as test').first();

            // 获取数据库信息（如果可能的话）
            const dbInfo = {
                name: env.DB.name || 'D1 Database',
                connected: true,
                timestamp: new Date().toISOString()
            };

            return new Response(JSON.stringify({
                success: true,
                message: '数据库连接成功',
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
