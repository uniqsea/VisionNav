// NavigationCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NavigationCardProps {
    instruction: string;
}

const NavigationCard: React.FC<NavigationCardProps> = ({ instruction }) => {
    return (
        <View style={styles.navigationCard}>
            <Text style={styles.navigationText}>{instruction}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    navigationCard: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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