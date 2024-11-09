import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import MapViewComponent from '@/components/Map/MapViewComponent';
import HomeScreenBottom from '@/components/Map/ControlPanel/HomeScreenBottom';
import SearchBar from '@/components/Map/ControlPanel/SearchBar';
import MapTypeToggle from '@/components/Map/ControlPanel/MapTypeToggle';

export default function TabOneScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapViewComponent />
      <View style={styles.searchBarContainer}>
        <SearchBar onSearch={(query) => console.log(query)} />
      </View>
      {/* <View style={styles.container}>
        <MapTypeToggle onToggle={(type) => console.log(type)} />
      </View> */}
      <View style={styles.HomeScreenBottomContainer}>
        <HomeScreenBottom />
      </View>
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