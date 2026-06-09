import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput,
  RefreshControl, Modal, ActivityIndicator, Platform,
} from 'react-native'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { SubjectBadge } from '@/components/SubjectBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import colors from '@/constants/colors'

interface TutoringRequest {
  id: string; parent_id: string; subject: string; grade: string
  budget: number; description: string; location: string
  lesson_type: 'online' | 'in_person' | 'both'; created_at: string
}

interface Tutor {
  id: string; full_name: string; email: string; subjects: string[]
  hourly_rate: number; bio: string; teaching_format: string; location: string; phone: string
}

const C = colors.light

export default function BrowseScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const [requests, setRequests] = useState<TutoringRequest[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [applyTarget, setApplyTarget] = useState<TutoringRequest | null>(null)
  const [contactTarget, setContactTarget] = useState<Tutor | null>(null)
  const [applyMsg, setApplyMsg] = useState('')
  const [applyAvail, setApplyAvail] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyDone, setApplyDone] = useState(false)
  const [contactMsg, setContactMsg] = useState('')
  const [contactDone, setContactDone] = useState(false)

  const isWeb = Platform.OS === 'web'
  const topPad = isWeb ? 67 : insets.top

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    if (session.role === 'tutor') {
      const [reqRes, appRes] = await Promise.all([
        supabase.from('tutoring_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('applications').select('request_id').eq('tutor_id', session.id),
      ])
      if (reqRes.data) setRequests(reqRes.data as TutoringRequest[])
      if (appRes.data) setAppliedIds(new Set((appRes.data as { request_id: string }[]).map(a => a.request_id)))
    } else {
      const { data } = await supabase.from('tutors').select('*').order('created_at', { ascending: false })
      if (data) setTutors(data as Tutor[])
    }
    setLoading(false)
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleApply = async () => {
    if (!applyTarget || !session) return
    if (!applyMsg.trim() || !applyAvail.trim()) return
    setApplyLoading(true)
    const { error } = await supabase.from('applications').insert({
      tutor_id: session.id, request_id: applyTarget.id,
      message: applyMsg.trim(), availability: applyAvail.trim(),
      phone: '', status: 'pending',
    })
    setApplyLoading(false)
    if (!error) {
      setAppliedIds(prev => new Set([...prev, applyTarget.id]))
      setApplyDone(true)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => { setApplyTarget(null); setApplyDone(false); setApplyMsg(''); setApplyAvail('') }, 2000)
    }
  }

  const handleContact = async () => {
    if (!contactMsg.trim()) return
    await new Promise(r => setTimeout(r, 600))
    setContactDone(true)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => { setContactTarget(null); setContactDone(false); setContactMsg('') }, 2000)
  }

  const lessonLabel = (type: string) =>
    type === 'online' ? 'Online' : type === 'in_person' ? 'In-Person' : 'Both'

  const filteredRequests = requests.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.subject.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.grade.toLowerCase().includes(q)
  })

  const filteredTutors = tutors.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.full_name.toLowerCase().includes(q) || t.bio.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q))
  })

  const renderRequest = ({ item }: { item: TutoringRequest }) => {
    const hasApplied = appliedIds.has(item.id)
    return (
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={styles.cardTop}>
          <SubjectBadge subject={item.subject} />
          {hasApplied && (
            <View style={[styles.appliedBadge, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: '#16a34a', marginLeft: 3 }}>Applied</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardTitle, { color: C.foreground }]}>{item.subject} — Grade {item.grade}</Text>
        <Text style={[styles.cardDesc, { color: C.muted2 }]} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={13} color={C.mutedForeground} />
            <Text style={[styles.metaText, { color: C.mutedForeground }]}>₪{item.budget}/hr</Text>
          </View>
          {!!item.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={C.mutedForeground} />
              <Text style={[styles.metaText, { color: C.mutedForeground }]}>{item.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="wifi-outline" size={13} color={C.mutedForeground} />
            <Text style={[styles.metaText, { color: C.mutedForeground }]}>{lessonLabel(item.lesson_type)}</Text>
          </View>
        </View>
        <Pressable
          disabled={hasApplied}
          onPress={() => {
            if (!hasApplied) { setApplyTarget(item); setApplyMsg(''); setApplyAvail(''); setApplyDone(false) }
            Haptics.selectionAsync()
          }}
          style={[styles.actionBtn, { backgroundColor: hasApplied ? '#f0fdf4' : C.dark }]}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: hasApplied ? '#16a34a' : '#fff' }}>
            {hasApplied ? '✓ Applied' : 'Apply Now'}
          </Text>
          {!hasApplied && <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 5 }} />}
        </Pressable>
      </View>
    )
  }

  const renderTutor = ({ item }: { item: Tutor }) => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: C.secondary }]}>
          <Text style={[styles.avatarText, { color: C.foreground }]}>{item.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: C.foreground, marginBottom: 0 }]}>{item.full_name}</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.accentForeground }}>₪{item.hourly_rate}/hr</Text>
        </View>
      </View>
      <Text style={[styles.cardDesc, { color: C.muted2, marginTop: 8 }]} numberOfLines={2}>{item.bio}</Text>
      <View style={styles.chips}>
        {item.subjects.slice(0, 3).map(s => <SubjectBadge key={s} subject={s} small />)}
        {item.subjects.length > 3 && (
          <View style={[styles.moreChip, { backgroundColor: C.secondary }]}>
            <Text style={{ fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_500Medium' }}>+{item.subjects.length - 3}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardMeta}>
        {!!item.location && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={C.mutedForeground} />
            <Text style={[styles.metaText, { color: C.mutedForeground }]}>{item.location}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="wifi-outline" size={13} color={C.mutedForeground} />
          <Text style={[styles.metaText, { color: C.mutedForeground }]}>{lessonLabel(item.teaching_format)}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => { setContactTarget(item); setContactMsg(''); setContactDone(false); Haptics.selectionAsync() }}
        style={[styles.actionBtn, { backgroundColor: C.dark }]}>
        <Feather name="message-circle" size={14} color="#fff" />
        <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff', marginLeft: 6 }}>Contact Tutor</Text>
      </Pressable>
    </View>
  )

  if (!session) return <LoadingSpinner flex />

  const isTutor = session.role === 'tutor'
  const data: (TutoringRequest | Tutor)[] = isTutor ? filteredRequests : filteredTutors
  const count = data.length

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.pageTitle, { color: C.foreground }]}>{isTutor ? 'Open Requests' : 'Find a Tutor'}</Text>
          <Text style={[styles.pageSubtitle, { color: C.mutedForeground }]}>
            {loading ? 'Loading...' : `${count} ${isTutor ? 'requests' : 'tutors'} available`}
          </Text>
        </View>
        {!isTutor && (
          <Pressable onPress={() => router.push('/(tabs)/post')} style={[styles.postBtn, { backgroundColor: C.primary }]}>
            <Ionicons name="add" size={20} color={C.dark} />
          </Pressable>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: C.foreground }]}
            value={search} onChangeText={setSearch}
            placeholder={isTutor ? 'Search subject, grade...' : 'Search name, subject...'}
            placeholderTextColor={C.muted3}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner flex />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={40} color={C.border} />
          <Text style={[styles.emptyText, { color: C.mutedForeground }]}>
            {search ? 'No results found' : isTutor ? 'No requests yet' : 'No tutors yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={isTutor
            ? (info) => renderRequest({ item: info.item as TutoringRequest })
            : (info) => renderTutor({ item: info.item as Tutor })
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        />
      )}

      {/* Apply Modal */}
      <Modal visible={!!applyTarget} transparent animationType="slide" onRequestClose={() => setApplyTarget(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setApplyTarget(null)} />
          <View style={[styles.modalSheet, { backgroundColor: C.card, paddingBottom: insets.bottom + 20 }]}>
            {applyDone ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                <Text style={[styles.successTitle, { color: C.foreground }]}>Application Sent!</Text>
                <Text style={[styles.successSub, { color: C.mutedForeground }]}>The family will be notified.</Text>
              </View>
            ) : (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: C.foreground }]}>Apply to Request</Text>
                    {applyTarget && <Text style={[styles.sheetSub, { color: C.mutedForeground }]}>{applyTarget.subject} · Grade {applyTarget.grade}</Text>}
                  </View>
                  <Pressable onPress={() => setApplyTarget(null)}>
                    <Ionicons name="close" size={22} color={C.mutedForeground} />
                  </Pressable>
                </View>
                {applyTarget && (
                  <View style={[styles.summaryBox, { backgroundColor: C.warm1, borderColor: C.border }]}>
                    <Text style={[styles.summaryDesc, { color: C.muted2 }]} numberOfLines={2}>{applyTarget.description}</Text>
                    <Text style={[styles.summaryBudget, { color: C.accentForeground }]}>Budget: ₪{applyTarget.budget}/hr</Text>
                  </View>
                )}
                <Text style={[styles.fieldLabel, { color: C.foreground }]}>Message to Parent</Text>
                <TextInput
                  style={[styles.textarea, { borderColor: C.input, backgroundColor: C.warm1, color: C.foreground }]}
                  value={applyMsg} onChangeText={setApplyMsg}
                  placeholder="Introduce yourself and explain why you're a great fit..."
                  placeholderTextColor={C.muted3} multiline numberOfLines={4} textAlignVertical="top"
                />
                <Text style={[styles.fieldLabel, { color: C.foreground }]}>Your Availability</Text>
                <TextInput
                  style={[styles.inputField, { borderColor: C.input, backgroundColor: C.warm1, color: C.foreground }]}
                  value={applyAvail} onChangeText={setApplyAvail}
                  placeholder="e.g. Weekdays after 4pm" placeholderTextColor={C.muted3}
                />
                <Pressable
                  onPress={handleApply}
                  disabled={applyLoading || !applyMsg.trim() || !applyAvail.trim()}
                  style={[styles.modalBtn, { backgroundColor: (!applyMsg.trim() || !applyAvail.trim() || applyLoading) ? C.border : C.dark }]}>
                  {applyLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <>
                        <Ionicons name="send-outline" size={15} color="#fff" />
                        <Text style={[styles.modalBtnText, { color: '#fff' }]}>Submit Application</Text>
                      </>
                    )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal visible={!!contactTarget} transparent animationType="slide" onRequestClose={() => setContactTarget(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactTarget(null)} />
          <View style={[styles.modalSheet, { backgroundColor: C.card, paddingBottom: insets.bottom + 20 }]}>
            {contactDone ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
                <Text style={[styles.successTitle, { color: C.foreground }]}>Message Sent!</Text>
                <Text style={[styles.successSub, { color: C.mutedForeground }]}>{contactTarget?.full_name} will get back to you.</Text>
              </View>
            ) : (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: C.foreground }]}>Contact {contactTarget?.full_name}</Text>
                    {contactTarget && (
                      <Text style={[styles.sheetSub, { color: C.mutedForeground }]}>₪{contactTarget.hourly_rate}/hr · {contactTarget.location}</Text>
                    )}
                  </View>
                  <Pressable onPress={() => setContactTarget(null)}>
                    <Ionicons name="close" size={22} color={C.mutedForeground} />
                  </Pressable>
                </View>
                <TextInput
                  style={[styles.textarea, { borderColor: C.input, backgroundColor: C.warm1, color: C.foreground }]}
                  value={contactMsg} onChangeText={setContactMsg}
                  placeholder="Write a short message to the tutor..."
                  placeholderTextColor={C.muted3} multiline numberOfLines={4} textAlignVertical="top"
                />
                <Pressable
                  onPress={handleContact} disabled={!contactMsg.trim()}
                  style={[styles.modalBtn, { backgroundColor: !contactMsg.trim() ? C.border : C.dark }]}>
                  <Feather name="message-circle" size={15} color="#fff" />
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Send Message</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  pageSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  postBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10 },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  moreChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  sheetSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  summaryBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  summaryDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 5 },
  summaryBudget: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  textarea: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', height: 100, marginBottom: 14 },
  inputField: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  modalBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  successBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  successTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
})
