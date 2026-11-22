import { RepeatMode } from '@siren/audio'
import Icon from '@react-native-vector-icons/material-design-icons'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ProgressBar } from '@/components/ProgressBar'
import { downloadTrack, removeDownload, useDownloadItem } from '@/lib/downloads'
import {
	cycleRepeatMode,
	skipToNext,
	skipToPrevious,
	toggleShuffle,
	togglePlay,
	useCurrentTrack,
	usePlayerState,
} from '@/lib/player/player'
import { openSongMenu } from '@/lib/songMenu'
import { t } from '@/i18n'
import { useTheme } from '@/theme'

interface PlayerMainProps {
	onOpenLyrics: () => void
	onOpenQueue: () => void
}

/** プレーヤーのメインのページ．丸いカバー，曲名，進捗，操作ボタン */
export function PlayerMain({ onOpenLyrics, onOpenQueue }: PlayerMainProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const track = useCurrentTrack()
	const { isPlaying, repeatMode, shuffle, error } = usePlayerState()
	const download = useDownloadItem(track?.id)
	const [size, setSize] = useState({ width: 0, height: 0 })
	const [coverArea, setCoverArea] = useState({ width: 0, height: 0 })
	const [titleExpanded, setTitleExpanded] = useState(false)

	if (!track) return null

	const compact = size.height - insets.bottom < 600 || size.width < 360
	const coverSize = Math.max(0, Math.min(coverArea.width - 120, coverArea.height - 24, 400))

	const repeatIcon =
		repeatMode === RepeatMode.TRACK
			? 'repeat-once'
			: repeatMode === RepeatMode.QUEUE
				? 'repeat'
				: 'repeat-off'

	const downloadIcon =
		download?.status === 'done'
			? 'check-circle'
			: download?.status === 'downloading' || download?.status === 'queued'
				? 'close-circle-outline'
				: 'download-outline'

	const onDownloadPress = () => {
		if (download?.status === 'done') openSongMenu(track)
		else if (download?.status === 'downloading' || download?.status === 'queued') {
			removeDownload(track.id)
		} else downloadTrack(track)
	}

	return (
		<View style={styles.container} onLayout={(e) => setSize(e.nativeEvent.layout)}>
			<View style={styles.trackArea}>
				<Pressable
					style={[styles.coverArea, { maxHeight: Math.max(0, coverArea.width - 32) }]}
					onLayout={(e) => setCoverArea(e.nativeEvent.layout)}
					onPress={onOpenLyrics}
				>
					<Image
						source={track.artwork}
						style={{
							width: coverSize,
							height: coverSize,
							borderRadius: coverSize / 2,
							backgroundColor: theme.surface,
						}}
						recyclingKey={track.id}
						transition={300}
					/>
				</Pressable>

				<View style={styles.info}>
					<Pressable onPress={() => setTitleExpanded((expanded) => !expanded)}>
						<Text
							numberOfLines={titleExpanded ? 3 : 1}
							style={[styles.title, { color: theme.text }]}
						>
							{track.title}
						</Text>
					</Pressable>
					<Text numberOfLines={1} style={[styles.artist, { color: theme.sub }]}>
						{track.artist}
					</Text>
					{error ? (
						<Text style={[styles.error, { color: theme.accent }]}>{t('再生できませんでした')}</Text>
					) : null}
				</View>
			</View>

			<View style={[styles.controls, { paddingBottom: insets.bottom + (compact ? 8 : 20) }]}>
				<ProgressBar />
				<View style={[styles.main, { marginTop: compact ? 8 : 24, gap: compact ? 24 : 40 }]}>
					<Pressable hitSlop={8} onPress={() => void skipToPrevious()}>
						<Icon name="skip-previous" size={compact ? 40 : 46} color={theme.sub} />
					</Pressable>
					<Pressable hitSlop={8} onPress={togglePlay}>
						<Icon
							name={isPlaying ? 'pause-circle' : 'play-circle'}
							size={compact ? 80 : 96}
							color={theme.accent}
						/>
					</Pressable>
					<Pressable hitSlop={8} onPress={() => void skipToNext()}>
						<Icon name="skip-next" size={compact ? 40 : 46} color={theme.sub} />
					</Pressable>
				</View>
				<View style={[styles.secondary, compact ? styles.secondaryCompact : null]}>
					<Pressable hitSlop={8} onPress={toggleShuffle}>
						<Icon
							name={shuffle ? 'shuffle-variant' : 'shuffle-disabled'}
							size={24}
							color={shuffle ? theme.accent : theme.sub}
						/>
					</Pressable>
					<Pressable hitSlop={8} onPress={cycleRepeatMode}>
						<Icon
							name={repeatIcon}
							size={24}
							color={repeatMode === RepeatMode.OFF ? theme.sub : theme.accent}
						/>
					</Pressable>
					<Pressable hitSlop={8} onPress={onDownloadPress}>
						<Icon
							name={downloadIcon}
							size={24}
							color={download?.status === 'done' ? theme.accent : theme.sub}
						/>
					</Pressable>
					<Pressable hitSlop={8} onPress={onOpenQueue}>
						<Icon name="format-list-bulleted" size={24} color={theme.sub} />
					</Pressable>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, minHeight: 0 },
	trackArea: { flex: 1, minHeight: 0 },
	coverArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	info: { paddingHorizontal: 24, paddingBottom: 8 },
	title: { fontSize: 22, fontWeight: '700' },
	artist: { fontSize: 14, marginTop: 2 },
	error: { fontSize: 13, marginTop: 4 },
	controls: { flexShrink: 0, paddingTop: 8, paddingHorizontal: 24 },
	main: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
	secondary: {
		marginTop: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 32,
	},
	secondaryCompact: { gap: 12, marginTop: 4 },
})
