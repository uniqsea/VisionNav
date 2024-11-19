import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

const HomeScreenBottom: React.FC = () => {
    const [locationName, setLocationName] = useState<string | null>(null);
    const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

    useEffect(() => {
        if (!hasFetchedLocation) {
            (async () => {
                try {
                    // Request location permission
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Location Permission Denied', 'The app needs location permission to display the current location.');
                        return;
                    }

                    // Get the current location
                    const currentLocation = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = currentLocation.coords;

                    // Get location name by reverse geocoding
                    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (geocode.length > 0) {
                        const place = geocode[0];
                        setLocationName(`${place.city || place.region}, ${place.country}`);
                    } else {
                        Alert.alert('Unable to Get Location Name', 'Reverse geocoding did not return any results.');
                    }
                } catch (error) {
                    console.error("Error fetching location or place name:", error);
                    Alert.alert('Location Error', 'An error occurred while fetching location information. Please try again later.');
                } finally {
                    setHasFetchedLocation(true); // Mark as fetched to avoid multiple requests
                }
            })();
        }
    }, [hasFetchedLocation]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Current Location</Text>
            {locationName ? (
                <Text style={styles.text}>{locationName}</Text>
            ) : (
                <Text style={styles.text}>Fetching location...</Text>
            )}
            <View style={styles.buttonContainer}>
                {/* Space reserved for additional buttons */}
            </View>
        </View>
    );
};

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
        marginBottom: 5,
    },
    buttonContainer: {
        marginTop: 15,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});

export default HomeScreenBottom;
