import React, { useState, useEffect } from 'react';
import MapView, { Polyline } from 'react-native-maps';

export default function DirectionsPlan({ origin, destination }) {
    const [route, setRoute] = useState([]);

    useEffect(() => {
        // 调用第三方 API 获取路线数据
        const fetchRoute = async () => {
            // 假设 fetchDirections 是一个获取路线数据的函数
            const routeData = await fetchDirections(origin, destination);
            setRoute(routeData);
        };
        if (origin && destination) {
            fetchRoute();
        }
    }, [origin, destination]);

    return (
        <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
    );
}
