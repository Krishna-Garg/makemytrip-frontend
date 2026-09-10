import axios from "axios";

const BACKEND_URL = "https://makemytrip-backend-px07.onrender.com";

// ── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/login?email=${email}&password=${password}`);
    return res.data;
  } catch (error) { throw error; }
};

export const signup = async (firstName, lastName, email, phoneNumber, password) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName, lastName, email, phoneNumber, password,
    });
    return res.data;
  } catch (error) { throw error; }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/email?email=${email}`);
    return res.data;
  } catch (error) { throw error; }
};

export const editprofile = async (id, firstName, lastName, email, phoneNumber) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/edit?id=${id}`, {
      firstName, lastName, email, phoneNumber,
    });
    return res.data;
  } catch (error) { console.log(error); }
};

// ── Flights ───────────────────────────────────────────────────────────────────
// FIX #4: filter out templates on the frontend as well as backend

export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    // Filter templates and expired flights client-side as safety net
    return (res.data || []).filter(
      (f) => !f.isTemplate && f.status !== "EXPIRED" && f.status !== "DEPARTED"
    );
  } catch (error) {
    console.log(error); // FIX #1: was console.log(data) — data undefined in catch
    return [];
  }
};

export const addflight = async (
  flightName, from, to, departureTime, arrivalTime, price, availableSeats, boardingMinutes
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName, from, to, departureTime, arrivalTime, price, availableSeats, boardingMinutes,
    });
    return res.data;
  } catch (error) { console.log(error); }
};

export const editflight = async (
  id, flightName, from, to, departureTime, arrivalTime, price, availableSeats, boardingMinutes
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/flight/${id}`, {
      flightName, from, to, departureTime, arrivalTime, price, availableSeats, boardingMinutes,
    });
    return res.data;
  } catch (error) { console.log(error); }
};

// ── Hotels ────────────────────────────────────────────────────────────────────

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const addhotel = async (hotelName, location, pricePerNight, availableRooms, amenities, imageUrls = []) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName, location, pricePerNight, availableRooms, amenities, imageUrls,
    });
    return res.data;
  } catch (error) { console.log(error); }
};


export const edithotel = async (id, hotelName, location, pricePerNight, availableRooms, amenities, imageUrls = []) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/hotel/${id}`, {
      hotelName, location, pricePerNight, availableRooms, amenities, imageUrls,
    });
    return res.data;
  } catch (error) { console.log(error); }
};


// ── Bookings — FIX #2: switched from query params to request body ──────────────

export const handleflightbooking = async (userId, flightId, seats, price, selectedSeats = []) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/booking/flight`, {
      userId, flightId, seats, price, selectedSeats,
    });
    return res.data;
  } catch (error) { console.log(error); throw error; }
};

export const handlehotelbooking = async (userId, hotelId, rooms, price, selectedRoomType = null) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/booking/hotel`, {
      userId, hotelId, rooms, price, selectedRoomType,
    });
    return res.data;
  } catch (error) { console.log(error); throw error; }
};

export const getMyBookings = async (userId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/booking/my-booking?userId=${userId}`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const getCancellationReasons = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/booking/cancellation-reasons`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const cancelBooking = async (userId, bookingId, reason) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/booking/cancel?userId=${userId}&bookingId=${bookingId}&reason=${encodeURIComponent(reason)}`
    );
    return res.data;
  } catch (error) { throw error; }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAllUsers = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/admin/users`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const getAllRefunds = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/admin/refunds`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const updateRefundStatus = async (userId, bookingId, status) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/admin/refund/status?userId=${userId}&bookingId=${bookingId}&status=${status}`
    );
    return res.data;
  } catch (error) { throw error; }
};

// ── Reviews ───────────────────────────────────────────────────────────────────

export const getReviews = async (targetId, sort = "newest") => {
  try {
    const res = await axios.get(`${BACKEND_URL}/reviews/${targetId}?sort=${sort}`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const createReview = async (targetId, targetType, userId, userFullName, rating, reviewText, photoUrl) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews`, {
      targetId, targetType, userId, userFullName, rating, reviewText, photoUrl,
    });
    return res.data;
  } catch (error) { throw error; }
};

export const addReviewReply = async (reviewId, userId, userFullName, text) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/reply`, {
      userId, userFullName, text,
    });
    return res.data;
  } catch (error) { throw error; }
};

export const markReviewHelpful = async (reviewId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/helpful`);
    return res.data;
  } catch (error) { console.log(error); }
};

export const flagReview = async (reviewId, reason) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/flag`, { reason });
    return res.data;
  } catch (error) { throw error; }
};

export const getFlaggedReviews = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/reviews/admin/flagged`);
    return res.data;
  } catch (error) { return []; }
};

export const deleteReview = async (reviewId) => {
  try {
    await axios.delete(`${BACKEND_URL}/reviews/admin/${reviewId}`);
  } catch (error) { throw error; }
};

export const unflagReview = async (reviewId) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/reviews/admin/${reviewId}/unflag`);
    return res.data;
  } catch (error) { throw error; }
};

