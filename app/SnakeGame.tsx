"use client"

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react"

// Types and Interfaces
type GameState = "PLAYING" | "PAUSED" | "GAME_OVER"

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

interface Coordinate {
	x: number
	y: number
}

// Constants
const SPEED = 50 // ms; This will be passed to setInterval, so the lower the faster
const SEGMENT_SIZE = 5 // px; How many pixels each snake segment or food will take
const CANVAS_WIDTH = 300 // px; internal canvas width
const CANVAS_HEIGHT = 150 // px; internal canvas height
const INITIAL_SPAWN_COORDINATES = [
	{ x: CANVAS_WIDTH / 3, y: CANVAS_HEIGHT / 2 },
	{ x: CANVAS_WIDTH / 3 - SEGMENT_SIZE, y: CANVAS_HEIGHT / 2 },
	{ x: CANVAS_WIDTH / 3 - SEGMENT_SIZE * 2, y: CANVAS_HEIGHT / 2 },
	{ x: CANVAS_WIDTH / 3 - SEGMENT_SIZE * 3, y: CANVAS_HEIGHT / 2 },
	{ x: CANVAS_WIDTH / 3 - SEGMENT_SIZE * 4, y: CANVAS_HEIGHT / 2 },
] // px; Where the snake will spawn
const INITIAL_DIRECTION: Direction = "RIGHT"
const INITIAL_GAME_STATE: GameState = "PAUSED"
const SNAKE_TAIL_LENGTH = 2 // SEGMENT_SIZE; This will act as afterimage of movement

// Helpers
const moveSnake = {
	up: (segments: Coordinate[]) => {
		const newSegments = [...segments]
		newSegments.pop()
		newSegments.unshift({ x: segments[0].x, y: segments[0].y - SEGMENT_SIZE })
		return newSegments
	},
	down: (segments: Coordinate[]) => {
		const newSegments = [...segments]
		newSegments.pop()
		newSegments.unshift({ x: segments[0].x, y: segments[0].y + SEGMENT_SIZE })
		return newSegments
	},
	left: (segments: Coordinate[]) => {
		const newSegments = [...segments]
		newSegments.pop()
		newSegments.unshift({ x: segments[0].x - SEGMENT_SIZE, y: segments[0].y })
		return newSegments
	},
	right: (segments: Coordinate[]) => {
		const newSegments = [...segments]
		newSegments.pop()
		newSegments.unshift({ x: segments[0].x + SEGMENT_SIZE, y: segments[0].y })
		return newSegments
	},
}

// Entry point
export default function SnakeGame() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)

	const { segments, food, handleKeydown, resetGame } = useSnakeGame(
		gameState,
		setGameState
	)

	const drawFn = (ctx: CanvasRenderingContext2D) => draw(ctx, segments, food)

	const focusCanvas = () => {
		if (!canvasRef.current) return
		canvasRef.current.focus()
	}

	const restartGame = () => {
		resetGame()
		setGameState("PLAYING")
		focusCanvas()
	}

	const pauseGame = () => {
		setGameState("PAUSED")
		focusCanvas()
	}

	const playGame = () => {
		setGameState("PLAYING")
		focusCanvas()
	}

	return (
		<div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center">
			<div className="h-[300px] w-[600px] rounded bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1">
				<Canvas ref={canvasRef} draw={drawFn} onKeyDown={handleKeydown} />
			</div>
			<div className="mt-8 w-fit rounded bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-1">
				{gameState === "GAME_OVER" ? (
					<button
						className="bg-white px-6 py-2 text-black"
						onClick={restartGame}
					>
						Reset
					</button>
				) : gameState === "PLAYING" ? (
					<button className="bg-white px-6 py-2 text-black" onClick={pauseGame}>
						Pause
					</button>
				) : (
					<button className="bg-white px-6 py-2 text-black" onClick={playGame}>
						Play
					</button>
				)}
			</div>
		</div>
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
		<canvas
			ref={canvasRef}
			className="h-full w-full bg-black focus:outline-none"
			width={CANVAS_WIDTH} // internal canvas width
			height={CANVAS_HEIGHT} // internal canvas height
			tabIndex={0}
			{...props}
		/>
	)
})

