import type { ExpoConfig } from 'expo/config'

import { version } from './package.json'

// versionCode は git のコミット数から決める．作業用ディレクトリには履歴がないので，環境変数でも渡せる
const getVersionCode = (): number => {
	const fromEnv = parseInt(process.env.VERSION_CODE ?? '', 10)
	return Number.isNaN(fromEnv) || fromEnv < 1 ? 1 : fromEnv
}

const config: ExpoConfig = {
	name: 'Siren Player',
	slug: 'siren-player',
	version,
	orientation: 'portrait',
	icon: './assets/images/icon.png',
	scheme: 'sirenplayer',
	userInterfaceStyle: 'automatic',
	backgroundColor: '#ffffff',
	platforms: ['android'],
	android: {
		package: 'com.aruteko.sirenplayer',
		versionCode: getVersionCode(),
		adaptiveIcon: {
			foregroundImage: './assets/images/adaptive-icon.png',
			backgroundColor: '#14171f',
		},
		permissions: ['android.permission.POST_NOTIFICATIONS'],
	},
	plugins: [
		'./expo-plugins/withReleaseSigning',
		'./expo-plugins/withAndroidGradleProperties',
		[
			'./expo-plugins/withAbiFilters',
			{
				abiFilters:
					typeof process.env.ABI_FILTERS === 'string'
						? process.env.ABI_FILTERS.split(',')
						: ['arm64-v8a'],
			},
		],
		[
			'expo-build-properties',
			{
				android: {
					minSdkVersion: 26,
					enableMinifyInReleaseBuilds: false,
					enableShrinkResourcesInReleaseBuilds: false,
				},
			},
		],
		[
			'expo-splash-screen',
			{
				image: './assets/images/splash-icon.png',
				imageWidth: 240,
				// アイコンの背景と同じ色にして，明るい表示でも暗い表示でも，四角の継ぎ目を出さない
				backgroundColor: '#14171f',
			},
		],
		'expo-router',
		'expo-image',
		'expo-system-ui',
	],
}

export default config
