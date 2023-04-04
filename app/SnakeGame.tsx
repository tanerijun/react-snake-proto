"use client"

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react"

// Interface
interface Coordinate {
	x: number
	y: number
}

// Constants
const SPEED = 75 // ms; This will be passed to setInterval, so the lower the faster
const SNAKE_SEGMENT_SIZE = 5 // px; How many pixels each snake segment will take
const CANVAS_WIDTH = 300 // px; internal canvas width
const CANVAS_HEIGHT = 150 // px; internal canvas height

// Helpers
const moveSnake = {
	up: (segments: Coordinate[]) => {
		return segments.map((segment) => {
			return { x: segment.x, y: segment.y - SNAKE_SEGMENT_SIZE }
		})
	},
	down: (segments: Coordinate[]) => {
		return segments.map((segment) => {
			return { x: segment.x, y: segment.y + SNAKE_SEGMENT_SIZE }
		})
	},
	left: (segments: Coordinate[]) => {
		return segments.map((segment) => {
			return { x: segment.x - SNAKE_SEGMENT_SIZE, y: segment.y }
		})
	},
	right: (segments: Coordinate[]) => {
		return segments.map((segment) => {
			return { x: segment.x + SNAKE_SEGMENT_SIZE, y: segment.y }
		})
	},
}

// Entry point
export default function SnakeGame() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const { segments, handleKeydown } = useSnakeGame()

	const drawFn = (ctx: CanvasRenderingContext2D) => draw(ctx, segments)

	return (
		<Canvas
			ref={canvasRef}
			draw={drawFn}
			onKeyDown={handleKeydown}
			tabIndex={0}
		>
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

		return () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
		}
	}, [canvasRef, draw])

	if (!canvasRef) return null

	return (
		<div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
			<div className="h-[300px] w-[600px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1">
				<canvas
					ref={canvasRef}
					className="h-full w-full border-2 bg-white"
					width={CANVAS_WIDTH} // internal canvas width
					height={CANVAS_HEIGHT} // internal canvas height
					{...props}
				/>
			</div>
		</div>
	)
})

// Draws stuffs on the canvas
function draw(ctx: CanvasRenderingContext2D, segments: Coordinate[]) {
	ctx.fillStyle = "black" // TODO: Use color from design system
	for (const { x, y } of segments) {
		ctx.fillRect(x, y, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE)
	}
}

// Controls the logic of the game
function useSnakeGame() {
	const [segments, setSegments] = useState<Coordinate[]>([{ x: 0, y: 0 }])
	const [direction, setDirection] = useState<
		"UP" | "DOWN" | "LEFT" | "RIGHT" | undefined
	>(undefined)

	const headCoordinate = segments[segments.length - 1]
	const isTouchingTopBoundary = headCoordinate.y <= 0
	const isTouchingBottomBoundary =
		headCoordinate.y >= CANVAS_HEIGHT - SNAKE_SEGMENT_SIZE
	const isTouchingLeftBoundary = headCoordinate.x <= 0
	const isTouchingRightBoundary =
		headCoordinate.x >= CANVAS_WIDTH - SNAKE_SEGMENT_SIZE
	const isOnLeftSide = headCoordinate.x <= CANVAS_WIDTH / 2
	const isOnTopSide = headCoordinate.y <= CANVAS_HEIGHT / 2

	const handleKeydown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "W":
				if (direction === "DOWN") return // prevent 180 degree turn
				setDirection("UP")
				break
			case "ArrowDown":
			case "s":
			case "S":
				if (direction === "UP") return // prevent 180 degree turn
				setDirection("DOWN")
				break
			case "ArrowLeft":
			case "a":
			case "A":
				if (direction === "RIGHT") return // prevent 180 degree turn
				setDirection("LEFT")
				break
			case "ArrowRight":
			case "d":
			case "D":
				if (direction === "LEFT") return // prevent 180 degree turn
				setDirection("RIGHT")
				break
		}
	}

	const handleFrameUpdate = () => {
		let newSegmentCoordinates: Coordinate[] | undefined

		switch (direction) {
			case "UP":
				if (isTouchingTopBoundary) {
					if (isOnLeftSide) {
						setDirection("RIGHT")
					} else {
						setDirection("LEFT")
					}
				} else {
					newSegmentCoordinates = moveSnake.up(segments)
				}
				break
			case "DOWN":
				if (isTouchingBottomBoundary) {
					if (isOnLeftSide) {
						setDirection("RIGHT")
					} else {
						setDirection("LEFT")
					}
				} else {
					newSegmentCoordinates = moveSnake.down(segments)
				}
				break
			case "LEFT":
				if (isTouchingLeftBoundary) {
					if (isOnTopSide) {
						setDirection("DOWN")
					} else {
						setDirection("UP")
					}
				} else {
					newSegmentCoordinates = moveSnake.left(segments)
				}
				break
			case "RIGHT":
				if (isTouchingRightBoundary) {
					if (isOnTopSide) {
						setDirection("DOWN")
					} else {
						setDirection("UP")
					}
				} else {
					newSegmentCoordinates = moveSnake.right(segments)
				}
				break
		}

		if (!newSegmentCoordinates) return
		setSegments(newSegmentCoordinates)
	}

	useInterval(handleFrameUpdate, SPEED)

	return { segments, handleKeydown }
}

// https://usehooks-ts.com/react-hook/use-interval
function useInterval(callback: () => void, delay: number | null) {
	const savedCallback = useRef(callback)

	// Remember the latest callback if it changes.
	useLayoutEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the interval.
	useEffect(() => {
		// Don't schedule if no delay is specified.
		// Note: 0 is a valid value for delay.
		if (!delay && delay !== 0) {
			return
		}

		const id = setInterval(() => savedCallback.current(), delay)

		return () => clearInterval(id)
	}, [delay])
}
