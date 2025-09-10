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
import { Call, fetchPerpNexusConfig, fetchPosition, getInitPerpConfigInstruction, getOpenPositionInstruction, getPerpNexusProgramId } from '../src'
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

// get position pda
// [b"position", trader.key().as_ref(), &position_index.to_le_bytes()],
async function getPositionAddress(programAddress: Address, traderKey: Address, position_index: number) {
  const addressEncoder = getAddressEncoder();
  // convert the number to rusts to_le_bytes
  let position_buffer = Buffer.alloc(8);
  position_buffer.writeBigInt64LE(BigInt(position_index));

  const [pda,] = await getProgramDerivedAddress({
    programAddress, seeds: [
      "position",
      addressEncoder.encode(traderKey),
      position_buffer
    ]
  })
  return pda;
}


describe('PerpNexus', () => {
  let payer: KeyPairSigner;
  let cranker: KeyPairSigner;
  let config: Address;
  let protocolVault: Address;
  let programAddress = getPerpNexusProgramId('solana:localnet');

  // 7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE this is the sponsered solana account, which is live on mainnet
  // Clone mainnet account to localnet for testing
  let priceUpdateAccount: Address = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE" as Address;

  // let trader 1
  let trader_one: KeyPairSigner

  beforeAll(async () => {
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!);
    cranker = await generateKeyPairSigner();
    [config] = await getProgramDerivedAddress({ programAddress, seeds: ["config"] });
    [protocolVault] = await getProgramDerivedAddress({ programAddress, seeds: ["vault"] })

    trader_one = await generateKeyPairSigner();

    // airdrop
    const airdrop = rpc.requestAirdrop(trader_one.address, 5 * LAMPORTS_PER_SOL as any);
    const sig = await airdrop.send();
    console.log(sig);
    console.log('--------------------------------');
    console.log('payer', payer.address);
    console.log('cranker', cranker.address);
    console.log('config', config.toString());
    console.log('vault; ', protocolVault.toString());
    console.log('--------------------------------');

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

  it('should fail to initilize the config again', async () => {
    const initPerpIx = getInitPerpConfigInstruction({
      admin: payer,
      cranker: cranker.address,
      config,
      protocolVault,
      fees: 0,
    });

    await expect(sendAndConfirm({ ix: initPerpIx, payer })).rejects.toThrow();
  })

  it("should open a position for trader", async () => {
    const positionIndex = 0;
    const amount = 0.01 * LAMPORTS_PER_SOL;
    const leverage = 1;
    const trader_one_call = Call.SHORT;

    const position = await getPositionAddress(programAddress, trader_one.address, positionIndex);

    const open_position_ix = getOpenPositionInstruction({
      trader: trader_one,
      position,
      protocolVault,
      priceUpdate: priceUpdateAccount,
      positionIndex,
      amount,
      leverage,
      call: trader_one_call
    })

    await sendAndConfirm({ ix: open_position_ix, payer });

    const positionAccount = await fetchPosition(rpc, position);

    expect(positionAccount.data.leverage.toString()).toBe(leverage.toString());
    expect(positionAccount.data.amount.toString()).toBe(amount.toString());
    expect(positionAccount.data.positionIndex.toString()).toBe(positionIndex.toString());
    expect(positionAccount.data.trader.toString()).toBe(trader_one.address.toString());
    expect(positionAccount.data.call).toBe(trader_one_call);
    console.log('price of entry', Number(positionAccount.data.entryPrice));
  })
})
