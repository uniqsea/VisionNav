import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import debounce from "lodash/debounce";
import * as Location from "expo-location";

interface SearchBarProps {
    onSelectDestination: (place: { placeId: string; description: string } | null) => void;
}

const GOOGLE_PLACES_API_KEY = "AIzaSyCJ50N--3-fHY0bkIMwrE0hIXYP8qNq2wE";

export function SearchBar({ onSelectDestination }: SearchBarProps) {
    const [query, setQuery] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const inputRef = useRef<TextInput>(null);

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
                            radius: 5000,
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

    const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [currentLocation]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        Keyboard.dismiss(); // 收起键盘
    };

    const clearAll = () => {
        setQuery("");
        setSuggestions([]);
        onSelectDestination(null); // 回调清除状态到初始状态
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={isFocused ? handleBlur : undefined}>
                    <FontAwesome
                        name={isFocused ? "arrow-left" : "search"}
                        size={20}
                        color="gray"
                        style={styles.icon}
                    />
                </TouchableOpacity>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Search for a place"
                    value={query}
                    onFocus={handleFocus}
                    onChangeText={(text) => {
                        setQuery(text);
                        debouncedFetchSuggestions(text);
                    }}
                    returnKeyType="search"
                    onSubmitEditing={() => {
                        fetchSuggestions(query);
                        Keyboard.dismiss();
                    }}
                />
                {/* 清除按钮仅在聚焦且有输入时显示 */}
                {isFocused && query.length > 0 && (
                    <TouchableOpacity onPress={clearAll}>
                        <FontAwesome name="times-circle" size={20} color="gray" style={styles.clearIcon} />
                    </TouchableOpacity>
                )}
            </View>

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
                                setQuery(description);
                                setSuggestions([]);
                                setIsFocused(false); // 选择后隐藏返回图标
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
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        paddingHorizontal: 10,
        borderRadius: 15,
        marginBottom: 5,
        elevation: 2,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    clearIcon: {
        marginLeft: 8,
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
