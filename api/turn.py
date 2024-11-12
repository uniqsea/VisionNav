import cv2
import tensorflow as tf
import numpy as np
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from utils.circularBuffer import CircularBuffer

app = FastAPI()

labels = ["Left Turn", "No Turn", "Right Turn"]
model_path = "assets/model/turn_classification_model_final_v1.h5"
readings_buffer_size = 20
image_preprocessing_dimens = (100, 100)
detection_threshold = 0.5


class TurnClassification:

    def __init__(self):
        self.model = tf.keras.models.load_model(model_path)
        self.readings_buffer = CircularBuffer(
            readings_buffer_size, noneOverridePercent=0.5
        )

    def perform_inference(self, image):
        preprocessed_frame = cv2.resize(
            image, image_preprocessing_dimens, interpolation=cv2.INTER_LINEAR
        )
        preprocessed_frame = np.expand_dims(preprocessed_frame, 0)
        feedforward_result = self.model.predict(preprocessed_frame).tolist()[0]
        self.readings_buffer.add(
            None
            if feedforward_result == None
            or max(feedforward_result) < detection_threshold
            else feedforward_result
        )
        averaged_result = self.readings_buffer.mean()
        return (
            "No Turn" if averaged_result is None else labels[np.argmax(averaged_result)]
        )


turn_classifier = TurnClassification()


@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    image = np.frombuffer(await file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    result = turn_classifier.perform_inference(image)
    return {"result": result}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
