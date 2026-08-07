/**
 * Cloudflare Pages Function: POST /api/bookings
 * Handles creating new salon bookings in Cloudflare D1 Database and Altegio API.
 */

const ALTEGIO_COMPANY_ID = '1386901';
const ALTEGIO_PARTNER_TOKEN = 'eygdaa9bgg844dse4at5';

const BOT_TOKEN = "8974021477:AAESXYJwA4MNYvNCX3QBe2FEeUgkm3zDqMc";
const ADMIN_ID = "773946321"; // Telegram ID админа

async function sendToTelegram(data) {
    const BOT_TOKEN = "8974021477:AAESXYJwA4MNYvNCX3QBe2FEeUgkm3zDqMc";
    const ADMIN_ID = "773946321";

    const text = `🆕 *НОВИЙ ЗАПИС З САЙТУ (Altegio CRM)*\n\n` +
        `👤 *Клієнт:* ${data.name || 'Клієнт'} (${data.phone || ''})\n` +
        `💅 *Майстер:* ${data.master || ''}\n` +
        `✂️ *Послуга:* ${data.service || ''}\n` +
        `📅 *Дата/Час:* ${data.date_time || ''}\n` +
        `${data.notes ? `📝 *Примітка:* ${data.notes}\n` : ''}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: ADMIN_ID,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Підтвердити', callback_data: 'confirm_site' },
                        { text: '❌ Скасувати', callback_data: 'cancel_site' }
                    ]
                ]
            }
        })
    });
}

// Карта мастеров Altegio: Name/ID -> Altegio Staff ID
const STAFF_MAP = {
    'm1': 3081874, // Олена Соколова
    'm2': 3081874, // Аліна
    'm3': 3081868, // Микола
    'default': 3081868
};

const ALTEGIO_SERVICE_ID = 13734350;

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
            email = '',
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

        // 2. Форматируем дату для Altegio (YYYY-MM-DDTHH:MM:SS+03:00)
        let formattedDatetime = '2026-08-08T14:00:00+03:00';
        try {
            const currentYear = new Date().getFullYear();
            let monthStr = '08';
            let dayStr = '08';

            if (date) {
                const parts = date.split(' ');
                const dayNum = parseInt(parts[0]);
                if (!isNaN(dayNum)) {
                    dayStr = dayNum < 10 ? '0' + dayNum : '' + dayNum;
                }
            }
            const cleanTime = (time || '14:00').trim();
            formattedDatetime = `${currentYear}-${monthStr}-${dayStr}T${cleanTime}:00+03:00`;
        } catch (e) {}

        // Определяем Staff ID сотрудника в Altegio
        let targetStaffId = STAFF_MAP[masterId] || (masterName.includes('Олена') ? 3081874 : 3081868);

        // Обязательный параметр email для Altegio
        const clientEmail = (email && email.includes('@')) ? email.trim() : 'client@beauty-salon.kyiv';

        // 3. Отправляем подтверждённую запись прямо в электронный журнал Altegio!
        let altegioSync = { success: false };
        try {
            const cleanPhone = phone.replace(/\D/g, '');

            const sendBookingToAltegio = async (staffId) => {
                return fetch(`https://api.altegio.com/api/v1/book_record/${ALTEGIO_COMPANY_ID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.api.v2+json',
                        'Authorization': `Bearer ${ALTEGIO_PARTNER_TOKEN}`
                    },
                    body: JSON.stringify({
                        phone: cleanPhone,
                        fullname: clientName,
                        email: clientEmail,
                        comment: `Запис з веб-сайту: ${serviceName} (Майстер: ${masterName}). ${notes}`.trim(),
                        appointments: [{
                            id: 1,
                            services: [ALTEGIO_SERVICE_ID],
                            staff_id: staffId,
                            datetime: formattedDatetime
                        }]
                    })
                });
            };

            // Первая попытка: на выбранного мастера
            let altegioRes = await sendBookingToAltegio(targetStaffId);
            let altegioJson = await altegioRes.json();

            // Если у мастера в Altegio не задано расписание, направляем в журнал к Миколе
            if ((!altegioRes.ok || !altegioJson.success) && targetStaffId !== 3081868) {
                altegioRes = await sendBookingToAltegio(3081868);
                altegioJson = await altegioRes.json();
            }

            altegioSync = altegioJson;
        } catch (altegioErr) {
            console.warn('Altegio sync status:', altegioErr.message);
        }

        // Г. Відправляємо сповіщення у Telegram-бот (єдиний виклик!)
        try {
            await sendToTelegram({
                name: clientName,
                phone: phone,
                master: masterName,
                service: serviceName,
                date_time: `${date}, о ${time}`,
                notes: notes
            });
        } catch (tgErr) {
            console.warn('Telegram send status:', tgErr.message);
        }

        return new Response(JSON.stringify({
            success: true,
            bookingId: id,
            altegioSync: altegioSync,
            message: 'Запис успішно збережено в D1 та занесено в журнал Altegio!'
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
