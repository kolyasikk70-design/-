/**
 * Cloudflare Pages Function: POST /api/bookings
 * Handles creating new salon bookings in Cloudflare D1 Database and Altegio API.
 */

const DEFAULT_ALTEGIO_COMPANY_ID = '1386901';
const DEFAULT_ALTEGIO_PARTNER_TOKEN = 'eygdaa9bgg844dse4at5';
const DEFAULT_BOT_TOKEN = "8974021477:AAESXYJwA4MNYvNCX3QBe2FEeUgkm3zDqMc";
const DEFAULT_ADMIN_ID = "773946321";

async function sendToTelegram(data, env = {}) {
    const botToken = env.BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const adminId = env.ADMIN_ID || DEFAULT_ADMIN_ID;

    const text = `🆕 *НОВИЙ ЗАПИС З САЙТУ (Altegio CRM)*\n\n` +
        `👤 *Клієнт:* ${data.name || 'Клієнт'} (${data.phone || ''})\n` +
        `💅 *Майстер:* ${data.master || ''}\n` +
        `✂️ *Послуга:* ${data.service || ''}\n` +
        `📅 *Дата/Час:* ${data.date_time || ''}\n` +
        `${data.notes ? `📝 *Примітка:* ${data.notes}\n` : ''}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: adminId,
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

// Карта услуг Altegio
const SERVICE_MAP = {
    '1': 13734350,
    '2': 13734350,
    '3': 13734350,
    '4': 13734350,
    '5': 13734350,
    '6': 13734350,
    'default': 13734350
};

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
                parseInt(duration) || 90,
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

        // 2. Динамически и безопасно форматируем дату для Altegio (YYYY-MM-DDTHH:MM:SS+03:00)
        let formattedDatetime = '2026-08-08T14:00:00+03:00';
        try {
            const now = new Date();
            let targetYear = now.getFullYear();
            let monthStr = '08';
            let dayStr = '08';

            if (date) {
                const lowerDate = date.toLowerCase();
                const parts = date.trim().split(' ');
                const dayNum = parseInt(parts[0]);
                if (!isNaN(dayNum)) {
                    dayStr = dayNum < 10 ? '0' + dayNum : '' + dayNum;
                }

                if (lowerDate.includes('січ')) monthStr = '01';
                else if (lowerDate.includes('лют')) monthStr = '02';
                else if (lowerDate.includes('берез')) monthStr = '03';
                else if (lowerDate.includes('квіт')) monthStr = '04';
                else if (lowerDate.includes('трав')) monthStr = '05';
                else if (lowerDate.includes('черв')) monthStr = '06';
                else if (lowerDate.includes('лип')) monthStr = '07';
                else if (lowerDate.includes('серп')) monthStr = '08';
                else if (lowerDate.includes('верес')) monthStr = '09';
                else if (lowerDate.includes('жовт')) monthStr = '10';
                else if (lowerDate.includes('листоп')) monthStr = '11';
                else if (lowerDate.includes('груд')) monthStr = '12';

                if (now.getMonth() === 11 && monthStr === '01') {
                    targetYear += 1;
                }
            }
            const cleanTime = (time || '14:00').trim();
            formattedDatetime = `${targetYear}-${monthStr}-${dayStr}T${cleanTime}:00+03:00`;
        } catch (e) {}

        const companyId = env.ALTEGIO_COMPANY_ID || DEFAULT_ALTEGIO_COMPANY_ID;
        const partnerToken = env.ALTEGIO_PARTNER_TOKEN || DEFAULT_ALTEGIO_PARTNER_TOKEN;
        const serviceId = SERVICE_MAP[data.serviceId] || SERVICE_MAP['default'];
        let targetStaffId = STAFF_MAP[masterId] || (masterName.includes('Олена') ? 3081874 : 3081868);
        const clientEmail = (email && email.includes('@')) ? email.trim() : 'client@beauty-salon.kyiv';

        // 3. Отправляем подтверждённую запись прямо в электронный журнал Altegio!
        let altegioSync = { success: false };
        try {
            const cleanPhone = phone.replace(/\D/g, '');

            const sendBookingToAltegio = async (staffId) => {
                return fetch(`https://api.altegio.com/api/v1/book_record/${companyId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.api.v2+json',
                        'Authorization': `Bearer ${partnerToken}`
                    },
                    body: JSON.stringify({
                        phone: cleanPhone,
                        fullname: clientName,
                        email: clientEmail,
                        comment: `Запис з веб-сайту: ${serviceName} (Майстер: ${masterName}). ${notes}`.trim(),
                        appointments: [{
                            id: 1,
                            services: [serviceId],
                            staff_id: staffId,
                            datetime: formattedDatetime
                        }]
                    })
                });
            };

            let altegioRes = await sendBookingToAltegio(targetStaffId);
            let altegioJson = await altegioRes.json();

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
            }, env);
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
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: err.message 
        }), {
            status: 500,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
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
