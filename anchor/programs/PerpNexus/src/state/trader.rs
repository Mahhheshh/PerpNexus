pub use anchor_lang::prelude::*;

#[account]
pub struct TraderProfile {
  pub trader: Pubkey,
  pub position_index: u64,
  pub unrealized_pnl: i64,
  pub funding_fees: i64,
  pub bump: u8
}

impl Space for TraderProfile {
  const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 1;
}