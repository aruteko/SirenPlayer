import { useQuery } from '@tanstack/react-query'

import { sirenApi } from '@/lib/api/siren'
import { parseLrc, type LyricLine } from '@/lib/lyrics'

/** 曲の歌詞．歌詞の登録がない曲は，空の配列になる */
export function useLyrics(cid: string | undefined) {
	return useQuery<LyricLine[]>({
		queryKey: ['lyrics', cid],
		enabled: !!cid,
		staleTime: Infinity,
		queryFn: async () => {
			const detail = await sirenApi.getSongDetail(cid ?? '')
			if (!detail.lyricUrl) return []
			return parseLrc(await sirenApi.getLyricText(detail.lyricUrl))
		},
	})
}
