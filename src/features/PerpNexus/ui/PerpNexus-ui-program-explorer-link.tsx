import { usePerpNexusProgramId } from '@/features/PerpNexus/data-access/use-PerpNexus-program-id'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function PerpNexusUiProgramExplorerLink() {
  const programId = usePerpNexusProgramId()

  return <AppExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}
