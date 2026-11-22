/** Monster Siren Records の公開 API の応答．非公式であり，仕様は予告なく変わりうる． */
export interface SirenResponse<T> {
	code: number
	msg: string
	data: T
}

export interface SirenAlbum {
	cid: string
	name: string
	coverUrl: string
	artistes: string[]
}

export interface SirenAlbumSong {
	cid: string
	name: string
	artistes: string[]
}

export interface SirenAlbumDetail {
	cid: string
	name: string
	intro: string
	belong: string
	coverUrl: string
	coverDeUrl: string
	songs: SirenAlbumSong[]
}

export interface SirenSongDetail {
	cid: string
	name: string
	albumCid: string
	sourceUrl: string | null
	lyricUrl: string | null
	mvUrl: string | null
	mvCoverUrl: string | null
	artists: string[]
}

export interface SirenSongListItem {
	cid: string
	name: string
	albumCid: string
	artists: string[]
}

export interface SirenSongList {
	list: SirenSongListItem[]
}
