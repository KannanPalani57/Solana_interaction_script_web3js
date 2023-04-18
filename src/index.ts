import * as Web3 from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function initializeKeyPair(connection: Web3.Connection) : Promise<Web3.Keypair> {
    if(!process.env.PRIVATE_KEY){
        console.log("Generating KeyPair")

        const signer = Web3.Keypair.generate();

        fs.writeFileSync(".env", `PRIVATE_KEY=[${signer.secretKey.toString()}]`)
   }

    const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[];

    const secretKey= Uint8Array.from(secret);

    const keyPairFromSecret = Web3.Keypair.fromSecretKey(secretKey);
    
   await airdropSolIfNeeded(keyPairFromSecret, connection);

    return keyPairFromSecret; 
}


async function airdropSolIfNeeded(
    signer: Web3.Keypair,
    connection: Web3.Connection
 ){
    const balance  = await connection.getBalance(signer.publicKey);

    console.log("Current balance is ", balance / Web3.LAMPORTS_PER_SOL, "SOL")
    
    if(balance / Web3.LAMPORTS_PER_SOL < 1 ){
        const airDropSignature  =  await connection.requestAirdrop(
            signer.publicKey, 
            Web3.LAMPORTS_PER_SOL
        )

        const latestBlockhash = await connection.getLatestBlockhash()

        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight, 
            signature: airDropSignature,
        })

        const newBalance = await connection.getBalance(signer.publicKey);

        console.log("New Balance is ", newBalance/ Web3.LAMPORTS_PER_SOL  , "SOL");


    }
 }

async function test() {
    const generateKeyPair = Web3.Keypair.generate();


    console.log("keyPair", generateKeyPair)
}

async function main() {
    const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'));
    const signer = await initializeKeyPair(connection);

    console.log("Public Key", signer.publicKey.toBase58())
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
