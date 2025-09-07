use anchor_lang::prelude::*;

use crate::state::PerpNexusConfig;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        space = 8 + PerpNexusConfig::INIT_SPACE,
        bump
    )]
    pub config: Account<'info, PerpNexusConfig>,

    #[account(
        seeds = [b"vault"],
        bump
    )]
    pub protocol_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitConfig<'info> {
    pub fn init_config(
        &mut self,
        cranker: Pubkey,
        fees: u16,
        bumps: &InitConfigBumps,
    ) -> Result<()> {
        let _ = self.config.set_inner(PerpNexusConfig {
            admin: self.admin.key(),
            cranker,
            fees,
            bump: bumps.config,
        });

        Ok(())
    }
}
