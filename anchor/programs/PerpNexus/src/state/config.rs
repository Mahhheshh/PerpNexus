use anchor_lang::prelude::*;

#[account]
pub struct PerpNexusConfig {
    pub admin: Pubkey,    // 32
    pub cranker: Pubkey, // 32
    pub fees: u16,        // 2 if fees = 0.001 then here it will be 100_00;  5 decimals
    pub bump: u8,         // 1
}

impl Space for PerpNexusConfig {
    const INIT_SPACE: usize = 32 + 32 + 2 + 1;
}
