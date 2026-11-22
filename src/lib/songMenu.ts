import type { AudioTrack } from '@siren/audio'
import { useSyncExternalStore } from 'react'

export interface SongMenuTarget {
	track: AudioTrack
	/** プレイリストの中から開いたときの，そのプレイリストの id．「外す」を出すために使う */
	removeFromPlaylistId?: string
}

let target: SongMenuTarget | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export function openSongMenu(track: AudioTrack, removeFromPlaylistId?: string) {
	target = { track, removeFromPlaylistId }
	emit()
}

export function closeSongMenu() {
	target = null
	emit()
}

export function useSongMenuTarget(): SongMenuTarget | null {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		() => target,
	)
}
