import { useState } from 'react'

import { SearchTab } from '@/components/home/SearchTab'
import { TabPage } from '@/components/TabPage'
import { t } from '@/i18n'

export default function SearchScreen() {
	const [query, setQuery] = useState('')

	return (
		<TabPage title={t('検索')}>
			<SearchTab query={query} onChangeQuery={setQuery} />
		</TabPage>
	)
}
