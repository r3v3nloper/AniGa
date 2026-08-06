const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(process.env.DATA_DIR || __dirname, 'aniga.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    token_version INTEGER DEFAULT 0,
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
    FOREIGN KEY (media_id) REFERENCES media_entries(id) ON DELETE CASCADE,
    UNIQUE(user_id, media_id)
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS collection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    list_entry_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (list_entry_id) REFERENCES user_list(id) ON DELETE CASCADE,
    UNIQUE(collection_id, list_entry_id)
  );

  CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_list_user_id ON user_list(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_list_media_id ON user_list(media_id);
  CREATE INDEX IF NOT EXISTS idx_media_entries_mal_id ON media_entries(mal_id);
  CREATE INDEX IF NOT EXISTS idx_media_entries_type ON media_entries(type);
  CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
  CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
  CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
  CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
  CREATE INDEX IF NOT EXISTS idx_collection_items_entry ON collection_items(list_entry_id);
`);

// Migrations for existing databases (no-op when the column already exists)
function addColumnIfMissing(table, columnDef)
{
  try
  {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  }
  catch
  {
    // Column already exists
  }
}

addColumnIfMissing('users', 'is_admin INTEGER DEFAULT 0');
addColumnIfMissing('users', 'token_version INTEGER DEFAULT 0');
addColumnIfMissing('user_list', 'owned INTEGER DEFAULT 0');
addColumnIfMissing('user_list', 'owned_volumes INTEGER DEFAULT 0');

// Seed admin user if not exists
const adminEmail = process.env.ADMIN_EMAIL || 'admin@aniga.local';
const adminPassword = process.env.ADMIN_PASSWORD;
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!adminExists && adminPassword)
{
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)')
    .run('admin', adminEmail, hash);
  console.log(`Admin-Benutzer angelegt (${adminEmail})`);
}

module.exports = db;
