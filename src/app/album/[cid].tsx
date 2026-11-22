import type { AudioTrack } from '@siren/audio'
import Icon from '@react-native-vector-icons/material-design-icons'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { SongRow } from '@/components/SongRow'
import { t } from '@/i18n'
import { sirenApi } from '@/lib/api/siren'
import { playQueue, toggleShuffle, useCurrentTrack, usePlayerState } from '@/lib/player/player'
import { downloadTracks } from '@/lib/downloads'
import { openSongMenu } from '@/lib/songMenu'
import { useTheme } from '@/theme'

export default function AlbumScreen() {
	const theme = useTheme()
	const { cid } = useLocalSearchParams<{ cid: string }>()
	const current = useCurrentTrack()
	const player = usePlayerState()
	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ['album', cid],
		queryFn: () => sirenApi.getAlbumDetail(cid),
	})

	const tracks = useMemo<AudioTrack[]>(
		() =>
			(data?.songs ?? []).map((song) => ({
				id: song.cid,
				title: song.name,
				artist: song.artistes.join(' / '),
				album: data?.name ?? '',
				artwork: data?.coverUrl ?? '',
			})),
		[data],
	)

	if (isPending) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={theme.accent} />
			</View>
		)
	}

	if (isError) {
		return (
			<View style={styles.center}>
				<Text style={{ color: theme.sub }}>{t('曲を取得できませんでした')}</Text>
				<Pressable onPress={() => void refetch()} style={styles.retry}>
					<Text style={{ color: theme.accent }}>{t('再読み込み')}</Text>
				</Pressable>
			</View>
		)
	}

	const playShuffled = () => {
		if (!player.shuffle) toggleShuffle()
		playQueue(tracks, Math.floor(Math.random() * tracks.length))
	}

	const playInOrder = () => {
		if (player.shuffle) toggleShuffle()
		playQueue(tracks, 0)
	}

	return (
		<FlatList
			data={tracks}
			keyExtractor={(track) => track.id}
			contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 24 }}
			ListHeaderComponent={
				<View style={styles.header}>
					<Image
						source={data.coverUrl}
						style={[styles.cover, { backgroundColor: theme.surface }]}
					/>
					<Text style={[styles.albumName, { color: theme.text }]}>{data.name.trim()}</Text>
					<Text style={[styles.meta, { color: theme.sub }]}>{t('{0} 曲', data.songs.length)}</Text>
					{data.intro ? (
						<Text style={[styles.intro, { color: theme.sub }]}>{data.intro}</Text>
					) : null}
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
							<Text style={[styles.actionText, { color: theme.text }]}>{t('シャッフル再生')}</Text>
						</Pressable>
						<Pressable
							onPress={() => downloadTracks(tracks)}
							style={[styles.action, { backgroundColor: theme.surface }]}
						>
							<Icon name="download-outline" size={20} color={theme.text} />
							<Text style={[styles.actionText, { color: theme.text }]}>
								{t('すべてダウンロード')}
							</Text>
						</Pressable>
					</View>
				</View>
			}
			renderItem={({ item, index }) => (
				<SongRow
					title={item.title}
					subtitle={item.artist}
					index={index}
					trackId={item.id}
					playing={current?.id === item.id}
					onPress={() => playQueue(tracks, index)}
					onMore={() => openSongMenu(item)}
				/>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	retry: { marginTop: 12, padding: 8 },
	header: { alignItems: 'center', padding: 16 },
	cover: { width: 220, height: 220, borderRadius: 12 },
	albumName: { marginTop: 16, fontSize: 20, fontWeight: '700', textAlign: 'center' },
	meta: { marginTop: 4, fontSize: 13 },
	intro: { marginTop: 12, fontSize: 13, lineHeight: 20 },
	actions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
		marginTop: 16,
	},
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 24,
	},
	actionText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
})
