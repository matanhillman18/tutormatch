import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { SUBJECTS } from '@/lib/subjects'
import colors from '@/constants/colors'

const C = colors.light
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College']

type LessonType = 'online' | 'in_person' | 'both'

export default function PostScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [lessonType, setLessonType] = useState<LessonType>('both')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isWeb = Platform.OS === 'web'
  const topPad = isWeb ? 67 : insets.top

  if (session?.role === 'tutor') {
    return (
      <View style={[styles.screen, { backgroundColor: C.background }]}>
        <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.pageTitle, { color: C.foreground }]}>Post Request</Text>
        </View>
        <View style={styles.notApplicable}>
          <View style={[styles.naIcon, { backgroundColor: C.secondary }]}>
            <Ionicons name="person-outline" size={32} color={C.mutedForeground} />
          </View>
          <Text style={[styles.naTitle, { color: C.foreground }]}>For Parents Only</Text>
          <Text style={[styles.naDesc, { color: C.mutedForeground }]}>
            Tutors can browse and apply to existing requests.{'\n'}
            Head to the Browse tab to find open requests.
          </Text>
        </View>
      </View>
    )
  }

  if (done) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
        <Text style={[styles.pageTitle, { color: C.foreground, textAlign: 'center', marginTop: 16 }]}>Request Posted!</Text>
        <Text style={[styles.naDesc, { color: C.mutedForeground, textAlign: 'center', marginTop: 8 }]}>
          Tutors can now apply to your request.{'\n'}
          Check your Dashboard for applicants.
        </Text>
        <Pressable
          onPress={() => { setDone(false); setSubject(''); setGrade(''); setBudget(''); setDescription(''); setLocation(''); setLessonType('both') }}
          style={[styles.btn, { backgroundColor: C.dark, marginTop: 28, paddingHorizontal: 28 }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Post Another</Text>
        </Pressable>
      </View>
    )
  }

  const handleSubmit = async () => {
    if (!subject || !grade || !budget || !description.trim()) {
      Alert.alert('Missing fields', 'Please fill in subject, grade, budget and description.'); return
    }
    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Invalid budget', 'Please enter a valid hourly budget.'); return
    }
    if (!session) return
    setLoading(true)
    const { error } = await supabase.from('tutoring_requests').insert({
      parent_id: session.id,
      subject, grade,
      budget: Number(budget),
      description: description.trim(),
      location: location.trim() || session.email,
      lesson_type: lessonType,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message); return
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setDone(true)
  }

  const inputStyle = [styles.input, { borderColor: C.input, backgroundColor: C.card, color: C.foreground }]

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.pageTitle, { color: C.foreground }]}>Post a Request</Text>
        <Text style={[styles.pageSub, { color: C.mutedForeground }]}>Tell tutors what you need</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled">

        {/* Subject picker */}
        <Text style={[styles.label, { color: C.foreground }]}>Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
          {SUBJECTS.map(s => {
            const sel = subject === s
            return (
              <Pressable key={s} onPress={() => { setSubject(s); Haptics.selectionAsync() }}
                style={[styles.chip, { backgroundColor: sel ? C.dark : C.card, borderColor: sel ? C.dark : C.border }]}>
                <Text style={[styles.chipText, { color: sel ? '#fff' : C.mutedForeground }]}>{s}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Grade picker */}
        <Text style={[styles.label, { color: C.foreground }]}>Grade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
          {GRADES.map(g => {
            const sel = grade === g
            return (
              <Pressable key={g} onPress={() => { setGrade(g); Haptics.selectionAsync() }}
                style={[styles.chip, { backgroundColor: sel ? C.primary : C.card, borderColor: sel ? C.primary : C.border }]}>
                <Text style={[styles.chipText, { color: sel ? C.dark : C.mutedForeground }]}>{g}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Budget */}
        <Text style={[styles.label, { color: C.foreground }]}>Budget (₪/hr)</Text>
        <TextInput
          style={inputStyle}
          value={budget} onChangeText={setBudget}
          placeholder="60" placeholderTextColor={C.muted3}
          keyboardType="numeric"
        />

        {/* Lesson type */}
        <Text style={[styles.label, { color: C.foreground }]}>Format</Text>
        <View style={styles.formatRow}>
          {(['online', 'in_person', 'both'] as LessonType[]).map(f => {
            const sel = lessonType === f
            const labels = { online: 'Online', in_person: 'In-Person', both: 'Both' }
            return (
              <Pressable key={f} onPress={() => { setLessonType(f); Haptics.selectionAsync() }}
                style={[styles.formatBtn, { backgroundColor: sel ? C.dark : C.card, borderColor: sel ? C.dark : C.border, flex: 1 }]}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: sel ? '#fff' : C.mutedForeground }}>{labels[f]}</Text>
              </Pressable>
            )
          })}
        </View>

        {/* Location */}
        <Text style={[styles.label, { color: C.foreground }]}>City / Area <Text style={{ color: C.mutedForeground }}>(optional)</Text></Text>
        <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholder="Tel Aviv" placeholderTextColor={C.muted3} />

        {/* Description */}
        <Text style={[styles.label, { color: C.foreground }]}>Description</Text>
        <TextInput
          style={[inputStyle, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
          value={description} onChangeText={setDescription}
          placeholder="Describe what you're looking for — grade level, goals, schedule..."
          placeholderTextColor={C.muted3} multiline numberOfLines={4}
        />

        <Pressable
          onPress={handleSubmit} disabled={loading}
          style={[styles.btn, { backgroundColor: loading ? C.border : C.dark, marginTop: 8 }]}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Post Request</Text>
              </>
            )}
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 16 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  formatRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  formatBtn: { paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1.5 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  notApplicable: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  naIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  naTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  naDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
})
