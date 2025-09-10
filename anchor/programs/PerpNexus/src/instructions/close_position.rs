use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use crate::state::{Call, Position};

#[derive(Accounts)]
#[instruction(position_index: u64)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(
      mut,
      close = trader,
      seeds = [b"position", trader.key().as_ref(), &position_index.to_le_bytes()],
      bump = position.bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub protocol_vault: SystemAccount<'info>,

    pub price_update: Account<'info, PriceUpdateV2>,

    pub system_program: Program<'info, System>,
}

impl<'info> ClosePosition<'info> {
        pub fn calculate_amount_to_transfer(&mut self) -> Result<i64> {
        let price_update = &mut self.price_update;
        let position = &mut self.position;

        // let maximum_age: u64 = 300;
        let feed_id: [u8; 32] = get_feed_id_from_hex(
            "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        )?;

        // let exit_price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;
        // NOTE: ONLY FOR LOCALNET TESTING DO NOY USE IN DEVNET
        let exit_price = price_update.get_price_unchecked(&feed_id)?;
        let exit_price = exit_price.price;

        let position_size = (position.amount as i64)
            .checked_mul(position.leverage as i64)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        let price_diff = if position.call == Call::LONG {
            exit_price.checked_sub(position.entry_price)
            .ok_or(ProgramError::ArithmeticOverflow)?
        } else {
            position.entry_price.checked_sub(exit_price)
            .ok_or(ProgramError::ArithmeticOverflow)?
        };

        let unrealized_pnl = position_size
            .checked_mul(price_diff)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .checked_div(position.entry_price)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        // TODO: Calculate and subtract funding fees

        let amount_to_transfer = (position.amount as i64)
            .checked_add(unrealized_pnl)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        Ok(amount_to_transfer.max(0))
    }

    pub fn transfer_to_trader(&mut self, protocol_vault_bump: u8) -> Result<()> {
        let amount_to_transfer: u64 = self.calculate_amount_to_transfer()? as u64;

        if amount_to_transfer > 0 {
            let signer_seeds: &[&[&[u8]]] = &[&[b"vault".as_ref(), &[protocol_vault_bump]]];

            let cpi_ctx = CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.protocol_vault.to_account_info(),
                    to: self.trader.to_account_info(),
                },
            )
            .with_signer(signer_seeds);

            transfer(cpi_ctx, amount_to_transfer)?;
        }

        Ok(())
    }
}
