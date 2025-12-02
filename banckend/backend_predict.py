from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import sys
import io

# Configurar encoding para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

app = Flask(__name__)
# Configurar CORS para permitir ngrok y GitHub Pages
CORS(app, origins=[
    'https://gestisechuanchaco-glitch.github.io',
    'https://touchedly-unbegrudged-natividad.ngrok-free.dev',
    'http://localhost:4200',
    'http://localhost:3000'
])

# Mensaje de inicio (sin emojis para compatibilidad con Windows)
print("=" * 50)
print("SERVIDOR DE PREDICCION DE RIESGO (Python)")
print("=" * 50)

try:
    modelo = joblib.load("modelo_riesgo.pkl")
    print("[OK] Modelo de riesgo cargado correctamente")
except Exception as e:
    print(f"[ERROR] Error al cargar modelo: {e}")
    sys.exit(1)

@app.route('/predict_riesgo', methods=['POST'])
def predict_riesgo():
    data = request.json

    df_nuevo = pd.DataFrame([{
        'giro': data['giro'].lower(),
        'area_m2': float(data['area_ocupada']),
        'numero_pisos': int(data['num_pisos']),
        'horario_atencion': data['horario_atencion'].lower(),
    }])

    df_encoded = pd.get_dummies(df_nuevo)
    for col in modelo.feature_names_in_:
        if col not in df_encoded.columns:
            df_encoded[col] = 0
    df_encoded = df_encoded[modelo.feature_names_in_]

    pred = modelo.predict(df_encoded)[0]
    probs = modelo.predict_proba(df_encoded)[0]

    confiabilidad_ml = float(max(probs))  

    niveles = {0: "ALTO", 1: "MEDIO", 2: "MUY ALTO"}
    return jsonify({
        "nivel_riesgo": niveles.get(pred, "NO CLASIFICADO"),
        "confiabilidad_ml": confiabilidad_ml
    })

if __name__ == '__main__':
    print("[INICIO] Iniciando servidor Flask en puerto 5000...")
    print("[INFO] Endpoint disponible: http://localhost:5000/predict_riesgo")
    print("=" * 50)
    app.run(port=5000, debug=False, use_reloader=False)