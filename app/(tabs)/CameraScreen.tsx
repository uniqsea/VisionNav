import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CameraComponent from '../../components/CameraComponent';

const CameraScreen = () => {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Camera Screen</Text> */}
      <CameraComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default CameraScreen;
