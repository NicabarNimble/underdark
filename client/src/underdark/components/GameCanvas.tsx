import { useState, useEffect, useRef } from 'react'
import * as game from '../three/game'
import { useGameplayContext } from '../hooks/GameplayContext'

const GameCanvas = ({
  width = 720,
  height = 540,
  gameTilemap,
  gameParams = {},
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const canvasRef = useRef()

  useEffect(() => {
    if (canvasRef.current && !isLoading) {
      setIsLoading(true)
      game.init(canvasRef.current, width, height)
      game.animate()
      setIsLoading(false)
      setIsInitialized(true)
      //@ts-ignore
      canvasRef.current.focus()
    }
  }, [canvasRef.current])

  const { playerPosition } = useGameplayContext()

  useEffect(() => {
    if (isInitialized && gameTilemap) {
      game.setupMap(gameTilemap)
      game.setGameParams(gameParams)
    }
  }, [isInitialized, gameTilemap])

  useEffect(() => {
    if (isInitialized && gameTilemap) {
      game.movePlayer(playerPosition)
    }
  }, [isInitialized, playerPosition])

  useEffect(() => {
    if (isInitialized) {
      game.setGameParams(gameParams)
    }
  }, [gameParams])

return (
  <canvas
    id='gameCanvas'
    className='GameCanvas'
    ref={canvasRef}
    width={width * 2}
    height={height * 2}
  >
    Canvas not supported by your browser.
  </canvas>
)
}

export default GameCanvas
