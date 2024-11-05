import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { Camera } from 'expo-camera'

export default function CameraComponent() {
    const [hasPermission, setHasPermission] = useState(null)
    const [cameraRef, setCameraRef] = useState(null)

    useEffect(() => {
        ;(async () => {
            const { status } = await Camera.requestCameraPermissionsAsync()
            setHasPermission(status === 'granted')
        })()
    }, [])

    const takePicture = async () => {
        if (cameraRef) {
            const photo = await cameraRef.takePictureAsync()
            console.log(photo)
        }
    }

    if (hasPermission === null) {
        return <View />
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>
    }

    return (
        <View style={styles.container}>
            <Camera style={styles.camera} ref={ref => setCameraRef(ref)}>
                <View style={styles.buttonContainer}>
                    <Button title="Take Picture" onPress={takePicture} />
                </View>
            </Camera>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    camera: {
        flex: 1
    },
    buttonContainer: {
        flex: 0.1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center'
    }
})
