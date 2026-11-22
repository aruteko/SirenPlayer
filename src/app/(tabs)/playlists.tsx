import { PlaylistsTab } from '@/components/home/PlaylistsTab'
import { TabPage } from '@/components/TabPage'
import { t } from '@/i18n'

export default function PlaylistsScreen() {
	return (
		<TabPage title={t('プレイリスト')}>
			<PlaylistsTab />
		</TabPage>
	)
}
