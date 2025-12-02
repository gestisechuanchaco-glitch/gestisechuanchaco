import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

archivo = 'riesgo_establecimientos.csv'

# Lee el CSV usando punto y coma como separador
df = pd.read_csv(archivo, sep=';', on_bad_lines='skip')

print("Columnas detectadas:", df.columns.tolist())

# Quédate solo con las primeras 9 columnas relevantes
columnas_esperadas = [
    'fecha', 'expediente', 'razon_social', 'giro', 'area_m2', 'numero_pisos', 
    'horario_atencion', 'nivel_riesgo', 'vigencia'
]
df = df[columnas_esperadas]

# Normaliza los textos
df['giro'] = df['giro'].str.lower().str.strip()
df['horario_atencion'] = df['horario_atencion'].str.lower().str.strip()
df['nivel_riesgo'] = df['nivel_riesgo'].str.lower().str.strip()

# Codifica variables categóricas
df_encoded = pd.get_dummies(df, columns=['giro', 'horario_atencion'])

label_encoder = LabelEncoder()
df_encoded['nivel_riesgo_encoded'] = label_encoder.fit_transform(df_encoded['nivel_riesgo'])

# Selecciona variables para el modelo (quita las que no aportan)
X = df_encoded.drop(
    ['nivel_riesgo', 'nivel_riesgo_encoded', 'razon_social', 'expediente', 'fecha', 'vigencia'], 
    axis=1, errors="ignore"
)
y = df_encoded['nivel_riesgo_encoded']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Shape entrenamiento:", X_train.shape)
print("Shape prueba:", X_test.shape)
print("Clases de nivel_riesgo:", label_encoder.classes_)

# (Opcional) Guarda el dataset procesado
df_encoded.to_csv('riesgo_establecimientos_preprocesado.csv', index=False)