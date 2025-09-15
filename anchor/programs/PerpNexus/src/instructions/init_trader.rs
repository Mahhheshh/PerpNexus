use anchor_lang::prelude::*;

use crate::state::TraderProfile;


#[derive(Accounts)]
pub struct InitTrader<'info> {
  #[account(mut)]
  pub trader: Signer<'info>,

  #[account(
    init,
    payer = trader,
    space = 8 + TraderProfile::INIT_SPACE,
    seeds = [b"trader", trader.key().as_ref()],
    bump
  )]
  pub trader_profile: Account<'info, TraderProfile>,

  pub system_program: Program<'info, System>,
}

impl<'info> InitTrader<'info> {
  pub fn init(&mut self, trader_bump: u8) -> Result<()> {
    let _ = self.trader_profile.set_inner(TraderProfile { trader: self.trader.key(), position_index: 0, unrealized_pnl: 0, funding_fees: 0, bump: trader_bump });

    Ok(())
  }
}