import postgres from "postgres";

const sql = postgres({
    database:'ledger',
    username:process.env.DB_USERNAME,
    password:process.env.DB_PASSWORD
})

export default sql