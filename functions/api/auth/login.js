// 用户登录 API
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
        const { username, password, remember } = await request.json();

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

        try {
            // 查找用户
            const user = await env.DB.prepare(`
                SELECT id, username, password, email, role 
                FROM users 
                WHERE username = ? 
                LIMIT 1
            `).bind(username).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '用户名或密码错误'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 验证密码
            const hashedPassword = await hashPassword(password);
            if (hashedPassword !== user.password) {
                return new Response(JSON.stringify({
                    success: false,
                    message: '用户名或密码错误'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 生成 JWT token
            const token = await generateJWT({
                userId: user.id,
                username: user.username,
                role: user.role
            }, remember ? '30d' : '1d');

            // 返回登录成功信息
            return new Response(JSON.stringify({
                success: true,
                message: '登录成功',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (dbError) {
            console.error('数据库查询失败:', dbError);
            return new Response(JSON.stringify({
                success: false,
                message: '登录验证失败'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('登录处理失败:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '登录过程中发生错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 密码哈希函数
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 生成 JWT Token (简化版本)
async function generateJWT(payload, expiresIn = '1d') {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    // 计算过期时间
    const now = Math.floor(Date.now() / 1000);
    let exp;
    if (expiresIn === '1d') {
        exp = now + (24 * 60 * 60); // 1天
    } else if (expiresIn === '30d') {
        exp = now + (30 * 24 * 60 * 60); // 30天
    } else {
        exp = now + (24 * 60 * 60); // 默认1天
    }

    const jwtPayload = {
        ...payload,
        iat: now,
        exp: exp
    };

    // Base64 编码
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(jwtPayload));

    // 创建签名 (简化版本，生产环境应使用更安全的密钥)
    const secret = 'your-secret-key-change-this-in-production';
    const signature = await createSignature(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 创建签名
async function createSignature(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
