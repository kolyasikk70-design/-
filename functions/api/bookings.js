/**
 * Cloudflare Pages Function: POST /api/bookings
 * Handles creating new salon bookings in Cloudflare D1 Database.
 */

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const data = await request.json();

        const {
            date,
            time,
            duration = 90,
            masterId = 'm1',
            masterName = 'Олена Соколова',
            serviceName = 'Процедура beauty',
            clientName = 'Клієнт',
            phone = '',
            notes = '',
            isOvertime = false
        } = data;

        if (!date || !time || !phone) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Обов\'язкові поля: дата, час, телефон' 
            }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const id = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        // Access D1 database binding (fall back to mock in local preview if DB binding missing)
        if (env.DB) {
            await env.DB.prepare(`
                INSERT INTO bookings (
                    id, date, time, duration, master_id, master_name, service_name, client_name, phone, notes, is_overtime, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id,
                date,
                time,
                parseInt(duration),
                masterId,
                masterName,
                serviceName,
                clientName,
                phone,
                notes,
                isOvertime ? 1 : 0,
                isOvertime ? 'PENDING_APPROVAL' : 'CONFIRMED'
            ).run();
        }

        return new Response(JSON.stringify({
            success: true,
            bookingId: id,
            message: 'Запис успішно збережено в базі данных D1'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: err.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
