import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  password,
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/email?email=${email}`);
    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const editprofile = async (
  id,
  firstName,
  lastName,
  email,
  phoneNumber,
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/edit?id=${id}`, {
      firstName,
      lastName,
      email,
      phoneNumber,
    });
    const data = res.data;
    return data;
  } catch (error) {}
};
export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log(data);
  }
};

export const addflight = async (
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats,
  boardingMinutes,
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      boardingMinutes,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const editflight = async (
  id,
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats,
  boardingMinutes,
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/flight/${id}`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      boardingMinutes,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const addhotel = async (
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities,
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    console.log(res);
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const edithotel = async (
  id,
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities,
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/hotel/${id}`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Replace handleflightbooking and handlehotelbooking in api/index.js

export const handleflightbooking = async (userId, flightId, seats, price, selectedSeats = []) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/booking/flight`, {
      userId,
      flightId,
      seats,
      price,
      selectedSeats,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const handlehotelbooking = async (userId, hotelId, rooms, price, selectedRoomType = null) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/booking/hotel`, {
      userId,
      hotelId,
      rooms,
      price,
      selectedRoomType,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMyBookings = async (userId) => {
  try {
    const url = `${BACKEND_URL}/booking/my-booking?userId=${userId}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getCancellationReasons = async () => {
  try {
    const url = `${BACKEND_URL}/booking/cancellation-reasons`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const cancelBooking = async (userId, bookingId, reason) => {
  try {
    const url = `${BACKEND_URL}/booking/cancel?userId=${userId}&bookingId=${bookingId}&reason=${encodeURIComponent(reason)}`;
    const res = await axios.post(url);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/admin/users`);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getAllRefunds = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/admin/refunds`);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const updateRefundStatus = async (userId, bookingId, status) => {
  try {
    const url = `${BACKEND_URL}/admin/refund/status?userId=${userId}&bookingId=${bookingId}&status=${status}`;
    const res = await axios.put(url);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getReviews = async (targetId, sort = "newest") => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/reviews/${targetId}?sort=${sort}`,
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const createReview = async (
  targetId,
  targetType,
  userId,
  userFullName,
  rating,
  reviewText,
  photoUrl,
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews`, {
      targetId,
      targetType,
      userId,
      userFullName,
      rating,
      reviewText,
      photoUrl,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const addReviewReply = async (reviewId, userId, userFullName, text) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/reply`, {
      userId,
      userFullName,
      text,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const markReviewHelpful = async (reviewId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/helpful`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const flagReview = async (reviewId, reason) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/flag`, {
      reason,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getFlaggedReviews = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/reviews/admin/flagged`);
    return res.data;
  } catch (error) {
    return [];
  }
};

export const deleteReview = async (reviewId) => {
  try {
    await axios.delete(`${BACKEND_URL}/reviews/admin/${reviewId}`);
  } catch (error) {
    throw error;
  }
};

export const unflagReview = async (reviewId) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/reviews/admin/${reviewId}/unflag`,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getFlightStatus = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight-status/${flightId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const searchFlightsByDate = async (from, to, date) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight-status/search?from=${from}&to=${to}&date=${date}`,
    );
    return res.data;
  } catch (error) {
    return [];
  }
};

export const adminUpdateFlightStatus = async (
  flightId,
  status,
  reason,
  estimatedDeparture,
  delayMinutes,
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/flight-status/admin/${flightId}`,
      {
        status,
        reason,
        estimatedDeparture,
        delayMinutes,
      },
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const createFlightTemplate = async (templateData) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/flight-status/admin/template`,
      templateData,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Notifications — stored client-side for now (upgrade to DB later)
export const getMyNotifications = async (userId) => {
  // Returns from localStorage until backend notification system is added
  const stored = JSON.parse(localStorage.getItem(`notifs_${userId}`) || "[]");
  return stored;
};

export const markNotificationRead = async (userId, index) => {
  const stored = JSON.parse(localStorage.getItem(`notifs_${userId}`) || "[]");
  if (stored[index]) stored[index].read = true;
  localStorage.setItem(`notifs_${userId}`, JSON.stringify(stored));
  return stored;
};

export const getEffectivePrice = async (flightId, userId) => {
  try {
    const url = userId
      ? `${BACKEND_URL}/pricing/${flightId}?userId=${userId}`
      : `${BACKEND_URL}/pricing/${flightId}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
 
export const getPriceHistory = async (flightId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/pricing/${flightId}/history`);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
 
export const freezePrice = async (flightId, userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/pricing/${flightId}/freeze?userId=${userId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
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

export const getRecommendations = async (userId) => {
  try {
    const url = userId
      ? `${BACKEND_URL}/recommendations?userId=${userId}`
      : `${BACKEND_URL}/recommendations`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
 
export const refreshRecommendations = async (userId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/recommendations/refresh?userId=${userId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
 
export const sendRecommendationFeedback = async (userId, targetId, targetType, feedback) => {
  try {
    await axios.post(`${BACKEND_URL}/recommendations/feedback`, {
      userId, targetId, targetType, feedback,
    });
  } catch (error) {
    console.log(error);
  }
};
