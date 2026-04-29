import { LeftPanel } from './components/layout/LeftPanel'
import { PreviewArea } from './components/preview/PreviewArea'

export default function App() {
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <LeftPanel />
      <PreviewArea />
    </div>
  )
}
