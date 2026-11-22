import Constants from 'expo-constants'
import { ScrollView, StyleSheet, Text } from 'react-native'

import { t } from '@/i18n'
import { useTheme } from '@/theme'

export default function AboutScreen() {
	const theme = useTheme()
	const version = Constants.expoConfig?.version ?? ''

	const sections: { heading: string; body: string }[] = [
		{
			heading: t('免責事項'),
			body:
				t('本アプリは非公式の音楽プレーヤーであり，塞壬唱片および Hypergryph とは関係がない．') +
				'\n' +
				t(
					'曲，歌詞，画像の権利は，塞壬唱片および Hypergryph に帰属する．本アプリは，公式サイトの公開 API から取得して再生する．曲は，利用者が指示したときだけ，アプリ専用の領域に保存する．再配布は行わないこと．',
				),
		},
		{
			heading: t('プライバシー'),
			body: t(
				'本アプリは，利用者の情報を収集せず，開発者のサーバーとも通信しない．通信先は，塞壬唱片の公式サイトの API と，そこで示された配信元のみである．',
			),
		},
		{
			heading: t('ライセンス'),
			body: t('MIT ライセンスで公開している．Roitium 作の BBPlayer を基にした派生アプリである．'),
		},
	]

	return (
		<ScrollView contentContainerStyle={styles.content}>
			<Text style={[styles.version, { color: theme.sub }]}>
				{t('バージョン')} {version}
			</Text>
			{sections.map((section) => (
				<Text key={section.heading} style={[styles.body, { color: theme.text }]}>
					<Text style={styles.heading}>{section.heading + '\n'}</Text>
					{section.body}
					{'\n\n'}
				</Text>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	content: { padding: 20 },
	version: { fontSize: 13, marginBottom: 16 },
	heading: { fontSize: 16, fontWeight: '700' },
	body: { fontSize: 14, lineHeight: 22 },
})
