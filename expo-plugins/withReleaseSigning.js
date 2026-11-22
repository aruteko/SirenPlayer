const { withAppBuildGradle } = require('expo/config-plugins')

/**
 * リリースビルドに，自分の署名鍵を使う．
 *
 * 鍵とパスワードはリポジトリに入れず，ユーザーの Gradle 設定
 * （~/.gradle/gradle.properties）から読む．
 *   SIRENPLAYER_STORE_FILE=C:/Users/xxx/.sirenplayer/sirenplayer-release.jks
 *   SIRENPLAYER_STORE_PASSWORD=...
 *   SIRENPLAYER_KEY_ALIAS=sirenplayer
 *   SIRENPLAYER_KEY_PASSWORD=...
 * 設定が無いときは何もしない．Expo 既定のデバッグ鍵でビルドされる．
 */
const signingBlock = `
// Siren Player: release signing from the user's gradle.properties (keeps keys out of the repo).
if (project.hasProperty('SIRENPLAYER_STORE_FILE')) {
    def sirenRelease = android.signingConfigs.create('sirenRelease') {
        storeFile file(project.property('SIRENPLAYER_STORE_FILE'))
        storePassword project.property('SIRENPLAYER_STORE_PASSWORD')
        keyAlias project.property('SIRENPLAYER_KEY_ALIAS')
        keyPassword project.property('SIRENPLAYER_KEY_PASSWORD')
    }
    android.buildTypes.release.signingConfig = sirenRelease
}
`

module.exports = (config) =>
	withAppBuildGradle(config, (config) => {
		if (config.modResults.language !== 'groovy') {
			throw new Error('Release signing requires a Groovy build.gradle.')
		}
		if (!config.modResults.contents.includes(signingBlock)) {
			config.modResults.contents += signingBlock
		}
		return config
	})
