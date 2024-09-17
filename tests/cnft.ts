import * as anchor from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import { Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import type { NftMinter } from '../target/types/nft_minter';

describe('NFT Minter', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.NftMinter as anchor.Program<NftMinter>;
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  // The metadata for our NFT
  const metadata = {
    name: 'Homer NFT',
    symbol: 'HOMR',
    uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/nft.json',
  };

  it('Create an NFT!', async () => {
    // Generate a keypair to use as the address of our mint account
    const mintKeypair = new Keypair();
  
    // Derive the associated token address account for the mint and payer.
    const associatedTokenAccountAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, payer.publicKey);
    const [metadataPDA, metadataBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [editionPDA, editionBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const transactionSignature = await program.methods
      .mintNft(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
        associatedTokenAccount: associatedTokenAccountAddress,
        metadataAccount:metadataPDA,
        editionAccount: editionPDA,
        rent:anchor.web3.SYSVAR_RENT_PUBKEY,
        associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram:SystemProgram.programId,
        tokenProgram:TOKEN_PROGRAM_ID,
        tokenMetadataProgram:TOKEN_METADATA_PROGRAM_ID
      })
      .signers([mintKeypair])
      .rpc({ skipPreflight: true });

    console.log('Success!');
    console.log(`   Mint Address: ${mintKeypair.publicKey}`);
    console.log(`   Transaction Signature: ${transactionSignature}`);
  });
});