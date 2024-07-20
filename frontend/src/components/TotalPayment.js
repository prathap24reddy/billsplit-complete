import React, { useState, useEffect } from 'react';
import Debts from './Debts';

function TotalPayment({ transactions }) {
    const [totalPayments, setTotalPayments] = useState([]);
    const [expandedFriend, setExpandedFriend] = useState(null);

    const calculateTotalPayments = (transactions) => {
        const totals = {};
        transactions.forEach(transaction => {
            transaction.users.forEach(user => {
                if (!totals[user.id]) {
                    totals[user.id] = { id: user.id, name: user.name, lent: 0, borrowed: 0 };
                }
                totals[user.id].lent += Number(user.lent);
                totals[user.id].borrowed += Number(user.borrow);
            });
        });
        setTotalPayments(Object.values(totals));
    };

    useEffect(() => {
        calculateTotalPayments(transactions);
    }, [transactions]);

    const handleExpand = (friendId) => {
        setExpandedFriend(prevExpandedFriend => 
            prevExpandedFriend === friendId ? null : friendId
        );
    };

    return (
        <div>
            <h2 className='box' id="heading" style={{marginTop:'100px'}}>Total Payments</h2>
            <table className='box table'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Lent</th>
                        <th>Borrowed</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {totalPayments.map((payment) => {
                        const total = payment.lent - payment.borrowed;
                        let totalText;
                        if (total > 0) {
                            totalText = `Owed ₹${total.toFixed(2)}`;
                        } else if (total < 0) {
                            totalText = `Owe ₹${Math.abs(total).toFixed(2)}`;
                        } else {
                            totalText = 'Settled';
                        }
                        return (
                            <React.Fragment key={payment.id}>
                                <tr>
                                    <td>{payment.name}</td>
                                    <td>{payment.lent.toFixed(2)}</td>
                                    <td>₹{payment.borrowed.toFixed(2)}</td>
                                    <td>{totalText}</td>
                                    <td>
                                        <button style={{width:'auto'}} onClick={() => handleExpand(payment.id)}>
                                            {expandedFriend === payment.id ? 'Collapse' : 'Expand'}
                                        </button>
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            {expandedFriend && (
                <Debts 
                    expandedFriends={[expandedFriend]} 
                    transactions={transactions} 
                />
            )}
        </div>
    );
}

export default TotalPayment;