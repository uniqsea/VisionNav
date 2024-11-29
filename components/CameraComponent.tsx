import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function App() {
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

    useEffect(() => {
        const interval = setInterval(() => {
            takePicture();
        }, 4 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.buttonContainer}>
                    {result && (
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultText}>{result}</Text>
                        </View>
                    )}
                    {/* <TouchableOpacity
                        style={styles.button}
                        onPress={toggleCameraFacing}
                    >
                        <Text style={styles.text}>Flip Camera</Text>
                    </TouchableOpacity> */}
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center'
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10
    },
    camera: {
        flex: 1
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center'
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white'
    },
    resultContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 5
    },
    resultText: {
        fontSize: 24,
        color: 'white'
    }
});
