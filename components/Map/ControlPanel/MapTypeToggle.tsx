import React, { useState } from 'react';
import { Button } from 'react-native';

export default function MapTypeToggle({ onToggle }) {
    const [type, setType] = useState('standard');

    const toggleType = () => {
        const newType = type === 'standard' ? 'satellite' : 'standard';
        setType(newType);
        onToggle(newType);
    };

    return <Button title="Toggle Map Type" onPress={toggleType} />;
}
