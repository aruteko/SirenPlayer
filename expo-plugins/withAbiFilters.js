const { withGradleProperties, withAppBuildGradle } = require('expo/config-plugins')

// BBPlayer (MIT, Copyright (c) 2025 Roitium) の同名のプラグインに基づく
const withAbiFilters = (config, { abiFilters = ['arm64-v8a'] } = {}) => {
	config = withGradleProperties(config, (config) => {
		config.modResults = config.modResults.filter(
			(item) => !item.key || item.key !== 'reactNativeArchitectures',
		)
		config.modResults.push({
			type: 'property',
			key: 'reactNativeArchitectures',
			value: abiFilters.join(','),
		})
		return config
	})

	config = withAppBuildGradle(config, (config) => {
		const abiFiltersString = abiFilters.map((abi) => `"${abi}"`).join(', ')
		if (config.modResults.contents.includes('defaultConfig {')) {
			config.modResults.contents = config.modResults.contents.replace(
				/(defaultConfig\s*\{[^}]*versionName\s+[^}]*)/,
				`$1

        ndk {
            abiFilters ${abiFiltersString}
        }`,
			)
		}
		return config
	})

	return config
}

module.exports = withAbiFilters
