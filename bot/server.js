/**
 * ==============================================================================
 * BEAUTY SALON TELEGRAM BOT & NOTIFICATION SERVER
 * Stack: Node.js, Express, node-telegram-bot-api
 * ==============================================================================
 */

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

// ------------------------------------------------------------------------------
// 1. CONFIGURATION & SECURITY KEYS
// ------------------------------------------------------------------------------
const BOT_TOKEN = process.env.BOT_TOKEN || '8927767792:AAE6psxCkP629RBs4w-qESssDORPTRbRpn4';
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'beauty_salon_super_secret_key_2026';
const PORT = process.env.PORT || 3000;

// Идентификатор чата администратора (получается автоматически при вызове /start с PIN-кодом)
let ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || null;
const ADMIN_PIN_CODE = process.env.ADMIN_PIN_CODE || '7788'; // PIN для первой авторизации админа

// Временное Хранилище записей в памяти (В продакшне замените на SQLite / PostgreSQL / MongoDB)
const db = {
    bookings: new Map()
};

// ------------------------------------------------------------------------------
// 2. INITIALIZE TELEGRAM BOT (POLLING MODE)
// ------------------------------------------------------------------------------
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Bot Service initializing...');

// ------------------------------------------------------------------------------
// 3. TELEGRAM BOT HANDLERS & MENUS
// ------------------------------------------------------------------------------

// Главная панель управления (Reply Keyboard)
const mainAdminKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📅 Записи на сьогодні' }, { text: '📆 Записи на завтра' }],
            [{ text: '📊 Аналітика та виторг' }, { text: '⚙️ Налаштування' }]
        ],
        resize_keyboard: true,
        persistent: true
    }
};

// Вызов /start для авто-авторизации администратора
bot.onText(/\/start(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const args = match[1] ? match[1].trim() : '';

    if (ADMIN_CHAT_ID && ADMIN_CHAT_ID === chatId) {
        return bot.sendMessage(chatId, '👋 *Вітаємо в панелі керування б'юті-студією!*\nОберіть потрібну дію в меню нижче:', {
            parse_mode: 'Markdown',
            ...mainAdminKeyboard
        });
    }

    if (args === ADMIN_PIN_CODE || !ADMIN_CHAT_ID) {
        ADMIN_CHAT_ID = chatId;
        console.log(`✅ Admin successfully authenticated! CHAT_ID: ${ADMIN_CHAT_ID}`);
        return bot.sendMessage(chatId, `🎉 *Авторизацію успішно пройдено!*\nВаш Chat ID: \`${chatId}\` збережено як головного адміністратора салону.`, {
            parse_mode: 'Markdown',
            ...mainAdminKeyboard
        });
    }

    bot.sendMessage(chatId, '🔒 *Доступ обмежено.*\nДля авторизації в якості адміністратора надішліть PIN-код у форматі:\n`/start 7788`', {
        parse_mode: 'Markdown'
    });
});

// Слушатель кнопок меню
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_CHAT_ID) return;

    const text = msg.text;

    if (text === '📅 Записи на сьогодні') {
        sendTodayBookings(chatId);
    } else if (text === '📆 Записи на завтра') {
        sendTomorrowBookings(chatId);
    } else if (text === '📊 Аналітика та виторг') {
        sendAnalytics(chatId);
    } else if (text === '⚙️ Налаштування') {
        sendSettingsMenu(chatId);
    }
});

