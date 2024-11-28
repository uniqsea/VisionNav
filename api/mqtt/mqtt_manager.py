import paho.mqtt.client as mqtt_client
import ssl
import random
import time
import json
import argparse
from typing import Optional, Dict, Any

CLIENT_ID = f"python-mqtt-pub-{random.randint(0, 4095)}"
BROKER = "myggen.mooo.com"
PORT = 8883
LEFT_TOPIC = "IvyVine/left"
RIGHT_TOPIC = "IvyVine/right"
class MqttManager:
    def __init__(
        self,
        broker: str = BROKER,
        port: int = PORT,
        client_id: str = CLIENT_ID,
        username: str = "",
        password: str = "",
        topic: str = "test"
    ):
        self.broker = broker
        self.port = port
        self.client_id = client_id
        self.username = username
        self.password = password
        self.topic = topic
        self.client: Optional[mqtt_client.Client] = None
        self.is_connected = False

    def connect(self) -> bool:
        try:
            def on_connect(_client, _userdata, _flags, return_code, _properties):
                if return_code == 0:
                    print("Connected to MQTT Broker!")
                    self.is_connected = True
                else:
                    print(f"Failed to connect, return code {return_code}")
                    self.is_connected = False

            self.client = mqtt_client.Client(
                callback_api_version=mqtt_client.CallbackAPIVersion.VERSION2,
                client_id=self.client_id,
            )
            self.client.username_pw_set(self.username, self.password)
            self.client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2, cert_reqs=ssl.CERT_NONE)
            self.client.on_connect = on_connect
            self.client.connect(self.broker, self.port)
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def publish_message(self, message: Dict[str, Any], topic: str = None) -> bool:
        if not self.is_connected or not self.client:
            print("Not connected to MQTT broker")
            return False

        try:
            used_topic = topic or self.topic
            result = self.client.publish(used_topic, json.dumps(message))
            if result.rc == 0:
                print(f"Message published to {used_topic}")
                return True
            else:
                print(f"Failed to publish message, return code: {result.rc}")
                return False
        except Exception as e:
            print(f"Publishing error: {e}")
            return False

    def disconnect(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
            print("Disconnected from MQTT broker")

import os
import argparse
import paho.mqtt.client as mqtt_client

# 从环境变量获取凭据
def get_credentials():
    username = os.getenv('USER_NAME')
    password = os.getenv('PASSWORD')
    
    if not username or not password:
        raise ValueError("env USER_NAME and PASSWORD misiing")
    
    return username, password

try:
    username, password = get_credentials()
    mqtt_manager = MqttManager(
        username=username,
        password=password,
    )
    mqtt_manager.connect()
    
    while not mqtt_manager.is_connected:
        pass

    test_message = {
        "freq": 10,
        "duty": 50,
        "duration": 1000
    }
    mqtt_manager.publish_message(test_message)
except ValueError as e:
    print(f"error: {e}")

if __name__ == "__main__":
    try:
        username, password = get_credentials()
        fake_mqtt_manager = MqttManager(
            username=username,
            password=password,
        )
        fake_mqtt_manager.connect()
        
        while not fake_mqtt_manager.is_connected:
            pass

        test_message = {
            "freq": 10,
            "duty": 50,
            "duration": 1000
        }
        fake_mqtt_manager.publish_message(test_message)
        
        fake_mqtt_manager.disconnect()
    except ValueError as e:
        print(f"error: {e}")