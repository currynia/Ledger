"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = createAccount;
exports.transfer = transfer;
exports.getAccountBalance = getAccountBalance;
exports.getAccountTransactions = getAccountTransactions;
exports.reverse = reverse;
exports.createTables = createTables;
exports.verifyTransactions = verifyTransactions;
exports.cleanUp = cleanUp;
const connection_1 = __importDefault(require("./connection"));
class CustomError extends Error {
    code;
}
async function createAccount(accId) {
    const user = await (0, connection_1.default) `
    insert into Accounts
      (id, balance)
    values
      (${accId}, 1000)
    returning id, balance
  `;
    return user[0];
}
async function transfer(srcAcc, dstAcc, amount) {
    const result = await connection_1.default.begin(async (sql) => {
        await sql `
  UPDATE Accounts SET balance = balance - ${amount} 
  WHERE id = ${srcAcc}
  `;
        await sql `
  UPDATE Accounts SET balance = balance + ${amount} 
  WHERE id = ${dstAcc}`;
        const [result] = await sql `
  INSERT INTO Transactions (SrcAcc, DstAcc, Amount, Reversed, TransactionTime)
  VALUES (${srcAcc}, ${dstAcc}, ${amount}, ${false}, ${Date.now()})
  returning *
  `;
        return [result];
    });
    return result[0];
}
async function getAccountBalance(accId) {
    const acc = await (0, connection_1.default) `SELECT * FROM Accounts WHERE id = ${accId}`;
    return acc[0];
}
async function getAccountTransactions(accId) {
    const transactions = await (0, connection_1.default) `SELECT * FROM Transactions 
  WHERE SrcAcc = ${accId} or DstAcc = ${accId} 
  ORDER BY TransactionTime  `;
    return transactions;
}
async function reverse(transactionId) {
    const transaction = await (0, connection_1.default) `SELECT * FROM transactions t WHERE t.id = ${transactionId}`;
    if (transaction.length == 0) {
        const err = new CustomError();
        err.code = "ZZ000";
        throw err;
    }
    if (!transaction[0].reversed) {
        const srcAcc = transaction[0].srcacc;
        const dstAcc = transaction[0].dstacc;
        const amount = transaction[0].amount;
        const result = await connection_1.default.begin(async (sql) => {
            await sql `
  UPDATE Accounts SET balance = balance + ${amount} 
  WHERE id = ${srcAcc}
  `;
            await sql `
  UPDATE Accounts SET balance = balance - ${amount} 
  WHERE id = ${dstAcc}`;
            await sql `UPDATE Transactions t SET reversed = ${true} 
      WHERE t.id=${transactionId}`;
            const [result] = await sql `
  INSERT INTO Transactions (SrcAcc, DstAcc, Amount, Reversed, TransactionTime)
  VALUES (${dstAcc}, ${srcAcc}, ${amount}, ${false}, ${Date.now()})
  returning *
  `;
            return [result];
        });
        return result[0];
    }
    else {
        throw Error();
    }
}
async function createTables() {
    await connection_1.default.begin(async (sql) => {
        await sql `
      CREATE TABLE IF NOT EXISTS Accounts(
      id TEXT PRIMARY KEY,
      balance FLOAT NOT NULL CHECK (balance >= 0)
      )
      `;
        await sql `
    CREATE TABLE IF NOT EXISTS Transactions(
    id SERIAL PRIMARY KEY,
    SrcAcc TEXT NOT NULL REFERENCES Accounts(id),
    DstAcc TEXT NOT NULL REFERENCES Accounts(id),
    Reversed BOOLEAN NOT NULL,
    Amount FLOAT,
    TransactionTime TIMESTAMP
    )
    `;
    });
}
async function verifyTransactions() {
    const rows = await (0, connection_1.default) `
  SELECT * FROM 
  (SELECT SrcAcc, SUM(amount) as "summedAmtSrc" FROM Transactions GROUP BY SrcAcc ORDER BY SrcAcc) t1 
  FULL OUTER JOIN
  (SELECT DstAcc, SUM(amount) as "summedAmtDst" FROM Transactions GROUP BY DstAcc ORDER BY DstAcc) t2
  ON t1.SrcAcc = t2.DstAcc
  INNER JOIN Accounts a
  ON a.id = SrcAcc OR a.id = DstAcc

`;
    try {
        for (const row of rows) {
            const { summedAmtDst, summedAmtSrc, balance } = row;
            const startingAmt = 1000;
            if (startingAmt + summedAmtDst - summedAmtSrc != balance) {
                throw new Error("Mismatch detected");
            }
        }
    }
    catch (error) {
        console.log(error);
    }
}
async function cleanUp() {
    await (0, connection_1.default) `DROP TABLE IF EXISTS Accounts CASCADE`;
    await (0, connection_1.default) `DROP TABLE IF EXISTS Transactions`;
}
