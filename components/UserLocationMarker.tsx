import React, { useState, useEffect } from 'react';
import { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function UserLocationMarker() {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let userLocation = await Location.getCurrentPositionAsync({});
                setLocation(userLocation.coords);
            }
        })();
    }, []);

    return location ? (
        <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="You are here"
        />
    ) : null;
}
