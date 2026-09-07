# 🥔 Potato Disease Classification (CNN)

A deep learning system that classifies potato leaf images as **Early Blight**, **Late Blight**, or **Healthy**, served through a FastAPI backend with a React frontend — built to help catch crop disease early using computer vision instead of manual inspection.

## Overview

Potato crops are highly vulnerable to blight, and early detection can be the difference between a treatable outbreak and a lost harvest. This project trains a Convolutional Neural Network (CNN) on the PlantVillage dataset to classify leaf images into three categories, serves predictions through a FastAPI backend, and provides a React-based interface for uploading images.

## Key Results

- **96% test accuracy** across all three classes
- Classes (as returned by the API): `Potato___Early_blight` · `Potato___Late_blight` · `Potato___healthy`

## Tech Stack

| Layer | Tools |
|---|---|
| Model | TensorFlow 2.19 / Keras CNN (with a built-in `Rescaling(1./255)` layer) |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19 + Vite, lucide-react |
| Supporting libs | NumPy, Pillow, Matplotlib |

## How It Works

1. User uploads a leaf image through the React frontend
2. The FastAPI `/predict` endpoint reads the image, converts it to RGB, and resizes it to 256×256 (the model handles pixel rescaling internally, so no manual normalization is applied in the API layer)
3. The loaded Keras model (`potato_model.keras`) predicts class probabilities
4. The predicted class and confidence score are returned as JSON

## API

**`GET /`** — health check
```json
{ "message": "Potato Disease Classification API Running" }
```

**`POST /predict`** — multipart form upload, field name `file`
```json
{
  "success": true,
  "prediction": {
    "class": "Potato___Early_blight",
    "confidence": 96.42
  }
}
```

## Running Locally

Backend:
```bash
cd Api
pip install -r ../requirements.txt
python main.py
# runs at http://127.0.0.1:8001
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Model & Training

The model (`potato_model.keras`) is trained on the PlantVillage dataset across the three classes above, with a built-in `Rescaling(1./255)` layer so raw pixel values feed directly into the network.

*(The training script/notebook that produced this model isn't in the repo yet — adding it, along with your architecture, augmentation, and regularization choices, is the single best thing you could add here. It's the part that actually demonstrates the ML work behind the 96% number.)*

## Results

| Metric | Value |
|---|---|
| Test Accuracy | 96% |

## Future Improvements

- [ ] Add the training notebook/script to the repo
- [ ] Reconcile CORS config with actual deployment target
- [ ] Add a confusion matrix / per-class precision & recall

## Author

**Keshav Kumar** — [GitHub](https://github.com/KESHAV531PANDEY)
