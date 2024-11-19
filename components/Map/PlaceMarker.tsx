import React from 'react';
import { Marker } from 'react-native-maps';

interface PlaceMarkerProps {
    coordinate: { latitude: number; longitude: number };
    title: string;
}

export default function PlaceMarker({ coordinate, title }: PlaceMarkerProps) {
    return (
        <Marker coordinate={coordinate} title={title} />
    );
}
