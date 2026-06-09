import AsyncStorage from '@react-native-async-storage/async-storage'

export type UserRole = 'tutor' | 'parent'

export interface Session {
  id: string
  role: UserRole
  name: string
  email: string
}

const KEY = 'tm_session'

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session))
}

export async function removeSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}
