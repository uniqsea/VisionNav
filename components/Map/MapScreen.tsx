import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import SearchBar from './SearchBar';
import RouteOptionsCard from './RouteOptionsCard';
import CurrentLocationButton from './CurrentLocationButton';
import { GOOGLE_PLACES_API_KEY } from '@env';

const GOOGLE_PLACES_API_KEY = "test";

export function MapScreen() {
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region>({
        latitude: 56.172953020825375,
        longitude: 10.187886714211011,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const [destination, setDestination] = useState<null | { latitude: number; longitude: number }>(null);
    const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [showRouteOptions, setShowRouteOptions] = useState<boolean>(false);

    const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return false;
        }
        return true;
    };

    const updateRegion = (latitude: number, longitude: number) => {
        mapRef.current?.animateToRegion(
            {
                latitude,
                longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
            },
            1000
        );
    };

    const handleCurrentLocationPress = async () => {
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) return;

            const location = await Location.getCurrentPositionAsync({});
            updateRegion(location.coords.latitude, location.coords.longitude);
            console.log('Current location:', location);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch current location. Please try again.');
            console.error(error);
        }
    };

    const handleDestinationSelect = async (place: { placeId: string; description: string }) => {
        try {
            // 使用 Google Places API 的 Place Details 获取精确坐标
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {
                    params: {
                        place_id: place.placeId,
                        key: GOOGLE_PLACES_API_KEY,
                    },
                }
            );

            const result = response.data.result;
            if (result && result.geometry) {
                const { lat, lng } = result.geometry.location;
                const coord = { latitude: lat, longitude: lng };
                setDestination(coord);
                updateRegion(coord.latitude, coord.longitude);
            } else {
                Alert.alert('Error', 'Failed to fetch coordinates for the selected place.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch details for the selected place.');
            console.error(error);
        }

        // 延迟显示 RouteOptionsCard
        setTimeout(() => setShowRouteOptions(true), 500);
    };

    return (
        <View style={styles.container}>
            <MapView ref={mapRef} style={styles.map} region={region} showsUserLocation={true}>
                {destination && <Marker coordinate={destination} />}
                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeWidth={4}
                        strokeColor="rgba(0, 0, 255, 0.6)"
                        lineDashPattern={[1]}
                    />
                )}
            </MapView>
            <SearchBar onSelectDestination={handleDestinationSelect} />
            {showRouteOptions && destination && (
                <RouteOptionsCard
                    onClose={() => setShowRouteOptions(false)}
                    origin={{ latitude: region.latitude, longitude: region.longitude }}
                    destination={destination}
                    onRouteSelected={(coords) => setRouteCoords(coords)}
                />
            )}
            <CurrentLocationButton onPress={handleCurrentLocationPress} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MapScreen;
