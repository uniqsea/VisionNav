import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import axios from 'axios';
import polyline from 'polyline';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import ENV from '../../map_env';
import RenderHtml from 'react-native-render-html';

interface RouteOptionsCardProps {
    onClose: () => void;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    onRouteSelected: (coords: Array<{ latitude: number; longitude: number }>) => void;
    onMoveCamera: (coords: { latitude: number; longitude: number }) => void;
    onStartNavigation: (steps: Array<any>) => void;
    onExitNavigation: () => void;
}

export const RouteOptionsCard = forwardRef(({
    onClose,
    origin,
    destination,
    onRouteSelected,
    onMoveCamera,
    onStartNavigation,
    onExitNavigation,
}: RouteOptionsCardProps, ref) => {
    const [routeData, setRouteData] = useState<{
        coords: Array<{ latitude: number; longitude: number }>;
        steps: Array<any>;
    } | null>(null);

    const [isRouteVisible, setIsRouteVisible] = useState(false);
    const [isStepsVisible, setIsStepsVisible] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const fetchRoute = async () => {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destinationStr = `${destination.latitude},${destination.longitude}`;

        try {
            console.log('Start Fetching...');
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=walking&key=${ENV.GOOGLE_DIRECTIONS_API_KEY}`
            );
            console.log('Fetching...');
            if (response.data.routes.length) {
                const route = response.data.routes[0];
                const points = route.overview_polyline.points;
                const coords = polyline.decode(points).map((value: number[]) => {
                    const [lat, lng] = value;
                    return { latitude: lat, longitude: lng };
                });

                const steps = route.legs[0].steps.map((step: any) => ({
                    instruction: step.html_instructions,
                    distance: step.distance.text,
                    duration: step.duration.text,
                    start_location: step.start_location,
                    end_location: step.end_location,
                    polyline: step.polyline.points,
                    maneuver: step.maneuver || null,
                }));

                console.log('Routeinfo and stepsinfo fetched:', steps);
                const fetchedRouteData = { coords, steps };
                setRouteData(fetchedRouteData);

                return fetchedRouteData;
            } else {
                Alert.alert('No route found', 'Please try again.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            Alert.alert('Error', 'Failed to fetch route. Please check your connection.');
            return null;
        }
    };

    const handleRouteToggle = async () => {
        let fetchedRouteData = routeData;
        if (fetchedRouteData) {
            setIsRouteVisible(!isRouteVisible);
            onRouteSelected(isRouteVisible || !fetchedRouteData ? [] : fetchedRouteData.coords);
        } else {
            fetchedRouteData = await fetchRoute();
            setIsRouteVisible(true);
            onRouteSelected(isRouteVisible || !fetchedRouteData ? [] : fetchedRouteData.coords);
        }
    };

    const handleStepsToggle = async () => {
        let fetchedRouteData = routeData;
        if (fetchedRouteData) {
            setIsStepsVisible(!isStepsVisible);
        } else {
            fetchedRouteData = await fetchRoute();
            setIsStepsVisible(true);
        }
    };

    const handleGoButtonPress = async () => {
        let fetchedRouteData = routeData;
        if (!fetchedRouteData) {
            fetchedRouteData = await fetchRoute();
        }
        setIsRouteVisible(true);
        onRouteSelected(fetchedRouteData?.coords || []);
        onMoveCamera(origin);
        onStartNavigation(fetchedRouteData?.steps || []);
        setIsNavigating(true);
    };

    const handleExitNavigation = () => {
        setIsNavigating(false);
        onExitNavigation();
        onClose();
    };

    useImperativeHandle(ref, () => ({
        handleCompleteNavigation: () => {
            setIsNavigating(false);
            onExitNavigation();
            onClose();
            console.log('Navigation completed');
        }
    }));
    return (
        <>
            {isStepsVisible && routeData && (
                <View style={styles.stepsCard}>
                    <ScrollView style={styles.stepsContainer}>
                        {routeData.steps.map((step, index) => (
                            <View key={index} style={styles.step}>
                                <RenderHtml contentWidth={300} source={{ html: step.instruction }} />
                                <Text style={styles.stepSubText}>
                                    Distance: {step.distance}, Time: {step.duration}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.container}>
                <TouchableOpacity
                    style={[
                        styles.goButton,
                        isNavigating && styles.goButtonPressed
                    ]}
                    onPress={isNavigating ? handleExitNavigation : handleGoButtonPress}
                >
                    {/* <Text style={{ color: 'white' }}>
                        {isNavigating ? 'Exit' : <Ionicons name="walk" size={45} color="white" />}
                    </Text> */}
                    {isNavigating ? <Text style={{ fontSize: 30, color: 'white' }}>Exit</Text> : <FontAwesome5 name="walking" size={45} color="white" />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.directionButton, isRouteVisible && styles.activeButton]}
                    onPress={handleRouteToggle}
                >
                    <FontAwesome6
                        name="arrows-turn-right"
                        size={24}
                        color={isRouteVisible ? 'white' : 'black'}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.stepsButton, isStepsVisible && styles.activeButton]}
                    onPress={handleStepsToggle}
                >
                    <FontAwesome5
                        name="route"
                        size={24}
                        color={isStepsVisible ? 'white' : 'black'}
                    />
                </TouchableOpacity>
            </View>
        </>
    );
})

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 0,
        padding: 30,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: '#ffffff',
        position: 'absolute',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    stepsCard: {
        position: 'absolute',
        bottom: 120,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 10,
        elevation: 5,
    },
    goButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgb(0, 128, 255)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    directionButton: {
        width: 60,
        height: 60,
        backgroundColor: 'gray',
        borderRadius: 10,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepsButton: {
        width: 60,
        height: 60,
        backgroundColor: 'gray',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeButton: {
        backgroundColor: 'rgb(0, 128, 255)',
    },
    stepsContainer: {
        maxHeight: 200,
        overflow: 'scroll',
    },
    step: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    stepSubText: {
        fontSize: 14,
        color: '#555',
    },
    goButtonPressed: {
        backgroundColor: '#F12C30', // 导航时变成橙色
    }
});

export default RouteOptionsCard;
