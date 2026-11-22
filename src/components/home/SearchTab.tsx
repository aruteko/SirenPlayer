import Icon from '@react-native-vector-icons/material-design-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { SongRow } from '@/components/SongRow'
import { t } from '@/i18n'
import { songToTrack, useCatalog } from '@/lib/catalog'
import { playQueue, useCurrentTrack } from '@/lib/player/player'
import { openSongMenu } from '@/lib/songMenu'
import { buildIndex, searchIndex } from '@/lib/search'
import { useTheme } from '@/theme'
import type { SirenAlbum, SirenSongListItem } from '@/types/siren'

const MAX_ALBUMS = 30
const MAX_SONGS = 200

type Item =
	| { key: string; kind: 'header'; title: string }
	| { key: string; kind: 'album'; album: SirenAlbum }
	| { key: string; kind: 'song'; song: SirenSongListItem }

interface SearchTabProps {
	query: string
	onChangeQuery: (query: string) => void
}

export function SearchTab({ query, onChangeQuery }: SearchTabProps) {
	const theme = useTheme()
	const router = useRouter()
	const current = useCurrentTrack()
	const { albums, songs, albumByCid } = useCatalog()

	const albumIndex = useMemo(
		() => buildIndex(albums.data ?? [], (album) => `${album.name} ${album.artistes.join(' ')}`),
		[albums.data],
	)
	const songIndex = useMemo(
		() =>
			buildIndex(
				songs.data ?? [],
				(song) =>
					`${song.name} ${song.artists.join(' ')} ${albumByCid.get(song.albumCid)?.name ?? ''}`,
			),
		[songs.data, albumByCid],
	)

	const { items, songHits } = useMemo(() => {
		const albumHits = searchIndex(albumIndex, query, MAX_ALBUMS)
		const hits = searchIndex(songIndex, query, MAX_SONGS)
		const list: Item[] = []
		if (albumHits.length > 0) {
			list.push({ key: 'h-albums', kind: 'header', title: t('アルバム') })
			for (const album of albumHits) {
				list.push({ key: `a-${album.cid}`, kind: 'album', album })
			}
		}
		if (hits.length > 0) {
			list.push({ key: 'h-songs', kind: 'header', title: t('曲') })
			for (const song of hits) {
				list.push({ key: `s-${song.cid}`, kind: 'song', song })
			}
		}
		return { items: list, songHits: hits }
	}, [albumIndex, songIndex, query])

	const trackOf = (song: SirenSongListItem) => songToTrack(song, albumByCid.get(song.albumCid))

	const loading = albums.isPending || songs.isPending
	const failed = albums.isError || songs.isError

	return (
		<View style={styles.container}>
			<View style={[styles.inputBox, { backgroundColor: theme.surface }]}>
				<Icon name="magnify" size={20} color={theme.sub} />
				<TextInput
					value={query}
					onChangeText={onChangeQuery}
					placeholder={t('曲名，アーティスト，アルバムで検索')}
					placeholderTextColor={theme.sub}
					autoCorrect={false}
					returnKeyType="search"
					style={[styles.input, { color: theme.text }]}
				/>
				{query.length > 0 ? (
					<Pressable hitSlop={8} onPress={() => onChangeQuery('')}>
						<Icon name="close-circle" size={20} color={theme.sub} />
					</Pressable>
				) : null}
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator color={theme.accent} />
				</View>
			) : failed ? (
				<View style={styles.center}>
					<Text style={{ color: theme.sub }}>{t('アルバムを取得できませんでした')}</Text>
					<Pressable
						onPress={() => {
							void albums.refetch()
							void songs.refetch()
						}}
						style={styles.retry}
					>
						<Text style={{ color: theme.accent }}>{t('再読み込み')}</Text>
					</Pressable>
				</View>
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.key}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 24 }}
					ListEmptyComponent={
						query.trim().length > 0 ? (
							<Text style={[styles.empty, { color: theme.sub }]}>
								{t('一致するものがありません')}
							</Text>
						) : undefined
					}
					renderItem={({ item }) => {
						if (item.kind === 'header') {
							return <Text style={[styles.header, { color: theme.sub }]}>{item.title}</Text>
						}
						if (item.kind === 'album') {
							return (
								<Pressable
									onPress={() => router.push(`/album/${item.album.cid}`)}
									style={styles.albumRow}
								>
									<Image
										source={item.album.coverUrl}
										style={[styles.albumCover, { backgroundColor: theme.surface }]}
									/>
									<Text numberOfLines={2} style={[styles.albumName, { color: theme.text }]}>
										{item.album.name.trim()}
									</Text>
								</Pressable>
							)
						}
						const song = item.song
						return (
							<SongRow
								title={song.name}
								subtitle={albumByCid.get(song.albumCid)?.name.trim() ?? ''}
								playing={current?.id === song.cid}
								onPress={() =>
									playQueue(
										songHits.map(trackOf),
										songHits.findIndex((hit) => hit.cid === song.cid),
									)
								}
								trackId={song.cid}
								onMore={() => openSongMenu(trackOf(song))}
							/>
						)
					}}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	inputBox: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		margin: 12,
		paddingHorizontal: 12,
		borderRadius: 24,
	},
	input: { flex: 1, fontSize: 15, paddingVertical: 8 },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	retry: { marginTop: 12, padding: 8 },
	empty: { textAlign: 'center', marginTop: 32 },
	header: {
		fontSize: 13,
		fontWeight: '600',
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 4,
	},
	albumRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		gap: 12,
	},
	albumCover: { width: 48, height: 48, borderRadius: 6 },
	albumName: { flex: 1, fontSize: 15 },
})
