from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import io
from dataclasses import dataclass
from typing import List, Tuple
import cv2
import numpy as np
from ultralytics import YOLO


@dataclass
class Detection:
    class_name: str
    confidence: float
    bbox: List[int]

    @property
    def center_x(self) -> float:
        return (self.bbox[0] + self.bbox[2]) / 2

    @property
    def center_y(self) -> float:
        return (self.bbox[1] + self.bbox[3]) / 2

    def get_avoidance_direction(self, image_width: int) -> str:
        left_threshold = image_width * 0.4
        right_threshold = image_width * 0.6
        
        if self.center_x < left_threshold:
            return "Detour to the right."
        elif self.center_x > right_threshold:
            return "Detour to the left."
        else:
            return "Detour to the left." if self.center_x > image_width/2 else "Detour to the right."

    def is_obstacle(self, image_width: int, image_height: int) -> bool:
        box_area = (self.bbox[2] - self.bbox[0]) * (self.bbox[3] - self.bbox[1])

        box_proportion = box_area / (image_width * image_height)
        distance = 1 / box_proportion

        if distance > 2.0:
            return False

        if not (image_width * 0.4 < self.center_x < image_width * 0.6):
            return False

        return True


class ObjectDetector:
    def __init__(self, model_path: str = "yolov8n.pt"):
        self.model = YOLO(model_path)

    def process_image(self, image_path: str) -> Tuple[np.ndarray, List[Detection]]:
        image = cv2.imread(image_path)
        return self.detect(image)

    def detect(self, image: np.ndarray) -> Tuple[np.ndarray, List[Detection]]:
        results = self.model(image)
        detection_results = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = r.names[cls]

                detection = Detection(
                    class_name=class_name, confidence=conf, bbox=[x1, y1, x2, y2]
                )
                is_obstacle = detection.is_obstacle(image.shape[1], image.shape[0])
                detection_results.append(
                    {
                        "class": detection.class_name,
                        "confidence": float(detection.confidence),
                        "bbox": detection.bbox,
                        "is_obstacle": is_obstacle,
                        "avoidance_direction": detection.get_avoidance_direction(image.shape[1]) if is_obstacle else "None"
                    }
                )

        return JSONResponse(
            content={
                "detections": detection_results,
                "total_objects": len(detection_results),
            }
        )


def main():
    detector = ObjectDetector()

    image_path = "api/image2.png"
    detections = detector.process_image(image_path)
    print(detections.body)


if __name__ == "__main__":
    main()
