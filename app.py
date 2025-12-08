import sqlite3

conn = sqlite3.connect("example.db")

cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               name TEXT NOT NULL,
               age INTEGER,
               email TEXT UNIQUE
               )
               """)


def add_user():
    cursor.execute(
        "INSERT INTO users (name, age, email) VALUES (?, ?, ?)",
        ("m", 10, "alice@exaaample.com")

    )


add_user()

cursor.execute("SELECT id, name, age, email FROM users")
rows = cursor.fetchall()
for row in rows: print(row)

conn.commit()
conn.close()