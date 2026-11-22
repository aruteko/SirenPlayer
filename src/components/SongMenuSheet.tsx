import Icon from '@react-native-vector-icons/material-design-icons'
import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { t } from '@/i18n'
import { downloadTrack, removeDownload, useDownloadItem } from '@/lib/downloads'
import { openAddToPlaylist, removeFromPlaylist } from '@/lib/playlists'
import { closeSongMenu, useSongMenuTarget } from '@/lib/songMenu'
import { useTheme } from '@/theme'

type IconName = React.ComponentProps<typeof Icon>['name']

interface MenuRowProps {
	icon: IconName
	label: string
	onPress: () => void
	destructive?: boolean
}

function MenuRow({ icon, label, onPress, destructive = false }: MenuRowProps) {
	const theme = useTheme()
	const color = destructive ? '#e5484d' : theme.text
	return (
		<Pressable onPress={onPress} style={styles.row}>
			<Icon name={icon} size={22} color={color} />
			<Text style={[styles.label, { color }]}>{label}</Text>
		</Pressable>
	)
}

/** 曲のメニュー．プレイリストへの追加，ダウンロード，プレイリストから外す，を出す．ルートに一つだけ置く */
export function SongMenuSheet() {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const target = useSongMenuTarget()
	const download = useDownloadItem(target?.track.id)

	if (!target) return null
	const { track, removeFromPlaylistId } = target

	const percent =
		download && download.total > 0 ? Math.floor((download.bytes / download.total) * 100) : 0

	return (
		<Modal transparent animationType="slide" onRequestClose={closeSongMenu}>
			<Pressable style={styles.backdrop} onPress={closeSongMenu}>
				<Pressable
					style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 8 }]}
				>
					<Text numberOfLines={1} style={[styles.heading, { color: theme.text }]}>
						{track.title}
					</Text>
					<Text numberOfLines={1} style={[styles.sub, { color: theme.sub }]}>
						{track.artist}
					</Text>
					<MenuRow
						icon="playlist-plus"
						label={t('プレイリストに追加')}
						onPress={() => {
							closeSongMenu()
							openAddToPlaylist(track)
						}}
					/>
					{download === undefined || download.status === 'failed' ? (
						<MenuRow
							icon="download-outline"
							label={
								download?.status === 'failed'
									? t('ダウンロードに失敗しました．もう一度行う')
									: t('ダウンロード')
							}
							onPress={() => {
								closeSongMenu()
								downloadTrack(track)
							}}
						/>
					) : download.status === 'done' ? (
						<MenuRow
							icon="delete-outline"
							label={t('ダウンロードを削除')}
							destructive
							onPress={() => {
								closeSongMenu()
								removeDownload(track.id)
							}}
						/>
					) : (
						<MenuRow
							icon="close-circle-outline"
							label={
								download.status === 'queued'
									? t('ダウンロードの待機を取り消す')
									: t('ダウンロード中 {0}% を取り消す', percent)
							}
							onPress={() => {
								closeSongMenu()
								removeDownload(track.id)
							}}
						/>
					)}
					{removeFromPlaylistId ? (
						<MenuRow
							icon="playlist-remove"
							label={t('プレイリストから外す')}
							destructive
							onPress={() => {
								closeSongMenu()
								removeFromPlaylist(removeFromPlaylistId, track.id)
							}}
						/>
					) : null}
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	sheet: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	heading: { fontSize: 17, fontWeight: '700' },
	sub: { fontSize: 13, marginTop: 2, marginBottom: 8 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
	label: { flex: 1, fontSize: 15 },
})
