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
  getAddressEncoder,
  LAMPORTS_PER_SOL,
} from 'gill'
import {
  Call,
  fetchPerpNexusConfig,
  fetchPosition,
  fetchTraderProfile,
  getClosePositionInstruction,
  getInitPerpConfigInstruction,
  getInitTraderProfileInstruction,
  getOpenPositionInstruction,
  getPerpNexusProgramId,
  getUpdateFundingFeesInstruction,
} from '../src'
import { loadKeypairSignerFromFile } from 'gill/node'
import { describe, it, expect, beforeAll } from 'vitest'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' })

// Helper function to keep the tests DRY
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
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
    latestBlockhash: await getLatestBlockhash()
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction, {
    skipPreflight: false,
    commitment: 'confirmed',
  })
}

// get position pda
// [b"position", trader.key().as_ref(), &position_index.to_le_bytes()],
async function getPositionAddress(programAddress: Address, traderKey: Address, position_index: number) {
  const addressEncoder = getAddressEncoder()
  // convert the number to rusts to_le_bytes
  let position_buffer = Buffer.alloc(8)
  position_buffer.writeBigInt64LE(BigInt(position_index))

  const [pda] = await getProgramDerivedAddress({
    programAddress,
    seeds: ['position', addressEncoder.encode(traderKey), position_buffer],
  })
  return pda
}

// trader profile pda
// [b"trader", trader.key().as_ref()],
async function getTraderProfile(programAddress: Address, traderKey: Address) {
  const addressEncoder = getAddressEncoder()

  const [pda] = await getProgramDerivedAddress({
    programAddress,
    seeds: ['trader', addressEncoder.encode(traderKey)],
  })
  return pda
}


