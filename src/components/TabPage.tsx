import { useFocusEffect } from 'expo-router'
import { type ReactNode, useCallback, useRef } from 'react'
import { type ViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-screens/experimental'

import { setTabBarHeight } from '@/lib/tabBar'
import { useTheme } from '@/theme'

interface TabPageProps {
	title: string
	/** 見出しの右端に置くもの */
	right?: ReactNode
	children: ReactNode
}

/** タブ画面の共通の枠．見出しを出し，下のタブバーの高さを測って再生バーへ伝える */
export function TabPage({ title, right, children }: TabPageProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const { height: windowHeight } = useWindowDimensions()
	const contentRef = useRef<ViewInstance>(null)

	const measure = useCallback(() => {
		contentRef.current?.measureInWindow((_x, y, _width, height) => {
			if (height > 0) setTabBarHeight(Math.max(0, windowHeight - y - height))
		})
	}, [windowHeight])

	useFocusEffect(
		useCallback(() => {
			measure()
			return () => setTabBarHeight(0)
		}, [measure]),
	)

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<Text style={[styles.title, { color: theme.text }]}>{title}</Text>
				{right}
			</View>
			{/* タブバーの高さぶんの下余白を，ネイティブ側から受け取る */}
			<SafeAreaView style={styles.content} edges={{ bottom: true }} insetType="all">
				<View ref={contentRef} collapsable={false} style={styles.content} onLayout={measure}>
					{children}
				</View>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	title: { fontSize: 22, fontWeight: '700' },
	content: { flex: 1 },
})
