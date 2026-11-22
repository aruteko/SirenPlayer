import Icon from '@react-native-vector-icons/material-design-icons'
import ImageThemeColors, { type ExtractedPalette } from '@siren/theme-colors'
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia'
import { useImage } from 'expo-image'
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	Animated,
	AppState,
	BackHandler,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	type ScrollViewInstance,
	StyleSheet,
	Text,
	useColorScheme,
	useWindowDimensions,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FluidBackground } from '@/components/player/FluidBackground'
import { PlayerLyricsPage } from '@/components/player/PlayerLyricsPage'
import { PlayerMain } from '@/components/player/PlayerMain'
import { QueueSheet } from '@/components/QueueSheet'
import { t } from '@/i18n'
import { useCurrentTrack, usePlayerState } from '@/lib/player/player'
import { openSongMenu } from '@/lib/songMenu'
import { useTheme } from '@/theme'

const MAIN_PAGE = 0
const LYRICS_PAGE = 1

export default function PlayerScreen() {
	const theme = useTheme()
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const { width, height } = useWindowDimensions()
	const colorScheme = useColorScheme()
	const isFocused = useIsFocused()
	const track = useCurrentTrack()
	const { isPlaying } = usePlayerState()
	const coverImage = useImage(track?.artwork ?? '', { onError: () => undefined })
	const [palette, setPalette] = useState<ExtractedPalette | null>(null)
	const [isForeground, setIsForeground] = useState(AppState.currentState === 'active')
	const pagerRef = useRef<ScrollViewInstance>(null)
	const [scrollX] = useState(() => new Animated.Value(0))
	const [page, setPage] = useState(MAIN_PAGE)
	const [queueVisible, setQueueVisible] = useState(false)

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (state) => {
			setIsForeground(state === 'active')
		})
		return () => subscription.remove()
	}, [])

	// カバーから代表色を取り出す．新しい結果が届くまでは，いまの配色を保つ
	useEffect(() => {
		if (!coverImage || !isForeground) return
		let cancelled = false
		void ImageThemeColors.extractThemeColorAsync(coverImage)
			.then((result) => {
				if (!cancelled) setPalette(result)
				return undefined
			})
			.catch(() => undefined)
		return () => {
			cancelled = true
		}
	}, [coverImage, isForeground])

	const goTo = useCallback(
		(target: number) => pagerRef.current?.scrollTo({ x: target * width, animated: true }),
		[width],
	)

	// 歌詞のページで戻る操作をしたら，閉じずにメインのページへ戻す
	useFocusEffect(
		useCallback(() => {
			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				if (page === LYRICS_PAGE) {
					goTo(MAIN_PAGE)
					return true
				}
				return false
			})
			return () => subscription.remove()
		}, [page, goTo]),
	)

	const onBack = () => {
		if (page === LYRICS_PAGE) goTo(MAIN_PAGE)
		else router.back()
	}

	const statusOpacity = scrollX.interpolate({
		inputRange: [0, width],
		outputRange: [1, 0],
		extrapolate: 'clamp',
	})
	const titleOpacity = scrollX.interpolate({
		inputRange: [0, width],
		outputRange: [0, 1],
		extrapolate: 'clamp',
	})

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<FluidBackground
				palette={palette}
				fallbackColor={theme.bg}
				colorScheme={colorScheme === 'light' ? 'light' : 'dark'}
				paused={!isFocused || !isPlaying}
			/>
			{/* 上から半分は，文字を読みやすくするために，うっすら暗く（明るい表示では白く）する */}
			<Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
				<Rect x={0} y={0} width={width} height={height}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height * 0.5)}
						colors={
							colorScheme === 'light'
								? ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']
								: ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0)']
						}
					/>
				</Rect>
			</Canvas>

			<View style={[styles.inner, { paddingTop: insets.top }]}>
				<View style={styles.header}>
					<Pressable hitSlop={12} onPress={onBack} style={styles.headerButton}>
						<Icon
							name={page === LYRICS_PAGE ? 'chevron-left' : 'chevron-down'}
							size={28}
							color={theme.text}
						/>
					</Pressable>
					<View style={styles.headerTitle}>
						<Animated.View
							pointerEvents="none"
							style={[styles.headerText, { opacity: statusOpacity }]}
						>
							<Text numberOfLines={1} style={[styles.headerLabel, { color: theme.text }]}>
								{t('再生中')}
							</Text>
						</Animated.View>
						<Animated.View
							pointerEvents="none"
							style={[styles.headerText, { opacity: titleOpacity }]}
						>
							<Text numberOfLines={1} style={[styles.headerLabel, { color: theme.text }]}>
								{track?.title ?? ''}
							</Text>
						</Animated.View>
					</View>
					<Pressable
						hitSlop={12}
						disabled={!track}
						onPress={() => track && openSongMenu(track)}
						style={styles.headerButton}
					>
						<Icon name="dots-vertical" size={26} color={theme.text} />
					</Pressable>
				</View>

				<Animated.ScrollView
					ref={pagerRef}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					style={styles.pager}
					scrollEventThrottle={16}
					onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
						useNativeDriver: true,
					})}
					onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
						setPage(Math.round(e.nativeEvent.contentOffset.x / width))
					}
				>
					<View style={{ width }}>
						<PlayerMain
							onOpenLyrics={() => goTo(LYRICS_PAGE)}
							onOpenQueue={() => setQueueVisible(true)}
						/>
					</View>
					<View style={{ width }}>
						<PlayerLyricsPage />
					</View>
				</Animated.ScrollView>
			</View>

			<QueueSheet visible={queueVisible} onClose={() => setQueueVisible(false)} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	inner: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerButton: { padding: 4 },
	headerTitle: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center' },
	headerText: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
	pager: { flex: 1 },
})
