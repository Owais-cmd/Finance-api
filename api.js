import bodyParser from "body-parser";
import express from "express";
import pg from "pg";
import cors from "cors"
import env from "dotenv"
const app = express();
const port = 4000;

env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const { Client } = pg
app.use(cors())

const db=new Client({
    user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME, // Fixed here
  password: process.env.DATABASE_PWD,
  port: Number(process.env.DATABASE_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false,  // ✅ Required for cloud PostgreSQL (e.g., Render)
  },
  });
  
  
  db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL successfully"))
  .catch(err => console.error("❌ PostgreSQL connection error:", err));

  import ExcelJS from 'exceljs';

app.get('/export-excel', async (req, res) => {
    try {
        const {id,startDate,endDate}=req.query;
        const id1=parseInt(id);
        var query='SELECT id, category, amount, date FROM expenses WHERE 1=1';
        const params=[];
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Export');
        if(id1){
            query+=` AND user_id=$1`
            params.push(id1)
        }

        if(startDate && endDate){
            query+=` AND date>=$2 AND date<$3`;
            params.push(startDate)
            params.push(endDate)
        }        
        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
        ];

        // Fetch data from your database
        const result = await db.query(query,params);
        result.rows.forEach(row => {
            worksheet.addRow({
                id: row.id,
                category: row.category,
                amount: row.amount,
                date: row.date.toISOString().split('T')[0],
            });
        });

        // Set response headers for download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error exporting data:', err.message);
        res.status(500).send('Failed to export data');
    }
});

app.get('/export-excel-income', async (req, res) => {
    try {
        const {id,startDate,endDate}=req.query;
        const id1=parseInt(id);
        const params=[]
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Export');
        var query='SELECT id, category, amount, date FROM incomes WHERE 1=1'
        if(id1){
            query+=` AND user_id=$1`
            params.push(id1)
        }

        if(startDate && endDate){
            query+=` AND date>=$2 AND date<$3`;
            params.push(startDate)
            params.push(endDate)
        }
        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
        ];

        // Fetch data from your database
        const result = await db.query(query,params);
        result.rows.forEach(row => {
            worksheet.addRow({
                id: row.id,
                category: row.category,
                amount: row.amount,
                date: row.date.toISOString().split('T')[0],
            });
        });

        // Set response headers for download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=incomes.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error exporting data:', err.message);
        res.status(500).send('Failed to export data');
    }
});



app.delete("/delete/income/:id",async(req,res)=>{
    try{
    const id=parseInt(req.params.id);
    const result= await db.query("DELETE FROM incomes WHERE id=$1",[id])
    if (result.rowCount > 0) {
        res.status(200).json({ success: true, message: "Item deleted successfully!" });
    } else {
        res.status(404).json({ success: false, message: "Item not found!" });
    };
    }catch(err){
        console.error(err.message);
        res.status(500).json({ success: false, message: "Server error!" });
    }
})


app.delete("/delete/expense/:id",async(req,res)=>{
    try{
    const id=parseInt(req.params.id);
    const result= await db.query("DELETE FROM expenses WHERE id=$1",[id])
    if (result.rowCount > 0) {
        res.status(200).json({ success: true, message: "Item deleted successfully!" });
    } else {
        res.status(404).json({ success: false, message: "Item not found!" });
    };
    }catch(err){
        console.error(err.message);
        res.status(500).json({ success: false, message: "Server error!" });
    }
})

app.get("/stats1", async (req, res) => {
    try {
            const {id,startDate,endDate}=req.query;
            const id1=parseInt(id);
            var query1="SELECT SUM(amount) AS total_food FROM expenses WHERE category = 'Food'";
            var query2="SELECT SUM(amount) AS total_transport FROM expenses WHERE category = 'Transport'";
            var query3="SELECT SUM(amount) AS total_rent FROM expenses WHERE category = 'Rent'";
            var query4="SELECT SUM(amount) AS total_enter FROM expenses WHERE category = 'Entertainment'"
            var query5="SELECT SUM(amount) AS total_others FROM expenses WHERE category ='Others'";
            const params=[]
            if(id1){
                query1+=` AND user_id=$1`
                query2+=` AND user_id=$1`
                query3+=` AND user_id=$1`
                query4+=` AND user_id=$1`
                query5+=` AND user_id=$1`
                params.push(id1)
            }

            if(startDate && endDate){
                query1+=` AND date>=$2 AND date<$3`;
                query2+=` AND date>=$2 AND date<$3`;
                query3+=` AND date>=$2 AND date<$3`;
                query4+=` AND date>=$2 AND date<$3`;
                query5+=` AND date>=$2 AND date<$3`;
                params.push(startDate)
                params.push(endDate)
            }


            const food = await db.query(
            query1,params
        );

        const transport = await db.query(
            query2,params
        );;

        const rent = await db.query(
            query3,params
        );

        const entertainment = await db.query(
            query4,params
        );

        const other = await db.query(
            query5,params
        );
        

        res.json({
            Entertain: entertainment.rows[0]?.total_enter || 0,
            Rents: rent.rows[0]?.total_rent || 0,
            Transports: transport.rows[0]?.total_transport || 0,
            Foods: food.rows[0]?.total_food || 0,
            Others: other.rows[0]?.total_others || 0,
        });

    } catch (err) {
        console.error("Error in /stats1 route:", err.message);
        res.status(500).send("Error fetching chart data");
    }
});


app.get("/stats2", async (req, res) => {
    try {
        const {id,startDate,endDate}=req.query;
        const id1=parseInt(id);
        const params=[]
        var query1='SELECT SUM(amount) AS total_expense FROM expenses WHERE 1=1 '
        var query2='SELECT SUM(amount) AS total_income FROM incomes WHERE 1=1'
        
        if(id1){
            query1+=` AND user_id=$1`
            query2+=` AND user_id=$1`
            params.push(id1)
        }

        if(startDate && endDate){
            query1+=` AND date>=$2 AND date<$3`;
            query2+=` AND date>=$2 AND date<$3`;
            params.push(startDate)
            params.push(endDate)
        }


        const expense = await db.query(
            query1,params
        );
        const income = await db.query(
            query2,params
        );
        res.json({
            Expense: expense.rows[0]?.total_expense || 0,
            Income: income.rows[0]?.total_income || 0,
        });

    } catch (err) {
        console.error("Error in /stats1 route:", err.message);
        res.status(500).send("Error fetching chart data");
    }
});



app.get('/filter', async (req, res) => {
    try {
        
        const { id,option,startDate, endDate, category, minAmount, maxAmount } = req.query;
        const id1=parseInt(id);
            var table;
        if(option=="expense"){
            table="expenses";
        }else{
            table="incomes"
        }

        let query = 'SELECT * FROM '+table +' WHERE 1=1';
        const params = [];
        let paramCount = 0;
        

        if (id1) {
            paramCount++;
            query += ` AND user_id = $${paramCount}`;
            params.push(id1);
        }

        if (startDate) {
            paramCount++;
            query += ` AND date >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND date <= $${paramCount}`;
            params.push(endDate);
        }

        if (category && category!="All") {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        if (minAmount) {
            paramCount++;
            query += ` AND amount >= $${paramCount}`;
            params.push(minAmount);
        }

        if (maxAmount) {
            paramCount++;
            query += ` AND amount <= $${paramCount}`;
            params.push(maxAmount);
        }

        const result = await db.query(query, params);
        console.log(result.rows)
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Error filtering data' });
    }
});



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  })