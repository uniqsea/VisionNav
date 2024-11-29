import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import React, { useImperativeHandle, forwardRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CameraComponent = forwardRef(({ style }, ref) => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView | null>(null);
    const [result, setResult] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        takePictureAsync: async (options) => {
          if (cameraRef.current) {
            return await cameraRef.current.takePictureAsync(options);
          }
          return null;
        },
      }));

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
});

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
export default CameraComponent;