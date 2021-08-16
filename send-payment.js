const DigitalBitsSdk = require("xdb-digitalbits-sdk");
const server = new DigitalBitsSdk.Server("https://frontier.testnet.digitalbits.io");
const sourceKeys = DigitalBitsSdk.Keypair.fromSecret(
  "SA7ZTL6URLWXQHQ44736MBLHFUWJ3337PHII7NBBZAB7N7ZR3ZXMKYAB"
);
const destinationId = "GCDIAIHBHTTSVSEXI6Z2JDRJ7E4JYL4JJBFVXQ2W23QBW362M6P4HIQ5";

// Transaction will hold a built transaction we can resubmit if the result is unknown.
let transaction;

// First, check to make sure that the destination account exists.
// You could skip this, but if the account does not exist, you will be charged
// the transaction fee when the transaction fails.
server
  .loadAccount(destinationId)
  // If the account is not found, surface a nicer error message for logging.
  .catch(function (error) {
    if (error instanceof DigitalBitsSdk.NotFoundError) {
      throw new Error("The destination account does not exist!");
    } else return error;
  })
  // If there was no error, load up-to-date information on your account.
  .then(function () {
    return server.loadAccount(sourceKeys.publicKey());
  })
  .then(function (sourceAccount) {
    // Start building the transaction.
    transaction = new DigitalBitsSdk.TransactionBuilder(sourceAccount, {
      fee: DigitalBitsSdk.BASE_FEE,
      networkPassphrase: DigitalBitsSdk.Networks.TESTNET
    })
      .addOperation(
        DigitalBitsSdk.Operation.payment({
          destination: destinationId,
          // Because DigitalBits allows transaction in many currencies, you must
          // specify the asset type. The special "native" asset represents digitalbits.
          asset: DigitalBitsSdk.Asset.native(),
          amount: "10"
        })
      )
      // A memo allows you to add your own metadata to a transaction. It's
      // optional and does not affect how DigitalBits treats the transaction.
      .addMemo(DigitalBitsSdk.Memo.text("Test Transaction"))
      // Wait a maximum of three minutes for the transaction
      .setTimeout(180)
      .build();
    // Sign the transaction to prove you are actually the person sending it.
    transaction.sign(sourceKeys);
    // And finally, send it off to DigitalBits!
    return server.submitTransaction(transaction);
  })
  .then(function (result) {
    console.log("Success! Results:", result);
  })
  .catch(function (error) {
    console.error("Something went wrong!", error);
    // If the result is unknown (no response body, timeout etc.) we simply resubmit
    // already built transaction:
    // server.submitTransaction(transaction);
  });
