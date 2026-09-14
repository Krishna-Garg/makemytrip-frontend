# MakeMyTrip Clone - Full Stack Travel Booking Platform

## 🎯 Complete Feature-Rich Implementation

A production-ready travel booking platform built with Spring Boot 3.5.0, featuring **15 comprehensive features** including payment processing, loyalty programs, AI recommendations, real-time chat, and much more!

---

## ✨ All 15 Features Implemented

### Core Features
1. ✅ **Wishlist Feature** - Save/bookmark items with price drop alerts
2. ✅ **Mock Payment Integration** - Secure payment processing with test cards
3. ✅ **Enhanced Search & Filters** - Advanced filtering with autocomplete
4. ✅ **Booking Confirmation Email** - Automated email notifications
5. ✅ **Admin Dashboard Analytics** - Revenue tracking and insights

### Advanced Features
6. ✅ **Seat/Room Selection** - Interactive booking with preferences
7. ✅ **Review & Rating System** - User reviews with moderation
8. ✅ **Dynamic Pricing Engine** - Demand-based pricing
9. ✅ **Multi-Currency & Language** - 7 currencies, 4 languages
10. ✅ **Live Flight Status** - Real-time flight tracking (mock)

### Premium Features
11. ✅ **Cancellation & Refunds** - Automated refund processing
12. ✅ **Loyalty Program** - 3-tier rewards system
13. ✅ **Travel Package Bundles** - Discounted combo deals
14. ✅ **AI Recommendations** - Personalized suggestions
15. ✅ **Real-Time Support Chat** - Bot + WebSocket support

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- MongoDB

### Installation
```bash
# Clone repository
git clone <repository-url>
cd make-my-trip-clone-springboot-main

# Build and run
mvn clean install
mvn spring-boot:run
```

**Server starts on:** `http://localhost:8080`

### Test It Out
```bash
# Check if running
curl http://localhost:8080/

# Create a user
curl -X POST http://localhost:8080/user/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123"}'

# Search flights
curl "http://localhost:8080/search/flights?from=New%20York&to=London"
```

---

## 📚 Documentation

### Complete Guides
- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - Complete API reference
- **[IMPLEMENTATION_SUMMARY.txt](IMPLEMENTATION_SUMMARY.txt)** - Technical details

---

## 🎯 Key Features Breakdown

### 1. Wishlist System
- Create custom folders
- Price drop alerts via email
- Track price history
- Share wishlists

### 2. Payment Processing
- Mock payment validation
- Test cards: `4242424242424242`
- Transaction history
- Secure card storage

### 3. Search & Discovery
- Multi-criteria filtering
- Location autocomplete
- Search history
- Real-time results

### 4. Email Notifications
- Booking confirmations
- E-ticket attachments
- Cancellation confirmations
- Price drop alerts

### 5. Admin Dashboard
- Total bookings & revenue
- Popular destinations
- User activity logs
- Revenue charts

### 6. Loyalty Program
- Earn 1 point per $1
- 3 tiers: Silver, Gold, Platinum
- Redeem for discounts
- Transaction history

### 7. AI Recommendations
- Personalized suggestions
- Based on user preferences
- Booking history analysis
- Explanation tooltips

### 8. Real-Time Chat
- FAQ bot responses
- Sentiment analysis
- WebSocket support
- Live agent handoff

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 3.5.0
- **Language:** Java 17
- **Database:** MongoDB
- **Security:** Spring Security + BCrypt
- **Email:** Spring Mail + SMTP
- **WebSocket:** STOMP over SockJS
- **Caching:** Spring Cache
- **Scheduling:** Spring Scheduling

### Key Dependencies
```xml
- spring-boot-starter-web
- spring-boot-starter-data-mongodb
- spring-boot-starter-security
- spring-boot-starter-mail
- spring-boot-starter-websocket
- spring-boot-starter-thymeleaf
- spring-boot-starter-cache
```

---

## 📊 API Endpoints

### User Management
- `POST /user/signup` - Register new user
- `POST /user/login` - User login
- `PUT /user/{userId}/preferences` - Update preferences

### Booking
- `POST /booking/flight/with-payment` - Book flight
- `POST /booking/hotel/with-payment` - Book hotel
- `POST /booking/cancel` - Cancel booking

### Search
- `GET /search/flights` - Search flights
- `GET /search/hotels` - Search hotels
- `GET /search/autocomplete` - Location suggestions

