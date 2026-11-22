import type { AudioTrack } from '@siren/audio'
import { File, Paths } from 'expo-file-system'
import { useSyncExternalStore } from 'react'

export interface Playlist {
	id: string
	name: string
	/** 曲の情報ごと保存する．一覧の取得を待たずに，そのまま再生できる */
	tracks: AudioTrack[]
}

interface PlaylistState {
	playlists: Playlist[]
	loaded: boolean
}

let state: PlaylistState = { playlists: [], loaded: false }
let sheetTrack: AudioTrack | null = null

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

const file = new File(Paths.document, 'playlists.json')

async function persist() {
	try {
		if (!file.exists) file.create()
		await file.write(JSON.stringify(state.playlists))
	} catch {
		// 保存に失敗しても，その回の操作は画面に残る．次の操作で再び保存する
	}
}

function update(playlists: Playlist[]) {
	state = { ...state, playlists }
	emit()
	void persist()
}

const isTrack = (value: unknown): value is AudioTrack =>
	typeof value === 'object' && value !== null && typeof (value as AudioTrack).id === 'string'

function parsePlaylists(content: string): Playlist[] {
	const data: unknown = JSON.parse(content)
	if (!Array.isArray(data)) return []
	return data.flatMap((entry: unknown): Playlist[] => {
		if (typeof entry !== 'object' || entry === null) return []
		const { id, name, tracks } = entry as Partial<Playlist>
		if (typeof id !== 'string' || typeof name !== 'string') return []
		return [{ id, name, tracks: Array.isArray(tracks) ? tracks.filter(isTrack) : [] }]
	})
}

/** 保存済みのプレイリストを読み込む．一度だけ呼ぶ */
export async function initPlaylists() {
	if (state.loaded) return
	try {
		if (file.exists) {
			state = { playlists: parsePlaylists(await file.text()), loaded: true }
		} else {
			state = { ...state, loaded: true }
		}
	} catch {
		state = { ...state, loaded: true }
	}
	emit()
}

export function usePlaylists(): Playlist[] {
	return useSyncExternalStore(subscribe, () => state).playlists
}

export function usePlaylist(id: string | undefined): Playlist | undefined {
	return usePlaylists().find((playlist) => playlist.id === id)
}

const withName = (playlist: Playlist, name: string): Playlist => ({
	id: playlist.id,
	name,
	tracks: playlist.tracks,
})

const withTracks = (playlist: Playlist, tracks: AudioTrack[]): Playlist => ({
	id: playlist.id,
	name: playlist.name,
	tracks,
})

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function createPlaylist(name: string, tracks: AudioTrack[] = []): string {
	const id = newId()
	update([...state.playlists, { id, name: name.trim(), tracks }])
	return id
}

export function renamePlaylist(id: string, name: string) {
	update(
		state.playlists.map((playlist) =>
			playlist.id === id ? withName(playlist, name.trim()) : playlist,
		),
	)
}

export function deletePlaylist(id: string) {
	update(state.playlists.filter((playlist) => playlist.id !== id))
}

/** すでに入っている曲は足さない．足したときだけ true */
export function addToPlaylist(id: string, track: AudioTrack): boolean {
	const target = state.playlists.find((playlist) => playlist.id === id)
	if (!target || target.tracks.some((existing) => existing.id === track.id)) {
		return false
	}
	update(
		state.playlists.map((playlist) =>
			playlist.id === id ? withTracks(playlist, [...playlist.tracks, track]) : playlist,
		),
	)
	return true
}

export function removeFromPlaylist(id: string, trackId: string) {
	update(
		state.playlists.map((playlist) =>
			playlist.id === id
				? withTracks(
						playlist,
						playlist.tracks.filter((track) => track.id !== trackId),
					)
				: playlist,
		),
	)
}

/** 「プレイリストに追加」の選択画面で対象にする曲 */
export function openAddToPlaylist(track: AudioTrack) {
	sheetTrack = track
	emit()
}

export function closeAddToPlaylist() {
	sheetTrack = null
	emit()
}

export function useAddToPlaylistTarget(): AudioTrack | null {
	return useSyncExternalStore(subscribe, () => sheetTrack)
}
