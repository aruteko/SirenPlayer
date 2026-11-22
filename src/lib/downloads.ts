import type { AudioTrack } from '@siren/audio'
import { Directory, File, Paths } from 'expo-file-system'
import { useSyncExternalStore } from 'react'

import { sirenApi } from '@/lib/api/siren'

/**
 * 曲のダウンロード．端末のアプリ専用の領域にだけ保存し，ほかのアプリや共有の場所へは出さない．
 * 再生サービス側が `downloads/{cid}` のファイルを見つけると，それを再生する．
 */
export type DownloadStatus = 'queued' | 'downloading' | 'done' | 'failed'

export interface DownloadItem {
	track: AudioTrack
	status: DownloadStatus
	/** ダウンロード済みのバイト数と，全体のバイト数．全体が分からないときは 0 */
	bytes: number
	total: number
}

let items: Record<string, DownloadItem> = {}
let loaded = false

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function subscribe(listener: () => void) {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

const downloadsDir = new Directory(Paths.document, 'downloads')
const indexFile = new File(Paths.document, 'downloads.json')

function setItem(cid: string, item: DownloadItem) {
	items = { ...items, [cid]: item }
	emit()
}

function removeItem(cid: string) {
	items = Object.fromEntries(Object.entries(items).filter(([key]) => key !== cid))
	emit()
}

async function saveIndex() {
	try {
		const done = Object.values(items)
			.filter((item) => item.status === 'done')
			.map((item) => item.track)
		if (!indexFile.exists) indexFile.create()
		await indexFile.write(JSON.stringify(done))
	} catch {
		// 保存に失敗しても，ファイルは残る．次の操作で再び保存する
	}
}

const isTrack = (value: unknown): value is AudioTrack =>
	typeof value === 'object' && value !== null && typeof (value as AudioTrack).id === 'string'

/** 保存済みの一覧を読み込み，ファイルが残っているものだけ戻す．一度だけ呼ぶ */
export async function initDownloads() {
	if (loaded) return
	loaded = true
	try {
		if (!downloadsDir.exists) downloadsDir.create({ intermediates: true })
		if (!indexFile.exists) return
		const data: unknown = JSON.parse(await indexFile.text())
		if (!Array.isArray(data)) return
		const restored: Record<string, DownloadItem> = {}
		for (const entry of data) {
			if (!isTrack(entry)) continue
			const file = new File(downloadsDir, entry.id)
			if (!file.exists) continue
			restored[entry.id] = {
				track: entry,
				status: 'done',
				bytes: file.size ?? 0,
				total: file.size ?? 0,
			}
		}
		items = { ...restored, ...items }
		emit()
	} catch {
		// 読めないときは，ダウンロード済みなしとして始める
	}
}

export function useDownloads(): Record<string, DownloadItem> {
	return useSyncExternalStore(subscribe, () => items)
}

export function useDownloadItem(cid: string | undefined): DownloadItem | undefined {
	return useDownloads()[cid ?? '']
}

const controllers = new Map<string, AbortController>()
const queue: string[] = []
let running = false

async function downloadOne(cid: string) {
	const current = items[cid]
	if (!current) return
	const partFile = new File(downloadsDir, `${cid}.part`)
	const finalFile = new File(downloadsDir, cid)
	const controller = new AbortController()
	controllers.set(cid, controller)
	try {
		if (!downloadsDir.exists) downloadsDir.create({ intermediates: true })
		setItem(cid, { ...current, status: 'downloading', bytes: 0, total: 0 })
		const detail = await sirenApi.getSongDetail(cid)
		if (!detail.sourceUrl) throw new Error('No source URL')
		let lastEmit = 0
		await File.downloadFileAsync(detail.sourceUrl, partFile, {
			idempotent: true,
			signal: controller.signal,
			onProgress: ({ bytesWritten, totalBytes }) => {
				const now = Date.now()
				if (now - lastEmit < 250) return
				lastEmit = now
				const latest = items[cid]
				if (latest) {
					setItem(cid, {
						...latest,
						status: 'downloading',
						bytes: bytesWritten,
						total: Math.max(totalBytes, 0),
					})
				}
			},
		})
		if (finalFile.exists) finalFile.delete()
		await partFile.move(finalFile)
		const size = finalFile.size ?? 0
		const latest = items[cid]
		if (latest) setItem(cid, { ...latest, status: 'done', bytes: size, total: size })
		await saveIndex()
	} catch {
		if (partFile.exists) partFile.delete()
		// 取り消しで消えた項目は，失敗として残さない
		if (items[cid]) setItem(cid, { ...items[cid], status: 'failed', bytes: 0, total: 0 })
	} finally {
		controllers.delete(cid)
	}
}

async function runQueue() {
	if (running) return
	running = true
	try {
		for (let cid = queue.shift(); cid !== undefined; cid = queue.shift()) {
			// 一曲ずつ順に行うので，ここで待つのが目的
			// oxlint-disable-next-line eslint/no-await-in-loop
			await downloadOne(cid)
		}
	} finally {
		running = false
	}
}

/** 一曲を待ち行列に入れる．すでに済み，または進行中のものは何もしない */
export function downloadTrack(track: AudioTrack) {
	const existing = items[track.id]
	if (existing && existing.status !== 'failed') return
	setItem(track.id, { track, status: 'queued', bytes: 0, total: 0 })
	queue.push(track.id)
	void runQueue()
}

export function downloadTracks(tracks: AudioTrack[]) {
	tracks.forEach(downloadTrack)
}

/** 待ち行列の項目と進行中の項目を取り消し，ダウンロード済みのファイルを削除する */
export function removeDownload(cid: string) {
	const index = queue.indexOf(cid)
	if (index >= 0) queue.splice(index, 1)
	controllers.get(cid)?.abort()
	try {
		const file = new File(downloadsDir, cid)
		if (file.exists) file.delete()
	} catch {
		// 使用中で消せなくても，一覧からは外す
	}
	removeItem(cid)
	void saveIndex()
}

/** ダウンロード済みの全体の大きさ．バイト */
export function totalDownloadedBytes(all: Record<string, DownloadItem>): number {
	return Object.values(all).reduce(
		(sum, item) => (item.status === 'done' ? sum + item.bytes : sum),
		0,
	)
}
