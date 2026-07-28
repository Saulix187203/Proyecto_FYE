import re
import requests
import pandas as pd
import os
from dotenv import load_dotenv

# Ruta específica al .env si no está en la misma carpeta
env_path = r"C:\Users\Saulo\Documents\FYE\autenticacion_reporte\.env"
load_dotenv(dotenv_path=env_path)

USER = os.getenv("API_USER")
PASSWORD = os.getenv("API_PASSWORD")

LOGIN_URL = "https://sisca.aletechgt.com/api/auth/login"
ENDPOINTS = [
    "https://sisca.aletechgt.com/api/dashboard/resumen",
    "https://sisca.aletechgt.com/api/dashboard/casos-por-estado",
    "https://sisca.aletechgt.com/api/dashboard/casos-por-area",
    "https://sisca.aletechgt.com/api/dashboard/casos-por-criticidad",
    "https://sisca.aletechgt.com/api/dashboard/acciones-vencidas",
    "https://sisca.aletechgt.com/api/dashboard/ultimos-casos",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/resumen",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/casos-por-region",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/casos-por-departamento",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/casos-por-brigada",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/integrantes-por-brigada",
    "https://sisca.aletechgt.com/api/dashboard/brigadas/casos-abiertos-por-brigada",
    "https://sisca.aletechgt.com/api/brigadas",
    "https://sisca.aletechgt.com/api/acciones-correctivas",
    "https://sisca.aletechgt.com/api/casos",
    "https://sisca.aletechgt.com/api/catalogos/areas",
    "https://sisca.aletechgt.com/api/catalogos/procesos",
    "https://sisca.aletechgt.com/api/catalogos/tipos-evento",
    "https://sisca.aletechgt.com/api/catalogos/criticidades",
    "https://sisca.aletechgt.com/api/catalogos/estados-caso",
    "https://sisca.aletechgt.com/api/catalogos/estados-accion",
    "https://sisca.aletechgt.com/api/catalogos/regiones",
    "https://sisca.aletechgt.com/api/catalogos/tipos-brigada",
    "https://sisca.aletechgt.com/api/catalogos/departamentos",
    "https://sisca.aletechgt.com/api/catalogos/municipios"
]

# Login y token
payload = {"correo": USER, "password": PASSWORD}
headers = {"accept": "application/json", "Content-Type": "application/json"}
login_response = requests.post(LOGIN_URL, json=payload, headers=headers)
login_response.raise_for_status()

resp = login_response.json()
token = resp["data"]["token"]

# Datos protegidos
data_headers = {"Authorization": f"Bearer {token}", "accept": "application/json"}

# Carpeta para guardar las tablas generadas para Power BI
output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "powerbi_tables")
os.makedirs(output_dir, exist_ok=True)

# Tablas auxiliares que no deben exponerse a Power BI
EXCLUDED_TABLES = {"datasheet", "df", "frame", "df_data"}


def normalize_payload_to_dataframe(payload):
    if isinstance(payload, dict):
        if "datasheet" in payload:
            payload = payload["datasheet"]
        elif "data" in payload:
            payload = payload["data"]
        elif "records" in payload:
            payload = payload["records"]
        elif len(payload) == 1:
            only_value = next(iter(payload.values()))
            if isinstance(only_value, (list, dict)):
                payload = only_value

    if isinstance(payload, list):
        try:
            return pd.json_normalize(payload)
        except Exception:
            return pd.DataFrame(payload)

    if isinstance(payload, dict):
        if payload and all(isinstance(v, list) for v in payload.values()):
            return pd.DataFrame(payload)
        return pd.json_normalize(payload)

    return pd.DataFrame([{"value": payload}])


def build_table_name(url):
    path = url.split("/api/", 1)[-1] if "/api/" in url else url.rstrip("/")
    segments = [segment for segment in path.split("/") if segment]
    normalized_segments = [re.sub(r"[^0-9A-Za-z]+", "_", segment).strip("_") for segment in segments]
    table_name = "_".join([segment for segment in normalized_segments if segment])
    return table_name or "endpoint"


# Crear una variable pandas por cada endpoint
used_table_names = set()
for url in ENDPOINTS:
    data_response = requests.get(url, headers=data_headers, timeout=60)
    data_response.raise_for_status()
    payload = data_response.json()

    base_table_name = build_table_name(url)
    table_name = base_table_name
    suffix = 1

    if table_name in EXCLUDED_TABLES:
        continue

    while table_name in used_table_names or table_name in globals():
        table_name = f"{base_table_name}_{suffix}"
        suffix += 1

    used_table_names.add(table_name)
    globals()[table_name] = normalize_payload_to_dataframe(payload)
    json_path = os.path.join(output_dir, f"{table_name}.json")
    globals()[table_name].to_json(json_path, orient="records", indent=2, force_ascii=False)


#exec(open(r"C:\Users\Saulo\Documents\FYE\autenticacion_reporte\Auth.py").read())
