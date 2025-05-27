// 创建管理员账号
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
        const { username, password, email } = await request.json();

        // 验证输入
        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名和密码不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (username.length < 3) {
            return new Response(JSON.stringify({
                success: false,
                message: '用户名至少需要3个字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({
                success: false,
                message: '密码至少需要6个字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // 检查是否已存在管理员
            const existingAdmin = await env.DB.prepare(
                'SELECT id FROM users WHERE role = ? LIMIT 1'
            ).bind('admin').first();

            if (existingAdmin) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '管理员账号已存在，无法重复创建'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 检查用户名是否已存在
            const existingUser = await env.DB.prepare(
                'SELECT id FROM users WHERE username = ? LIMIT 1'
            ).bind(username).first();

            if (existingUser) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '用户名已存在'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 加密密码（使用简单的哈希，生产环境建议使用更强的加密）
            const hashedPassword = await hashPassword(password);

            // 插入管理员账号
            const result = await env.DB.prepare(`
                INSERT INTO users (username, password, email, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            `).bind(username, hashedPassword, email || null, 'admin').run();

            if (result.success) {
                console.log('管理员账号创建成功:', { username, userId: result.meta.last_row_id });

                return new Response(JSON.stringify({
                    success: true,
                    message: '管理员账号创建成功',
                    data: {
                        userId: result.meta.last_row_id,
                        username
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                throw new Error('数据库插入失败');
            }

        } catch (dbError) {
            console.error('数据库操作失败:', dbError);
            return new Response(JSON.stringify({
                success: false,
                message: '数据库操作失败: ' + dbError.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('创建管理员时发生错误:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '创建过程中发生错误: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 简单的密码哈希函数
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
