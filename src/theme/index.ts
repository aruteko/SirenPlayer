import { useColorScheme } from 'react-native'

const light = {
	bg: '#ffffff',
	surface: '#f1f3f6',
	text: '#14171f',
	sub: '#5f6673',
	accent: '#1f6feb',
	border: '#e1e4ea',
}

const dark = {
	bg: '#0f1218',
	surface: '#1a1f29',
	text: '#eceff4',
	sub: '#9aa3b2',
	accent: '#5aa2ff',
	border: '#262c38',
}

export type Theme = typeof light

export function useTheme(): Theme {
	return useColorScheme() === 'dark' ? dark : light
}
