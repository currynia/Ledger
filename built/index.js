"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const interface_1 = require("./db/interface");
async function main() {
    // await cleanUp()
    await (0, interface_1.createTables)();
    const app = (0, express_1.default)();
    const PORT = 1500;
    app.use(express_1.default.json());
    app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
    app.get("/", (req, res) => {
        res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
    });
    app.get("/accounts/:accId/transactions", async (req, res) => {
        const acc = req.params.accId;
        try {
            const result = await (0, interface_1.getAccountTransactions)(acc);
            res.status(200).send(result);
        }
        catch (error) {
        }
    });
    app.get("/accounts/:accId", async (req, res) => {
        const acc = req.params.accId;
        try {
            const result = await (0, interface_1.getAccountBalance)(acc);
            res.status(200).send(result);
        }
        catch (error) {
        }
    });
    app.post("/create", async (req, res) => {
        const accId = req.body.accId;
        try {
            const result = await (0, interface_1.createAccount)(accId);
            res.status(200).send(result);
        }
        catch (error) {
            const e = error;
            if (e.code = '23505') {
                res.status(400).send();
            }
            else {
                console.log(error);
                res.status(500).send();
            }
        }
    });
    app.get('/transactions/verify', async (req, res) => {
        (0, interface_1.verifyTransactions)();
        res.status(200).send();
    });
    app.post("/transactions/reverse", async (req, res) => {
        const { transactionId } = req.body;
        try {
            const result = await (0, interface_1.reverse)(transactionId);
            res.status(200).send(result);
        }
        catch (error) {
            const e = error;
            if (e.code == '23514') {
                res.status(400).send();
            }
            else if (e.code == 'ZZ000') {
                res.status(404).send();
            }
            else {
                console.log(error);
                res.status(500).send();
            }
        }
    });
    app.post("/transactions", async (req, res) => {
        const { srcAccId, destAccId, transferAmt } = req.body;
        try {
            const result = await (0, interface_1.transfer)(srcAccId, destAccId, transferAmt);
            res.status(200).send(result);
        }
        catch (error) {
            const e = error;
            if (e.code == '23514') {
                res.status(400).send();
            }
            else {
                console.log(error);
                res.status(500).send();
            }
        }
    });
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
main();
