import React from 'react';
import { Button } from 'react-native';

export default function SettingsButton({ onPress }) {
    return <Button title="Settings" onPress={onPress} />;
}
