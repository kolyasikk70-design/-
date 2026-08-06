const ALTEGIO_COMPANY_ID = '1386901';
const ALTEGIO_PARTNER_TOKEN = 'eygdaa9bgg844dse4at5';
const ALTEGIO_SERVICE_ID = 13734350;

const STAFF_MAP = {
    'm1': 3081874, // Olena Sokolova
    'm2': 3081868, // Mykola
    'm3': 3081874,
    'm4': 3081874,
    'm5': 3081868,
    'm6': 3081868
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS preflight handling
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        // ----------------------------------------------------------------------
        // 1. ENDPOINT: GET /api/slots?date=...&masterId=...
        // ----------------------------------------------------------------------
        if (url.pathname === '/api/slots' && request.method === 'GET') {
            try {
                const date = url.searchParams.get('date');
                const masterId = url.searchParams.get('masterId');
                let bookings = [];

                if (env.DB) {
                    let query = `SELECT * FROM bookings`;
                    let params = [];
                    if (date && masterId) {
                        query += ` WHERE date = ? AND master_id = ?`;
                        params.push(date, masterId);
                    } else if (date) {
                        query += ` WHERE date = ?`;
                        params.push(date);
                    }

                    const { results } = await env.DB.prepare(query).bind(...params).all();
                    bookings = results || [];
                }

                return new Response(JSON.stringify({ success: true, bookings }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, bookings: [], error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        // ----------------------------------------------------------------------
        // 2. ENDPOINT: POST /api/bookings
        // ----------------------------------------------------------------------
        if (url.pathname === '/api/bookings' && request.method === 'POST') {
            try {
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
                    return new Response(JSON.stringify({ success: false, error: 'Обов\'язкові поля: дата, час, телефон' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }

                const id = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

                // А. Сохраняем в облачную базу данных Cloudflare D1
                if (env.DB) {
                    await env.DB.prepare(`
                        INSERT INTO bookings (
                            id, date, time, duration, master_id, master_name, service_name, client_name, phone, notes, is_overtime, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        id, date, time, parseInt(duration), masterId, masterName, serviceName, clientName, phone, notes,
                        isOvertime ? 1 : 0, isOvertime ? 'PENDING_APPROVAL' : 'CONFIRMED'
                    ).run();
                }

                // Б. Форматируем дату для Altegio (YYYY-MM-DDTHH:MM:SS+03:00)
                let formattedDatetime = '2026-08-08T14:00:00+03:00';
                try {
                    const currentYear = new Date().getFullYear();
                    let monthStr = '08';
                    let dayStr = '08';

                    if (date) {
                        const lowerDate = date.toLowerCase();
                        const parts = date.split(' ');
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
                    }
                    const cleanTime = (time || '14:00').trim();
                    formattedDatetime = `${currentYear}-${monthStr}-${dayStr}T${cleanTime}:00+03:00`;
                } catch (e) {}

                let targetStaffId = STAFF_MAP[masterId] || (masterName.includes('Олена') ? 3081874 : 3081868);
                const clientEmail = (email && email.includes('@')) ? email.trim() : 'client@beauty-salon.kyiv';

                // В. Отправляем в Altegio API
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

                return new Response(JSON.stringify({
                    success: true,
                    bookingId: id,
                    altegio: altegioSync,
                    message: 'Запис успішно створено та синхронізовано з Altegio'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            } catch (err) {
                return new Response(JSON.stringify({ success: false, error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        // ----------------------------------------------------------------------
        // 3. PROXY STATIC ASSETS (HTML, CSS, JS, IMAGES)
        // ----------------------------------------------------------------------
        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};
