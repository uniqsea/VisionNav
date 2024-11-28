import cv2
import numpy as np
import tensorflow as tf
from mqtt.mqtt_manager import mqtt_manager, LEFT_TOPIC, RIGHT_TOPIC

class SideWalkClassification:
    def __init__(
        self, model_path, classes, image_preprocessing_dimens, detection_threshold
    ):
        self.model = tf.keras.models.load_model(model_path)
        self.classes = classes
        self.image_preprocessing_dimens = image_preprocessing_dimens
        self.detection_threshold = detection_threshold

    def predict(self, image):
        preprocessed_frame = cv2.resize(
            image, self.image_preprocessing_dimens, interpolation=cv2.INTER_LINEAR
        )
        input_image = np.expand_dims(preprocessed_frame, axis=0)
        predictions = self.model.predict(input_image).tolist()[0]

        if max(predictions) >= self.detection_threshold:
            predicted_class = self.classes[np.argmax(predictions)]
        else:
            predicted_class = "Nothing Detected"

        return predicted_class


from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import cv2
import numpy as np

# from sidewalk_classification import SideWalkClassification

app = FastAPI()

classes = [
    "Left of Sidewalk",
    "Middle of Sidewalk",
    "Right of Sidewalk",
    "Nothing Detected",
]
model_path = "api/model/sidewalk_classification_model_vgg16_final.h5"
image_preprocessing_dimens = (100, 100)
detection_threshold = 0.5

classifier = SideWalkClassification(
    model_path, classes, image_preprocessing_dimens, detection_threshold
)

MESSAGE_CONFIG = {
    "Left of Sidewalk": {
        "message": {"freq": 10, "duty": 20, "duration": 1000},
        "topic": LEFT_TOPIC
    },
    "Right of Sidewalk": {
        "message": {"freq": 10, "duty": 20, "duration": 1000},
        "topic": RIGHT_TOPIC
    },
}

@app.post("/predict_side_walk/")
async def predict(file: UploadFile = File(...)):
    image = np.frombuffer(await file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    result = classifier.predict(image)
    if result == "Left of Sidewalk" or result == "Right of Sidewalk":
        mqtt_manager.publish_message(MESSAGE_CONFIG[result]["message"], MESSAGE_CONFIG[result]["topic"])

    return JSONResponse(content={"result": result})

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

# curl -X POST "http://0.0.0.0:8000/predict_side_walk/" -F "file=@api/image.png"
# curl -X POST "http://localhost:8000/predict_side_walk/" -F "file=@api/image.png"
