use anchor_lang::prelude::*;

use crate::state::{PerpNexusConfig, TraderProfile};

#[derive(Accounts)]
#[instruction(trader: Pubkey)]
pub struct UpdateFundingFees<'info> {
    #[account(
      mut,
      address = config.cranker
    )]
    pub cranker: Signer<'info>,

    #[account(
      has_one = cranker,
      seeds = [b"config"],
      bump = config.bump
    )]
    pub config: Account<'info, PerpNexusConfig>,

    #[account(
      mut,
      has_one = trader,
      seeds = [b"trader", trader.key().as_ref()],
      bump = trader_profile.bump
    )]
    pub trader_profile: Account<'info, TraderProfile>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateFundingFees<'info> {
    pub fn update_fees(&mut self, updated_fees: i64) -> Result<()> {
        let trader_profile = &mut self.trader_profile;

        trader_profile.funding_fees = updated_fees;

        Ok(())
    }
}
