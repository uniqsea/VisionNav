import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import axios from "axios";
import debounce from "lodash/debounce";
import * as Location from "expo-location";
import { GOOGLE_PLACES_API_KEY } from "@env";


interface SearchBarProps {
    onSelectDestination: (place: { placeId: string; description: string }) => void;
}

const GOOGLE_PLACES_API_KEY = "test";

export function SearchBar({ onSelectDestination }: SearchBarProps) {
    const [query, setQuery] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // 获取当前位置
    const fetchCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.error("Location permission not granted");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            console.error("Error fetching current location:", error);
        }
    };

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    // 调用 Google Places Autocomplete API
    const fetchSuggestions = async (input: string) => {
        if (!input || !currentLocation) {
            setSuggestions([]);
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "https://places.googleapis.com/v1/places:autocomplete",
                {
                    input,
                    locationBias: {
                        circle: {
                            center: {
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                            },
                            radius: 5000, // 半径 5 公里
                        },
                    },
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    },
                }
            );

            setSuggestions(response.data.suggestions || []);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setLoading(false);
        }
    };

    // 使用 debounce 降低 API 请求频率
    const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [currentLocation]);

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Search for a place"
                value={query}
                onChangeText={(text) => {
                    setQuery(text);
                    debouncedFetchSuggestions(text);
                }}
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007BFF" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            )}

            <FlatList
                data={suggestions}
                keyExtractor={(item) => item.placePrediction?.placeId || item.queryPrediction?.text?.text}
                renderItem={({ item }) => {
                    const prediction = item.placePrediction || item.queryPrediction;
                    const description = prediction.text.text;

                    return (
                        <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                                onSelectDestination({
                                    placeId: item.placePrediction?.placeId || "",
                                    description: description,
                                });
                                setQuery(description); // 更新输入框内容
                                setSuggestions([]); // 清空建议列表
                            }}
                        >
                            <Text>{description}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        width: "90%",
        alignSelf: "center",
        zIndex: 1,
    },
    input: {
        backgroundColor: "white",
        padding: 10,
        borderRadius: 15,
        marginBottom: 5,
        fontSize: 16,
        elevation: 2,
    },
    suggestionItem: {
        padding: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    loadingText: {
        marginLeft: 10,
        color: "gray",
    },
});

export default SearchBar;
