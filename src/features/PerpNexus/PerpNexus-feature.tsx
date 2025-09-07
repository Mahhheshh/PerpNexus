import { useSolana } from '@/components/solana/use-solana'
import { WalletButton } from '@/components/solana/solana-provider'
import { AppHero } from '@/components/app-hero'
import { PerpNexusUiProgramExplorerLink } from './ui/PerpNexus-ui-program-explorer-link'
import { PerpNexusUiCreate } from './ui/PerpNexus-ui-create'
import { PerpNexusUiProgram } from '@/features/PerpNexus/ui/PerpNexus-ui-program'

export default function PerpNexusFeature() {
  const { account } = useSolana()

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="hero py-[64px]">
          <div className="hero-content text-center">
            <WalletButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="PerpNexus" subtitle={'Run the program by clicking the "Run program" button.'}>
        <p className="mb-6">
          <PerpNexusUiProgramExplorerLink />
        </p>
        <PerpNexusUiCreate />
      </AppHero>
      <PerpNexusUiProgram />
    </div>
  )
}
