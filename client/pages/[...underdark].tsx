import React, { useMemo } from 'react'
import { useRouter } from 'next/router'
import AppDojo from '@/underdark/components/AppDojo'
import Manor from '@/underdark/components/Manor'
import Underdark from '@/underdark/components/Underdark'

export default function UnderdarkPage() {
  const router = useRouter()
  console.log(`>>> UNDERDARK`, router.query.underdark)

  const { page, title, isPlaying, roomId, levelNumber } = useMemo(() => {
    let page = null
    let title = null
    let isPlaying = false
    let roomId = null
    let levelNumber = null
    // parse page
    if (router.isReady && router.query.underdark) {
      const _page = router.query.underdark[0]
      const _slugs = router.query.underdark.slice(1)
      if (_page == 'manor') {
        // '/manor'
        page = _page
        title = 'Underdark - The Manor'
      } else if (_page == 'room') {
        // '/room/[roomId]'
        // '/room/[roomId]/[levelNumber]'
        if (_slugs.length > 0) {
          page = _page
          roomId = parseInt(_slugs[0])
          levelNumber = parseInt(_slugs[1] ?? '1')
          title = `Underdark - Room #${roomId} Level ${levelNumber}`
          isPlaying = true
        }
      }
    }
    return {
      page,
      title,
      isPlaying,
      roomId,
      levelNumber,
    }
  }, [router.isReady, router.query])

  if (!page) {
    if (router.isReady) {
      // invalid route
      router.push('/')
    }
    return <></>
  }

  return (
    <AppDojo title={title}>
      {page == 'manor' &&
        <Manor />
      }
      <Underdark
        isPlaying={isPlaying}
        roomId={roomId}
        levelNumber={levelNumber}
      />
    </AppDojo>
  );
}