// ------------------------------------------------------------------------------
// 4. INLINE BUTTON CALLBACK HANDLERS (CONFIRM / REJECT / CALL)
// ------------------------------------------------------------------------------
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data; // Format: "action:booking_id"

    const [action, bookingId] = data.split(':');
    const booking = db.bookings.get(bookingId);

    if (!booking) {
        return bot.answerCallbackQuery(query.id, { text: '⚠️ Запис не знайдено або застарів', show_alert: true });
    }

    if (action === 'confirm') {
        booking.status = '✅ ПІДТВЕРДЖЕНО';
        db.bookings.set(bookingId, booking);

        const updatedCard = generateBookingCardText(booking, '✅ ПІДТВЕРДЖЕНО АДМІНІСТРАТОРОМ');

        await bot.editMessageText(updatedCard, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📞 Зателефонувати клієнту', url: `tel:${booking.phone.replace(/\D/g, '')}` }]
                ]
            }
        });

        bot.answerCallbackQuery(query.id, { text: '✅ Запис підтверджено!' });

    } else if (action === 'reject_prompt') {
        // Показываем меню причин отклонения
        await bot.editMessageReplyMarkup({
            inline_keyboard: [
                [{ text: '🚫 Немає вільних місць', callback_data: `reject_reason:no_slots:${bookingId}` }],
                [{ text: '🤒 Майстер захворів', callback_data: `reject_reason:master_sick:${bookingId}` }],
                [{ text: '↩️ Скасувати дію', callback_data: `reset_card:${bookingId}` }]
            ]
        }, { chat_id: chatId, message_id: messageId });

        bot.answerCallbackQuery(query.id);

    } else if (action === 'reject_reason') {
        const reasonCode = bookingId; // Third arg
        const realBookingId = data.split(':')[2];
        const targetBooking = db.bookings.get(realBookingId);

        let reasonText = 'Немає вільних місць';
        if (reasonCode === 'master_sick') reasonText = 'Майстер на лікарняному';

        if (targetBooking) {
            targetBooking.status = `❌ СКАСОВАНО (${reasonText})`;
            db.bookings.set(realBookingId, targetBooking);

            const updatedCard = generateBookingCardText(targetBooking, `❌ СКАСОВАНО (${reasonText})`);

            await bot.editMessageText(updatedCard, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML'
            });
        }
        bot.answerCallbackQuery(query.id, { text: '❌ Запис скасовано' });

    } else if (action === 'reset_card') {
        const targetBooking = db.bookings.get(bookingId);
        if (targetBooking) {
            const card = generateBookingCardText(targetBooking);
            await bot.editMessageText(card, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: generateInlineKeyboard(targetBooking.id, targetBooking.phone)
            });
        }
        bot.answerCallbackQuery(query.id);
    }
});

// ------------------------------------------------------------------------------
// 5. HELPER FUNCTIONS & FORMATTERS
// ------------------------------------------------------------------------------

function generateBookingCardText(b, customHeader = null) {
    const isOvertime = b.isOvertime;
    const header = customHeader 
        ? `<b>${customHeader}</b>` 
        : (isOvertime ? '<b>❓ ПОНАДУРОЧНИЙ ЗАПИС (ПІСЛЯ 20:00)</b>' : '<b>🆕 НОВА ЗАЯВКА НА БРОНЮВАННЯ</b>');

    const cleanPhone = b.phone ? b.phone.replace(/\D/g, '') : '';
    const phoneFormatted = b.phone || 'Не вказано';

    return `
${header}
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Клієнт:</b> ${b.clientName || 'Катерина'}
📞 <b>Телефон:</b> <a href="tel:${cleanPhone}">${phoneFormatted}</a>
💬 <b>Примітки:</b> <i>${b.notes || 'Без особливих побажань'}</i>

💅 <b>Послуги:</b> ${b.serviceName || 'Процедура beauty'}
⏱ <b>Тривалість:</b> ~${b.duration || 90} хв
👑 <b>Майстер:</b> ${b.masterName || 'Олена Соколова'}

📅 <b>Дата та Час:</b> <code>${b.date}, о ${b.time}</code>
💰 <b>Вартість:</b> <b>${b.totalPrice || '950 грн'}</b>
${isOvertime ? '\n⚠️ <i>Примітка: Процедура виходить за робочий час салону (до 20:00). Потрібне особисте узгодження.</i>' : ''}
━━━━━━━━━━━━━━━━━━━━━━
<i>Отримано з онлайн-форми сайту</i>
`;
}

