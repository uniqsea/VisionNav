import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import CameraComponent from '../../components/CameraComponent';

const CameraScreen = () => {
  return (
    <View style={styles.container}>
      <CameraComponent style={styles.camera} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default CameraScreen;