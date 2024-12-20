import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import ENV from '../../map_env';

interface HomeScreenBottomProps {
    locationCoords: { latitude: number; longitude: number } | null;
}

export function HomeScreenBottom({ locationCoords }: HomeScreenBottomProps) {
    const [locationName, setLocationName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchLocationName = async () => {
            if (!locationCoords) {
                setLocationName(null);
                return;
            }

            try {
                setIsLoading(true);
                const response = await axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json`,
                    {
                        params: {
                            latlng: `${locationCoords.latitude},${locationCoords.longitude}`,
                            key: ENV.GOOGLE_PLACES_API_KEY,
                        },
                    }
                );
                const results = response.data.results;
                if (results && results.length > 0) {
                    setLocationName(results[0].formatted_address);
                } else {
                    setLocationName('Unknown Location');
                }
            } catch (err) {
                console.error('Error fetching location:', err);
                setError('Failed to fetch location name.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocationName();
    }, [locationCoords]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Location</Text>
            {isLoading ? (
                <ActivityIndicator size="small" color="#007BFF" />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <Text style={styles.text}>{locationName || 'Loading...'}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: '#ffffff',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        color: 'red',
        textAlign: 'center',
    },
});

export default HomeScreenBottom;