import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DataEntryTable({ tripId, refreshData, onTransactionSubmitted, editingTransaction, baseAPI }) {
    const [data, setData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [totalLent, setTotalLent] = useState(0);
    const [splitEqually, setSplitEqually] = useState(false);
    const [note, setNote] = useState('');
    const [involvedUsers, setInvolvedUsers] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${baseAPI}/trip_users/${tripId}`);
            setData(response.data);
            // console.log((data.length)/100);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tripId, refreshData]);

    useEffect(() => {
        setTableData(data.map(item => ({ ...item, newLent: '', newBorrow: '' })));
        setInvolvedUsers({});
    }, [data]);

    useEffect(() => {
        if (editingTransaction) {
            setIsEditing(true);
            setEditingTransactionId(editingTransaction.id);
            setTotalLent(editingTransaction.amount);
            setNote(editingTransaction.note);

            const involved = {};
            const updatedTableData = data.map(item => {
                const transactionUser = editingTransaction.users.find(u => u.id === item.id);
                if (transactionUser) {
                    involved[item.id] = true;
                    return {
                        ...item,
                        newLent: transactionUser.lent.toString(),
                        newBorrow: transactionUser.borrow.toString()
                    };
                }
                return { ...item, newLent: '', newBorrow: '' };
            });

            setTableData(updatedTableData);
            setInvolvedUsers(involved);
        } else {
            clearFormData();
        }
    }, [editingTransaction, data]);

    useEffect(() => {
        if (splitEqually) {
            const involvedCount = tableData.length;
            const perPersonAmount = involvedCount > 0 ? totalLent / involvedCount : 0;
            const updatedTableData = tableData.map(item => ({
                ...item,
                newBorrow: perPersonAmount.toFixed(2),
                // Keep the existing newLent value
                newLent: item.newLent || ''
            }));
            setTableData(updatedTableData);
            setInvolvedUsers(Object.fromEntries(tableData.map(item => [item.id, true])));
        }
    }, [totalLent, splitEqually]);

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const updatedData = [...tableData];
        updatedData[index][name] = value;
    
        if (name === 'newLent' || !splitEqually) {
            setTableData(updatedData);
    
            const userId = updatedData[index].id;
            if (value && (name === 'newLent' || name === 'newBorrow')) {
                setInvolvedUsers(prev => ({ ...prev, [userId]: true }));
            } else if (!updatedData[index].newLent && !updatedData[index].newBorrow) {
                setInvolvedUsers(prev => {
                    const newInvolved = { ...prev };
                    delete newInvolved[userId];
                    return newInvolved;
                });
            }
    
            if (name === 'newLent') {
                const newTotal = updatedData.reduce((sum, item) => sum + (Number(item.newLent) || 0), 0);
                setTotalLent(newTotal);
    
                if (splitEqually) {
                    // Recalculate newBorrow for all users
                    const involvedCount = updatedData.length;
                    const perPersonAmount = involvedCount > 0 ? newTotal / involvedCount : 0;
                    updatedData.forEach(item => {
                        item.newBorrow = perPersonAmount.toFixed(2);
                    });
                    setTableData(updatedData);
                }
            }
        }
    };

    const handleTotalLentChange = (event) => {
        const value = Number(event.target.value);
        setTotalLent(value);
    };

    const handleNoteChange = (event) => {
        setNote(event.target.value);
    };

    const toggleSplitEqually = () => {
        setSplitEqually(!splitEqually);
        if (!splitEqually) {
            const involvedCount = tableData.length;
            const perPersonAmount = involvedCount > 0 ? totalLent / involvedCount : 0;
            const updatedTableData = tableData.map(item => ({
                ...item,
                newBorrow: perPersonAmount.toFixed(2),
                // Keep the existing newLent value
                newLent: item.newLent || ''
            }));
            setTableData(updatedTableData);
            setInvolvedUsers(Object.fromEntries(tableData.map(item => [item.id, true])));
        } else {
            // Reset only the newBorrow when unchecking split equally
            setTableData(tableData.map(item => ({ ...item, newBorrow: '' })));
            setInvolvedUsers({});
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();

        const involvedData = tableData.filter(item => involvedUsers[item.id]);
        const totalBorrow = involvedData.reduce((sum, item) => sum + (Number(item.newBorrow) || 0), 0);
            // console.log(totalLent);
            // console.log(totalBorrow);

        if (Math.abs(totalLent - totalBorrow) > (data.length)/100) {
            // console.log(totalLent);
            // console.log(totalBorrow);
            // console.log((data.length)/100);
            alert('Total lent must equal total borrowed');
            return;
        }

        if (involvedData.length === 0) {
            alert('At least one user must be involved in the transaction');
            return;
        }

        try {
            let transactionId;
            if (isEditing) {
                await axios.put(`${baseAPI}/transaction/${editingTransactionId}`, {
                    trip_id: tripId,
                    amount: totalLent,
                    note: note
                });
                transactionId = editingTransactionId;
            } else {
                const transactionResponse = await axios.post(`${baseAPI}/transaction`, {
                    trip_id: tripId,
                    amount: totalLent,
                    note: note
                });
                transactionId = transactionResponse.data.id;
            }

            if (isEditing) {
                await axios.delete(`${baseAPI}/transaction_users/${editingTransactionId}`);
            }

            const transactionUsersPromises = involvedData.map(item =>
                axios.post(`${baseAPI}/transaction_users`, {
                    transaction_id: transactionId,
                    user_id: item.id,
                    borrow: Number(item.newBorrow) || 0,
                    lent: Number(item.newLent) || 0
                })
            );

            await Promise.all(transactionUsersPromises);

            clearFormData();
            onTransactionSubmitted();

            alert(isEditing ? 'Transaction updated successfully!' : 'Transaction submitted successfully!');
        } catch (error) {
            console.error('Error submitting transaction:', error);
            alert('Error submitting transaction. Please check the console for more details.');
        }
    };

    const clearFormData = () => {
        setTotalLent(0);
        setNote('');
        setSplitEqually(false);
        setTableData(data.map(item => ({ ...item, newLent: '', newBorrow: '' })));
        setInvolvedUsers({});
        setIsEditing(false);
        setEditingTransactionId(null);
    };

    const cancelEdit = () => {
        clearFormData();
        onTransactionSubmitted();
    };

    return (
        <>
        <form onSubmit={handleSubmit} >
        <h3 style={{paddingTop:'25px', textAlign:'left'}}>Enter a transaction details below:</h3>
            <div>
                
                <label>
                    <input
                        type="text"
                        value={note}
                        onChange={handleNoteChange}
                        placeholder="Add a note for this transaction"
                    />
                </label>
                <label>
                    <div>
                        Split Equally:
                        <input
                            type="checkbox"
                            checked={splitEqually}
                            onChange={toggleSplitEqually}
                        />
                    </div>
                </label>
            </div>
            <table className='table'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>New Lent</th>
                        <th>New Borrow</th>
                    </tr>
                </thead>
                <tbody>
    {tableData.map((item, index) => (
        <tr key={index}>
            <td>{item.name}</td>
            <td>
                <input
                    type="number"
                    name="newLent"
                    value={item.newLent}
                    onChange={(e) => handleInputChange(index, e)}
                    // Remove the disabled prop here
                />
            </td>
            <td>
                <input
                    type="number"
                    name="newBorrow"
                    value={item.newBorrow}
                    onChange={(e) => handleInputChange(index, e)}
                    disabled={splitEqually}
                />
            </td>
        </tr>
    ))}
</tbody>
            </table>
            <button type="submit" className='button' style={{width:'auto', marginTop:'10px'}}>
                <p>{isEditing ? 'Update Transaction' : 'Submit Data'}</p>
            </button>
            {isEditing && (
                <button type="button" onClick={cancelEdit}>
                    Cancel Edit
                </button>
            )}
        </form>
        <label>
                    Total Lent:
                    <input
                        type="number"
                        value={totalLent}
                        onChange={handleTotalLentChange}
                    />
                </label>
        </>
    );
}

export default DataEntryTable;
