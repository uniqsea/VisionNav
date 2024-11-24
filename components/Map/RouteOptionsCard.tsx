import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { GOOGLE_DIRECTIONS_API_KEY } from '@env';
import polyline from 'polyline';

interface RouteOptionsCardProps {
    onClose: () => void;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    onRouteSelected: (coords: Array<{ latitude: number; longitude: number }>) => void;
    onMoveCamera: (coords: { latitude: number; longitude: number }) => void; // 视角移动
    onStartNavigation: (steps: Array<any>) => void; // 新增：开始导航时传递所有步骤
}

export function RouteOptionsCard({
    onClose,
    origin,
    destination,
    onRouteSelected,
    onMoveCamera,
    onStartNavigation,
}: RouteOptionsCardProps) {
    const [routeSteps, setRouteSteps] = useState<
        Array<{ instruction: string; distance: string; duration: string }>
    >([]);

    const getRoute = async (mode: 'walking', showSteps: boolean = false) => {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destinationStr = `${destination.latitude},${destination.longitude}`;

        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_DIRECTIONS_API_KEY}`
            );

            if (response.data.routes.length) {
                const route = response.data.routes[0];
                const points = route.overview_polyline.points;
                // 使用 polyline.decode() 解码
                const coords = polyline.decode(points).map(([lat, lng]) => ({
                    latitude: lat,
                    longitude: lng,
                }));
                onRouteSelected(coords);

                // 如果需要显示文字版路线
                if (showSteps) {
                    const steps = route.legs[0].steps.map((step: any) => ({
                        instruction: step.html_instructions, // HTML 格式的文字说明
                        distance: step.distance.text, // 距离
                        duration: step.duration.text, // 时间
                        start_location: step.start_location, // 起点坐标
                        end_location: step.end_location, // 终点坐标
                        polyline: step.polyline.points, // Step路线坐标
                        maneuver: step.maneuver || null, // 转弯方向
                    }));
                    setRouteSteps(steps); // 保存步骤数据
                } else {
                    setRouteSteps([]); // 清除之前的文字版步骤
                }
            } else {
                console.log('No route found');
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        }
    };

    return (
        <>
            {/* 步骤说明卡片 */}
            {routeSteps.length > 0 && (
                <View style={styles.stepsCard}>
                    <ScrollView style={styles.stepsContainer}>
                        {routeSteps.map((step, index) => (
                            <View key={index} style={styles.step}>
                                <Text style={styles.stepText}>
                                    {step.instruction.replace(/<[^>]*>?/gm, '')}
                                </Text>
                                <Text style={styles.stepSubText}>
                                    Distance: {step.distance}, Time: {step.duration}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 选项卡 */}
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.goButton}
                    onPress={() => {
                        getRoute('walking', false); // 获取路线
                        onMoveCamera(origin); // 移动视角到当前位置
                        onStartNavigation(routeSteps); // 开始导航，传递步骤
                        onClose(); // 关闭卡片
                    }}
                >
                    <Text style={styles.goButtonText}>GO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.directionButton}
                    onPress={() => getRoute('walking', false)} // 仅规划路线
                >
                    <Text style={styles.directionButtonText}>Direction</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.stepsButton}
                    onPress={() => getRoute('walking', true)} // 展示步骤说明
                >
                    <Text style={styles.stepsButtonText}>Steps</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 0,
        padding: 20,
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
        bottom: 120, // 放置在主卡片上方
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        elevation: 5,
    },
    goButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'blue',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    goButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    directionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'gray',
        borderRadius: 5,
        marginRight: 10,
    },
    directionButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    stepsButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    stepsButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    stepsContainer: {
        maxHeight: 200,
        overflow: 'scroll',
    },
    step: {
        marginBottom: 10,
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepSubText: {
        fontSize: 12,
        color: 'gray',
    },
});

export default RouteOptionsCard;
