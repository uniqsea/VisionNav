import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SearchBar from './SearchBar';
import RouteOptionsCard from './RouteOptionsCard';
import CurrentLocationButton from './CurrentLocationButton';
import HomeScreenBottom from './HomeScreenBottom';
import NavigationCard from './NavigationCard'; // 引入新的导航卡片组件
import ENV from '../../map_env';
import { getDistance } from 'geolib';
import { set } from 'lodash';


export function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [traveledCoords, setTraveledCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<any[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentInstruction, setCurrentInstruction] = useState<string>(''); // 当前步骤指令
    const [currentHtmlInstruction, setCurrentHtmlInstruction] = useState<string>(''); // 当前步骤指令（HTML 格式）
    const searchBarRef = useRef<{ clear: () => void } | null>(null);
    const routeOptionsCardRef = useRef<{ handleCompleteNavigation: () => void } | null>(null);

    const clearSearch = () => {
        console.log('Search clearing...'); // 调试日志
        if (searchBarRef.current) {
            console.log('Search clearing1...'); // 调试日志
            searchBarRef.current.clear();  // 调用 SearchBar 中的 clear 方法
            console.log('Search clearing2...'); // 调试日志
        }
    };

    useEffect(() => {
        fetchCurrentLocation();
    }, []);
    useEffect(() => {
        console.log('Destination updated:', destination);
    }, [destination]);

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        let timer: NodeJS.Timeout | null = null;

        console.log('isNavigating1:', isNavigating); // 调试日志

        if (isNavigating) {
            const startTracking = async () => {
                // 开始位置追踪
                locationSubscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 1 },
                    (location) => {
                        const { latitude: locLat, longitude: locLng } = location.coords;
                        updateRegion(locLat, locLng);

                        // 更新已走过的路线
                        setTraveledCoords((prev) => [...prev, { latitude: locLat, longitude: locLng }]);

                        // 更新当前位置
                        setLatitude(locLat);
                        setLongitude(locLng);
                    }
                );

                // 每隔一秒获取当前位置，更新状态
                timer = setInterval(async () => {
                    try {
                        const location = await Location.getCurrentPositionAsync({});
                        const { latitude: locLat, longitude: locLng } = location.coords;
                        console.log('Current location:', locLat, locLng); // 调试日志
                        setLatitude(locLat);
                        setLongitude(locLng);
                    } catch (error) {
                        console.error('Error getting location:', error);
                    }
                }, 1000);
            };
            startTracking();
        }

        return () => {
            if (locationSubscription) locationSubscription.remove();
            if (timer) clearInterval(timer);
        };
    }, [isNavigating]);

    useEffect(() => {
        if (latitude !== null && longitude !== null) {
            checkTurn({ latitude, longitude });
        }
    }, [latitude, longitude]);
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

    const sendtrunRequest = async (instruction: string, frequency: number, duty: number, duration: number) => {
        try {
            const response = await fetch('http://10.192.94.60:8003/publish/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    freq: frequency,
                    duty: duty,
                    duration: duration,
                    topic: 'IvyVine/' + instruction,
                }),
            });
            const data = await response.json();
            console.log('API Response:', data);
        } catch (error) {
            console.error('Error sending API request:', error);
        }
    };

    const checkTurn = (currentCoords: { latitude: number; longitude: number }) => {
        console.log('checkTurn called with currentCoords:', currentCoords); // 调试日志
        // 确保 steps 不为空且 currentStepIndex 是有效的
        if (steps.length === 0) {
            console.log('No steps available for navigation.');
            return;
        }

        // 检查是否还有下一步
        if (steps.length > currentStepIndex && currentStepIndex !== steps.length - 1) {
            const currentStep = steps[currentStepIndex];
            const nextStep = steps[currentStepIndex + 1];
            const { lat: latitude, lng: longitude } = currentStep.end_location;
            const distance = calculateDistance(currentCoords, { latitude, longitude });

            if (distance <= 10) {
                // 如果下一步存在，根据 maneuver 执行
                if (nextStep) {
                    let instruction = '';
                    const rawInstruction = nextStep.instruction.replace(/<[^>]+>/g, '');
                    const html_instruction = nextStep.instruction;
                    console.log('Raw Instruction:', rawInstruction); // 调试日志
                    // 根据 maneuver 来判断操作
                    if (nextStep.maneuver && (nextStep.maneuver.includes('left') || nextStep.maneuver.includes('right'))) {
                        if (nextStep.maneuver.includes('left')) {
                            instruction = 'left';
                        } else if (nextStep.maneuver.includes('right')) {
                            instruction = 'right';
                        } else {
                            instruction = 'straight';
                        }
                    } else {
                        // 如果 maneuver 为 null 或者没有方向，解析 instruction 内容来决定动作
                        if (rawInstruction.includes('Turn left')) {
                            instruction = 'left';
                        } else if (rawInstruction.includes('Turn right')) {
                            instruction = 'right';
                        } else {
                            instruction = 'straight';
                        }
                    }
                    console.log('Instruction:', instruction); // 调试日志
                    if (instruction === 'left' || instruction === 'right') {
                        sendtrunRequest(instruction, 50, 80, 1200);
                    }
                    setCurrentInstruction(rawInstruction); // 更新当前步骤指令
                    setCurrentHtmlInstruction(html_instruction); // 更新当前步骤指令（HTML 格式）
                    setCurrentStepIndex((prev) => prev + 1); // 进入下一步
                }
            }
        } else {
            // 如果是最后一步，判断是否到达
            const currentStep = steps[currentStepIndex];
            const { lat: latitude, lng: longitude } = currentStep.end_location;
            const distance = calculateDistance(currentCoords, { latitude, longitude });
            if (distance <= 10) {
                const instruction = currentStep.instruction.replace(/<[^>]+>/g, '');
                setCurrentInstruction(instruction); // 更新当前步骤指令
                setCurrentHtmlInstruction(currentStep.instruction); // 更新当前步骤指令（HTML 格式）
                console.log('Instruction:', instruction); // 调试日志
                sendtrunRequest('left', 10, 80, 600);
                sendtrunRequest('right', 10, 80, 600);
                handleExitNavigation();
                Alert.alert('Navigation Completed', 'You have reached your destination.');
            }
        }
    };

    // const calculateDistance = (
    //     coord1: { latitude: number; longitude: number },
    //     coord2: { latitude: number; longitude: number }
    // ) => {
    //     const R = 6371e3; // 地球半径，单位：米
    //     const φ1 = (coord1.latitude * Math.PI) / 180;
    //     const φ2 = (coord2.latitude * Math.PI) / 180;
    //     const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    //     const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    //     const a =
    //         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    //         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //     return R * c; // 距离，单位：米
    // };
    const calculateDistance = (
        coord1: { latitude: number; longitude: number },
        coord2: { latitude: number; longitude: number }
    ): number => {
        return getDistance(coord1, coord2); // 返回两点间的距离，单位：米
    };

    const handleDestinationSelect = async (place: { placeId: string; description: string }) => {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {
                    params: {
                        place_id: place.placeId,
                        key: ENV.GOOGLE_PLACES_API_KEY,
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

    const onStartNavigation = async (stepsData: any[]) => {
        console.log('onStartNavigation called with stepsData:', stepsData); // 调试日志
        if (stepsData.length === 0) {
            Alert.alert('Error', 'No navigation steps available.');
            console.error('No navigation steps available.');
            return;
        }
        console.log('Starting navigation...'); // 调试日志
        setSteps(stepsData);
        console.log('steps:', steps); // 调试日志
        setCurrentStepIndex(0);
        console.log('currentStepIndex:', currentStepIndex); // 调试日志
        setTraveledCoords([]);
        console.log('traveledCoords:', traveledCoords); // 调试日志
        let currentInstruction_info = stepsData[0].instruction.replace(/<[^>]*>?/gm, ''); // 获取第一步指令
        console.log('currentInstruction1:', currentInstruction_info); // 调试日志
        setCurrentInstruction(currentInstruction_info || ''); // 初始化第一步
        console.log('currentInstruction2:', currentInstruction); // 调试日志
        setCurrentHtmlInstruction(stepsData[0].instruction || ''); // 初始化第一步（HTML 格式）
        setIsNavigating(true);
        console.log('isNavigating:', isNavigating);

        if (destination) updateRegion(destination.latitude, destination.longitude); // 更新地图视角
    };

    function handleExitNavigation() {
        console.log('Exiting navigation...'); // 调试日志
        setIsNavigating(false);
        console.log('isNavigating:', isNavigating); // 调试日志
        setSteps([]);
        setCurrentStepIndex(0);
        setRouteCoords([]);
        setCurrentInstruction('');
        setCurrentHtmlInstruction('');
        setTraveledCoords([]);
        setDestination(null);
        console.log('Destination:', destination); // 调试日志
        clearSearch();
        console.log('Search cleared.'); // 调试日志
        fetchCurrentLocation();
        console.log('1');
        if (region) {
            handleMoveCamera({ latitude: region.latitude, longitude: region.longitude });
        }
        if (routeOptionsCardRef.current) {
            console.log('2');
            routeOptionsCardRef.current.handleCompleteNavigation();
        }
        console.log('3');
    }


    return (
        <View style={styles.container}>
            {region && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    region={region}
                    showsUserLocation={true}
                >
                    {/* {destination && */}
                    <Marker coordinate={destination || { latitude: 0, longitude: 0 }} title="Destination">
                        <FontAwesome name="map-marker" size={39} color="#F12C30" />
                        {/* <Fontisto name="map-marker-alt" size={36} color="red" /> */}
                    </Marker>
                    {/* } */}
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="rgb(0, 128, 255)" />
                </MapView>
            )}

            {/* 使用 NavigationCard 组件来显示导航指令 */}
            {isNavigating && currentHtmlInstruction && (
                <NavigationCard instruction={currentHtmlInstruction} />
            )}

            {!isNavigating && (
                <SearchBar
                    ref={searchBarRef}
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
            )}

            <CurrentLocationButton onPress={fetchCurrentLocation} />
            {destination && (
                <RouteOptionsCard
                    onClose={() => setDestination(null)}
                    origin={{ latitude: region!.latitude, longitude: region!.longitude }}
                    destination={destination}
                    onRouteSelected={(coords) => {
                        setRouteCoords(coords);
                    }}
                    onMoveCamera={handleMoveCamera}
                    onStartNavigation={onStartNavigation}
                    onExitNavigation={handleExitNavigation}
                />
            )}

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