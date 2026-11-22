import Icon from '@react-native-vector-icons/material-design-icons'
import { Image } from 'expo-image'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { t } from '@/i18n'
import { skipToIndex, usePlayerState } from '@/lib/player/player'
import { useTheme } from '@/theme'

interface QueueSheetProps {
	visible: boolean
	onClose: () => void
}

/** 再生キューの一覧．押した曲へ移る */
export function QueueSheet({ visible, onClose }: QueueSheetProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const { queue, index } = usePlayerState()

	if (!visible) return null

	return (
		<Modal transparent animationType="slide" onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Pressable
					style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 8 }]}
				>
					<Text style={[styles.heading, { color: theme.text }]}>
						{t('再生キュー')} · {queue.length}
					</Text>
					<FlatList
						data={queue}
						keyExtractor={(track, position) => `${position}-${track.id}`}
						initialScrollIndex={Math.max(0, Math.min(index, queue.length - 1))}
						getItemLayout={(_data, position) => ({
							length: ROW_HEIGHT,
							offset: ROW_HEIGHT * position,
							index: position,
						})}
						renderItem={({ item, index: position }) => {
							const playing = position === index
							return (
								<Pressable
									onPress={() => {
										void skipToIndex(position)
										onClose()
									}}
									style={styles.row}
								>
									<Image
										source={item.artwork}
										style={[styles.cover, { backgroundColor: theme.surface }]}
									/>
									<View style={styles.texts}>
										<Text
											numberOfLines={1}
											style={[styles.title, { color: playing ? theme.accent : theme.text }]}
										>
											{item.title}
										</Text>
										<Text numberOfLines={1} style={[styles.artist, { color: theme.sub }]}>
											{item.artist}
										</Text>
									</View>
									{playing ? <Icon name="volume-high" size={20} color={theme.accent} /> : null}
								</Pressable>
							)
						}}
					/>
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const ROW_HEIGHT = 60

const styles = StyleSheet.create({
	backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
	sheet: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 16,
		paddingHorizontal: 16,
		height: '65%',
	},
	heading: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
	row: {
		height: ROW_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	cover: { width: 44, height: 44, borderRadius: 6 },
	texts: { flex: 1 },
	title: { fontSize: 15 },
	artist: { fontSize: 12, marginTop: 2 },
})