// Draws stuffs on the canvas
function draw(
	ctx: CanvasRenderingContext2D,
	segments: Coordinate[],
	food: Coordinate | undefined
) {
	const head = segments[0]
	const body = segments.slice(1, segments.length - SNAKE_TAIL_LENGTH)
	const tail = segments.slice(segments.length - SNAKE_TAIL_LENGTH)

	// Draw food
	if (food) {
		ctx.fillStyle = "red" // TODO: Use color from design system
		ctx.fillRect(food.x, food.y, SEGMENT_SIZE, SEGMENT_SIZE)
	}

	// Draw snake's head
	ctx.fillStyle = "rgba(255, 255, 255, 1)"
	ctx.fillRect(head.x, head.y, SEGMENT_SIZE, SEGMENT_SIZE)

	// Draw snake's body
	ctx.fillStyle = "rgba(255, 255, 255, 0.8" // TODO: Use color from design system
	for (const { x, y } of body) {
		ctx.fillRect(x, y, SEGMENT_SIZE, SEGMENT_SIZE)
	}

	// Draw snake's tail
	for (let i = 0; i < tail.length; i++) {
		const { x, y } = tail[i]
		ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * (tail.length - i)})`
		ctx.fillRect(x, y, SEGMENT_SIZE, SEGMENT_SIZE)
	}
}

// Controls the logic of the game
function useSnakeGame(
	gameState: GameState,
	setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
	const [segments, setSegments] = useState<Coordinate[]>(
		INITIAL_SPAWN_COORDINATES
	)
	const [food, setFood] = useState<Coordinate | undefined>(undefined)
	const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)

	const headCoordinate = segments[0]
	const isTouchingTopBoundary = headCoordinate.y <= 0
	const isTouchingBottomBoundary =
		headCoordinate.y >= CANVAS_HEIGHT - SEGMENT_SIZE
	const isTouchingLeftBoundary = headCoordinate.x <= 0
	const isTouchingRightBoundary =
		headCoordinate.x >= CANVAS_WIDTH - SEGMENT_SIZE
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

	const isSnakeEatingItself = () => {
		const segmentsWithoutHeadAndTail = segments.slice(
			1,
			segments.length - SNAKE_TAIL_LENGTH
		)

		if (segmentsWithoutHeadAndTail.length <= 1) {
			return false
		}

		return segmentsWithoutHeadAndTail.some(
			(segment) =>
				segment.x === headCoordinate.x && segment.y === headCoordinate.y
		)
	}

	const isSnakeGoingToEatFoodNextFrame = () => {
		if (!food) return false

		switch (direction) {
			case "UP":
				return (
					headCoordinate.x === food.x &&
					headCoordinate.y - SEGMENT_SIZE === food.y
				)
			case "DOWN":
				return (
					headCoordinate.x === food.x &&
					headCoordinate.y + SEGMENT_SIZE === food.y
				)
			case "LEFT":
				return (
					headCoordinate.x - SEGMENT_SIZE === food.x &&
					headCoordinate.y === food.y
				)
			case "RIGHT":
				return (
					headCoordinate.x + SEGMENT_SIZE === food.x &&
					headCoordinate.y === food.y
				)
		}
	}

	const handleFrameUpdate = () => {
		let newSegmentCoordinates: Coordinate[] | undefined

		if (isSnakeEatingItself()) {
			setGameState("GAME_OVER")
			return
		}

		if (food && isSnakeGoingToEatFoodNextFrame()) {
			setSegments([...segments, food])
			setFood(undefined)
			return
		}

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

	const resetGame = () => {
		setSegments(INITIAL_SPAWN_COORDINATES)
		setFood(undefined)
		setDirection(INITIAL_DIRECTION)
	}

	useEffect(() => {
		if (!food) {
			setFood(spawnFoodRandom())
		}
	}, [food])

	useInterval(handleFrameUpdate, gameState === "PLAYING" ? SPEED : null)

	return { segments, food, handleKeydown, resetGame }
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

function spawnFoodRandom(): Coordinate {
	const x =
		Math.floor((Math.random() * CANVAS_WIDTH) / SEGMENT_SIZE) * SEGMENT_SIZE
	const y =
		Math.floor((Math.random() * CANVAS_HEIGHT) / SEGMENT_SIZE) * SEGMENT_SIZE
	return { x, y }
}
