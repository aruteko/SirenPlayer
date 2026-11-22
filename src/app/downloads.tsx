import Icon from '@react-native-vector-icons/material-design-icons'
import { useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { SongRow } from '@/components/SongRow'
import { t } from '@/i18n'
import { totalDownloadedBytes, useDownloads } from '@/lib/downloads'
import { formatBytes } from '@/lib/format'
import { playQueue, toggleShuffle, useCurrentTrack, usePlayerState } from '@/lib/player/player'
import { openSongMenu } from '@/lib/songMenu'
import { useTheme } from '@/theme'

export default function DownloadsScreen() {
	const theme = useTheme()
	const downloads = useDownloads()
	const current = useCurrentTrack()
	const player = usePlayerState()

	const items = useMemo(() => Object.values(downloads), [downloads])
	const tracks = useMemo(
		() => items.filter((item) => item.status === 'done').map((item) => item.track),
		[items],
	)

	const playInOrder = () => {
		if (player.shuffle) toggleShuffle()
		playQueue(tracks, 0)
	}

	const playShuffled = () => {
		if (!player.shuffle) toggleShuffle()
		playQueue(tracks, Math.floor(Math.random() * tracks.length))
	}

	return (
		<FlatList
			data={items}
			keyExtractor={(item) => item.track.id}
			contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 24 }}
			ListHeaderComponent={
				<View style={styles.header}>
					<Text style={[styles.meta, { color: theme.sub }]}>
						{t('{0} 曲', tracks.length)} · {formatBytes(totalDownloadedBytes(downloads))}
					</Text>
					{tracks.length > 0 ? (
						<View style={styles.actions}>
							<Pressable
								onPress={playInOrder}
								style={[styles.action, { backgroundColor: theme.accent }]}
							>
								<Icon name="play" size={20} color="#ffffff" />
								<Text style={styles.actionText}>{t('すべて再生')}</Text>
							</Pressable>
							<Pressable
								onPress={playShuffled}
								style={[styles.action, { backgroundColor: theme.surface }]}
							>
								<Icon name="shuffle" size={20} color={theme.text} />
								<Text style={[styles.actionText, { color: theme.text }]}>
									{t('シャッフル再生')}
								</Text>
							</Pressable>
						</View>
					) : null}
				</View>
			}
			ListEmptyComponent={
				<Text style={[styles.empty, { color: theme.sub }]}>
					{t('ダウンロードした曲がありません')}
				</Text>
			}
			renderItem={({ item }) => (
				<SongRow
					title={item.track.title}
					subtitle={item.track.album || item.track.artist}
					trackId={item.track.id}
					playing={current?.id === item.track.id}
					onPress={() =>
						playQueue(
							tracks,
							tracks.findIndex((track) => track.id === item.track.id),
						)
					}
					onMore={() => openSongMenu(item.track)}
				/>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	header: { padding: 16, gap: 12 },
	meta: { fontSize: 13 },
	actions: { flexDirection: 'row', gap: 12 },
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 24,
	},
	actionText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
	empty: { textAlign: 'center', marginTop: 32 },
})
