import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { LyricsView } from '@/components/LyricsView'
import { t } from '@/i18n'
import { useCurrentTrack } from '@/lib/player/player'
import { useLyrics } from '@/lib/useLyrics'
import { useTheme } from '@/theme'

/** プレーヤーの歌詞のページ．歌詞がない曲では，その旨を短く出す */
export function PlayerLyricsPage() {
	const theme = useTheme()
	const track = useCurrentTrack()
	const lyrics = useLyrics(track?.id)

	if (lyrics.isPending) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={theme.accent} />
				<Text style={[styles.notice, { color: theme.sub }]}>{t('歌詞を読み込み中')}</Text>
			</View>
		)
	}

	if (lyrics.isError) {
		return (
			<View style={styles.center}>
				<Text style={[styles.notice, { color: theme.sub }]}>{t('歌詞を取得できませんでした')}</Text>
				<Text style={[styles.notice, { color: theme.sub }]}>{lyrics.error.message}</Text>
				<Pressable onPress={() => void lyrics.refetch()}>
					<Text style={{ color: theme.accent }}>{t('再読み込み')}</Text>
				</Pressable>
			</View>
		)
	}

	if (lyrics.data.length === 0) {
		return (
			<View style={styles.center}>
				<Text style={[styles.notice, { color: theme.sub }]}>{t('この曲に歌詞はありません')}</Text>
			</View>
		)
	}

	return <LyricsView lines={lyrics.data} />
}

const styles = StyleSheet.create({
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
	notice: { fontSize: 13 },
})
