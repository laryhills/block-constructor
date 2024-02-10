const fs = require("fs");

const BLOCK_WEIGHT = 4000000; // 4MB

type Transaction = {
  txid: string;
  fee: number;
  weight: number;
  parent_txids: string[] | [];
};

type MinerBlockSum = {
  blockTxns: string[];
  blockTotalFees: number;
};

// this function creates a array of objects of txns
function processCSVToTxns(fileContent: string): Transaction[] {
  return fileContent
    .trim()
    .split("\n")
    .map((line) => line.split(","))
    .map(([txid, fee, weight, parent_txids]) => ({
      txid,
      fee: Number(fee),
      weight: Number(weight),
      parent_txids: parent_txids.replace("\r", "")
        ? parent_txids.split(";")
        : [],
    }));
}

// miner selection procress
// sort txns
// check for parent
// check block weight limit
// add txn to block
function minerSelectionProcess(txns: Transaction[]): MinerBlockSum {
  const minerBlock: Set<string> = new Set(); // unique values
  let selectedFee = 0;
  let selectedWeight = 0;

  // sort txns in reducing order according to fee
  txns.sort((a, b) => b.fee - a.fee);

  for (const txn of txns) {
    // check if parent txns already selected
    // if any are not, skip
    if (txn.parent_txids.every((parent) => minerBlock.has(parent))) {
      // check if adding txn will exceed block max weight
      if (selectedWeight + txn.weight <= BLOCK_WEIGHT) {
        // add txn to block
        minerBlock.add(txn.txid);
        selectedFee += txn.fee;
        selectedWeight += txn.weight;
      }
    }
  }

  return { blockTxns: Array.from(minerBlock), blockTotalFees: selectedFee };
}

// read csv and process
fs.readFile("mempool.csv", "utf8", (err: any, data: string) => {
  if (err) {
    console.error("❌ Reading CSV Error:", err);
    return;
  }

  const transactions = processCSVToTxns(data);
  const { blockTxns, blockTotalFees } = minerSelectionProcess(transactions);

  console.log("Block Transactions\n", blockTxns.join("\n"));
});
