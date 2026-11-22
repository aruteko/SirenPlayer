import Icon from '@react-native-vector-icons/material-design-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useDownloadItem } from '@/lib/downloads'
import { useTheme } from '@/theme'

interface SongRowProps {
	title: string
	subtitle: string
	/** 左に出す番号．省略すると出さない */
	index?: number
	/** 曲の id．渡すと，ダウンロードの状態を右に出す */
	trackId?: string
	playing: boolean
	onPress: () => void
	onMore: () => void
}

export function SongRow({
	title,
	subtitle,
	index,
	trackId,
	playing,
	onPress,
	onMore,
}: SongRowProps) {
	const theme = useTheme()
	const download = useDownloadItem(trackId)
	const percent =
		download && download.total > 0 ? Math.floor((download.bytes / download.total) * 100) : 0
	return (
		<Pressable onPress={onPress} style={[styles.row, { borderColor: theme.border }]}>
			{index === undefined ? null : (
				<View style={styles.index}>
					{playing ? (
						<Icon name="volume-high" size={18} color={theme.accent} />
					) : (
						<Text style={{ color: theme.sub }}>{index + 1}</Text>
					)}
				</View>
			)}
			<View style={styles.texts}>
				<Text
					numberOfLines={1}
					style={[styles.title, { color: playing ? theme.accent : theme.text }]}
				>
					{title}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, { color: theme.sub }]}>
					{subtitle}
				</Text>
			</View>
			{download?.status === 'done' ? (
				<Icon name="check-circle" size={18} color={theme.accent} />
			) : download?.status === 'downloading' ? (
				<Text style={[styles.state, { color: theme.accent }]}>{percent}%</Text>
			) : download?.status === 'queued' ? (
				<Icon name="timer-sand" size={18} color={theme.sub} />
			) : download?.status === 'failed' ? (
				<Icon name="alert-circle-outline" size={18} color={theme.sub} />
			) : null}
			<Pressable hitSlop={10} onPress={onMore} style={styles.more}>
				<Icon name="dots-vertical" size={22} color={theme.sub} />
			</Pressable>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 16,
		paddingRight: 8,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	index: { width: 32, alignItems: 'center', marginRight: 8 },
	texts: { flex: 1 },
	title: { fontSize: 15 },
	subtitle: { fontSize: 12, marginTop: 2 },
	state: { fontSize: 12, fontWeight: '600' },
	more: { padding: 8 },
})
