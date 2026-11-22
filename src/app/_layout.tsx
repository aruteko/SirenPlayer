import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ErrorBoundaryProps, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { PermissionsAndroid, Platform, Pressable, ScrollView, Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AddToPlaylistSheet } from '@/components/AddToPlaylistSheet'
import { MiniPlayer } from '@/components/MiniPlayer'
import { SongMenuSheet } from '@/components/SongMenuSheet'
import { t } from '@/i18n'
import { initDownloads } from '@/lib/downloads'
import { initPlayer } from '@/lib/player/player'
import { initPlaylists } from '@/lib/playlists'
import { useTheme } from '@/theme'

// 最初の画面の内容がそろうまで，起動画面を出したままにする．空白の画面を見せないため
void SplashScreen.preventAutoHideAsync()
// 通信が遅くても，起動画面を出し続けない
const SPLASH_TIMEOUT_MS = 3000

/** 画面の描画で起きた例外を，その場に表示する．原因をつかみやすくするため */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	void SplashScreen.hideAsync()
	return (
		<ScrollView contentContainerStyle={errorStyles.container}>
			<Text style={errorStyles.title}>{t('エラーが起きました')}</Text>
			<Text selectable style={errorStyles.message}>
				{error.message}
			</Text>
			<Text selectable style={errorStyles.stack}>
				{error.stack}
			</Text>
			<Pressable onPress={() => void retry()} style={errorStyles.button}>
				<Text style={errorStyles.buttonText}>{t('再読み込み')}</Text>
			</Pressable>
		</ScrollView>
	)
}

const errorStyles = {
	container: { padding: 24, paddingTop: 64, gap: 12 },
	title: { fontSize: 18, fontWeight: '700' as const },
	message: { fontSize: 14 },
	stack: { fontSize: 11, opacity: 0.6 },
	button: { alignSelf: 'flex-start' as const, paddingVertical: 8 },
	buttonText: { fontSize: 14, fontWeight: '600' as const },
}

function requestNotificationPermission() {
	if (Platform.OS !== 'android' || Platform.Version < 33) return
	PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).catch(
		() => undefined,
	)
}

export default function RootLayout() {
	const theme = useTheme()
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { retry: 1, staleTime: 10 * 60_000 } },
			}),
	)

	useEffect(() => {
		initPlayer()
		void initPlaylists()
		void initDownloads()
		requestNotificationPermission()
		const timer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [])

	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<StatusBar style="auto" />
				<Stack
					screenOptions={{
						headerStyle: { backgroundColor: theme.bg },
						headerTintColor: theme.text,
						headerShadowVisible: false,
						contentStyle: { backgroundColor: theme.bg },
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="album/[cid]" options={{ title: '' }} />
					<Stack.Screen name="playlist/[id]" options={{ title: '' }} />
					<Stack.Screen name="downloads" options={{ title: t('ダウンロード済み') }} />
					<Stack.Screen name="player" options={{ presentation: 'modal', headerShown: false }} />
					<Stack.Screen name="about" options={{ title: t('このアプリについて') }} />
				</Stack>
				<MiniPlayer />
				<SongMenuSheet />
				<AddToPlaylistSheet />
			</QueryClientProvider>
		</SafeAreaProvider>
	)
}
