import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import env from 'dotenv';

const app = express();
env.config();
const port = process.env.PORT||4000;


const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
db.connect();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const salt = await bcryptjs.genSalt(10); // Generate salt
        const hashedPassword = await bcryptjs.hash(password, salt); // Hash password
        await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Account created successfully. Please sign in.' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ error: 'An error occurred while signing up', details: error.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcryptjs.compare(password, user.password)) { // Changed to bcryptjs.compare
                const token = jwt.sign(
                    { 
                        userId: user.id,
                        email: user.email,
                        name: user.name
                    }, 
                    'your_jwt_secret',
                    { expiresIn: '1h' }
                );
                res.json({ token });
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(400).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred while logging in' });
    }
});
  

// Get trips for a specific user
app.get('/user-trips/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(`
            SELECT DISTINCT t.* 
            FROM trips t
            JOIN trip_users tu ON t.id = tu.trip_id
            WHERE tu.user_id = $1
            ORDER BY t.start_date DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching user trips:', error);
        res.status(500).json({ error: 'An error occurred while fetching user trips' });
    }
});

// Add a new trip
app.post('/trips', async (req, res) => {
    const { name, userId } = req.body;
    try {
        await db.query('BEGIN');
        
        const tripResult = await db.query(
            'INSERT INTO trips (name, start_date) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
            [name]
        );
        
        await db.query(
            'INSERT INTO trip_users (trip_id, user_id) VALUES ($1, $2)',
            [tripResult.rows[0].id, userId]
        );

        await db.query('COMMIT');
        
        res.status(201).json(tripResult.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error adding trip:', error);
        res.status(500).json({ error: 'An error occurred while adding the trip' });
    }
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'An error occurred while fetching users' });
    }
});

// Add a user to a trip
app.post('/trip_users', async (req, res) => {
    const { trip_id, user_id } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO trip_users (trip_id, user_id) VALUES ($1, $2) RETURNING *',
            [trip_id, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding user to trip:', error);
        res.status(500).json({ error: 'An error occurred while adding the user to the trip' });
    }
});


// Get users for a specific trip
app.get('/trip_users/:tripId', async (req, res) => {
    const { tripId } = req.params;
    try {
        const result = await db.query(
            'SELECT users.id, users.name FROM users JOIN trip_users ON users.id = trip_users.user_id WHERE trip_users.trip_id = $1',
            [tripId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trip users:', error);
        res.status(500).json({ error: 'An error occurred while fetching trip users' });
    }
});

//Create a transaction
app.post('/transaction', async (req, res) => {
    const { trip_id, amount, note } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO transactions (trip_id, amount, note) VALUES ($1, $2, $3) RETURNING id',
            [trip_id, amount, note]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'An error occurred while creating the transaction' });
    }
});

app.post('/transaction_users', async (req, res) => {
    const { transaction_id, user_id, borrow, lent } = req.body;
    try {
        await db.query(
            'INSERT INTO transaction_users (transaction_id, user_id, borrow, lent) VALUES ($1, $2, $3, $4)',
            [transaction_id, user_id, borrow, lent]
        );
        res.status(201).json({ message: 'Transaction user entry created successfully' });
    } catch (error) {
        console.error('Error creating transaction user entry:', error);
        res.status(500).json({ error: 'An error occurred while creating the transaction user entry' });
    }
});

//get transaction details
app.get('/transaction/:tripId', async (req, res) => {
    const { tripId } = req.params;
    console.log(req.params);
    try {
        const result = await db.query(`
            SELECT 
                t.id, 
                t.amount, 
                t.note, 
                t.date,
                json_agg(json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'lent', tu.lent,
                    'borrow', tu.borrow
                )) as users
            FROM transactions t
            JOIN transaction_users tu ON t.id = tu.transaction_id
            JOIN users u ON tu.user_id = u.id
            WHERE t.trip_id = $1
            GROUP BY t.id
            ORDER BY t.date DESC
        `, [tripId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'An error occurred while fetching transactions' });
    }
});

// Delete a transaction and related data
app.delete('/transaction/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    try {
        await db.query('BEGIN');
        
        // Delete related transaction_users entries
        await db.query('DELETE FROM transaction_users WHERE transaction_id = $1', [transactionId]);
        
        // Delete the transaction
        const result = await db.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [transactionId]);
        
        await db.query('COMMIT');

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.json({ message: 'Transaction and related data deleted successfully' });
        }
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'An error occurred while deleting the transaction' });
    }
});

// Update a transaction
app.put('/transaction/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const { trip_id, amount, note } = req.body;
    try {
        const result = await db.query(
            'UPDATE transactions SET trip_id = $1, amount = $2, note = $3 WHERE id = $4 RETURNING *',
            [trip_id, amount, note, transactionId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'An error occurred while updating the transaction' });
    }
});

// Delete all transaction_users for a transaction
app.delete('/transaction_users/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    try {
        await db.query('DELETE FROM transaction_users WHERE transaction_id = $1', [transactionId]);
        res.json({ message: 'Transaction users deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction users:', error);
        res.status(500).json({ error: 'An error occurred while deleting transaction users' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});