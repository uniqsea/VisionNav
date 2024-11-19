import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

interface RouteOptionsCardProps {
    onClose: () => void;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    onRouteSelected: (coords: Array<{ latitude: number; longitude: number }>) => void;
}

// const GOOGLE_DIRECTIONS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
const GOOGLE_DIRECTIONS_API_KEY = 'AIzaSyDVHNdef33SHqTJGKgY-s0qy-X1KNZF46c';

export function RouteOptionsCard({ onClose, origin, destination, onRouteSelected }: RouteOptionsCardProps) {
    const getRoute = async (mode: 'walking' | 'transit') => {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destinationStr = `${destination.latitude},${destination.longitude}`;
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_DIRECTIONS_API_KEY}`
        );

        if (response.data.routes.length) {
            const points = response.data.routes[0].overview_polyline.points;
            const coords = decodePolyline(points);
            onRouteSelected(coords);
        } else {
            console.log('No route found');
        }
    };

    const decodePolyline = (t: string) => {
        let points = [];
        let index = 0,
            len = t.length;
        let lat = 0,
            lng = 0;

        while (index < len) {
            let b,
                shift = 0,
                result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += dlng;

            points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
        }
        return points;
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={{ fontSize: 18 }}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select Route Type</Text>
            <TouchableOpacity style={styles.optionButton} onPress={() => getRoute('walking')}>
                <Text>Walking Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => getRoute('transit')}>
                <Text>Public Transit Route</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        bottom: 50,
        width: '90%',
        alignSelf: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        zIndex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 5,
        right: 10,
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
    },
    optionButton: {
        padding: 10,
        backgroundColor: '#eee',
        marginVertical: 5,
        borderRadius: 5,
    },
});

export default RouteOptionsCard;
