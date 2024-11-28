# MqttServer.py

from fastapi import FastAPI
from pydantic import BaseModel
from mqtt.mqtt_manager import mqtt_manager
import os

app = FastAPI()


# 定义消息模型
class Message(BaseModel):
    freq: int
    duty: int
    duration: int
    topic: str


# 从环境变量中获取 MQTT 凭据
def get_credentials():
    username = os.getenv("USER_NAME")
    password = os.getenv("PASSWORD")

    if not username or not password:
        raise ValueError("环境变量 USER_NAME 和 PASSWORD 必须设置")

    return username, password


# 初始化 MQTT 管理器
username, password = get_credentials()


@app.post("/publish/")
async def publish_message(message: Message):
    # 将消息转换为字典
    msg_dict = {
        "freq": message.freq,
        "duty": message.duty,
        "duration": message.duration
    }
    topic = message.topic
    print("Received message:", topic)
    # 发布消息
    success = mqtt_manager.publish_message(msg_dict, topic)
    if success:
        return {"status": "success", "message": "Message published successfully"}
    else:
        return {"status": "failed", "message": "Failed to publish message"}
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

# curl -X POST "http://localhost:8003/publish/" \
# -H "Content-Type: application/json" \                                  
# -d '{"freq": 10, "duty": 50, "duration": 1000, "topic": "IvyVine/nav"}'
# {"status":"success","message":"Message published successfully"}% 