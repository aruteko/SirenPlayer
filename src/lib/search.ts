/** 記号と空白を除いて小文字にそろえる．全角と半角の違いも吸収する */
export function normalizeText(text: string): string {
	return text
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[\s!-/:-@[-`{-~]/g, '')
}

export interface Indexed<T> {
	item: T
	haystack: string
}

export function buildIndex<T>(items: T[], toText: (item: T) => string): Indexed<T>[] {
	return items.map((item) => ({ item, haystack: normalizeText(toText(item)) }))
}

/** 検索語を含む項目を，元の並びのまま返す */
export function searchIndex<T>(index: Indexed<T>[], query: string, limit: number): T[] {
	const target = normalizeText(query)
	if (target.length === 0) return []
	const hits: T[] = []
	for (const entry of index) {
		if (entry.haystack.includes(target)) {
			hits.push(entry.item)
			if (hits.length >= limit) break
		}
	}
	return hits
}