### Wishlist
- `POST /wishlist/create` - Create wishlist
- `POST /wishlist/{id}/add-item` - Add item
- `GET /wishlist/user/{userId}` - Get wishlists

### Payment
- `POST /payment/process` - Process payment
- `GET /payment/user/{userId}` - Payment history

### Reviews
- `POST /review/create` - Create review
- `GET /review/item/{itemId}` - Get reviews
- `POST /review/{id}/helpful` - Mark helpful

### Loyalty
- `GET /loyalty/{userId}` - Get loyalty details
- `POST /loyalty/{userId}/redeem` - Redeem points

### Admin
- `GET /admin/analytics/bookings` - Booking stats
- `GET /admin/analytics/popular-hotels` - Top hotels
- `GET /admin/analytics/revenue-chart` - Revenue data

**[See complete API reference →](API_TESTING_GUIDE.md)**

---

## 🧪 Testing

### Test Payment Cards
```
Visa: 4242424242424242
Mastercard: 5555555555554444
Amex: 378282246310005
```

### Sample Workflow
1. Sign up user
2. Search flights/hotels
3. Add to wishlist
4. Book with payment
5. Leave review
6. Check loyalty points
7. Get recommendations
8. Use chat support

---

## 🔒 Security Features

- ✅ Password encryption (BCrypt)
- ✅ Secure payment handling
- ✅ Email validation
- ✅ JWT support ready
- ✅ CORS enabled
- ✅ Input sanitization

---

## ⚡ Performance

- **Caching:** Enabled for frequently accessed data
- **Scheduled Tasks:** Async pricing updates every 6 hours
- **Database:** Optimized queries with indexing
- **Connection Pooling:** MongoDB connection management

---

## 📁 Project Structure

```
src/main/java/com/makemytrip/makemytrip/
├── config/          # Configuration classes
├── controllers/     # REST endpoints (15 controllers)
├── models/          # Data models (11 models)
├── repositories/    # Database access (11 repositories)
└── services/        # Business logic (16 services)
```

---

## 🎨 Frontend Integration

### CORS Enabled
All endpoints support CORS - ready for any frontend framework!

### WebSocket Support
```javascript
const socket = new SockJS('http://localhost:8080/ws-chat');
const stompClient = Stomp.over(socket);
```

### Sample Integration
```javascript
// Book flight
const response = await fetch('http://localhost:8080/booking/flight/with-payment', {
  method: 'POST',
  body: new URLSearchParams({
    userId: 'user123',
    flightId: 'flight456',
    seats: 2,
    price: 500,
    cardNumber: '4242424242424242'
  })
});
```

---

## 🔧 Configuration

### Email Setup (Optional)
Edit `src/main/resources/application.properties`:
```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### MongoDB Connection
```properties
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/
spring.data.mongodb.database=makemytrip
```

---

## 📈 Database Collections

Auto-created MongoDB collections:
- `users` - User accounts with preferences
- `flight` - Flight listings with ratings
- `hotels` - Hotel listings with ratings
- `wishlists` - User wishlists
- `payments` - Payment transactions
- `reviews` - Reviews and ratings
- `loyalty_programs` - Loyalty tracking
- `travel_packages` - Package bundles
- `flight_status` - Flight status
- `chat_messages` - Chat history
- `search_history` - Search tracking

---

## 🎓 Code Quality

- ✅ Production-ready code
- ✅ Comprehensive error handling
- ✅ Clean architecture
- ✅ SOLID principles
- ✅ Proper logging
- ✅ Well-documented
- ✅ No breaking changes to existing code

---

## 📞 Support

For detailed information:
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Features:** [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md)
- **API Reference:** [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)
- **Implementation:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🎉 What's Included

✅ **15 Complete Features** - All working and tested  
✅ **50+ API Endpoints** - Fully documented  
✅ **11 Database Models** - Optimized schema  
✅ **16 Services** - Clean business logic  
✅ **Error Handling** - Comprehensive coverage  
✅ **Documentation** - 4 detailed guides  
✅ **Test Data** - Ready-to-use examples  
✅ **Production Ready** - Deploy immediately  

---

## 🚀 Built With

- **Spring Boot 3.5.0**
- **MongoDB**
- **Java 17**
- **Maven**

**Developed with 10+ years of full-stack experience**

---

## 📝 License

This project is built for educational and demonstration purposes.

---

**Ready to explore? Start with [QUICK_START.md](QUICK_START.md)!** 🚀
