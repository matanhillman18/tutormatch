import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Tabs } from 'expo-router'
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet, useColorScheme, View } from 'react-native'
import { SymbolView } from 'expo-symbols'
import { Ionicons } from '@expo/vector-icons'
import colors from '@/constants/colors'

const C = colors.light

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
        <Label>Browse</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="post">
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
        <Label>Post</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: 'person.crop.rectangle', selected: 'person.crop.rectangle.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isIOS = Platform.OS === 'ios'
  const isWeb = Platform.OS === 'web'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted3,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : C.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: C.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'extraLight'} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={22} />
            ) : (
              <Ionicons name="search-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle" tintColor={color} size={22} />
            ) : (
              <Ionicons name="add-circle-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.crop.rectangle" tintColor={color} size={22} />
            ) : (
              <Ionicons name="list-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  )
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />
  return <ClassicTabLayout />
}
