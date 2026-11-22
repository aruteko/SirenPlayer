/**
 * 流れるような背景．BBPlayer の FluidBackground に基づく．
 * BBPlayer: MIT, Copyright (c) 2025 Roitium
 */
import type { ColorInfo, ExtractedPalette } from '@siren/theme-colors'
import { Canvas, Fill, LinearGradient, Shader, Skia } from '@shopify/react-native-skia'
import Color from 'color'
import { useEffect, useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import {
	AccessibilityInfo,
	AppState,
	PixelRatio,
	StyleSheet,
	useColorScheme,
	View,
} from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import {
	cancelAnimation,
	Easing,
	useDerivedValue,
	useFrameCallback,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

// 二つのグラデーションを一つのシェーダーの中で混ぜる．マスクを別の層にすると，色が先に量子化されるため
const FLUID_SHADER = Skia.RuntimeEffect.Make(`
  uniform shader gradientA;
  uniform shader gradientB;
  uniform shader maskGradient;
  uniform float pixelRatio;

  half4 main(float2 position) {
    float4 a = gradientA.eval(position);
    float4 b = gradientB.eval(position);
    float mask = maskGradient.eval(position).a;
    float4 color = mix(a, b, mask);

    // 物理ピクセルに固定した，平均が 0 のノイズ．時間では変えないので，ちらつかない
    float2 pixel = floor(position * pixelRatio);
    float3 hash = fract(float3(pixel.x, pixel.y, pixel.x) * 0.1031);
    hash += dot(hash, hash.yzx + 33.33);
    float noise = fract((hash.x + hash.y) * hash.z) - 0.5;
    color.rgb = clamp(color.rgb + (noise / 255.0) * color.a, 0.0, color.a);
    return half4(color);
  }
`)

/** 二組の不透明なグラデーションの両端の色．A の始点，A の終点，B の始点，B の終点の順 */
export type FluidBackgroundColors = readonly [string, string, string, string]

export type FluidBackgroundColorScheme = 'light' | 'dark'

export interface FluidBackgroundProps {
	/** 画像から取り出した色．画像の読み込みと色の抽出は，呼び出し側が行う */
	palette?: ExtractedPalette | null
	/** 色がまだ得られていないとき，または使える色がないときの背景色 */
	fallbackColor?: string
	/** 配色の明暗．省略すると端末の設定に従う */
	colorScheme?: FluidBackgroundColorScheme
	/** 再生が止まっているとき，または画面が隠れているときに true．流れはゆっくり止まる */
	paused?: boolean
	/** 配色が変わるときの移り変わりの長さ．ミリ秒 */
	transitionDuration?: number
	/** 止めるとき，動かすときの加減速の長さ．ミリ秒 */
	flowTransitionDuration?: number
	style?: StyleProp<ViewStyle>
}

/** 暗い表示では暗く，明るい表示では明るくして，背景の上の文字の読みやすさを保つ */
const LIGHTNESS_BANDS: Record<FluidBackgroundColorScheme, readonly [number, number]> = {
	dark: [12, 35],
	light: [85, 97],
}

/** 彩度の下限は濁りを防ぎ，上限は派手になりすぎるのを防ぐ */
const SATURATION_BANDS: Record<FluidBackgroundColorScheme, readonly [number, number]> = {
	dark: [30, 68],
	light: [22, 48],
}

/** 一つのグラデーションの両端の明度差が，明度の幅に占める割合 */
const LIGHTNESS_SPREAD = 0.32

/** 派生させる色の色相のずれの最大．近い色にとどめ，補色どうしが混ざって灰色になるのを避ける */
const HUE_OFFSET = 28

/** 元の色の彩度が低すぎると色相が当てにならないので，予備の色の色相を使う */
const MIN_SEED_SATURATION = 15

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** 配色の種になる色を選ぶ．彩度が高く，占める割合が大きいものを優先する */
function pickSeedColor(swatches: ColorInfo[], fallbackColor: string) {
	let best = { color: Color(fallbackColor), score: -1 }
	for (const swatch of swatches) {
		const color = Color(swatch.hex)
		const score = color.saturationl() * Math.sqrt(Math.max(swatch.population, 1))
		if (score > best.score) best = { color, score }
	}
	return best.color
}

/**
 * カバーの色から種の色を一つ選び，近い色の範囲で二組のグラデーションの両端を作る．
 * 明度は表示の明暗に合う幅に収めるので，色相が調和し，背景はいつも制御できる明るさになる．
 */
export function getFluidBackgroundColors(
	palette: ExtractedPalette | null | undefined,
	{
		fallbackColor = '#202124',
		colorScheme = 'dark',
	}: { fallbackColor?: string; colorScheme?: FluidBackgroundColorScheme } = {},
): FluidBackgroundColors {
	const swatches = [
		palette?.vibrant,
		palette?.lightVibrant,
		palette?.darkVibrant,
		palette?.dominant,
		palette?.muted,
		palette?.lightMuted,
		palette?.darkMuted,
	].filter((swatch): swatch is ColorInfo => swatch !== null && swatch !== undefined)

	if (swatches.length === 0) {
		return [fallbackColor, fallbackColor, fallbackColor, fallbackColor]
	}

	const seed = pickSeedColor(swatches, fallbackColor)
	const fallback = Color(fallbackColor)
	const hue = seed.saturationl() >= MIN_SEED_SATURATION ? seed.hue() : fallback.hue()
	const saturation = clamp(seed.saturationl(), ...SATURATION_BANDS[colorScheme])
	const [minLightness, maxLightness] = LIGHTNESS_BANDS[colorScheme]
	const midLightness = (minLightness + maxLightness) / 2
	const lightnessSpread = (maxLightness - minLightness) * LIGHTNESS_SPREAD
	const at = (hueOffset: number, lightness: number) =>
		Color.hsl(
			(hue + hueOffset + 360) % 360,
			saturation,
			clamp(lightness, minLightness, maxLightness),
		).hex()

	// A は H から H+Δ，B は H-Δ から H．同じ近い色の群れを使う
	return [
		at(0, midLightness - lightnessSpread),
		at(HUE_OFFSET, midLightness + lightnessSpread),
		at(-HUE_OFFSET, midLightness + lightnessSpread),
		at(0, midLightness - lightnessSpread),
	]
}

interface RotatingGradientProps {
	colors: string[] | SharedValue<string[]>
	width: number
	height: number
	elapsed: SharedValue<number>
	/** 負の値は反時計回り */
	period: number
}

function useTransitionColors(first: string, second: string, duration: number) {
	const startColor = useSharedValue(first)
	const endColor = useSharedValue(second)

	useEffect(() => {
		const config = { duration, easing: Easing.inOut(Easing.quad) }
		// withTiming は，いま表示している色から続けるので，曲を素早く替えても前の曲の色へ戻らない
		startColor.set(withTiming(first, config))
		endColor.set(withTiming(second, config))
		return () => {
			cancelAnimation(startColor)
			cancelAnimation(endColor)
		}
	}, [first, second, duration, startColor, endColor])

	return useDerivedValue(() => [startColor.value, endColor.value])
}

function RotatingGradient({ colors, width, height, elapsed, period }: RotatingGradientProps) {
	// 回すのはシェーダーの両端の点だけ．グラデーションの長さは高さのままにする
	const start = useDerivedValue(() => {
		const angle = (elapsed.value / period) * Math.PI * 2
		return {
			x: width / 2 + (Math.sin(angle) * height) / 2,
			y: height / 2 - (Math.cos(angle) * height) / 2,
		}
	})
	const end = useDerivedValue(() => ({
		x: width - start.value.x,
		y: height - start.value.y,
	}))

	return <LinearGradient start={start} end={end} colors={colors} mode="clamp" />
}

/** 独立に回る二層のグラデーションを，三層目のアルファで混ぜる */
export function FluidBackground({
	palette,
	fallbackColor = '#202124',
	colorScheme,
	paused = false,
	transitionDuration = 800,
	flowTransitionDuration = 600,
	style,
}: FluidBackgroundProps) {
	const [size, setSize] = useState({ width: 0, height: 0 })
	const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active')
	const initialReducedMotion = useReducedMotion()
	const [reducedMotion, setReducedMotion] = useState(initialReducedMotion)
	const elapsed = useSharedValue(0)
	// 流れる速さの倍率．止めるときは 0 へ，動かすときは 1 へ，なめらかに変える
	const flowSpeed = useSharedValue(paused ? 0 : 1)
	const [isFlowEasing, setIsFlowEasing] = useState(false)
	const systemColorScheme = useColorScheme()
	const resolvedColors = getFluidBackgroundColors(palette, {
		fallbackColor,
		colorScheme: colorScheme ?? (systemColorScheme === 'light' ? 'light' : 'dark'),
	})
	const hasSize = size.width > 0 && size.height > 0
	const duration =
		paused || !isAppActive || reducedMotion || !Number.isFinite(transitionDuration)
			? 0
			: Math.max(0, transitionDuration)
	const colorsA = useTransitionColors(resolvedColors[0], resolvedColors[1], duration)
	const colorsB = useTransitionColors(resolvedColors[2], resolvedColors[3], duration)

	useEffect(() => {
		let motionChanged = false
		const appSubscription = AppState.addEventListener('change', (state) => {
			setIsAppActive(state === 'active')
		})
		const motionSubscription = AccessibilityInfo.addEventListener(
			'reduceMotionChanged',
			(value) => {
				motionChanged = true
				setReducedMotion(value)
			},
		)
		// useReducedMotion は起動時の値なので，表示した時点の実際の設定を改めて調べる
		void AccessibilityInfo.isReduceMotionEnabled().then(
			(value) => {
				if (!motionChanged) setReducedMotion(value)
				return undefined
			},
			() => {},
		)
		return () => {
			motionChanged = true
			appSubscription.remove()
			motionSubscription.remove()
		}
	}, [])

	const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
		// 60 秒は，三つの周期の公倍数．折り返しても，どの層にも見た目の飛びが出ない
		elapsed.set((elapsed.value + (timeSincePreviousFrame ?? 0) * flowSpeed.value) % 60_000)
	}, false)

	useEffect(() => {
		const config = {
			duration: Math.max(0, flowTransitionDuration),
			easing: Easing.inOut(Easing.quad),
		}
		if (paused) {
			// 速さが 0 になるまでは，フレームの処理を動かしたままにして，急に止まらないようにする
			setIsFlowEasing(true)
			flowSpeed.set(
				withTiming(0, config, (finished) => {
					if (finished) scheduleOnRN(setIsFlowEasing, false)
				}),
			)
		} else {
			flowSpeed.set(withTiming(1, config))
		}
	}, [paused, flowTransitionDuration, flowSpeed])

	useEffect(() => {
		frame.setActive(hasSize && isAppActive && !reducedMotion && (!paused || isFlowEasing))
		return () => frame.setActive(false)
	}, [frame, hasSize, isAppActive, paused, reducedMotion, isFlowEasing])

	return (
		<View
			pointerEvents="none"
			accessible={false}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}
			onLayout={({ nativeEvent: { layout } }) => {
				setSize((previous) =>
					previous.width === layout.width && previous.height === layout.height
						? previous
						: { width: layout.width, height: layout.height },
				)
			}}
		>
			{hasSize && (
				<Canvas style={StyleSheet.absoluteFill}>
					<Fill>
						{FLUID_SHADER ? (
							<Shader source={FLUID_SHADER} uniforms={{ pixelRatio: PixelRatio.get() }}>
								<RotatingGradient {...size} elapsed={elapsed} period={20_000} colors={colorsA} />
								<RotatingGradient {...size} elapsed={elapsed} period={-12_000} colors={colorsB} />
								<RotatingGradient
									{...size}
									elapsed={elapsed}
									period={15_000}
									colors={['#FFFFFFFF', '#FFFFFF00']}
								/>
							</Shader>
						) : (
							<RotatingGradient {...size} elapsed={elapsed} period={20_000} colors={colorsA} />
						)}
					</Fill>
				</Canvas>
			)}
		</View>
	)
}
