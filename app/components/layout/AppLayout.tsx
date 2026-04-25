import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'

export function AppLayout() {
  return (
    <div className="flex w-full min-h-screen overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="block md:hidden">
          <MobileHeader />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>
        <div className="block md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
