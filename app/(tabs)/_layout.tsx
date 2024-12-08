import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import Feather from '@expo/vector-icons/Feather';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
}) {
  return <Feather size={24} style={{ marginBottom: -3 }} {...props} />
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false, // 隐藏标题栏
        // tabBarStyle: { display: 'none' }, // 隐藏标签栏
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Navigation',
          tabBarIcon: ({ color }) => <TabBarIcon name="navigation" color={color} />,
        }}
      />
      <Tabs.Screen
        name="CameraScreen"
        options={{
          title: 'Vision',
          tabBarIcon: ({ color }) => <TabBarIcon name="eye" color={color} />,
        }}
      />
    </Tabs>
  );
}
