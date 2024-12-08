// NavigationCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';

interface NavigationCardProps {
    instruction: string;
}

const NavigationCard: React.FC<NavigationCardProps> = ({ instruction }) => {
    return (
        <View style={styles.navigationCard}>
            {/* <Text style={styles.navigationText}>{instruction}</Text> */}
            <RenderHtml contentWidth={300} source={{ html: instruction }} />
        </View>
    );
};

const styles = StyleSheet.create({
    navigationCard: {
        fontSize: 16,
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    navigationText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default NavigationCard;