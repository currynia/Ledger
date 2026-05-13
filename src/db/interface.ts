import { sign } from "crypto";
import sql from "./connection";

class CustomError extends Error {
  code?: string
}


export async function createAccount(accId: string) {
  const user = await sql`
    insert into Accounts
      (id, balance)
    values
      (${accId}, 1000)
    returning id, balance
  `
  return user[0]
}
export async function transfer(srcAcc: string, dstAcc: string, amount: number) {

  const result = await sql.begin(async sql => {
    await sql`
  UPDATE Accounts SET balance = balance - ${amount} 
  WHERE id = ${srcAcc}
  `
    await sql`
  UPDATE Accounts SET balance = balance + ${amount} 
  WHERE id = ${dstAcc}`

    const [result] = await sql`
  INSERT INTO Transactions (SrcAcc, DstAcc, Amount, Reversed, TransactionTime)
  VALUES (${srcAcc}, ${dstAcc}, ${amount}, ${false}, ${Date.now()})
  returning *
  `
    return [result]
  })
  return result[0]
}

export async function getAccountBalance(accId: string) {
  const acc = await sql`SELECT * FROM Accounts WHERE id = ${accId}`
  return acc[0]
}
export async function getAccountTransactions(accId: string) {
  const transactions = await sql`SELECT * FROM Transactions 
  WHERE SrcAcc = ${accId} or DstAcc = ${accId} 
  ORDER BY TransactionTime  `
  return transactions
}

export async function reverse(transactionId: number) {
  const transaction = await sql`SELECT * FROM transactions t WHERE t.id = ${transactionId}`
  if (transaction.length == 0) {
    const err = new CustomError()
    err.code = "ZZ000"
    throw err
  }
  if (!transaction[0].reversed) {
    const srcAcc = transaction[0].srcacc
    const dstAcc = transaction[0].dstacc
    const amount = transaction[0].amount

    const result = await sql.begin(async sql => {
      await sql`
  UPDATE Accounts SET balance = balance + ${amount} 
  WHERE id = ${srcAcc}
  `
      await sql`
  UPDATE Accounts SET balance = balance - ${amount} 
  WHERE id = ${dstAcc}`

      await sql`UPDATE Transactions t SET reversed = ${true} 
      WHERE t.id=${transactionId}`

      const [result] = await sql`
  INSERT INTO Transactions (SrcAcc, DstAcc, Amount, Reversed, TransactionTime)
  VALUES (${dstAcc}, ${srcAcc}, ${amount}, ${false}, ${Date.now()})
  returning *
  `
      return [result]
    })
    return result[0]
  } else {
    throw Error()
  }
}
export async function createTables() {
  await sql.begin(async sql => {
    await sql`
      CREATE TABLE IF NOT EXISTS Accounts(
      id TEXT PRIMARY KEY,
      balance FLOAT NOT NULL CHECK (balance >= 0)
      )
      `

    await sql`
    CREATE TABLE IF NOT EXISTS Transactions(
    id SERIAL PRIMARY KEY,
    SrcAcc TEXT NOT NULL REFERENCES Accounts(id),
    DstAcc TEXT NOT NULL REFERENCES Accounts(id),
    Reversed BOOLEAN NOT NULL,
    Amount FLOAT,
    TransactionTime TIMESTAMP
    )
    `
  }
  )
}


export async function verifyTransactions() {
  const rows = await sql`
  SELECT * FROM 
  (SELECT SrcAcc, SUM(amount) as "summedAmtSrc" FROM Transactions GROUP BY SrcAcc ORDER BY SrcAcc) t1 
  FULL OUTER JOIN
  (SELECT DstAcc, SUM(amount) as "summedAmtDst" FROM Transactions GROUP BY DstAcc ORDER BY DstAcc) t2
  ON t1.SrcAcc = t2.DstAcc
  INNER JOIN Accounts a
  ON a.id = SrcAcc OR a.id = DstAcc

`
try {

  for (const row of rows) {
    const {summedAmtDst, summedAmtSrc, balance} = row
    const startingAmt = 1000
    if (startingAmt + summedAmtDst - summedAmtSrc != balance) {
      throw new Error("Mismatch detected")
    }
  }
}
  catch (error){
    console.log(error)
  }


}

export async function cleanUp() {
  await sql`DROP TABLE IF EXISTS Accounts CASCADE`
  await sql`DROP TABLE IF EXISTS Transactions`
}


