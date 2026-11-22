import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from 'react-native'

import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer'
import { t } from '@/i18n'
import { useCatalog } from '@/lib/catalog'
import { useTheme } from '@/theme'

const COLUMNS = 2
const GAP = 12

export function AlbumsTab() {
	const theme = useTheme()
	const router = useRouter()
	const { width } = useWindowDimensions()
	const itemSize = (width - GAP * (COLUMNS + 1)) / COLUMNS
	const { data, isPending, isError, refetch } = useCatalog().albums

	// 一覧か，失敗の表示が出る段階になったら，起動画面を閉じる
	useEffect(() => {
		if (!isPending) void SplashScreen.hideAsync()
	}, [isPending])

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
				<Text style={{ color: theme.sub }}>{t('アルバムを取得できませんでした')}</Text>
				<Pressable onPress={() => void refetch()} style={styles.retry}>
					<Text style={{ color: theme.accent }}>{t('再読み込み')}</Text>
				</Pressable>
			</View>
		)
	}

	return (
		<FlatList
			data={data}
			keyExtractor={(album) => album.cid}
			numColumns={COLUMNS}
			contentContainerStyle={{
				padding: GAP / 2,
				paddingBottom: MINI_PLAYER_HEIGHT + 24,
			}}
			renderItem={({ item }) => (
				<Pressable
					onPress={() => router.push(`/album/${item.cid}`)}
					style={{ width: itemSize, margin: GAP / 2 }}
				>
					<Image
						source={item.coverUrl}
						style={[
							styles.cover,
							{ width: itemSize, height: itemSize, backgroundColor: theme.surface },
						]}
					/>
					<Text numberOfLines={2} style={[styles.name, { color: theme.text }]}>
						{item.name.trim()}
					</Text>
				</Pressable>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	retry: { marginTop: 12, padding: 8 },
	cover: { borderRadius: 8 },
	name: { marginTop: 6, fontSize: 13, lineHeight: 18 },
})
