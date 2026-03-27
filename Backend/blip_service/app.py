import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from transformers import BlipForConditionalGeneration, BlipProcessor
import torch


MODEL_NAME = os.getenv("BLIP_MODEL", "Salesforce/blip-image-captioning-base")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

processor = BlipProcessor.from_pretrained(MODEL_NAME)
model = BlipForConditionalGeneration.from_pretrained(MODEL_NAME).to(DEVICE)

app = FastAPI(title="Local BLIP Service")


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "device": DEVICE}


@app.post("/caption")
async def caption(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt").to(DEVICE)
        generated = model.generate(**inputs, max_new_tokens=32)
        caption_text = processor.decode(generated[0], skip_special_tokens=True).strip()
        return {"caption": caption_text}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