describe('PerpNexus', () => {
  let payer: KeyPairSigner
  let cranker: KeyPairSigner
  let config: Address
  let protocolVault: Address
  let programAddress = getPerpNexusProgramId('solana:localnet')

  // 7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE this is the sponsered solana account, which is live on mainnet
  // Clone mainnet account to localnet for testing
  let priceUpdateAccount: Address = '7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE' as Address

  // let trader 1
  let trader_one: KeyPairSigner

  beforeAll(async () => {
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
    cranker = await generateKeyPairSigner();
    [config] = await getProgramDerivedAddress({ programAddress, seeds: ['config'] });
    [protocolVault] = await getProgramDerivedAddress({ programAddress, seeds: ['vault'] })

    trader_one = await generateKeyPairSigner()

    // airdrop
    const airdrop = rpc.requestAirdrop(trader_one.address, (5 * LAMPORTS_PER_SOL) as any)
    await airdrop.send()

    // fund the protocol vault
    const protocolVaultDrop = rpc.requestAirdrop(protocolVault, (5 * LAMPORTS_PER_SOL) as any)
    await protocolVaultDrop.send()

    const cranckDrop = rpc.requestAirdrop(cranker.address, (5 * LAMPORTS_PER_SOL) as any)
    await cranckDrop.send()

    console.log('--------------------------------')
    console.log('payer', payer.address)
    console.log('cranker', cranker.address)
    console.log('config', config.toString())
    console.log('vault; ', protocolVault.toString())
    console.log('--------------------------------')
  })

  it('should init config', async () => {
    const initPerpIx = getInitPerpConfigInstruction({
      admin: payer,
      cranker: cranker.address,
      config,
      protocolVault,
      fees: 0,
    })

    await sendAndConfirm({ ix: initPerpIx, payer })
    let configAccount = await fetchPerpNexusConfig(rpc, config)

    expect(configAccount.data.admin).toBe(payer.address)
    expect(configAccount.data.fees.toString()).toBe('0')
    expect(configAccount.data.cranker).toBe(cranker.address)
  })

  it('should fail to initilize the config again', async () => {
    const initPerpIx = getInitPerpConfigInstruction({
      admin: payer,
      cranker: cranker.address,
      config,
      protocolVault,
      fees: 0,
    })

    await expect(sendAndConfirm({ ix: initPerpIx, payer })).rejects.toThrow()
  })

  it('it should create a trader profile pda', async () => {
    const traderProfileAddress = await getTraderProfile(programAddress, trader_one.address);

    const create_profile_ix = await getInitTraderProfileInstruction({
      trader: trader_one,
      traderProfile: traderProfileAddress
    })

    await sendAndConfirm({ ix: create_profile_ix, payer: trader_one });

    const traderOneProfile = await fetchTraderProfile(rpc, traderProfileAddress);

    expect(traderOneProfile.data.trader).toBe(trader_one.address);
    expect(traderOneProfile.data.fundingFees.toString()).toBe("0");
    expect(traderOneProfile.data.positionIndex.toString()).toBe("0");
    expect(traderOneProfile.data.unrealizedPnl.toString()).toBe("0");
  })

  it('should open a position for trader', async () => {
    const positionIndex = 0
    const amount = 0.01 * LAMPORTS_PER_SOL
    const leverage = 1
    const trader_one_call = Call.SHORT

    const position = await getPositionAddress(programAddress, trader_one.address, positionIndex)

    const open_position_ix = getOpenPositionInstruction({
      trader: trader_one,
      position,
      protocolVault,
      priceUpdate: priceUpdateAccount,
      positionIndex,
      amount,
      leverage,
      call: trader_one_call,
    })

    await sendAndConfirm({ ix: open_position_ix, payer: trader_one })

    const positionAccount = await fetchPosition(rpc, position)

    expect(positionAccount.data.leverage.toString()).toBe(leverage.toString())
    expect(positionAccount.data.amount.toString()).toBe(amount.toString())
    expect(positionAccount.data.positionIndex.toString()).toBe(positionIndex.toString())
    expect(positionAccount.data.trader.toString()).toBe(trader_one.address.toString())
    expect(positionAccount.data.call).toBe(trader_one_call)
  })

  it("should the funding rate to be positive", async () => {
    const traderProfileAddress = await getTraderProfile(programAddress, trader_one.address);

    let updatedFundingFees = BigInt(50);

    const traderOneProfileBefore = await fetchTraderProfile(rpc, traderProfileAddress);
    expect(traderOneProfileBefore.data.fundingFees.toString()).toBe("0");

    const create_funding_rate_ix = getUpdateFundingFeesInstruction({
      cranker: cranker,
      config,
      traderProfile: traderProfileAddress,
      trader: trader_one.address,
      updatedFees: updatedFundingFees
    });

    await sendAndConfirm({ ix: create_funding_rate_ix, payer: cranker });

    const traderOneProfileAfter = await fetchTraderProfile(rpc, traderProfileAddress);
    expect(traderOneProfileAfter.data.fundingFees).toBe(updatedFundingFees);

    expect(traderOneProfileAfter.data.fundingFees).toBeGreaterThan(traderOneProfileBefore.data.fundingFees);
  })

  it("should the funding rate to be negative", async () => {

    const traderProfileAddress = await getTraderProfile(programAddress, trader_one.address);

    let updatedFundingFees = BigInt(-50);
    const traderOneProfileBefore = await fetchTraderProfile(rpc, traderProfileAddress);

    const create_funding_rate_ix = getUpdateFundingFeesInstruction({
      cranker: cranker,
      config,
      traderProfile: traderProfileAddress,
      trader: trader_one.address,
      updatedFees: updatedFundingFees
    });

    await sendAndConfirm({ ix: create_funding_rate_ix, payer: cranker });

    const traderOneProfileAfter = await fetchTraderProfile(rpc, traderProfileAddress);

    expect(traderOneProfileAfter.data.fundingFees).toBe(updatedFundingFees);
    expect(traderOneProfileAfter.data.fundingFees).toBeLessThan(traderOneProfileBefore.data.fundingFees);
  })

  // This needs to be run using the bankrun.
  it.skip('should close a position for trader', async () => {
    // Not implemented: This test requires bankrun and is intentionally skipped.
    const positionIndex = 0;
    const position = await getPositionAddress(programAddress, trader_one.address, positionIndex);

    const open_position_ix = getClosePositionInstruction({
      trader: trader_one,
      position,
      protocolVault,
      priceUpdate: priceUpdateAccount,
      positionIndex,
    })

    await sendAndConfirm({ ix: open_position_ix, payer: trader_one });

    await expect(async () => await fetchPosition(rpc, position)).rejects.toThrow();
  })
})
