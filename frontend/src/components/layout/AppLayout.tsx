import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex w-full min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      <div className="block md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
