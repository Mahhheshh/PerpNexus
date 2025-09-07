import { useSolana } from '@/components/solana/use-solana'
import { useMemo } from 'react'
import { getPerpNexusProgramId } from '@project/anchor'

export function usePerpNexusProgramId() {
  const { cluster } = useSolana()

  return useMemo(() => getPerpNexusProgramId(cluster.id), [cluster])
}
