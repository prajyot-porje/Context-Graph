'use client'

import dynamic from 'next/dynamic'

const WhatAIKnowsSection = dynamic(
  () => import('@/components/sections/WhatAIKnowsSection'),
  { ssr: false }
)

export default WhatAIKnowsSection