// ── Flight status ─────────────────────────────────────────────────────────────

export const getFlightStatus = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight-status/${flightId}`);
    return res.data;
  } catch (error) { throw error; }
};

export const searchFlightsByDate = async (from, to, date) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight-status/search?from=${from}&to=${to}&date=${date}`);
    return res.data;
  } catch (error) { return []; }
};

export const adminUpdateFlightStatus = async (flightId, status, reason, estimatedDeparture, delayMinutes) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/flight-status/admin/${flightId}`, {
      status, reason, estimatedDeparture, delayMinutes,
    });
    return res.data;
  } catch (error) { throw error; }
};

export const createFlightTemplate = async (templateData) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/flight-status/admin/template`, templateData);
    return res.data;
  } catch (error) { throw error; }
};

// ── Seats ─────────────────────────────────────────────────────────────────────

export const getSeatMap = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/seats/flight/${flightId}`);
    return res.data;
  } catch (error) { console.log(error); return { seats: [], aircraftModel: null }; }
};

export const lockSeats = async (flightId, seatNumbers, userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/flight/${flightId}/lock`, { userId, seatNumbers });
    return res.data;
  } catch (error) { throw error; }
};

export const confirmSeats = async (flightId, seatNumbers) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/flight/${flightId}/confirm`, { seatNumbers });
    return res.data;
  } catch (error) { throw error; }
};

export const unlockSeats = async (flightId, seatNumbers, userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/flight/${flightId}/unlock`, { userId, seatNumbers });
    return res.data;
  } catch (error) { console.log(error); }
};

export const generateSeatMap = async (flightId, model) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/flight/${flightId}/generate?model=${model}`);
    return res.data;
  } catch (error) { throw error; }
};

export const getRoomTypes = async (hotelId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/seats/hotel/${hotelId}`);
    return res.data;
  } catch (error) { console.log(error); return { roomTypes: [] }; }
};

export const bookRoomType = async (hotelId, roomType, quantity) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/hotel/${hotelId}/book`, { roomType, quantity });
    return res.data;
  } catch (error) { throw error; }
};

export const savePreferences = async (userId, seatPreference, roomPreference) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/seats/preferences`, {
      userId, seatPreference, roomPreference,
    });
    return res.data;
  } catch (error) { console.log(error); }
};

// ── Pricing ───────────────────────────────────────────────────────────────────

export const getEffectivePrice = async (flightId, userId) => {
  try {
    const url = userId
      ? `${BACKEND_URL}/pricing/flight/${flightId}?userId=${userId}`
      : `${BACKEND_URL}/pricing/flight/${flightId}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) { console.log(error); return null; }
};

export const getHotelEffectivePrice = async (hotelId, userId) => {
  try {
    const url = userId
      ? `${BACKEND_URL}/pricing/hotel/${hotelId}?userId=${userId}`
      : `${BACKEND_URL}/pricing/hotel/${hotelId}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) { console.log(error); return null; }
};

export const getPriceHistory = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/pricing/${flightId}/history`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const freezePrice = async (flightId, userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/pricing/${flightId}/freeze?userId=${userId}`);
    return res.data;
  } catch (error) { throw error; }
};

export const getUserTier = async (userId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/pricing/tier?userId=${userId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return { tier: "BASIC", discount: "0%", freezeMinutes: 30, nextTier: "3 qualifying bookings for SILVER" };
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const getMyNotifications = async (userId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/notifications?userId=${userId}`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    await axios.put(`${BACKEND_URL}/notifications/mark-all-read?userId=${userId}`);
  } catch (error) { console.log(error); }
};

export const markOneNotificationRead = async (notificationId) => {
  try {
    await axios.put(`${BACKEND_URL}/notifications/${notificationId}/read`);
  } catch (error) { console.log(error); }
};

export const getUnreadNotificationCount = async (userId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/notifications/unread-count?userId=${userId}`);
    return res.data.count || 0;
  } catch (error) { return 0; }
};

// ── Recommendations ───────────────────────────────────────────────────────────

export const getRecommendations = async (userId) => {
  try {
    const url = userId
      ? `${BACKEND_URL}/recommendations?userId=${userId}`
      : `${BACKEND_URL}/recommendations`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const refreshRecommendations = async (userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/recommendations/refresh?userId=${userId}`);
    return res.data;
  } catch (error) { console.log(error); return []; }
};

export const sendRecommendationFeedback = async (userId, targetId, targetType, feedback) => {
  try {
    await axios.post(`${BACKEND_URL}/recommendations/feedback`, {
      userId, targetId, targetType, feedback,
    });
  } catch (error) { console.log(error); }
};

export const getGeneratedFlights = async (templateId) => {
  try {
    const res = await fetch(`http://localhost:8080/flight-status/admin/generated/${templateId}`);
    return await res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
};
 
export const regenerateFlights = async (templateId) => {
  try {
    const res = await fetch(`http://localhost:8080/flight-status/admin/regenerate/${templateId}`, {
      method: "POST",
    });
    return await res.json();
  } catch (error) {
    console.log(error);
    return null;
  }
};

