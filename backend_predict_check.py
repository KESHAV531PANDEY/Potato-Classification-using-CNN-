import os
import numpy as np
from PIL import Image
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CANDIDATE_MODELS = [
    os.path.join(BASE_DIR, 'potato_model.keras'),
    os.path.join(BASE_DIR, '1.keras'),
]
DATA_DIR = os.path.join(BASE_DIR, 'PlantVillage')
CLASS_NAMES = ['Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy']

MODEL_PATH = None
for m in CANDIDATE_MODELS:
    if os.path.exists(m):
        MODEL_PATH = m
        break

if MODEL_PATH is None:
    raise FileNotFoundError(f"No model file found. Checked: {CANDIDATE_MODELS}")

print('Loading model from', MODEL_PATH)
model = tf.keras.models.load_model(MODEL_PATH)
for cname in CLASS_NAMES:
    class_dir = os.path.join(DATA_DIR, cname)
    files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print('\n===', cname, 'sample', len(files))
    for file_name in sorted(files)[:5]:
        img_path = os.path.join(class_dir, file_name)
        image = Image.open(img_path).convert('RGB').resize((256, 256))
        arr = np.array(image, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)
        pred = model.predict(arr, verbose=0)[0]
        idx = int(np.argmax(pred))
        conf = float(np.max(pred)) * 100
        print(file_name, '->', CLASS_NAMES[idx], f'{conf:.2f}%')
