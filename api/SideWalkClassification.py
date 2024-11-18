import cv2
import numpy as np
import tensorflow as tf


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

# 确保使用的是已经加载好的模型路径和类别
classes = [
    "Left of Sidewalk",
    "Middle of Sidewalk",
    "Right of Sidewalk",
    "Nothing Detected",
]
model_path = "api/model/sidewalk_classification_model_vgg16_final.h5"
image_preprocessing_dimens = (100, 100)
detection_threshold = 0.5

# 创建分类器实例
classifier = SideWalkClassification(
    model_path, classes, image_preprocessing_dimens, detection_threshold
)


@app.post("/predict_side_walk/")
async def predict(file: UploadFile = File(...)):
    image = np.frombuffer(await file.read(), np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    result = classifier.predict(image)
    return JSONResponse(content={"result": result})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

# curl -X POST "http://0.0.0.0:8000/predict_side_walk/" -F "file=@api/image.png"