import { LeftPanel } from './components/layout/LeftPanel'
import { PreviewArea } from './components/preview/PreviewArea'

export default function App() {
  console.log("[v0] App mounted")
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <LeftPanel />
      <PreviewArea />
    </div>
  )
}
