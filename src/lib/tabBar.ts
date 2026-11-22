import { useSyncExternalStore } from 'react'

/**
 * いま表示しているタブ画面の，下のタブバーの高さ．
 * 再生バーを，タブバーの上に置くために使う．タブ以外の画面では 0 になる．
 */
let height = 0
const listeners = new Set<() => void>()

export function setTabBarHeight(next: number) {
	if (next === height) return
	height = next
	listeners.forEach((listener) => listener())
}

export function useTabBarHeight(): number {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		() => height,
	)
}
