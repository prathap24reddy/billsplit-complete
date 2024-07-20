import React, { useState } from 'react';
import axios from 'axios';

function AddFriend({ tripId, friends, onFriendAdded, baseAPI }) {
    const [selectedFriendId, setSelectedFriendId] = useState('');

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (!selectedFriendId) return;

        try {
            await axios.post(`${baseAPI}/trip_users`, {
                trip_id: tripId,
                user_id: selectedFriendId
            });
            console.log('Friend added to trip');
            setSelectedFriendId('');
            onFriendAdded(); // Trigger the refresh in BillSplit
        } catch (error) {
            console.error('Error adding friend to trip:', error);
        }
    };

    return (
        <div>
            <h3 style={{textAlign:'center'}}>Add Friend to Trip</h3>
            <form onSubmit={handleAddFriend}>
                <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                >
                    <option value="" >Select a friend</option>
                    {friends.map((friend) => (
                        <option key={friend.id} value={friend.id}>{friend.name}</option>
                    ))}
                </select>
                <button type="submit" className='button add' style={{ margin:'20px'}}>+</button>
            </form>
        </div>
    );
}

export default AddFriend;
