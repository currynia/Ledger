Requirements: node, Postgres17

Assumptions: Each account starts with a balance of 1000 upon creation.

### Installing dependencies
`npm install`

### Create Postgres Database
Open `psql`

`sudo -u postgres psql`

Create database

`create DATABASE ledger;`

### Configure Environment Variables
Modify .env file. 

### Build and Run
```
npm run build
npm run start
```
