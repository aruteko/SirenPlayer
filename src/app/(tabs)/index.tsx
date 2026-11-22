import Icon from '@react-native-vector-icons/material-design-icons'
import { useRouter } from 'expo-router'
import { Pressable } from 'react-native'

import { AlbumsTab } from '@/components/home/AlbumsTab'
import { TabPage } from '@/components/TabPage'
import { useTheme } from '@/theme'

export default function AlbumsScreen() {
	const theme = useTheme()
	const router = useRouter()

	return (
		<TabPage
			title="Siren Player"
			right={
				<Pressable hitSlop={8} onPress={() => router.push('/about')}>
					<Icon name="information-outline" size={24} color={theme.text} />
				</Pressable>
			}
		>
			<AlbumsTab />
		</TabPage>
	)
}
