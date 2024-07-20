import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TripManager({ onTripSelect, userData, baseAPI }) {
    // console.log(userData);
    const [trips, setTrips] = useState([]);
    const [newTripName, setNewTripName] = useState('');
    const [selectedTrip, setSelectedTrip] = useState('');

    useEffect(() => {
        if (userData && userData.userId) {
            fetchUserTrips(userData.userId);
        }
    }, [userData]);

    const fetchUserTrips = async (userId) => {
        try {
            const response = await axios.get(`${baseAPI}/user-trips/${userId}`);
            setTrips(response.data);
        } catch (error) {
            console.error('Error fetching user trips:', error);
        }
    };

    const handleAddTrip = async (e) => {
        e.preventDefault();
        if (!newTripName.trim()) return;

        try {
            const response = await axios.post(`${baseAPI}/trips`, { 
                name: newTripName,
                userId: userData.userId
            });
            setTrips([...trips, response.data]);
            setNewTripName('');
        } catch (error) {
            console.error('Error adding trip:', error);
        }
    };

    const handleSelectTrip = (trip) => {
        // console.log(trip);
        setSelectedTrip(trip);
        onTripSelect(trip);
    };

    return (
        <div>
            <h2 className='box'id="heading">Trip Manager</h2>

            <form onSubmit={handleAddTrip} className="box">
                    {trips.map((trip) => (
                        <div key={trip.id}>
                            <button className='item button' onClick={() => handleSelectTrip(trip)}>
                               <p className="item">{trip.name} - {new Date(trip.start_date).toLocaleString()}</p> 
                            </button>
                        </div>
                    ))}
                <div className='item'>
                <input
                    type="text"
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder="Enter new trip name"
                />
                <button type="submit" className='add'>+</button>
                </div>

            </form>
            {
                selectedTrip &&
                <h2 className='box'id="heading" style={{marginTop:'100px'}}>{selectedTrip.name}</h2>
            }

        </div>
    );
}

export default TripManager;