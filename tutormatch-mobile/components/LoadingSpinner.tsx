import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import colors from '@/constants/colors'

export function LoadingSpinner({ flex }: { flex?: boolean }) {
  return (
    <View style={[styles.container, flex && styles.flex]}>
      <ActivityIndicator size="large" color={colors.light.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
})
