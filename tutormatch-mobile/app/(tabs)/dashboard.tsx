import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, Pressable,
  RefreshControl, Platform,
} from 'react-native'
import { Ionicons, Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { SubjectBadge } from '@/components/SubjectBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import colors from '@/constants/colors'

const C = colors.light

interface Application {
  id: string; tutor_id: string; request_id: string
  message: string; availability: string; status: string; created_at: string
  tutor?: { full_name: string; email: string; phone: string; hourly_rate: number }
  request?: { subject: string; grade: string; budget: number }
}

interface TutoringRequest {
  id: string; subject: string; grade: string; budget: number
  description: string; lesson_type: string; created_at: string
  applications?: Application[]
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const { session, clearSession } = useSession()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [myRequests, setMyRequests] = useState<TutoringRequest[]>([])
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)

  const isWeb = Platform.OS === 'web'
  const topPad = isWeb ? 67 : insets.top

  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    if (session.role === 'tutor') {
      const { data } = await supabase
        .from('applications')
        .select('*, request:request_id(subject, grade, budget)')
        .eq('tutor_id', session.id)
        .order('created_at', { ascending: false })
      if (data) setMyApplications(data as Application[])
    } else {
      const { data: reqData } = await supabase
        .from('tutoring_requests')
        .select('*')
        .eq('parent_id', session.id)
        .order('created_at', { ascending: false })
      if (reqData) {
        const requestsWithApps = await Promise.all(
          (reqData as TutoringRequest[]).map(async r => {
            const { data: apps } = await supabase
              .from('applications')
              .select('*, tutor:tutor_id(full_name, email, phone, hourly_rate)')
              .eq('request_id', r.id)
            return { ...r, applications: (apps ?? []) as Application[] }
          })
        )
        setMyRequests(requestsWithApps)
      }
    }
    setLoading(false)
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleLogout = async () => {
    await Haptics.selectionAsync()
    await clearSession()
    router.replace('/login')
  }

  const statusColor = (s: string) => {
    if (s === 'approved') return { bg: '#f0fdf4', text: '#16a34a' }
    if (s === 'rejected') return { bg: '#fef2f2', text: '#dc2626' }
    return { bg: C.accent, text: C.accentForeground }
  }

  const renderApplication = ({ item }: { item: Application }) => {
    const sc = statusColor(item.status)
    return (
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={styles.cardTop}>
          {item.request && <SubjectBadge subject={item.request.subject} />}
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        {item.request && (
          <Text style={[styles.cardTitle, { color: C.foreground }]}>
            {item.request.subject} — Grade {item.request.grade}
          </Text>
        )}
        <Text style={[styles.cardDesc, { color: C.muted2 }]} numberOfLines={2}>{item.message}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={C.mutedForeground} />
          <Text style={[styles.metaText, { color: C.mutedForeground }]}>{item.availability}</Text>
        </View>
        {item.request && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={13} color={C.mutedForeground} />
            <Text style={[styles.metaText, { color: C.mutedForeground }]}>Budget ₪{item.request.budget}/hr</Text>
          </View>
        )}
      </View>
    )
  }

  const renderRequest = ({ item }: { item: TutoringRequest }) => {
    const isExpanded = expandedRequest === item.id
    const appCount = item.applications?.length ?? 0
    return (
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={styles.cardTop}>
          <SubjectBadge subject={item.subject} />
          <View style={[styles.statusBadge, { backgroundColor: appCount > 0 ? C.accent : C.secondary }]}>
            <Text style={[styles.statusText, { color: appCount > 0 ? C.accentForeground : C.mutedForeground }]}>
              {appCount} applicant{appCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: C.foreground }]}>{item.subject} — Grade {item.grade}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={13} color={C.mutedForeground} />
          <Text style={[styles.metaText, { color: C.mutedForeground }]}>₪{item.budget}/hr</Text>
          <Text style={[styles.metaDot, { color: C.border }]}>·</Text>
          <Ionicons name="wifi-outline" size={13} color={C.mutedForeground} />
          <Text style={[styles.metaText, { color: C.mutedForeground }]}>
            {item.lesson_type === 'in_person' ? 'In-Person' : item.lesson_type === 'online' ? 'Online' : 'Both'}
          </Text>
        </View>
        {appCount > 0 && (
          <Pressable
            onPress={() => { setExpandedRequest(isExpanded ? null : item.id); Haptics.selectionAsync() }}
            style={[styles.expandBtn, { borderColor: C.border }]}>
            <Text style={[styles.expandText, { color: C.foreground }]}>
              {isExpanded ? 'Hide Applicants' : 'View Applicants'}
            </Text>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.mutedForeground} />
          </Pressable>
        )}
        {isExpanded && item.applications && item.applications.map(app => (
          <View key={app.id} style={[styles.applicantRow, { backgroundColor: C.warm1, borderColor: C.border }]}>
            <View style={[styles.applicantAvatar, { backgroundColor: C.secondary }]}>
              <Text style={[styles.avatarChar, { color: C.foreground }]}>
                {(app.tutor?.full_name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.applicantName, { color: C.foreground }]}>{app.tutor?.full_name ?? 'Unknown'}</Text>
              <Text style={[styles.applicantMeta, { color: C.mutedForeground }]}>
                ₪{app.tutor?.hourly_rate ?? '?'}/hr · {app.tutor?.phone ?? 'no phone'}
              </Text>
              <Text style={[styles.applicantMsg, { color: C.muted2 }]} numberOfLines={2}>{app.message}</Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  if (!session) return <LoadingSpinner flex />

  const isTutor = session.role === 'tutor'
  const data = isTutor ? myApplications : myRequests

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.pageTitle, { color: C.foreground }]}>{isTutor ? 'My Applications' : 'My Requests'}</Text>
          <Text style={[styles.pageSub, { color: C.mutedForeground }]}>Signed in as {session.name}</Text>
        </View>
        <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: C.border }]}>
          <Feather name="log-out" size={16} color={C.mutedForeground} />
        </Pressable>
      </View>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border, marginHorizontal: 16, marginBottom: 12 }]}>
        <View style={[styles.profileAvatar, { backgroundColor: C.dark }]}>
          <Text style={styles.profileAvatarChar}>{session.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: C.foreground }]}>{session.name}</Text>
          <Text style={[styles.profileEmail, { color: C.mutedForeground }]}>{session.email}</Text>
        </View>
        <View style={[styles.rolePill, { backgroundColor: isTutor ? C.dark : C.primary }]}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isTutor ? '#fff' : C.dark }}>
            {isTutor ? 'Tutor' : 'Parent'}
          </Text>
        </View>
      </View>

      {!isTutor && (
        <Pressable onPress={() => router.push('/(tabs)/post')} style={[styles.postCta, { backgroundColor: C.accent, borderColor: C.amberBorder, marginHorizontal: 16, marginBottom: 12 }]}>
          <Ionicons name="add-circle-outline" size={18} color={C.accentForeground} />
          <Text style={[styles.postCtaText, { color: C.accentForeground }]}>Post a New Request</Text>
          <Ionicons name="chevron-forward" size={14} color={C.accentForeground} style={{ marginLeft: 'auto' }} />
        </Pressable>
      )}

      {loading ? (
        <LoadingSpinner flex />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name={isTutor ? 'document-text-outline' : 'list-outline'} size={40} color={C.border} />
          <Text style={[styles.emptyTitle, { color: C.foreground }]}>
            {isTutor ? 'No applications yet' : 'No requests yet'}
          </Text>
          <Text style={[styles.emptyDesc, { color: C.mutedForeground }]}>
            {isTutor ? 'Browse open requests and apply to get started.' : 'Post a tutoring request to get matched with tutors.'}
          </Text>
          <Pressable
            onPress={() => isTutor ? router.push('/(tabs)/') : router.push('/(tabs)/post')}
            style={[styles.emptyBtn, { backgroundColor: C.dark }]}>
            <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
              {isTutor ? 'Browse Requests' : 'Post a Request'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data as (Application | TutoringRequest)[]}
          keyExtractor={item => item.id}
          renderItem={isTutor
            ? (info) => renderApplication({ item: info.item as Application })
            : (info) => renderRequest({ item: info.item as TutoringRequest })
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  logoutBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, padding: 14 },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileAvatarChar: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  profileName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  profileEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  postCta: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  postCtaText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaDot: { fontSize: 14, marginHorizontal: 2 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  expandText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  applicantRow: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8 },
  applicantAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  applicantName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  applicantMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  applicantMsg: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4, lineHeight: 17 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
})
