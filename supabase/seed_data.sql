
-- Add some initial sample data for books
INSERT INTO public.books (title, author, genre, cover_url) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Classic', 'https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg'),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'https://upload.wikimedia.org/wikipedia/commons/4/4f/To_Kill_a_Mockingbird_%28first_edition_cover%29.jpg'),
('1984', 'George Orwell', 'Dystopian', 'https://m.media-amazon.com/images/I/519zR2oIlmL._AC_UF1000,1000_QL80_.jpg'),
('Pride and Prejudice', 'Jane Austen', 'Romance', 'https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg');

-- Add some initial sample data for events
INSERT INTO public.events (title, date, description) VALUES
('Book Club Meeting - The Great Gatsby', '2023-11-15T18:00:00Z', 'Join us for a discussion of F. Scott Fitzgerald''s classic novel.'),
('Author Talk: Modern Fiction', '2023-12-05T19:30:00Z', 'Local authors discuss their approach to modern fiction writing.'),
('Summer Reading Challenge Kickoff', '2024-06-01T10:00:00Z', 'Start your summer reading journey with challenges and prizes!');
