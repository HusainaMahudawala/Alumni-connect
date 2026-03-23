# Alumni Connect

A comprehensive platform connecting alumni with current students through mentorship, job opportunities, and community engagement.

## Features

- **User Authentication**: Secure login and registration for both alumni and students
- **Mentorship Program**: Connect students with experienced alumni mentors
- **Job Opportunities**: Alumni can post internships and job opportunities
- **Community Feed**: Share updates, ask questions, and engage with the community
- **Dashboard**: Personalized dashboards for alumni and students with relevant statistics
- **Profile Management**: Manage user profiles and preferences

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components (Login, Dashboard, etc.)
│   ├── services/       # API services
│   ├── styles/         # Global CSS files
│   ├── utils/          # Utility functions (auth helpers, etc.)
│   ├── App.js          # Main App component
│   └── index.js        # Entry point
└── package.json
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd Alumni-connect/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

### `npm start`
Runs the app in development mode. The page reloads when you make changes.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## API Configuration

The frontend connects to a backend server. Make sure the backend is running and the API endpoints are properly configured in `src/services/api.js`.

## Technologies Used

- React.js
- JavaScript (ES6+)
- CSS3
- Axios (for API calls)

## Contributing

Feel free to submit issues and enhancement requests!

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
