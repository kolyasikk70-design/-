-- Cloudflare D1 Database Schema for Beauty Salon Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    master_id TEXT NOT NULL,
    master_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT,
    is_overtime INTEGER DEFAULT 0,
    status TEXT DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_master ON bookings(date, master_id);
