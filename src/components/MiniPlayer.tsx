import Icon from '@react-native-vector-icons/material-design-icons'
import { Image } from 'expo-image'
import { usePathname, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { skipToNext, togglePlay, useCurrentTrack, usePlayerState } from '@/lib/player/player'
import { useTabBarHeight } from '@/lib/tabBar'
import { useTheme } from '@/theme'

export const MINI_PLAYER_HEIGHT = 64

/** 画面の下に出す小さなプレーヤー．プレーヤー画面では隠す */
export function MiniPlayer() {
	const theme = useTheme()
	const router = useRouter()
	const pathname = usePathname()
	const insets = useSafeAreaInsets()
	// タブ画面ではタブバーの上に置く．それ以外の画面では，画面の下端の安全な領域の上に置く
	const tabBarHeight = useTabBarHeight()
	const bottomInset = tabBarHeight > 0 ? 0 : insets.bottom
	const track = useCurrentTrack()
	const { isPlaying } = usePlayerState()

	if (!track || pathname === '/player') return null

	return (
		<Pressable
			onPress={() => router.push('/player')}
			style={[
				styles.bar,
				{
					backgroundColor: theme.surface,
					borderColor: theme.border,
					bottom: tabBarHeight,
					paddingBottom: bottomInset,
					height: MINI_PLAYER_HEIGHT + bottomInset,
				},
			]}
		>
			<Image source={track.artwork} style={styles.cover} />
			<View style={styles.texts}>
				<Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
					{track.title}
				</Text>
				<Text numberOfLines={1} style={[styles.artist, { color: theme.sub }]}>
					{track.artist}
				</Text>
			</View>
			<Pressable hitSlop={8} onPress={togglePlay} style={styles.button}>
				<Icon name={isPlaying ? 'pause' : 'play'} size={28} color={theme.text} />
			</Pressable>
			<Pressable hitSlop={8} onPress={() => void skipToNext()} style={styles.button}>
				<Icon name="skip-next" size={28} color={theme.text} />
			</Pressable>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	bar: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	cover: { width: 44, height: 44, borderRadius: 6 },
	texts: { flex: 1, marginHorizontal: 12 },
	title: { fontSize: 15, fontWeight: '600' },
	artist: { fontSize: 12, marginTop: 2 },
	button: { padding: 6 },
})
