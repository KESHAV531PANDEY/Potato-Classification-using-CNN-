import os
import io

import tensorflow as tf
import numpy as np
from PIL import Image

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --------------------------------------------------
# Class Names (must be the SAME order as training)
# --------------------------------------------------
CLASS_NAMES = [
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy"
]

# --------------------------------------------------
# FastAPI
# --------------------------------------------------
app = FastAPI(title="Potato Disease Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Load Model
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "potato_model.keras")

print("Loading Model:", MODEL_PATH)

MODEL = tf.keras.models.load_model(MODEL_PATH)

# --------------------------------------------------
# Home
# --------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "Potato Disease Classification API Running"
    }

# --------------------------------------------------
# Predict
# --------------------------------------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:

        if not file.content_type.startswith("image/"):
            return {
                "success": False,
                "error": "Upload an image."
            }

        contents = await file.read()

        image = Image.open(io.BytesIO(contents))

        image = image.convert("RGB")

        image = image.resize((256,256))

        image_array = np.array(image, dtype=np.float32)

        # IMPORTANT:
        # DO NOT divide by 255
        # because your model already has Rescaling(1./255)

        image_array = np.expand_dims(image_array, axis=0)

        prediction = MODEL.predict(image_array, verbose=0)

        predicted_index = np.argmax(prediction[0])

        predicted_class = CLASS_NAMES[predicted_index]

        confidence = float(np.max(prediction[0])) * 100

        return {
            "success": True,
            "prediction": {
                "class": predicted_class,
                "confidence": round(confidence,2)
            }
        }

    except Exception as e:

        print(e)

        return {
            "success": False,
            "error": str(e)
        }

# --------------------------------------------------
# Run
# --------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8001,
        reload=True
    )
    