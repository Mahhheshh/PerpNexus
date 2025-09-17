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

    pub fn init_trader_profile(ctx: Context<InitTrader>) -> Result<()> {
        ctx.accounts.init(ctx.bumps.trader_profile)?;
        Ok(())
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        position_index: u64,
        amount: u64,
        call: Call,
        leverage: u8,
    ) -> Result<()> {
        ctx.accounts
            .open_position(amount, position_index, call, leverage, ctx.bumps.position)?;
        ctx.accounts.transfer_to_vault(amount)?;
        Ok(())
    }

    pub fn clsoe_position(ctx: Context<ClosePosition>, position_index: u64) -> Result<()> {
        ctx.accounts.transfer_to_trader(ctx.bumps.protocol_vault)?;
        Ok(())
    }

    pub fn update_funding_fees(ctx: Context<UpdateFundingFees>, trader: Pubkey, updated_fees: i64) -> Result<()> {
        ctx.accounts.update_fees(updated_fees)?;
        Ok(())
    }
 }
