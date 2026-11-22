import { PlaybackState, RepeatMode, SirenAudio, type AudioTrack } from '@siren/audio'
import { useEffect, useState, useSyncExternalStore } from 'react'

export interface PlayerState {
	queue: AudioTrack[]
	index: number
	isPlaying: boolean
	playbackState: PlaybackState
	repeatMode: RepeatMode
	shuffle: boolean
	error: string | null
}

let state: PlayerState = {
	queue: [],
	index: -1,
	isPlaying: false,
	playbackState: PlaybackState.IDLE,
	repeatMode: RepeatMode.OFF,
	shuffle: false,
	error: null,
}

const listeners = new Set<() => void>()

function setState(patch: Partial<PlayerState>) {
	state = { ...state, ...patch }
	listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

const getState = () => state

export function usePlayerState(): PlayerState {
	return useSyncExternalStore(subscribe, getState)
}

export function useCurrentTrack(): AudioTrack | null {
	const { queue, index } = usePlayerState()
	return queue[index] ?? null
}

/** 取得できなかった項目は，空の文字列で埋める */
const fillTrack = (track: Partial<AudioTrack>): AudioTrack => ({
	id: track.id ?? '',
	title: track.title ?? '',
	artist: track.artist ?? '',
	album: track.album ?? '',
	artwork: track.artwork ?? '',
})

const reportError = (error: unknown) => {
	setState({ error: error instanceof Error ? error.message : String(error) })
}

let initialized = false

/** ネイティブ側の再生イベントを購読し，すでに再生中の状態があれば取り込む．一度だけ呼ぶ． */
export function initPlayer() {
	if (initialized) return
	initialized = true

	SirenAudio.addListener('onIsPlayingChanged', (e) => setState({ isPlaying: e.isPlaying }))
	SirenAudio.addListener('onPlaybackStateChanged', (e) => setState({ playbackState: e.state }))
	SirenAudio.addListener('onTrackChanged', (e) => setState({ index: e.index, error: null }))
	SirenAudio.addListener('onModeChanged', (e) =>
		setState({
			...(e.repeatMode === undefined ? {} : { repeatMode: e.repeatMode }),
			...(e.shuffle === undefined ? {} : { shuffle: e.shuffle }),
		}),
	)
	SirenAudio.addListener('onPlayerError', (e) => setState({ error: e.message }))

	void hydrate()
}

/** すでに再生サービスにキューがあれば，その状態を取り込む */
async function hydrate() {
	try {
		const native = await SirenAudio.getState()
		if (native.queue.length === 0) return
		setState({
			queue: native.queue.map(fillTrack),
			index: native.index,
			isPlaying: native.isPlaying,
			playbackState: native.playbackState,
			repeatMode: native.repeatMode,
			shuffle: native.shuffle,
		})
	} catch (error) {
		reportError(error)
	}
}

export function playQueue(tracks: AudioTrack[], startIndex: number) {
	setState({ queue: tracks, index: startIndex, error: null })
	SirenAudio.setQueue(tracks, startIndex, true).catch(reportError)
}

export function togglePlay() {
	const action = state.isPlaying ? SirenAudio.pause() : SirenAudio.play()
	action.catch(reportError)
}

export const skipToNext = () => SirenAudio.skipToNext().catch(reportError)
export const skipToPrevious = () => SirenAudio.skipToPrevious().catch(reportError)
export const seekTo = (positionMs: number) => SirenAudio.seekTo(positionMs).catch(reportError)

export function cycleRepeatMode() {
	// 繰り返しなし，一曲，キュー全体の順
	const next =
		state.repeatMode === RepeatMode.OFF
			? RepeatMode.TRACK
			: state.repeatMode === RepeatMode.TRACK
				? RepeatMode.QUEUE
				: RepeatMode.OFF
	setState({ repeatMode: next })
	SirenAudio.setRepeatMode(next).catch(reportError)
}

/** キューの中の一曲へ移って再生する */
export const skipToIndex = (index: number) => SirenAudio.skipTo(index).catch(reportError)

export function toggleShuffle() {
	const next = !state.shuffle
	setState({ shuffle: next })
	SirenAudio.setShuffleMode(next).catch(reportError)
}

export interface Progress {
	position: number
	duration: number
	buffered: number
}

/** 再生位置．ミリ秒．曲が変わったときは 0 に戻す */
export function useProgress(): Progress {
	const [progress, setProgress] = useState<Progress>({
		position: 0,
		duration: 0,
		buffered: 0,
	})

	useEffect(() => {
		let active = true
		const sync = async () => {
			try {
				const native = await SirenAudio.getState()
				if (!active) return
				setProgress({
					position: native.position,
					duration: native.duration,
					buffered: native.buffered,
				})
			} catch {
				// 取得できなくても，次の位置の通知で追いつく
			}
		}
		void sync()
		const position = SirenAudio.addListener('onPositionUpdate', (e) => setProgress(e))
		const track = SirenAudio.addListener('onTrackChanged', () =>
			setProgress({ position: 0, duration: 0, buffered: 0 }),
		)
		return () => {
			active = false
			position.remove()
			track.remove()
		}
	}, [])

	return progress
}