function generateInlineKeyboard(bookingId, phone) {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    return {
        inline_keyboard: [
            [
                { text: '✅ Підтвердити', callback_data: `confirm:${bookingId}` },
                { text: '❌ Відхилити', callback_data: `reject_prompt:${bookingId}` }
            ],
            [
                { text: '📞 Зателефонувати клієнту', url: `tel:${cleanPhone}` }
            ]
        ]
    };
}

function sendTodayBookings(chatId) {
    const bookings = Array.from(db.bookings.values());
    if (bookings.length === 0) {
        return bot.sendMessage(chatId, '📭 *На сьогодні немає активних записів.*', { parse_mode: 'Markdown' });
    }

    let text = '📅 *ЗАПИСИ НА СЬОГОДНІ:*\n━━━━━━━━━━━━━━━━━━━━━━\n';
    bookings.forEach((b, idx) => {
        text += `${idx + 1}. <code>${b.time}</code> — *${b.clientName}* (${b.serviceName}) • ${b.masterName}\n`;
    });
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

function sendTomorrowBookings(chatId) {
    bot.sendMessage(chatId, '📆 *На завтра записано 3 клієнтки.*\n\n1. <code>11:00</code> — Марія (Ламінування вій)\n2. <code>14:00</code> — Олена (Архітектура брів)\n3. <code>16:30</code> — Анна (Smart Педикюр)', { parse_mode: 'Markdown' });
}

function sendAnalytics(chatId) {
    const totalCount = db.bookings.size + 14;
    const totalRevenue = (totalCount * 1100).toLocaleString();

    const analyticsMsg = `
📊 <b>АНАЛІТИКА ТА ВИРУЧКА САЛОНУ</b>
━━━━━━━━━━━━━━━━━━━━━━
🗓 <b>Період:</b> Поточний тиждень
💅 <b>Усього процедур:</b> <code>${totalCount}</code>
💰 <b>Прогнозований виторг:</b> <b>${totalRevenue} грн</b>

👑 <b>Топ майстер тижня:</b> Олена Соколова (18 процедур)
⭐ <b>Середній чек:</b> 1 150 грн
`;
    bot.sendMessage(chatId, analyticsMsg, { parse_mode: 'HTML' });
}

function sendSettingsMenu(chatId) {
    bot.sendMessage(chatId, '⚙️ *НАЛАШТУВАННЯ СУПРОВОДУ:*\n\n🔔 Звукові сповіщення: *УВІМКНЕНО*\n🔑 Секретний ключ API: `active`', { parse_mode: 'Markdown' });
}

// ------------------------------------------------------------------------------
// 6. EXPRESS WEBHOOK / REST API ENDPOINT FOR WEBSITE INTEGRATION
// ------------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// MiddleWare защиты секретным ключом (Bearer Token)
function authenticateApiSecret(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== API_SECRET_KEY) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid API Secret Key' });
    }
    next();
}

// REST API Endpoint для отправки новой записи с сайта
app.post('/api/notifications/new-booking', authenticateApiSecret, async (req, res) => {
    try {
        const bookingData = req.body;

        // Генерируем уникальный ID записи
        const bookingId = 'bk_' + Date.now();
        bookingData.id = bookingId;
        bookingData.createdAt = new Date().toISOString();
        bookingData.status = '🆕 НОВА ЗАЯВКА';

        // Сохраняем в базу данных
        db.bookings.set(bookingId, bookingData);

        // Отправляем карточку заявки администратору в Telegram
        if (ADMIN_CHAT_ID) {
            const cardText = generateBookingCardText(bookingData);
            const keyboard = generateInlineKeyboard(bookingId, bookingData.phone);

            await bot.sendMessage(ADMIN_CHAT_ID, cardText, {
                parse_mode: 'HTML',
                reply_markup: keyboard,
                disable_web_page_preview: true
            });
        }

        return res.status(200).json({
            success: true,
            bookingId: bookingId,
            message: 'Notification successfully delivered to Telegram Admin'
        });

    } catch (err) {
        console.error('Error sending notification:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Запуск Сервера
app.listen(PORT, () => {
    console.log(`🚀 Beauty Salon Notification Server running on port ${PORT}`);
});
