import { useStore } from '../../store/useStore'
import type { CircleRole } from '../../types'

const ROLE_LABELS: Record<CircleRole, string> = {
  depth: 'Depth',
  main: 'Main',
  highlight: 'Highlight',
}

interface Props {
  role: CircleRole
}

export function CircleControls({ role }: Props) {
  const circle = useStore((s) => s.circles.find((c) => c.role === role)!)

  return (
    <div className="py-2 flex items-center gap-2">
      <div className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ background: circle.color }} />
      <span className="text-xs text-white/50">{ROLE_LABELS[role]}</span>
      <span className="text-xs text-white/25 font-mono ml-auto">{circle.color}</span>
    </div>
  )
}
