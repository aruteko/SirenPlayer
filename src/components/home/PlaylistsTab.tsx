import Icon from '@react-native-vector-icons/material-design-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { NameDialog } from '@/components/NameDialog'
import { t } from '@/i18n'
import { useDownloads } from '@/lib/downloads'
import { createPlaylist, usePlaylists } from '@/lib/playlists'
import { useTheme } from '@/theme'

export function PlaylistsTab() {
	const theme = useTheme()
	const router = useRouter()
	const playlists = usePlaylists()
	const downloadCount = Object.values(useDownloads()).filter(
		(item) => item.status === 'done',
	).length
	const [creating, setCreating] = useState(false)

	return (
		<View style={styles.container}>
			<FlatList
				data={playlists}
				keyExtractor={(playlist) => playlist.id}
				contentContainerStyle={{ paddingBottom: MINI_PLAYER_HEIGHT + 24 }}
				ListHeaderComponent={
					<View>
						<Pressable onPress={() => router.push('/downloads')} style={styles.row}>
							<View style={[styles.cover, { backgroundColor: theme.surface }]}>
								<Icon name="download-outline" size={26} color={theme.accent} />
							</View>
							<View style={styles.texts}>
								<Text style={[styles.name, { color: theme.text }]}>{t('ダウンロード済み')}</Text>
								<Text style={[styles.count, { color: theme.sub }]}>
									{t('{0} 曲', downloadCount)}
								</Text>
							</View>
						</Pressable>
						<Pressable onPress={() => setCreating(true)} style={styles.row}>
							<View style={[styles.cover, { backgroundColor: theme.surface }]}>
								<Icon name="plus" size={26} color={theme.accent} />
							</View>
							<Text style={[styles.name, { color: theme.accent }]}>{t('新しいプレイリスト')}</Text>
						</Pressable>
					</View>
				}
				ListEmptyComponent={
					<Text style={[styles.empty, { color: theme.sub }]}>{t('プレイリストがありません')}</Text>
				}
				renderItem={({ item }) => (
					<Pressable onPress={() => router.push(`/playlist/${item.id}`)} style={styles.row}>
						{item.tracks[0]?.artwork ? (
							<Image
								source={item.tracks[0].artwork}
								style={[styles.cover, { backgroundColor: theme.surface }]}
							/>
						) : (
							<View style={[styles.cover, { backgroundColor: theme.surface }]}>
								<Icon name="playlist-music" size={26} color={theme.sub} />
							</View>
						)}
						<View style={styles.texts}>
							<Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
								{item.name}
							</Text>
							<Text style={[styles.count, { color: theme.sub }]}>
								{t('{0} 曲', item.tracks.length)}
							</Text>
						</View>
					</Pressable>
				)}
			/>
			<NameDialog
				visible={creating}
				title={t('新しいプレイリスト')}
				confirmLabel={t('作成')}
				onCancel={() => setCreating(false)}
				onSubmit={(name) => {
					createPlaylist(name)
					setCreating(false)
				}}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	cover: { width: 52, height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
	texts: { flex: 1 },
	name: { fontSize: 15 },
	count: { fontSize: 12, marginTop: 2 },
	empty: { textAlign: 'center', marginTop: 32 },
})
