/**
 * 表示言語の切り替え．
 *
 * ソースの文字列は日本語で書き，中国語のときだけ `zh` の表で置き換える．
 *   t('アルバム')  →  日本語のとき 'アルバム' / 中国語のとき '专辑'
 * 今は中国語に固定している．日本語を出したいときは `language` を 'ja' にする．
 */
import { zh } from './zh'

export type AppLanguage = 'ja' | 'zh'

export const language: AppLanguage = 'zh'

/**
 * 日本語の文字列を，今の言語の文字列にする．中国語の訳がなければ，そのまま日本語になる．
 * 値を入れたいところは {0} {1} と書き，あとの引数で渡す．
 *   t('{0} 曲', count)
 */
export function t(text: string, ...args: (string | number)[]): string {
	const translated = language === 'zh' ? (zh[text] ?? text) : text
	if (args.length === 0) return translated
	return translated.replace(/\{(\d+)\}/g, (match, index: string) =>
		String(args[Number(index)] ?? match),
	)
}
