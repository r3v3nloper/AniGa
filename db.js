const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'aniga.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mal_id INTEGER,
    source TEXT DEFAULT 'jikan',
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    title_english TEXT,
    title_japanese TEXT,
    image_url TEXT,
    synopsis TEXT,
    media_status TEXT,
    episodes INTEGER,
    chapters INTEGER,
    volumes INTEGER,
    api_score REAL,
    genres TEXT,
    year INTEGER,
    season TEXT,
    is_manual INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mal_id, type, source)
  );

  CREATE TABLE IF NOT EXISTS user_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    list_status TEXT NOT NULL DEFAULT 'plan_to_watch',
    current_episode INTEGER DEFAULT 0,
    current_chapter INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 0,
    user_score INTEGER,
    notes TEXT,
    started_at TEXT,
    completed_at TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_entries(id),
    UNIQUE(user_id, media_id)
  );
`);

module.exports = db;
