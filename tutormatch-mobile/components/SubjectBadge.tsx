import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { SUBJECT_COLORS } from '@/lib/subjects'

export function SubjectBadge({ subject, small }: { subject: string; small?: boolean }) {
  const colors = SUBJECT_COLORS[subject] ?? { bg: '#f0ece4', text: '#6f6d66' }
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: colors.text }, small && styles.smallText]}>
        {subject}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  smallText: {
    fontSize: 11,
  },
})
