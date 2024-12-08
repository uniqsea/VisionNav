import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface CurrentLocationButtonProps {
    onPress: () => void;
}

export function CurrentLocationButton({ onPress }: CurrentLocationButtonProps) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            {/* <FontAwesome name="location-arrow" size={26} color="rgb(0, 128, 255)" /> */}
            <MaterialIcons name="my-location" size={24} color="rgb(0, 128, 255)" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        bottom: 150,
        right: 20,
        backgroundColor: 'white', // 圆形背景颜色
        padding: 10,
        borderRadius: 30, // 将这个值设为宽度或高度的一半，形成圆形
        width: 55, // 设置圆形的宽度
        height: 55, // 设置圆形的高度
        justifyContent: 'center', // 居中图标
        alignItems: 'center', // 居中图标
        elevation: 3, // 添加阴影效果
    },
});

export default CurrentLocationButton;
