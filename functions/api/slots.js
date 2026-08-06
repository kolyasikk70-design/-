/**
 * Cloudflare Pages Function: GET /api/slots?date=...&masterId=...
 * Returns list of occupied bookings from D1 Database for slot calculation.
 */

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const date = url.searchParams.get('date');
        const masterId = url.searchParams.get('masterId');

        let bookings = [];

        if (env.DB) {
            let query = `SELECT id, date, time, duration, master_id as masterId, phone FROM bookings`;
            const params = [];

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

        return new Response(JSON.stringify({
            success: true,
            bookings: bookings
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
            bookings: [],
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
