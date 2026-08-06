# -*- coding: utf-8 -*-
"""
==============================================================================
BEAUTY SALON TELEGRAM BOT & NOTIFICATION SERVER (FULL PYTHON ENGINE)
==============================================================================
"""

import json
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

import os

BOT_TOKEN = "8927767792:AAE6psxCkP629RBs4w-qESssDORPTRbRpn4"
API_SECRET_KEY = "beauty_salon_super_secret_key_2026"
PORT = 3000

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "admin_config.json")

def load_admin_chat_id():
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("admin_chat_id")
    except Exception as e:
        print("Config load error:", e)
    return None

def save_admin_chat_id(chat_id):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump({"admin_chat_id": chat_id}, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Config save error:", e)

ADMIN_CHAT_ID = load_admin_chat_id()

bookings_db = {}

def send_telegram_api(method, payload):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"Telegram API Error ({method}): {e}")
        return None

def format_card_html(b):
    is_overtime = b.get('isOvertime', False)
    header = "<b>❓ ПОНАДУРОЧНИЙ ЗАПИС (ПІСЛЯ 20:00)</b>" if is_overtime else "<b>🆕 НОВА ЗАЯВКА НА БРОНЮВАННЯ</b>"
    
    phone = b.get('phone', 'Не вказано')
    clean_phone = "".join(filter(str.isdigit, phone))
    
    card = f"""
{header}
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Клієнт:</b> {b.get('clientName', 'Катерина')}
📞 <b>Телефон:</b> <a href="tel:{clean_phone}">{phone}</a>
💬 <b>Примітки:</b> <i>{b.get('notes', 'Без приміток')}</i>

💅 <b>Послуги:</b> {b.get('serviceName', 'Процедура beauty')}
⏱ <b>Тривалість:</b> ~{b.get('duration', 90)} хв
👑 <b>Майстер:</b> {b.get('masterName', 'Олена Соколова')}

📅 <b>Дата та Час:</b> <code>{b.get('date')}, о {b.get('time')}</code>
💰 <b>Вартість:</b> <b>{b.get('totalPrice', '950 грн')}</b>
"""
    if is_overtime:
        card += "\n⚠️ <i>Примітка: Процедура виходить за графік салону (після 20:00). Потрібне особисте узгодження.</i>\n"
    
    card += "\n━━━━━━━━━━━━━━━━━━━━━━\n<i>Отримано з онлайн-форми сайту</i>"
    return card

def generate_calendar_keyboard(year=2026, month=8):
    days_in_month = 31
    keyboard = []
    
    keyboard.append([
        {"text": "Пн", "callback_data": "ignore"},
        {"text": "Вт", "callback_data": "ignore"},
        {"text": "Ср", "callback_data": "ignore"},
        {"text": "Чт", "callback_data": "ignore"},
        {"text": "Пт", "callback_data": "ignore"},
        {"text": "Сб", "callback_data": "ignore"},
        {"text": "Нд", "callback_data": "ignore"}
    ])
    
    row = []
    for _ in range(5):
        row.append({"text": " ", "callback_data": "ignore"})
        
    for day in range(1, days_in_month + 1):
        day_prefix = f"{day:02d}"
        # Ищем 100% реальные записи с сайта на этот день
        has_bookings = any(b.get('date', '').startswith(day_prefix) or b.get('date', '').startswith(str(day)) for b in bookings_db.values())
        
        btn_text = f"{day}🟢" if has_bookings else str(day)
        row.append({"text": btn_text, "callback_data": f"cal_day:{day_prefix}"})
        
        if len(row) == 7:
            keyboard.append(row)
            row = []
            
    if row:
        while len(row) < 7:
            row.append({"text": " ", "callback_data": "ignore"})
        keyboard.append(row)
        
    keyboard.append([
        {"text": "◀️ Липень", "callback_data": "cal_month:prev"},
        {"text": "Вересень ▶️", "callback_data": "cal_month:next"}
    ])
    
    return {"inline_keyboard": keyboard}

