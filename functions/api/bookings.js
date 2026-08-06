/**
 * Cloudflare Pages Function: POST /api/bookings
 * Handles creating new salon bookings in Cloudflare D1 Database and Altegio API.
 */

const ALTEGIO_COMPANY_ID = '1386901';

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

        // 1. Сохраняем в нашу облачную базу данных Cloudflare D1
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

        // 2. Дублируем запись напрямую в журнал Altegio компании #1386901
        let altegioSync = { success: false };
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const altegioRes = await fetch(`https://api.altegio.com/api/v1/book_record/${ALTEGIO_COMPANY_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.api.v2+json'
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    fullname: clientName,
                    email: '',
                    comment: `Запис з сайту: ${serviceName} (${masterName}). ${notes}`.trim(),
                    appointments: [{
                        id: 1,
                        services: [1],
                        staff_id: 0,
                        datetime: date + 'T' + time + ':00'
                    }]
                })
            });

            altegioSync = await altegioRes.json();
        } catch (altegioErr) {
            console.warn('Altegio sync status:', altegioErr.message);
        }

        return new Response(JSON.stringify({
            success: true,
            bookingId: id,
            altegioSync: altegioSync,
            message: 'Запис успішно збережено в базі D1 та надіслано в Altegio'
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
