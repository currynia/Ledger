import express, { Request, Response } from "express";
import path from "path"
import 'dotenv/config'
import { verifyTransactions, reverse, getAccountTransactions, createAccount, createTables, getAccountBalance, transfer, cleanUp } from "./db/interface";




async function main() {
  // await cleanUp()
  await createTables()

  const app = express();
  const PORT = 1500;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../public")));

  interface customError { code?: string }

  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  app.get("/accounts/:accId/transactions", async (req: Request, res: Response) => {
    const acc = req.params.accId as string
    try {
      const result = await getAccountTransactions(acc)
      res.status(200).send(result)
    }
    catch (error) {

    }
  });

  app.get("/accounts/:accId", async (req: Request, res: Response) => {
    const acc = req.params.accId as string
    try {
      const result = await getAccountBalance(acc)
      res.status(200).send(result)
    }
    catch (error) {

    }
  });

  app.post("/create", async (req: Request, res: Response) => {

    const accId = req.body.accId;
    try {
      const result = await createAccount(accId)

      res.status(200).send(result)
    }
    catch (error) {
      const e = error as customError
      if (e.code = '23505') {
        res.status(400).send()
      }
      else {
        console.log(error)
        res.status(500).send()
      }

    }
  })

  app.get('/transactions/verify', async (req: Request, res: Response) => {
    verifyTransactions()
    res.status(200).send()
  })


  app.post("/transactions/reverse", async (req: Request, res: Response) => {
    const { transactionId } = req.body
    try {
      const result = await reverse(transactionId)
      res.status(200).send(result)
    }
    catch (error) {
      const e = error as customError
      if (e.code == '23514') {
        res.status(400).send()
      } else if (e.code == 'ZZ000') {
        res.status(404).send()
      }
      else {
        console.log(error)
        res.status(500).send()
      }

    }
  });

  app.post("/transactions", async (req: Request, res: Response) => {
    const { srcAccId, destAccId, transferAmt } = req.body
    try {
      const result = await transfer(srcAccId, destAccId, transferAmt)
      res.status(200).send(result)
    }
    catch (error) {
      const e = error as customError
      if (e.code == '23514') {
        res.status(400).send()
      }
      else {
        console.log(error)
        res.status(500).send()
      }

    }
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}


main()


