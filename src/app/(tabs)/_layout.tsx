import Icon from '@react-native-vector-icons/material-design-icons'
import { NativeTabs } from 'expo-router/native-tabs'

import { t } from '@/i18n'
import { useTheme } from '@/theme'

const albumIcon = Icon.getImageSourceSync('album', 24)
const searchIcon = Icon.getImageSourceSync('magnify', 24)
const playlistIcon = Icon.getImageSourceSync('playlist-music', 24)

export default function TabLayout() {
	const theme = useTheme()

	return (
		<NativeTabs
			tintColor={theme.accent}
			backgroundColor={theme.surface}
			iconColor={{ default: theme.sub, selected: theme.accent }}
			labelStyle={{
				default: { color: theme.sub },
				selected: { color: theme.accent },
			}}
			indicatorColor={theme.border}
			minimizeBehavior="never"
			backBehavior="initialRoute"
		>
			<NativeTabs.Trigger name="index" disableAutomaticContentInsets>
				<NativeTabs.Trigger.Label>{t('アルバム')}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon src={albumIcon} />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="search" disableAutomaticContentInsets>
				<NativeTabs.Trigger.Label>{t('検索')}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon src={searchIcon} />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="playlists" disableAutomaticContentInsets>
				<NativeTabs.Trigger.Label>{t('プレイリスト')}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon src={playlistIcon} />
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
