import type { AudioTrack } from '@siren/audio'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { sirenApi } from '@/lib/api/siren'
import type { SirenAlbum, SirenSongListItem } from '@/types/siren'

/** アルバム一覧と全曲の一覧．検索の対象になる */
export function useCatalog() {
	const albums = useQuery({ queryKey: ['albums'], queryFn: sirenApi.getAlbums })
	const songs = useQuery({ queryKey: ['songs'], queryFn: sirenApi.getSongs })

	const albumByCid = useMemo(
		() => new Map((albums.data ?? []).map((album) => [album.cid, album])),
		[albums.data],
	)

	return { albums, songs, albumByCid }
}

export function songToTrack(song: SirenSongListItem, album: SirenAlbum | undefined): AudioTrack {
	return {
		id: song.cid,
		title: song.name,
		artist: song.artists.join(' / '),
		album: album?.name ?? '',
		artwork: album?.coverUrl ?? '',
	}
}
