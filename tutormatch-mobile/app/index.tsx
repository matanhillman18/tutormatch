import { useSession } from '@/context/SessionContext'
import { Redirect } from 'expo-router'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Index() {
  const { session, loading } = useSession()
  if (loading) return <LoadingSpinner flex />
  if (session) return <Redirect href="/(tabs)/" />
  return <Redirect href="/login" />
}
