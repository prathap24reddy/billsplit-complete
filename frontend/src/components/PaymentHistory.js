import React, { useState } from 'react';
import axios from 'axios';

function PaymentHistory({ transactions, onEditTransaction, onDeleteTransaction, baseAPI }) {
    const [error, setError] = useState(null);

    const handleDelete = async (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            try {
                await axios.delete(`${baseAPI}/transaction/${transactionId}`);
                onDeleteTransaction(transactionId);
            } catch (error) {
                console.error('Error deleting transaction:', error);
                setError('Failed to delete transaction. Please try again.');
            }
        }
    };

    if (!transactions.length) return <div>No transactions found for this trip.</div>;

    return (
        <div>
            <h2 className='box' id='heading'>Payment History</h2>
            {error && <div className="error">{error}</div>}
            <table className='box table'>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th>Details</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td>{new Date(transaction.date).toLocaleString()}</td>
                            <td>₹{Number(transaction.amount).toFixed(2)}</td>
                            <td>{transaction.note}</td>
                            <td>
                                <ul>
                                    {transaction.users.map(user => (
                                        <li key={user.id}>
                                            {user.name}: 
                                            {user.lent > 0 ? ` Lent ₹${user.lent.toFixed(2)}` : ''}
                                            {user.borrow > 0 ? ` Borrowed ₹${user.borrow.toFixed(2)}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td>
                                <button onClick={() => handleDelete(transaction.id)} className='button' style={{width:'100%'}}><p>Delete</p></button>
                                <button onClick={() => onEditTransaction(transaction)} className='button' style={{width:'100%'}}><p>Edit</p></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PaymentHistory;