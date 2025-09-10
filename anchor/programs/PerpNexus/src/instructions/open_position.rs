use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use crate::state::{Call, Position};

#[derive(Accounts)]
#[instruction(position_index: u64)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
      init,
      payer = trader,
      space = 8 + Position::INIT_SPACE,
      seeds = [b"position", trader.key().as_ref(), &position_index.to_le_bytes()],
      bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub protocol_vault: SystemAccount<'info>,

    pub price_update: Account<'info, PriceUpdateV2>, // pyth oracle for real time price

    pub system_program: Program<'info, System>,
}

impl<'info> OpenPosition<'info> {
    pub fn open_position(
        &mut self,
        amount: u64,
        position_index: u64,
        call: Call,
        leverage: u8,
        position_bump: u8,
    ) -> Result<()> {
        let price_update = &mut self.price_update;

        // let maximum_age: u64 = 300; // TODO: only for localnet testing

        let feed_id: [u8; 32] = get_feed_id_from_hex(
            "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        )?;

        // let entry_price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;
        // NOTE: ONLY FOR LOCALNET TESTING DO NOY USE IN DEVNET
        let entry_price = price_update.get_price_unchecked(&feed_id)?;
        let entry_price = entry_price.price;

        let _ = self.position.set_inner(Position {
            trader: self.trader.key(),
            amount,
            entry_price,
            position_index,
            call,
            leverage,
            bump: position_bump,
        });
        Ok(())
    }

    pub fn transfer_to_vault(&mut self, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            self.system_program.to_account_info(),
            Transfer {
                from: self.trader.to_account_info(),
                to: self.protocol_vault.to_account_info(),
            },
        );
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
