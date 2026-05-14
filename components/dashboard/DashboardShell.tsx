'use client'

import { useState, useEffect } from 'react'
import { gsap } from '@/lib/gsap'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { prefersReducedMotion } from '@/lib/gsap'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState('1') // Default to 'ME' node

  useEffect(() => {
    if (prefersReducedMotion()) return

    const tl = gsap.timeline()
    
    tl.fromTo('.cg-topbar',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.25, ease: 'cg-out' }
    )
    .fromTo('.cg-sidebar',
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.3, ease: 'cg-out' },
      0.05
    )
    .fromTo('.cg-main',
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      0.15
    )
    .fromTo('.cg-sidebar-node',
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.2, stagger: 0.04, ease: 'cg-out' },
      0.2
    )

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <TopBar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        
        {/* Main Area */}
        <main className="cg-main relative flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
