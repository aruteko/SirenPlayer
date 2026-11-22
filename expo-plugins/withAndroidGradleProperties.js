const { withGradleProperties } = require('expo/config-plugins')

// BBPlayer (MIT, Copyright (c) 2025 Roitium) の同名のプラグインに基づく
const GRADLE_XMX = process.env.GRADLE_XMX || '4g'
const KOTLIN_XMX = process.env.KOTLIN_XMX || '2g'
const WORKERS_MAX = process.env.ORG_GRADLE_WORKERS_MAX || process.env.GRADLE_WORKERS || '4'
// 手元のビルドは一度きりなので，常駐のデーモンは使わない
const GRADLE_DAEMON = process.env.ORG_GRADLE_DAEMON || 'false'

const newProperties = {
	'org.gradle.jvmargs': `-Xmx${GRADLE_XMX} -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8`,
	'kotlin.daemon.jvm.args': `-Xmx${KOTLIN_XMX}`,
	'org.gradle.workers.max': WORKERS_MAX,
	'org.gradle.daemon': GRADLE_DAEMON,
}

module.exports = (config) =>
	withGradleProperties(config, (config) => {
		for (const [key, value] of Object.entries(newProperties)) {
			const existing = config.modResults.find(
				(prop) => prop.type === 'property' && prop.key === key,
			)
			if (existing) {
				existing.value = value
			} else {
				config.modResults.push({ type: 'property', key, value })
			}
		}
		return config
	})