def check_telegram_updates():
    global ADMIN_CHAT_ID
    offset = 0
    print("Telegram Polling Engine started...")
    
    bot_info = send_telegram_api("getMe", {})
    if bot_info and bot_info.get("ok"):
        bot_name = bot_info["result"].get("username", "BeautyBot")
        print(f"Connected Telegram Bot: @{bot_name}")
    
    while True:
        try:
            res = send_telegram_api("getUpdates", {"offset": offset, "timeout": 5})
            if res and res.get("ok"):
                for result in res.get("result", []):
                    offset = result["update_id"] + 1
                    
                    if "message" in result:
                        msg = result["message"]
                        chat_id = msg["chat"]["id"]
                        text = msg.get("text", "")
                        
                        if text.startswith("/start") or text == "7788":
                            ADMIN_CHAT_ID = chat_id
                            save_admin_chat_id(chat_id)
                            print(f"SUCCESS: Admin authenticated and saved! CHAT_ID: {ADMIN_CHAT_ID}")
                            
                            send_telegram_api("sendMessage", {
                                "chat_id": chat_id,
                                "text": "🎉 <b>Авторизацію успішно пройдено!</b>\n\nВаш Telegram акаунт прив'язано як головного адміністратора б'юті-студії «Колян». Тепер сюди миттєво надходитимуть усі нові заявки з сайту!",
                                "parse_mode": "HTML",
                                "reply_markup": {
                                    "keyboard": [
                                        [{"text": "🗓 Календар на місяць"}],
                                        [{"text": "📅 Записи на сьогодні"}, {"text": "📆 Записи на завтра"}],
                                        [{"text": "📊 Аналітика та виторг"}, {"text": "⚙️ Налаштування"}]
                                    ],
                                    "resize_keyboard": True
                                }
                            })
                        elif text == "📅 Записи на сьогодні":
                            matching = [b for b in bookings_db.values() if b.get('date', '').startswith('06') or b.get('date', '').startswith('6')]
                            msg_t = "📅 <b>ЗАПИСИ НА СЬОГОДНІ (06 Серпня):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n"
                            if matching:
                                for idx, b in enumerate(matching):
                                    msg_t += f"{idx + 1}. <code>{b.get('time')}</code> — <b>{b.get('clientName')}</b> ({b.get('serviceName')}) • {b.get('masterName')} — <b>{b.get('totalPrice')}</b>\n"
                            else:
                                msg_t += "<i>⚪️ На сьогодні активних записів з сайту немає. День вільний!</i>"
                            send_telegram_api("sendMessage", {"chat_id": chat_id, "text": msg_t, "parse_mode": "HTML"})

                        elif text == "📆 Записи на завтра":
                            matching = [b for b in bookings_db.values() if b.get('date', '').startswith('07') or b.get('date', '').startswith('7')]
                            msg_t = "📆 <b>ЗАПИСИ НА ЗАВТРА (07 Серпня):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n"
                            if matching:
                                for idx, b in enumerate(matching):
                                    msg_t += f"{idx + 1}. <code>{b.get('time')}</code> — <b>{b.get('clientName')}</b> ({b.get('serviceName')}) • {b.get('masterName')} — <b>{b.get('totalPrice')}</b>\n"
                            else:
                                msg_t += "<i>⚪️ На завтра активних записів з сайту немає. День вільний!</i>"
                            send_telegram_api("sendMessage", {"chat_id": chat_id, "text": msg_t, "parse_mode": "HTML"})

                        elif text == "🗓 Календар на місяць":
                            send_telegram_api("sendMessage", {
                                "chat_id": chat_id,
                                "text": "🗓 <b>РОЗКЛАД ТА КАЛЕНДАР ЗАПИСІВ (СЕРПЕНЬ 2026)</b>\n━━━━━━━━━━━━━━━━━━━━━━\n🟢 — Записи є\n⚪️ — Вільно\n\nОберіть потрібний день для перегляду деталей:",
                                "parse_mode": "HTML",
                                "reply_markup": generate_calendar_keyboard(2026, 8)
                            })

                        elif text == "📊 Аналітика та виторг":
                            cnt = len(bookings_db)
                            msg_t = f"📊 <b>РЕАЛЬНА АНАЛІТИКА СТУДІЇ:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n• Нових записів з сайту: <b>{cnt}</b>\n• Статус системи: <b>Активна 🟢</b>\n• Інтеграція: <b>Сайт ⚡ Telegram</b>"
                            send_telegram_api("sendMessage", {"chat_id": chat_id, "text": msg_t, "parse_mode": "HTML"})
                        elif text == "⚙️ Налаштування":
                            send_telegram_api("sendMessage", {"chat_id": chat_id, "text": "⚙️ <b>Налаштування:</b>\n• Сповіщення: УВІМКНЕНО 🔔\n• Секретний ключ API: Active 🔑", "parse_mode": "HTML"})

                    elif "callback_query" in result:
                        cb = result["callback_query"]
                        cb_id = cb["id"]
                        data = cb.get("data", "")
                        msg = cb.get("message", {})
                        chat_id = msg.get("chat", {}).get("id")
                        msg_id = msg.get("message_id")
                        
                        if data.startswith("cal_day:"):
                            day = data.split(":")[1]
                            day_num = str(int(day))
                            
                            # Фильтруем ТОЛЬКО настоящие живые записи клиентов с сайта
                            matching = [b for b in bookings_db.values() if b.get('date', '').startswith(day) or b.get('date', '').startswith(day_num)]
                            
                            day_text = f"📅 <b>РОЗКЛАД НА {day_num} СЕРПНЯ 2026:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n"
                            if matching:
                                for idx, b in enumerate(matching):
                                    is_ov = " ❓ (Понадурочно)" if b.get('isOvertime') else ""
                                    day_text += f"{idx + 1}. <code>{b.get('time')}</code> — <b>{b.get('clientName')}</b> ({b.get('serviceName')}) • {b.get('masterName')}{is_ov} — <b>{b.get('totalPrice')}</b>\n"
                            else:
                                day_text += "<i>⚪️ На цей день записів поки немає. День вільний для запису клієнток!</i>\n"
                                
                            day_text += "\n━━━━━━━━━━━━━━━━━━━━━━\n<i>Б'юті-студія «Колян» • Київ</i>"
                            
                            send_telegram_api("editMessageText", {
                                "chat_id": chat_id,
                                "message_id": msg_id,
                                "text": day_text,
                                "parse_mode": "HTML",
                                "reply_markup": {
                                    "inline_keyboard": [
                                        [{"text": "🔙 Назад до календаря", "callback_data": "show_calendar"}]
                                    ]
                                }
                            })
                            send_telegram_api("answerCallbackQuery", {"callback_query_id": cb_id})

                        elif data == "show_calendar":
                            send_telegram_api("editMessageText", {
                                "chat_id": chat_id,
                                "message_id": msg_id,
                                "text": "🗓 <b>РОЗКЛАД ТА КАЛЕНДАР ЗАПИСІВ (СЕРПЕНЬ 2026)</b>\n━━━━━━━━━━━━━━━━━━━━━━\n🟢 — Записи є\n⚪️ — Вільно\n\nОберіть потрібний день для перегляду деталей:",
                                "parse_mode": "HTML",
                                "reply_markup": generate_calendar_keyboard(2026, 8)
                            })
                            send_telegram_api("answerCallbackQuery", {"callback_query_id": cb_id})

                        elif data.startswith("confirm:"):
                            b_id = data.split(":")[1]
                            b = bookings_db.get(b_id, {})
                            b['status'] = '✅ ПІДТВЕРДЖЕНО'
                            
                            card_html = format_card_html(b)
                            card_html = card_html.replace("<b>🆕 НОВА ЗАЯВКА НА БРОНЮВАННЯ</b>", "<b>✅ ЗАПИС ПІДТВЕРДЖЕНО АДМІНІСТРАТОРОМ</b>")
                            card_html = card_html.replace("<b>❓ ПОНАДУРОЧНИЙ ЗАПИС (ПІСЛЯ 20:00)</b>", "<b>✅ ПОНАДУРОЧНИЙ ЗАПИС ПІДТВЕРДЖЕНО</b>")
                            
                            clean_phone = "".join(filter(str.isdigit, b.get('phone', '')))
                            send_telegram_api("editMessageText", {
                                "chat_id": chat_id,
                                "message_id": msg_id,
                                "text": card_html,
                                "parse_mode": "HTML",
                                "reply_markup": {
                                    "inline_keyboard": [
                                        [{"text": "📞 Зателефонувати клієнту", "url": f"tel:{clean_phone}"}]
                                    ]
                                }
                            })
                            send_telegram_api("answerCallbackQuery", {"callback_query_id": cb_id, "text": "✅ Запис успішно підтверджено!"})
                            
                        elif data.startswith("reject:"):
                            b_id = data.split(":")[1]
                            b = bookings_db.get(b_id, {})
                            b['status'] = '❌ СКАСОВАНО'
                            
                            card_html = format_card_html(b)
                            card_html = card_html.replace("<b>🆕 НОВА ЗАЯВКА НА БРОНЮВАННЯ</b>", "<b>❌ ЗАПИС СКАСОВАНО АДМІНІСТРАТОРОМ</b>")
                            
                            send_telegram_api("editMessageText", {
                                "chat_id": chat_id,
                                "message_id": msg_id,
                                "text": card_html,
                                "parse_mode": "HTML"
                            })
                            send_telegram_api("answerCallbackQuery", {"callback_query_id": cb_id, "text": "❌ Запис скасовано"})

        except Exception as e:
            pass
        time.sleep(1.5)

class BeautyNotificationHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_POST(self):
        if self.path == '/api/notifications/new-booking':
            auth_header = self.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '').strip()
            
            if token != API_SECRET_KEY:
                self._set_headers(403)
                self.wfile.write(json.dumps({"success": False, "error": "Forbidden"}).encode('utf-8'))
                return

            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                booking_data = json.loads(body_bytes.decode('utf-8'))
                booking_id = f"bk_{int(time.time())}"
                booking_data['id'] = booking_id
                bookings_db[booking_id] = booking_data
                
                print(f"New booking received: {booking_data.get('clientName')} - {booking_data.get('serviceName')}")
                
                if ADMIN_CHAT_ID:
                    card_html = format_card_html(booking_data)
                    clean_phone = "".join(filter(str.isdigit, booking_data.get('phone', '')))
                    
                    payload = {
                        "chat_id": ADMIN_CHAT_ID,
                        "text": card_html,
                        "parse_mode": "HTML",
                        "reply_markup": {
                            "inline_keyboard": [
                                [
                                    {"text": "✅ Підтвердити", "callback_data": f"confirm:{booking_id}"},
                                    {"text": "❌ Відхилити", "callback_data": f"reject:{booking_id}"}
                                ],
                                [
                                    {"text": "📞 Зателефонувати клієнту", "url": f"tel:{clean_phone}"}
                                ]
                            ]
                        }
                    }
                    send_telegram_api("sendMessage", payload)

                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "bookingId": booking_id}).encode('utf-8'))

            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

def run_server():
    threading.Thread(target=check_telegram_updates, daemon=True).start()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, BeautyNotificationHandler)
    print(f"Beauty Salon Notification Server running on port {PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
