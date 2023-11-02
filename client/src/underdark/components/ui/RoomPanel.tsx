import { useEffect } from 'react'
import { useChamber, useGameChamberIds } from '../../hooks/useChamber'
import { useUnderdarkContext } from '../../hooks/UnderdarkContext'
import { bigintToHex } from '../../utils/utils'
import { MAX_GAMES } from './RoomSelector'
import ScoreBoard from './ScoreBoard'

function RoomPanel() {
  const { roomId, chamberId, dispatch, UnderdarkActions } = useUnderdarkContext()
  const { chamberExists, yonder } = useChamber(chamberId)

  const { chamberIds } = useGameChamberIds(roomId)
  useEffect(() => {
    const coord = chamberIds.length > 0 ? chamberIds[chamberIds.length - 1] : 0n
    dispatch({
      type: UnderdarkActions.SET_CHAMBER,
      payload: coord,
    })
  }, [chamberIds])

  const _randomizeGame = () => {
    const newRoomId = Math.floor(Math.random() * MAX_GAMES) + 1
    dispatch({
      type: UnderdarkActions.SET_GAME,
      payload: newRoomId,
    })
  }

  return (
    <div className='RoomPanel Padded'>
      <h2>
        Room #{roomId.toString()}
        {' '}
        <span className='Anchor' onClick={() => _randomizeGame()}>🔄</span>
      </h2>

      {!chamberExists && <>
        <div>This Room has not been
          <br />
          explored yet!
        </div>
      </>}

      {chamberExists && <>
        {/* <b>{coordToSlug(chamberId, yonder)}</b>
          <br /> */}
        {bigintToHex(chamberId)}
        <br />
        Level: <b>{yonder}</b>

        <ScoreBoard />

      </>}
    </div>
  )
}

export default RoomPanel
