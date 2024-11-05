import React from 'react';
import { Marker } from 'react-native-maps';

export default function PlaceMarker({ coordinate, title }) {
    return (
        <Marker coordinate={coordinate} title={title} />
    );
}
