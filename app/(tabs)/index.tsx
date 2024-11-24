import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import MapScreen from '@/components/Map/MapScreen';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <MapScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  HomeScreenBottomContainer: {
    // position: 'absolute',                                            
    bottom: 0,
    left: 0,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    zIndex: 1, // make sure the search bar is on top of the map
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});