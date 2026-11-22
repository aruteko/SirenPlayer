/** ミリ秒を m:ss にする */
export function formatTime(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000))
	const minutes = Math.floor(total / 60)
	const seconds = total % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** バイト数を MB や GB の表記にする */
export function formatBytes(bytes: number): string {
	if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
