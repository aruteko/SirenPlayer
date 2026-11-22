import Icon from '@react-native-vector-icons/material-design-icons'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { NameDialog } from '@/components/NameDialog'
import { SongRow } from '@/components/SongRow'
import { t } from '@/i18n'
import { playQueue, toggleShuffle, useCurrentTrack, usePlayerState } from '@/lib/player/player'
import { deletePlaylist, renamePlaylist, usePlaylist } from '@/lib/playlists'
import { openSongMenu } from '@/lib/songMenu'
import { useTheme } from '@/theme'

export default function PlaylistScreen() {
	const theme = useTheme()
	const router = useRouter()
	const { id } = useLocalSearchParams<{ id: string }>()
	const playlist = usePlaylist(id)
	const current = useCurrentTrack()
	const player = usePlayerState()
	const [renaming, setRenaming] = useState(false)

	if (!playlist) {
		return (
			<View style={styles.center}>
				<Text style={{ color: theme.sub }}>{t('プレイリストがありません')}</Text>
			</View>
		)
	}

	const confirmDelete = () =>
		Alert.alert(t('プレイリストを削除しますか'), playlist.name, [
			{ text: t('キャンセル'), style: 'cancel' },
			{
				text: t('削除'),
				style: 'destructive',
				onPress: () => {
					deletePlaylist(playlist.id)
					router.back()
				},
			},
		])

	const playInOrder = () => {
		if (player.shuffle) toggleShuffle()
		playQueue(playlist.tracks, 0)
	}

	const playShuffled = () => {
		if (!player.shuffle) toggleShuffle()
		playQueue(playlist.tracks, Math.floor(Math.random() * playlist.tracks.length))
	}

	return (
		<>
			<Stack.Screen options={{ title: playlist.name }} />
			<FlatList
				data={playlist.tracks}
				keyExtractor={(track) => track.id}
				contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 24 }}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text style={[styles.meta, { color: theme.sub }]}>
							{t('{0} 曲', playlist.tracks.length)}
						</Text>
						{playlist.tracks.length > 0 ? (
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
						<View style={styles.actions}>
							<Pressable onPress={() => setRenaming(true)} style={styles.textButton}>
								<Text style={{ color: theme.accent }}>{t('名前を変更')}</Text>
							</Pressable>
							<Pressable onPress={confirmDelete} style={styles.textButton}>
								<Text style={{ color: theme.accent }}>{t('削除')}</Text>
							</Pressable>
						</View>
					</View>
				}
				ListEmptyComponent={
					<Text style={[styles.empty, { color: theme.sub }]}>
						{t('このプレイリストに曲がありません')}
					</Text>
				}
				renderItem={({ item, index }) => (
					<SongRow
						title={item.title}
						subtitle={item.album || item.artist}
						index={index}
						playing={current?.id === item.id}
						onPress={() => playQueue(playlist.tracks, index)}
						trackId={item.id}
						onMore={() => openSongMenu(item, playlist.id)}
					/>
				)}
			/>
			<NameDialog
				visible={renaming}
				title={t('名前を変更')}
				initialValue={playlist.name}
				confirmLabel={t('保存')}
				onCancel={() => setRenaming(false)}
				onSubmit={(name) => {
					renamePlaylist(playlist.id, name)
					setRenaming(false)
				}}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	header: { padding: 16, gap: 12 },
	meta: { fontSize: 13 },
	actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 24,
	},
	actionText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
	textButton: { paddingVertical: 4, paddingRight: 8 },
	empty: { textAlign: 'center', marginTop: 32 },
})
