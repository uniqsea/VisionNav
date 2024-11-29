import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import CameraComponent from '../../components/CameraComponent';
import { useFocusEffect } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

const CameraScreen = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const createFormData = (photo: { uri: string }) => {
    const data = new FormData();
    data.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
    } as any);
    return data;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
        console.log('satrted');

        const photo = await cameraRef.current.takePictureAsync({
            base64: true
        });
        try {
            if (photo) {
                console.log(photo.uri);
                const response = await fetch(
                    // `http://${ipAddress}:8000/predict_side_walk/`,
                    // 'http://localhost:8000/predict_side_walk/',
                    'http://10.192.94.190:8000/predict_side_walk/',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        body: createFormData(photo)
                        // body: photo.uri
                    }
                );
                const data = await response.json();
                console.log(data.result);
                setResult(data.result);
                const fileInfo = await FileSystem.getInfoAsync(photo.uri);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(photo.uri);
                    console.log('Photo deleted:', photo.uri);
                } else {
                    console.log('File does not exist:', photo.uri);
                }
            } else {
                console.log('No photo');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      console.log('CameraScreen is focused');
      let interval;

      interval = setInterval(() => {
        takePicture();
      }, 4 * 1000);
      return () => {
        // 屏幕失去焦点，清除定时器和相机引用
        if (interval) clearInterval(interval);
        if (cameraRef.current) {
          cameraRef.current = null;
        }
        console.log('CameraScreen is unfocused');
      };
    }, [permission?.granted])
  );

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    // 相机权限正在加载中
    return <View />;
  }
  return (
    <View style={styles.container}>
      <CameraComponent style={styles.camera} ref={cameraRef} />
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  resultContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  resultText: {
    fontSize: 24,
    color: 'white',
  },
});

export default CameraScreen;