"use client"

import { forwardRef, useEffect, useRef, useState } from "react"

export default function SnakeGame() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { snakeBody } = useSnakeGame()

	const drawFn = (ctx: CanvasRenderingContext2D) => draw(ctx, snakeBody)

	return (
		<Canvas ref={canvasRef} draw={drawFn}>
			<h1>Snake Game</h1>
		</Canvas>
	)
}

// TODO:
// 1. Use color from design system
// 2. Set width and height properly (the internal size will be scaled to meet the style from CSS)
const Canvas = forwardRef<
	HTMLCanvasElement,
	{
		draw: (ctx: CanvasRenderingContext2D) => void
	} & React.DetailedHTMLProps<
		React.CanvasHTMLAttributes<HTMLCanvasElement>,
		HTMLCanvasElement
	>
>(function Canvas({ children, draw, ...props }, canvasRef) {
	useEffect(() => {
		if (!canvasRef) return

		const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>).current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		draw(ctx)
	}, [canvasRef, draw])

	if (!canvasRef) return null

	return (
		<div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
			<div className="h-[300px] w-[600px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1">
				<canvas
					ref={canvasRef}
					className="h-full w-full border-2 bg-white"
					width={300} // internal canvas width
					height={150} // internal canvas height
					{...props}
				/>
			</div>
		</div>
	)
})

interface Coordinate {
	x: number
	y: number
}

// Draws stuffs on the canvas
function draw(ctx: CanvasRenderingContext2D, snakeBody: Coordinate[]) {
	const SNAKE_SEGMENT_SIZE = 5

	ctx.fillStyle = "black" // TODO: Use color from design system
	for (const { x, y } of snakeBody) {
		ctx.fillRect(x, y, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE)
	}
}

// Controls the logic of the game
function useSnakeGame() {
	const [snakeBody, setSnakeBody] = useState<Coordinate[]>([{ x: 0, y: 0 }])

	return { snakeBody }
}
