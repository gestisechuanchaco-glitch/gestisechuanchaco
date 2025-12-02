import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import joblib

# Lee el archivo procesado
df = pd.read_csv("riesgo_establecimientos_preprocesado.csv")

# Selecciona X, y
y = df["nivel_riesgo_encoded"]
X = df.drop(["nivel_riesgo", "nivel_riesgo_encoded", "razon_social", "expediente", "fecha", "vigencia"], axis=1, errors="ignore")

# Divide en train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entrena el modelo
clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)

# Predicciones y evaluación
y_pred = clf.predict(X_test)
print("Reporte de clasificación:\n", classification_report(y_test, y_pred))
print("Matriz de confusión:\n", confusion_matrix(y_test, y_pred))

# Guarda el modelo entrenado
joblib.dump(clf, "modelo_riesgo.pkl")
print("Modelo guardado como modelo_riesgo.pkl")