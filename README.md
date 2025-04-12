# BookConnect - Connect Through Books

BookConnect is a platform that connects book lovers and facilitates book discussions. It provides features for users to discover new books, join book clubs, participate in anonymous chats, and engage in interactive book discussions.

## Features

### Anonymous Chat Section

- **Explore Books**: Discover trending books and recently discussed titles
- **Book Discussions**: Join real-time chat discussions about specific books
- **Anonymous Usernames**: Participate in discussions with a generated literary username
- **Message Reactions**: React to messages with emojis
- **Reply Threading**: Reply to specific messages in a discussion

### Book Club Section

- **Create Book Clubs**: Start your own book club with custom name and description
- **Join Book Clubs**: Browse and join existing book clubs
- **Discussion Topics**: Create and participate in structured discussions within book clubs
- **Current Book**: Set and track the book your club is currently reading
- **Member Management**: Invite members and manage club membership

### User Profiles

- **Enhanced Profiles**: Customize your profile with reading preferences
- **Book Club Profiles**: Separate profiles for the book club section
- **Reading Preferences**: Share your favorite genres and authors

### Admin Features

- **Club Management**: Admin dashboard for managing book clubs
- **User Management**: Approve join requests and manage members
- **Content Moderation**: Moderate discussions and enforce community guidelines

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/bookconnect.git

# Navigate to the project directory
cd bookconnect

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components for routing
- `/src/hooks` - Custom React hooks
- `/src/services` - API and service functions
- `/src/contexts` - React context providers
- `/src/lib` - Utility functions and libraries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
