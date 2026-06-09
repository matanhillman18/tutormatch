import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { SUBJECTS } from '@/lib/subjects'
import colors from '@/constants/colors'
import type { UserRole } from '@/lib/session'

type Step = 'credentials' | 'role' | 'details'
type Format = 'online' | 'in_person' | 'both'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { setSession } = useSession()

  const [step, setStep] = useState<Step>('credentials')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [role, setRole] = useState<UserRole>('tutor')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', location: '',
    bio: '', hourly_rate: '', teaching_format: 'both' as Format,
  })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleSubject = (s: string) =>
    setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleCredentials = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.'); return
    }
    setLoading(true)
    const email = form.email.trim().toLowerCase()
    for (const table of ['tutors', 'parents']) {
      const { data } = await supabase.from(table).select('id,full_name,email')
        .eq('email', email).eq('password', form.password.trim()).maybeSingle()
      if (data) {
        const d = data as { id: string; full_name: string; email: string }
        await setSession({ id: d.id, role: table === 'tutors' ? 'tutor' : 'parent', name: d.full_name, email: d.email })
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        router.replace('/(tabs)/')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    if (mode === 'login') {
      Alert.alert('Login failed', 'Email or password incorrect.'); return
    }
    setStep('role')
  }

  const handleSignup = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.location.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.'); return
    }
    if (role === 'tutor') {
      if (selectedSubjects.length === 0) { Alert.alert('No subjects', 'Please select at least one subject.'); return }
      if (!form.hourly_rate || isNaN(Number(form.hourly_rate)) || Number(form.hourly_rate) <= 0) {
        Alert.alert('Invalid rate', 'Please enter a valid hourly rate.'); return
      }
    }
    setLoading(true)
    try {
      const email = form.email.trim().toLowerCase()
      const table = role === 'tutor' ? 'tutors' : 'parents'
      const insertData: Record<string, unknown> = {
        full_name: form.full_name.trim(), email,
        phone: form.phone.trim(), location: form.location.trim(),
        password: form.password.trim(),
      }
      if (role === 'tutor') {
        insertData.subjects = selectedSubjects
        insertData.hourly_rate = Number(form.hourly_rate)
        insertData.bio = form.bio.trim() || 'Experienced tutor'
        insertData.teaching_format = form.teaching_format
      }
      const { data, error: dbErr } = await supabase.from(table).insert(insertData).select('id,full_name').single()
      if (dbErr || !data) throw new Error(dbErr?.message || 'Signup failed')
      const d = data as { id: string; full_name: string }
      await setSession({ id: d.id, role, name: d.full_name, email })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)/')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      Alert.alert('Signup failed', msg.includes('duplicate') ? 'Email already exists. Try logging in.' : msg)
    } finally { setLoading(false) }
  }

  const C = colors.light
  const inputStyle = [styles.input, { borderColor: C.input, backgroundColor: C.card, color: C.foreground }]

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="book-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: C.foreground }]}>TutorMatch</Text>
        </View>

        <Text style={[styles.title, { color: C.foreground }]}>
          {step === 'credentials' ? 'Welcome back' : step === 'role' ? 'I am joining as' : 'Your details'}
        </Text>
        <Text style={[styles.subtitle, { color: C.mutedForeground }]}>
          {step === 'credentials' ? 'Sign in or create a new account'
            : step === 'role' ? 'Choose your account type to continue'
            : 'Almost done! Fill in your profile'}
        </Text>

        {/* Step dots */}
        {mode === 'signup' && (
          <View style={styles.dots}>
            {(['credentials', 'role', 'details'] as Step[]).map((s, i) => {
              const idx = (['credentials', 'role', 'details'] as Step[]).indexOf(step)
              return (
                <View key={s} style={[styles.dot, {
                  backgroundColor: step === s ? C.primary : idx > i ? C.primary + '60' : C.border,
                  width: step === s ? 20 : 8,
                }]} />
              )
            })}
          </View>
        )}

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <View style={styles.form}>
            {/* Mode toggle */}
            <View style={[styles.toggle, { backgroundColor: C.secondary }]}>
              {(['signup', 'login'] as const).map(m => (
                <Pressable key={m} onPress={() => setMode(m)}
                  style={[styles.toggleBtn, mode === m && [styles.toggleActive, { backgroundColor: C.card }]]}>
                  <Text style={[styles.toggleText, { color: mode === m ? C.foreground : C.mutedForeground }]}>
                    {m === 'signup' ? 'Sign Up' : 'Log In'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: C.foreground }]}>Email</Text>
            <TextInput
              style={inputStyle}
              value={form.email} onChangeText={v => set('email', v)}
              placeholder="you@example.com" placeholderTextColor={C.muted3}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email"
            />

            <Text style={[styles.label, { color: C.foreground }]}>Password</Text>
            <View>
              <TextInput
                style={inputStyle}
                value={form.password} onChangeText={v => set('password', v)}
                placeholder="••••••••" placeholderTextColor={C.muted3}
                secureTextEntry={!showPw} autoComplete="password"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPw(s => !s)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.mutedForeground} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: loading ? C.border : C.dark }]}
              onPress={handleCredentials} disabled={loading}>
              <Text style={[styles.primaryBtnText, { color: '#fff' }]}>
                {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Continue'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />}
            </Pressable>
          </View>
        )}

        {/* Step 2: Role */}
        {step === 'role' && (
          <View style={styles.form}>
            {(['tutor', 'parent'] as UserRole[]).map(r => (
              <Pressable key={r} onPress={() => { setRole(r); setStep('details'); Haptics.selectionAsync() }}
                style={[styles.roleCard, { borderColor: C.border, backgroundColor: C.card }]}>
                <View style={[styles.roleIcon, { backgroundColor: r === 'tutor' ? C.dark : C.primary }]}>
                  <Ionicons name={r === 'tutor' ? 'school-outline' : 'people-outline'} size={24} color={r === 'tutor' ? '#fff' : C.dark} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.roleTitle, { color: C.foreground }]}>
                    {r === 'tutor' ? 'I am a Tutor' : 'I am a Parent / Student'}
                  </Text>
                  <Text style={[styles.roleDesc, { color: C.mutedForeground }]}>
                    {r === 'tutor' ? 'Browse requests and apply to teach' : 'Post requests and find a tutor'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.mutedForeground} />
              </Pressable>
            ))}
            <Pressable onPress={() => setStep('credentials')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color={C.mutedForeground} />
              <Text style={[styles.backText, { color: C.mutedForeground }]}>Back</Text>
            </Pressable>
          </View>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <View style={styles.form}>
            <View style={[styles.rolePill, { backgroundColor: C.accent }]}>
              <Ionicons name={role === 'tutor' ? 'school-outline' : 'people-outline'} size={14} color={C.accentForeground} />
              <Text style={[styles.rolePillText, { color: C.accentForeground }]}>
                {role === 'tutor' ? 'Tutor' : 'Parent / Student'}
              </Text>
            </View>

            <Text style={[styles.label, { color: C.foreground }]}>Full Name</Text>
            <TextInput style={inputStyle} value={form.full_name} onChangeText={v => set('full_name', v)}
              placeholder="Alex Johnson" placeholderTextColor={C.muted3} />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: C.foreground }]}>Phone</Text>
                <TextInput style={inputStyle} value={form.phone} onChangeText={v => set('phone', v)}
                  placeholder="050-000-0000" placeholderTextColor={C.muted3} keyboardType="phone-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.foreground }]}>City</Text>
                <TextInput style={inputStyle} value={form.location} onChangeText={v => set('location', v)}
                  placeholder="Tel Aviv" placeholderTextColor={C.muted3} />
              </View>
            </View>

            {role === 'tutor' && (
              <>
                <Text style={[styles.label, { color: C.foreground }]}>Subjects You Teach</Text>
                <View style={styles.chips}>
                  {SUBJECTS.map(s => {
                    const sel = selectedSubjects.includes(s)
                    return (
                      <Pressable key={s} onPress={() => { toggleSubject(s); Haptics.selectionAsync() }}
                        style={[styles.chip, {
                          backgroundColor: sel ? C.dark : C.card,
                          borderColor: sel ? C.dark : C.border,
                        }]}>
                        <Text style={[styles.chipText, { color: sel ? '#fff' : C.mutedForeground }]}>{s}</Text>
                      </Pressable>
                    )
                  })}
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.label, { color: C.foreground }]}>Rate (₪/hr)</Text>
                    <TextInput style={inputStyle} value={form.hourly_rate} onChangeText={v => set('hourly_rate', v)}
                      placeholder="80" placeholderTextColor={C.muted3} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: C.foreground }]}>Format</Text>
                    <View style={styles.formatRow}>
                      {(['online', 'in_person', 'both'] as Format[]).map(f => (
                        <Pressable key={f} onPress={() => set('teaching_format', f)}
                          style={[styles.formatBtn, {
                            backgroundColor: form.teaching_format === f ? C.dark : C.card,
                            borderColor: form.teaching_format === f ? C.dark : C.border,
                            flex: 1,
                          }]}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color: form.teaching_format === f ? '#fff' : C.mutedForeground }}>
                            {f === 'online' ? 'Online' : f === 'in_person' ? 'In-Person' : 'Both'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={[styles.label, { color: C.foreground }]}>Bio <Text style={{ color: C.mutedForeground }}>(optional)</Text></Text>
                <TextInput style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={form.bio} onChangeText={v => set('bio', v)}
                  placeholder="Describe your teaching experience..." placeholderTextColor={C.muted3}
                  multiline numberOfLines={3} />
              </>
            )}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: loading ? C.border : C.dark }]}
              onPress={handleSignup} disabled={loading}>
              <Text style={[styles.primaryBtnText, { color: '#fff' }]}>
                {loading ? 'Creating...' : 'Create Account'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />}
            </Pressable>

            <Pressable onPress={() => setStep('role')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color={C.mutedForeground} />
              <Text style={[styles.backText, { color: C.mutedForeground }]}>Back</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 34, height: 34, backgroundColor: '#111110', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 24, lineHeight: 20 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 },
  dot: { height: 8, borderRadius: 99 },
  form: { gap: 4 },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  toggleActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  toggleText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Inter_400Regular' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 20 },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1.5, marginBottom: 12 },
  roleIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  roleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start', marginBottom: 8 },
  rolePillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  formatRow: { flexDirection: 'row', gap: 4 },
  formatBtn: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1.5 },
})
