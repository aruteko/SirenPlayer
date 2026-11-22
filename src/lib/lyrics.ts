export interface LyricLine {
	/** 並べ替えたあとの通し番号．表示のキーに使う */
	id: number
	/** ミリ秒 */
	time: number
	text: string
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

/**
 * LRC を行の配列にする．時刻のない行と，[ti:] のようなメタ情報は捨てる．
 * 時刻の同じ行が複数あっても，書かれた順に残す．
 */
export function parseLrc(content: string): LyricLine[] {
	const lines: Omit<LyricLine, 'id'>[] = []
	for (const raw of content.replace(/\r\n?/g, '\n').split('\n')) {
		const tags = [...raw.matchAll(TIME_TAG)]
		if (tags.length === 0) continue
		const text = raw.replace(TIME_TAG, '').trim()
		for (const tag of tags) {
			const fraction = tag[3] ?? '0'
			const ms = Math.round(Number(`0.${fraction}`) * 1000)
			lines.push({
				time: Number(tag[1]) * 60_000 + Number(tag[2]) * 1000 + ms,
				text,
			})
		}
	}
	// Hermes には toSorted がない．sort は安定なので，時刻の同じ行は書かれた順に残る
	// oxlint-disable-next-line unicorn/no-array-sort
	lines.sort((a, b) => a.time - b.time)
	return lines.map((line, id) => ({ id, time: line.time, text: line.text }))
}

/** 位置に対応する行の添字．まだ最初の行に達していなければ -1 */
export function findActiveLine(lines: LyricLine[], positionMs: number): number {
	let low = 0
	let high = lines.length - 1
	let found = -1
	while (low <= high) {
		const mid = (low + high) >> 1
		if (lines[mid].time <= positionMs) {
			found = mid
			low = mid + 1
		} else {
			high = mid - 1
		}
	}
	return found
}
