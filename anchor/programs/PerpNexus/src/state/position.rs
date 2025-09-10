use anchor_lang::prelude::*;

#[repr(C)]
#[derive(AnchorDeserialize, AnchorSerialize, PartialEq, Eq, Clone, Copy, Debug)]
pub enum Call {
  SHORT,
  LONG
}

#[account]
pub struct Position {
  pub trader: Pubkey,           // 32
  pub amount: u64,              // 8
  pub entry_price: i64,         // 8
  pub position_index: u64,      // 8
  pub call: Call,               // 1
  pub leverage: u8,             // 1
  pub bump: u8,                 // 1
}

impl Space for Position {
  const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 1 + 1 + 1;

}