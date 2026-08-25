import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    room_id: "",
    user_id: 2,
    booking_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });

  const loadData = async () => {
    const roomsResponse = await fetch(`${API}/rooms`);
    const roomsData = await roomsResponse.json();
    setRooms(roomsData.rooms || []);

    const bookingsResponse = await fetch(`${API}/bookings`);
    const bookingsData = await bookingsResponse.json();
    setBookings(bookingsData.bookings || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Booking created successfully!");
      setForm({
        room_id: "",
        user_id: 2,
        booking_date: "",
        start_time: "",
        end_time: "",
        purpose: "",
      });

      loadData();
    } catch (error) {
      setMessage("Unable to connect to backend");
    }
  };

  const cancelBooking = async (id) => {
    const response = await fetch(`${API}/bookings/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    setMessage(data.message);
    loadData();
  };

  return (
    <div className="app">
      <header>
        <h1>Meeting Room Booking</h1>
        <p>Bellcorp Meeting Room Management System</p>
      </header>

      <main>
        <section className="card">
          <h2>Book a Meeting Room</h2>

          <form onSubmit={handleBooking}>
            <label>Meeting Room</label>
            <select
              name="room_id"
              value={form.room_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - Capacity {room.capacity}
                </option>
              ))}
            </select>

            <label>Date</label>
            <input
              type="date"
              name="booking_date"
              value={form.booking_date}
              onChange={handleChange}
              required
            />

            <div className="row">
              <div>
                <label>Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label>Purpose</label>
            <input
              type="text"
              name="purpose"
              placeholder="Team Meeting"
              value={form.purpose}
              onChange={handleChange}
            />

            <button type="submit">Book Room</button>
          </form>

          {message && <p className="message">{message}</p>}
        </section>

        <section className="card">
          <h2>Available Meeting Rooms</h2>

          <div className="rooms">
            {rooms.map((room) => (
              <div className="room" key={room.id}>
                <h3>{room.name}</h3>
                <p>{room.location}</p>
                <p>Capacity: {room.capacity}</p>
                <p>{room.facilities}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Bookings</h2>

          {bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <div className="bookings">
              {bookings.map((booking) => (
                <div className="booking" key={booking.id}>
                  <div>
                    <h3>{booking.room_name}</h3>
                    <p>User: {booking.user_name}</p>
                    <p>
                      Date:{" "}
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                    <p>
                      Time: {booking.start_time} - {booking.end_time}
                    </p>
                    <p>Purpose: {booking.purpose}</p>
                    <strong>Status: {booking.status}</strong>
                  </div>

                  <button
                    className="cancel"
                    onClick={() => cancelBooking(booking.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;