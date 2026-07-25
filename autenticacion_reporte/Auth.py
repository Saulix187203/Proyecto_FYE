import requests
import pandas as pd
import sqlite3
import os
from dotenv import load_dotenv

# Cargar variables desde .env
load_dotenv()
USER = os.getenv("API_USER")
PASSWORD = os.getenv("API_PASSWORD")

# Configuración
LOGIN_URL = "https://sisca.aletechgt.com/api/auth/login"
DATA_URL = "https://sisca.aletechgt.com/api/auth/me"
DB_FILE = "sisca_cache.db"

def get_token():
    """Genera un token nuevo desde la API"""
    payload = {"correo": USER, "password": PASSWORD}
    headers = {"accept": "application/json", "Content-Type": "application/json"}
    r = requests.post(LOGIN_URL, json=payload, headers=headers)
    r.raise_for_status()
    return r.json().get("token")

def fetch_data(token):
    """Obtiene datos protegidos usando el token"""
    headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}
    r = requests.get(DATA_URL, headers=headers)
    r.raise_for_status()
    return r.json()

def save_to_sqlite(df):
    """Guarda los datos en SQLite"""
    conn = sqlite3.connect(DB_FILE)
    df.to_sql("sisca_data", conn, if_exists="replace", index=False)
    conn.close()

def main():
    token = get_token()
    data = fetch_data(token)
    df = pd.json_normalize(data)
    save_to_sqlite(df)
    print("Datos actualizados en SQLite")

if __name__ == "__main__":
    main()
