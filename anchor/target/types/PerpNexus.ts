/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/PerpNexus.json`.
 */
export type PerpNexus = {
  "address": "BKRPzmuiy84FuBdbbjAa1Nk8LJ2CKekVhJXi1NqTxCh9",
  "metadata": {
    "name": "perpNexus",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initPerpConfig",
      "discriminator": [
        243,
        145,
        211,
        0,
        200,
        68,
        99,
        85
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "protocolVault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "cranker",
          "type": "pubkey"
        },
        {
          "name": "fees",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "perpNexusConfig",
      "discriminator": [
        31,
        122,
        184,
        34,
        246,
        243,
        2,
        211
      ]
    }
  ],
  "types": [
    {
      "name": "perpNexusConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "cranker",
            "type": "pubkey"
          },
          {
            "name": "fees",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
