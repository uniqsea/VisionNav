import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

import SearchBar from './SearchBar';
import RouteOptionsCard from './RouteOptionsCard';
import CurrentLocationButton from './CurrentLocationButton';
import HomeScreenBottom from './HomeScreenBottom';
import { GOOGLE_PLACES_API_KEY } from '@env';

export function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [traveledCoords, setTraveledCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<any[]>([]); // 保存步骤数据
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    // 实时跟踪用户位置
    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        if (isNavigating) {
            const startTracking = async () => {
                locationSubscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 1 },
                    (location) => {
                        const { latitude, longitude } = location.coords;
                        updateRegion(latitude, longitude);

                        // 更新已走过的路线
                        setTraveledCoords((prev) => [...prev, { latitude, longitude }]);

                        // 检查是否接近转弯点
                        checkTurn({ latitude, longitude });
                    }
                );
            };
            startTracking();
        }
        return () => {
            if (locationSubscription) locationSubscription.remove();
        };
    }, [isNavigating, currentStepIndex, steps]);

    const fetchCurrentLocation = async () => {
        const location = await fetchLocationCoords();
        if (location) {
            setRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    const fetchLocationCoords = async (): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'The app needs location permission to display the current location.');
                return null;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            return { latitude, longitude };
        } catch (error) {
            console.error('Error fetching current location:', error);
            Alert.alert('Location Error', 'An error occurred while fetching location information.');
            return null;
        }
    };

    const updateRegion = (latitude: number, longitude: number) => {
        mapRef.current?.animateToRegion(
            {
                latitude,
                longitude,
                latitudeDelta: region?.latitudeDelta || 0.01,
                longitudeDelta: region?.longitudeDelta || 0.01,
            },
            1000
        );
    };

    const handleMoveCamera = (coords: { latitude: number; longitude: number }) => {
        updateRegion(coords.latitude, coords.longitude);
    };

    const checkTurn = (currentCoords: { latitude: number; longitude: number }) => {
        if (steps.length > currentStepIndex) {
            const currentStep = steps[currentStepIndex];
            const { latitude, longitude } = currentStep.end_location;
            const distance = calculateDistance(currentCoords, { latitude, longitude });

            if (distance <= 10) {
                // 判断转向类型
                const direction = currentStep.maneuver?.includes('left') ? 'Left 0' : 'Right 1';
                console.log(direction);

                // 更新为下一步
                setCurrentStepIndex((prev) => prev + 1);
            }
        }
    };

    const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }) => {
        const R = 6371e3; // 地球半径，单位：米
        const φ1 = (coord1.latitude * Math.PI) / 180;
        const φ2 = (coord2.latitude * Math.PI) / 180;
        const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // 距离，单位：米
    };

    const handleDestinationSelect = async (place: { placeId: string; description: string }) => {
        try {
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
    };

    const onStartNavigation = (stepsData: any[]) => {
        setSteps(stepsData); // 设置步骤
        setCurrentStepIndex(0); // 从第一个步骤开始
        setTraveledCoords([]); // 清空已走过的路线
        setIsNavigating(true); // 开始导航

        // 视角移动到目的地
        if (destination) updateRegion(destination.latitude, destination.longitude);
    };

    return (
        <View style={styles.container}>
            {region && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    region={region}
                    showsUserLocation={true}
                >
                    {destination && <Marker coordinate={destination} title="Destination" />}
                    <Polyline coordinates={traveledCoords} strokeWidth={4} strokeColor="gray" />
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="rgb(0, 128, 255)" />
                </MapView>
            )}
            <SearchBar
                onSelectDestination={(place) => {
                    if (place === null) {
                        setRouteCoords([]);
                        setTraveledCoords([]);
                        setDestination(null);
                    } else {
                        handleDestinationSelect(place);
                    }
                }}
            />
            {destination && (
                <RouteOptionsCard
                    onClose={() => setDestination(null)}
                    origin={{ latitude: region!.latitude, longitude: region!.longitude }}
                    destination={destination}
                    onRouteSelected={(coords) => setRouteCoords(coords)}
                    onMoveCamera={handleMoveCamera}
                    onStartNavigation={onStartNavigation} // 传递导航开始逻辑
                />
            )}
            <CurrentLocationButton onPress={fetchCurrentLocation} />
            {!destination && region && (
                <HomeScreenBottom locationCoords={{ latitude: region.latitude, longitude: region.longitude }} />
            )}
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
