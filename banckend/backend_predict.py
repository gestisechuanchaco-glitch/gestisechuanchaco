from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app) 

modelo = joblib.load("modelo_riesgo.pkl")

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
    app.run(port=5000, debug=True)