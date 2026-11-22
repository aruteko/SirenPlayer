import Icon from '@react-native-vector-icons/material-design-icons'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { NameDialog } from '@/components/NameDialog'
import { t } from '@/i18n'
import {
	addToPlaylist,
	closeAddToPlaylist,
	createPlaylist,
	useAddToPlaylistTarget,
	usePlaylists,
} from '@/lib/playlists'
import { useTheme } from '@/theme'

/** 曲をどのプレイリストに入れるかを選ぶ下からの画面．ルートに一つだけ置く */
export function AddToPlaylistSheet() {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const track = useAddToPlaylistTarget()
	const playlists = usePlaylists()
	const [creating, setCreating] = useState(false)

	if (!track) return null

	return (
		<>
			<Modal transparent animationType="slide" onRequestClose={closeAddToPlaylist}>
				<Pressable style={styles.backdrop} onPress={closeAddToPlaylist}>
					<Pressable
						style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 8 }]}
					>
						<Text style={[styles.heading, { color: theme.text }]}>{t('プレイリストに追加')}</Text>
						<Text numberOfLines={1} style={[styles.track, { color: theme.sub }]}>
							{track.title}
						</Text>
						<ScrollView style={styles.list}>
							<Pressable onPress={() => setCreating(true)} style={styles.item}>
								<Icon name="plus" size={22} color={theme.accent} />
								<Text style={[styles.itemName, { color: theme.accent }]}>
									{t('新しいプレイリスト')}
								</Text>
							</Pressable>
							{playlists.map((playlist) => {
								const included = playlist.tracks.some((item) => item.id === track.id)
								return (
									<Pressable
										key={playlist.id}
										disabled={included}
										onPress={() => {
											addToPlaylist(playlist.id, track)
											closeAddToPlaylist()
										}}
										style={styles.item}
									>
										<Icon
											name={included ? 'check' : 'playlist-music'}
											size={22}
											color={included ? theme.accent : theme.sub}
										/>
										<Text
											numberOfLines={1}
											style={[styles.itemName, { color: included ? theme.sub : theme.text }]}
										>
											{playlist.name}
										</Text>
										<Text style={{ color: theme.sub }}>
											{included ? t('追加済み') : t('{0} 曲', playlist.tracks.length)}
										</Text>
									</Pressable>
								)
							})}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
			<NameDialog
				visible={creating}
				title={t('新しいプレイリスト')}
				confirmLabel={t('作成')}
				onCancel={() => setCreating(false)}
				onSubmit={(name) => {
					createPlaylist(name, [track])
					setCreating(false)
					closeAddToPlaylist()
				}}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	sheet: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 16,
		paddingHorizontal: 16,
		maxHeight: '70%',
	},
	heading: { fontSize: 17, fontWeight: '700' },
	track: { fontSize: 13, marginTop: 2, marginBottom: 8 },
	list: { flexGrow: 0 },
	item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
	itemName: { flex: 1, fontSize: 15 },
})
