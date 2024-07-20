import React from 'react';

function Debts({ expandedFriends, transactions }) {
    const calculateDetailedDebts = (friendId) => {
        const debts = {};
        
        transactions.forEach(transaction => {
            const lenders = transaction.users.filter(user => Number(user.lent) > 0);
            const borrowers = transaction.users.filter(user => Number(user.borrow) > 0);
            const totalLent = lenders.reduce((sum, lender) => sum + Number(lender.lent), 0);
            const totalBorrowed = borrowers.reduce((sum, borrower) => sum + Number(borrower.borrow), 0);

            transaction.users.forEach(user => {
                if (user.id !== friendId) {
                    if (!debts[user.id]) {
                        debts[user.id] = { name: user.name, lent: 0, borrowed: 0 };
                    }
                    
                    if (Number(user.lent) > 0 && Number(user.id) !== friendId) {
                        const friendBorrower = borrowers.find(b => b.id === friendId);
                        if (friendBorrower) {
                            const shareRatio = Number(friendBorrower.borrow) / totalBorrowed;
                            debts[user.id].lent += Number(user.lent) * shareRatio;
                        }
                    }

                    if (Number(user.borrow) > 0 && lenders.some(l => l.id === friendId)) {
                        const friendLender = lenders.find(l => l.id === friendId);
                        if (friendLender) {
                            const shareRatio = Number(user.borrow) / totalBorrowed;
                            debts[user.id].borrowed += Number(friendLender.lent) * shareRatio;
                        }
                    }
                }
            });
        });
        
        return Object.values(debts);
    };

    const getSummary = (friendId, detailedDebts) => {
        const friendName = transactions.find(t => t.users.some(u => u.id === friendId))?.users.find(u => u.id === friendId)?.name || 'Friend';

        let summary = [];
        detailedDebts.forEach(debt => {
            const net = debt.lent - debt.borrowed;
            if (net > 0) {
                summary.push(`${debt.name} owed by ${friendName} ₹${net.toFixed(2)}`);
            } else if (net < 0) {
                summary.push(`${debt.name} owes ${friendName} ₹${Math.abs(net).toFixed(2)}`);
            }
        });
        
        return summary.length > 0 ? summary : [`${friendName} has no outstanding debts`];
    };

    return (
        <div >
            <h2 className='box' id='heading'>Debt Summaries</h2>
            {expandedFriends.map(friendId => {
                const detailedDebts = calculateDetailedDebts(friendId);
                const summary = getSummary(friendId, detailedDebts);
                return (
                    <div key={friendId} className='box'>
                        {summary.map((line, index) => (
                            <p key={index} className='item'>{line}</p>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default Debts;