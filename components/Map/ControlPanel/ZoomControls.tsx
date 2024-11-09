import React from 'react';
import { View, Button } from 'react-native';

export default function ZoomControls({ onZoomIn, onZoomOut }) {
    return (
        <View style={{ flexDirection: 'row' }}>
            <Button title="+" onPress={onZoomIn} />
            <Button title="-" onPress={onZoomOut} />
        </View>
    );
}
