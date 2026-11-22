import { useEffect, useRef, useState } from 'react'
import {
	type LayoutChangeEvent,
	Pressable,
	ScrollView,
	type ScrollViewInstance,
	StyleSheet,
	Text,
} from 'react-native'

import { findActiveLine, type LyricLine } from '@/lib/lyrics'
import { seekTo, useProgress } from '@/lib/player/player'
import { useTheme } from '@/theme'

/** 歌詞を表示し，いまの行を強調して中央へスクロールする．行を押すと，その位置へ移る */
export function LyricsView({ lines }: { lines: LyricLine[] }) {
	const theme = useTheme()
	const { position } = useProgress()
	const scrollRef = useRef<ScrollViewInstance>(null)
	const layouts = useRef(new Map<number, { y: number; height: number }>())
	const [viewHeight, setViewHeight] = useState(0)
	const active = findActiveLine(lines, position)

	useEffect(() => {
		const layout = layouts.current.get(active)
		if (!layout || viewHeight === 0) return
		scrollRef.current?.scrollTo({
			y: Math.max(0, layout.y - viewHeight / 2 + layout.height / 2),
			animated: true,
		})
	}, [active, viewHeight])

	return (
		<ScrollView
			ref={scrollRef}
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
			onLayout={(e: LayoutChangeEvent) => setViewHeight(e.nativeEvent.layout.height)}
		>
			{lines.map((line, index) => (
				<Pressable
					key={line.id}
					onPress={() => void seekTo(line.time)}
					onLayout={(e) =>
						layouts.current.set(index, {
							y: e.nativeEvent.layout.y,
							height: e.nativeEvent.layout.height,
						})
					}
				>
					<Text
						style={[
							styles.line,
							index === active
								? { color: theme.accent, fontWeight: '700', fontSize: 22 }
								: { color: theme.sub },
						]}
					>
						{line.text || ' '}
					</Text>
				</Pressable>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scroll: { flex: 1 },
	content: { paddingVertical: 120, paddingHorizontal: 24 },
	line: { fontSize: 18, lineHeight: 30, textAlign: 'center', paddingVertical: 8 },
})
