import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { t } from '@/i18n'
import { useTheme } from '@/theme'

interface NameDialogProps {
	visible: boolean
	title: string
	initialValue?: string
	confirmLabel: string
	onSubmit: (name: string) => void
	onCancel: () => void
}

/** 名前を一行で入力する小さなダイアログ */
export function NameDialog(props: NameDialogProps) {
	// 開くたびに入力欄を初期値へ戻すため，開いているあいだだけ中身を作る
	if (!props.visible) return null
	return <NameDialogBody {...props} />
}

function NameDialogBody({
	title,
	initialValue = '',
	confirmLabel,
	onSubmit,
	onCancel,
}: NameDialogProps) {
	const theme = useTheme()
	const [value, setValue] = useState(initialValue)
	const canSubmit = value.trim().length > 0

	return (
		<Modal transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.backdrop}>
				<View style={[styles.dialog, { backgroundColor: theme.bg }]}>
					<Text style={[styles.title, { color: theme.text }]}>{title}</Text>
					<TextInput
						autoFocus
						value={value}
						onChangeText={setValue}
						placeholder={t('プレイリスト名')}
						placeholderTextColor={theme.sub}
						maxLength={60}
						onSubmitEditing={() => canSubmit && onSubmit(value)}
						style={[styles.input, { color: theme.text, borderColor: theme.border }]}
					/>
					<View style={styles.buttons}>
						<Pressable onPress={onCancel} style={styles.button}>
							<Text style={{ color: theme.sub }}>{t('キャンセル')}</Text>
						</Pressable>
						<Pressable disabled={!canSubmit} onPress={() => onSubmit(value)} style={styles.button}>
							<Text
								style={{
									color: canSubmit ? theme.accent : theme.sub,
									fontWeight: '600',
								}}
							>
								{confirmLabel}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	dialog: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20 },
	title: { fontSize: 17, fontWeight: '700' },
	input: {
		marginTop: 16,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 16,
	},
	buttons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
	button: { paddingHorizontal: 12, paddingVertical: 8 },
})
