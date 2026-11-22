import { NativeModule, requireNativeModule } from 'expo-modules-core'

/** ExoPlayer の再生状態 */
export enum PlaybackState {
	IDLE = 1,
	BUFFERING = 2,
	READY = 3,
	ENDED = 4,
}

/** ExoPlayer の繰り返し再生 */
export enum RepeatMode {
	OFF = 0,
	TRACK = 1,
	QUEUE = 2,
}

export interface AudioTrack {
	/** 曲の cid．再生の直前に，この cid から音源の URL を引く */
	id: string
	title: string
	artist: string
	album: string
	artwork: string
}

export interface AudioState {
	isPlaying: boolean
	playbackState: PlaybackState
	index: number
	repeatMode: RepeatMode
	shuffle: boolean
	queue: Partial<AudioTrack>[]
	/** ミリ秒 */
	position: number
	duration: number
	buffered: number
}

export type AudioEvents = {
	onIsPlayingChanged(event: { isPlaying: boolean }): void
	onPlaybackStateChanged(event: { state: PlaybackState }): void
	onTrackChanged(event: { id: string; index: number }): void
	onModeChanged(event: { repeatMode?: RepeatMode; shuffle?: boolean }): void
	onPositionUpdate(event: { position: number; duration: number; buffered: number }): void
	onPlayerError(event: { code: string; message: string }): void
}

declare class SirenAudioModule extends NativeModule<AudioEvents> {
	setQueue(tracks: AudioTrack[], startIndex: number, playWhenReady: boolean): Promise<void>
	play(): Promise<void>
	pause(): Promise<void>
	skipTo(index: number): Promise<void>
	skipToNext(): Promise<void>
	skipToPrevious(): Promise<void>
	/** ミリ秒 */
	seekTo(positionMs: number): Promise<void>
	setRepeatMode(mode: RepeatMode): Promise<void>
	setShuffleMode(enabled: boolean): Promise<void>
	getState(): Promise<AudioState>
}

export const SirenAudio = requireNativeModule<SirenAudioModule>('SirenAudio')
