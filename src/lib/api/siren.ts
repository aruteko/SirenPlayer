import type {
	SirenAlbum,
	SirenAlbumDetail,
	SirenResponse,
	SirenSongDetail,
	SirenSongList,
} from '@/types/siren'

const BASE_URL = 'https://monster-siren.hypergryph.com/api'

async function getJson<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`)
	if (!res.ok) {
		throw new Error(`Siren API error: ${res.status}`)
	}
	const body = (await res.json()) as SirenResponse<T>
	if (body.code !== 0) {
		throw new Error(`Siren API error: ${body.code} ${body.msg}`)
	}
	return body.data
}

export const sirenApi = {
	getAlbums: () => getJson<SirenAlbum[]>('/albums'),

	/** 全曲の一覧．検索とプレイリストの照合に使う */
	getSongs: async () => (await getJson<SirenSongList>('/songs')).list,

	getAlbumDetail: (cid: string) =>
		getJson<SirenAlbumDetail>(`/album/${encodeURIComponent(cid)}/detail`),

	getSongDetail: (cid: string) => getJson<SirenSongDetail>(`/song/${encodeURIComponent(cid)}`),

	/** 歌詞の LRC を文字列で取得する */
	getLyricText: async (url: string): Promise<string> => {
		const res = await fetch(url)
		if (!res.ok) {
			throw new Error(`Siren lyric error: ${res.status}`)
		}
		return res.text()
	},
}
