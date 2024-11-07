import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

import { useNavigation } from '@react-navigation/native'; // 导入导航

export default function TabTwoScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const navigation = useNavigation();

    const handleCameraAccess = () => {
        if (hasPermission === null) {
            Alert.alert('请求相机权限中...');
        } else if (hasPermission === false) {
            Alert.alert('没有相机权限');
        } else {
            navigation.navigate('CameraScreen');
            Alert.alert('进入相机页面');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tab Two</Text>
            <View
                style={styles.separator}
                lightColor="#eee"
                darkColor="rgba(255,255,255,0.1)"
            />
            <EditScreenInfo path="app/(tabs)/two.tsx" />

            {/* 相机按钮 */}
            <Button title="Go to Camera" onPress={handleCameraAccess} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%'
    }
});
