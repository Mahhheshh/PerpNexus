import {
  Address,
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  KeyPairSigner,
  getProgramDerivedAddress,
  signTransactionMessageWithSigners,
} from 'gill'
import { fetchPerpNexusConfig, getInitPerpConfigInstruction, getPerpNexusProgramId } from '../src'
import { loadKeypairSignerFromFile } from 'gill/node'
import { describe, it, expect, beforeAll } from 'vitest'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction, {
    skipPreflight: true,
    commitment: 'confirmed'
  })
}


describe('PerpNexus', () => {
  let payer: KeyPairSigner
  let cranker: KeyPairSigner;
  let config: Address;
  let protocolVault: Address;
  let programAddress = getPerpNexusProgramId('solana:localnet');

  beforeAll(async () => {
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!);
    cranker = await generateKeyPairSigner();

    [config] = await getProgramDerivedAddress({ programAddress, seeds: ["config"] });
    [protocolVault] = await getProgramDerivedAddress({ programAddress, seeds: ["vault"] })
  })

  it('should init config', async () => {
    const initPerpIx = getInitPerpConfigInstruction({
      admin: payer,
      cranker: cranker.address,
      config,
      protocolVault,
      fees: 0,
    });

    await sendAndConfirm({ ix: initPerpIx, payer });
    let configAccount = await fetchPerpNexusConfig(rpc, config);

    expect(configAccount.data.admin).toBe(payer.address);
    expect(configAccount.data.fees.toString()).toBe("0");
    expect(configAccount.data.cranker).toBe(cranker.address);
  })
})
