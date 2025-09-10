use anchor_lang::prelude::*;

mod instructions;
mod state;

use instructions::*;
use state::*;

declare_id!("BKRPzmuiy84FuBdbbjAa1Nk8LJ2CKekVhJXi1NqTxCh9");

#[program]
pub mod PerpNexus {
    use super::*;

    pub fn init_perp_config(ctx: Context<InitConfig>, cranker: Pubkey, fees: u16) -> Result<()> {
        ctx.accounts.init_config(cranker, fees, &ctx.bumps)?;
        Ok(())
    }
    pub fn open_position(ctx: Context<OpenPosition>, position_index: u64, amount: u64, call: Call, leverage: u8) -> Result<()> {

        ctx.accounts.open_position(amount, position_index, call, leverage, ctx.bumps.position)?;
        ctx.accounts.transfer_to_vault(amount)?;
        Ok(())
    }
}
