import { useRef, useState } from 'react'
import {
	type GestureResponderEvent,
	type LayoutChangeEvent,
	StyleSheet,
	Text,
	View,
} from 'react-native'

import { formatTime } from '@/lib/format'
import { seekTo, useProgress } from '@/lib/player/player'
import { useTheme } from '@/theme'

const THUMB = 14

/** タップとドラッグで位置を決められる進捗バー．読み込み済みの範囲も薄く示す */
export function ProgressBar() {
	const theme = useTheme()
	const { position, duration, buffered } = useProgress()
	const [width, setWidth] = useState(0)
	const [dragRatio, setDragRatio] = useState<number | null>(null)
	const ratioRef = useRef(0)

	const toRatio = (e: GestureResponderEvent) =>
		width > 0 ? Math.min(1, Math.max(0, e.nativeEvent.locationX / width)) : 0

	const ratio = dragRatio ?? (duration > 0 ? Math.min(1, position / duration) : 0)
	const bufferedRatio = duration > 0 ? Math.min(1, buffered / duration) : 0

	const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)

	return (
		<View>
			<View
				style={styles.touch}
				onLayout={onLayout}
				onStartShouldSetResponder={() => duration > 0}
				onMoveShouldSetResponder={() => duration > 0}
				onResponderGrant={(e) => {
					ratioRef.current = toRatio(e)
					setDragRatio(ratioRef.current)
				}}
				onResponderMove={(e) => {
					ratioRef.current = toRatio(e)
					setDragRatio(ratioRef.current)
				}}
				onResponderRelease={() => {
					void seekTo(ratioRef.current * duration)
					setDragRatio(null)
				}}
				onResponderTerminate={() => setDragRatio(null)}
			>
				<View pointerEvents="none" style={[styles.track, { backgroundColor: theme.border }]}>
					<View
						style={[
							styles.fill,
							{ backgroundColor: theme.sub, opacity: 0.4, width: `${bufferedRatio * 100}%` },
						]}
					/>
					<View
						style={[styles.fill, { backgroundColor: theme.accent, width: `${ratio * 100}%` }]}
					/>
				</View>
				<View
					pointerEvents="none"
					style={[
						styles.thumb,
						{
							backgroundColor: theme.accent,
							left: Math.max(0, ratio * width - THUMB / 2),
						},
					]}
				/>
			</View>
			<View style={styles.times}>
				<Text style={[styles.time, { color: theme.sub }]}>
					{formatTime(dragRatio === null ? position : dragRatio * duration)}
				</Text>
				<Text style={[styles.time, { color: theme.sub }]}>{formatTime(duration)}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	touch: { height: 32, justifyContent: 'center' },
	track: { height: 6, borderRadius: 3, overflow: 'hidden' },
	fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
	thumb: {
		position: 'absolute',
		width: THUMB,
		height: THUMB,
		borderRadius: THUMB / 2,
		top: (32 - THUMB) / 2,
	},
	times: { flexDirection: 'row', justifyContent: 'space-between' },
	time: { fontSize: 12 },
})
