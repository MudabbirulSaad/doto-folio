-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  featured_image_alt TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  reading_time INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_name VARCHAR(100) DEFAULT 'Mudabbirul Saad',
  author_bio TEXT DEFAULT 'AI Student & Full-Stack Developer',
  author_avatar TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog post tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- Create blog views table for analytics
CREATE TABLE IF NOT EXISTS blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_post ON blog_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON blog_views(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_tags_updated_at BEFORE UPDATE ON blog_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
('AI & Machine Learning', 'ai-machine-learning', 'Articles about artificial intelligence, machine learning, and deep learning technologies.', '#8B5CF6'),
('Web Development', 'web-development', 'Frontend and backend web development tutorials and insights.', '#3B82F6'),
('Technology Trends', 'technology-trends', 'Latest trends and innovations in the tech industry.', '#10B981'),
('Programming', 'programming', 'Programming languages, best practices, and coding tutorials.', '#F59E0B'),
('Career & Education', 'career-education', 'Career advice, learning resources, and educational content.', '#EF4444')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample tags
INSERT INTO blog_tags (name, slug, description) VALUES
('JavaScript', 'javascript', 'JavaScript programming language and frameworks'),
('React', 'react', 'React.js library and ecosystem'),
('Next.js', 'nextjs', 'Next.js framework for React applications'),
('TypeScript', 'typescript', 'TypeScript programming language'),
('Node.js', 'nodejs', 'Node.js runtime environment'),
('Python', 'python', 'Python programming language'),
('Machine Learning', 'machine-learning', 'Machine learning algorithms and techniques'),
('AI', 'ai', 'Artificial intelligence technologies'),
('Web Development', 'web-dev', 'Web development practices and tools'),
('Tutorial', 'tutorial', 'Step-by-step tutorials and guides'),
('Best Practices', 'best-practices', 'Industry best practices and standards'),
('Performance', 'performance', 'Performance optimization techniques'),
('Security', 'security', 'Security practices and considerations'),
('Database', 'database', 'Database design and management'),
('API', 'api', 'API design and development')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  status, 
  featured, 
  reading_time, 
  category_id, 
  published_at
) VALUES
(
  'Getting Started with Next.js 15: A Complete Guide',
  'getting-started-nextjs-15-complete-guide',
  'Learn how to build modern web applications with Next.js 15, including the latest features like Server Components, App Router, and improved performance optimizations.',
  '# Getting Started with Next.js 15: A Complete Guide

Next.js 15 brings exciting new features and improvements that make building React applications even more powerful and efficient. In this comprehensive guide, we''ll explore the key features and learn how to build a modern web application from scratch.

## What''s New in Next.js 15

Next.js 15 introduces several groundbreaking features:

### 1. Enhanced App Router
The App Router has been further refined with better performance and developer experience improvements.

### 2. Server Components by Default
Server Components are now the default, providing better performance and SEO out of the box.

### 3. Improved Caching
Enhanced caching mechanisms for better performance and reduced server load.

## Setting Up Your First Next.js 15 Project

Let''s start by creating a new Next.js 15 project:

```bash
npx create-next-app@latest my-nextjs-app
cd my-nextjs-app
npm run dev
```

## Building Your First Component

Here''s how to create a simple server component:

```tsx
// app/components/Welcome.tsx
export default function Welcome() {
  return (
    <div className="p-6 bg-blue-50 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-900">
        Welcome to Next.js 15!
      </h1>
      <p className="mt-2 text-blue-700">
        Building modern web applications has never been easier.
      </p>
    </div>
  )
}
```

## Conclusion

Next.js 15 represents a significant step forward in React development, offering improved performance, better developer experience, and powerful new features that make building modern web applications a joy.

Start exploring Next.js 15 today and experience the future of web development!',
  'published',
  true,
  8,
  (SELECT id FROM blog_categories WHERE slug = 'web-development'),
  NOW() - INTERVAL '2 days'
),
(
  'Understanding Machine Learning Fundamentals',
  'understanding-machine-learning-fundamentals',
  'Dive deep into the core concepts of machine learning, from supervised learning to neural networks, with practical examples and real-world applications.',
  '# Understanding Machine Learning Fundamentals

Machine Learning (ML) has become one of the most transformative technologies of our time. This comprehensive guide will help you understand the fundamental concepts and get started with your ML journey.

## What is Machine Learning?

Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every scenario.

## Types of Machine Learning

### 1. Supervised Learning
- **Definition**: Learning with labeled training data
- **Examples**: Classification, Regression
- **Use Cases**: Email spam detection, Price prediction

### 2. Unsupervised Learning
- **Definition**: Finding patterns in data without labels
- **Examples**: Clustering, Dimensionality reduction
- **Use Cases**: Customer segmentation, Anomaly detection

### 3. Reinforcement Learning
- **Definition**: Learning through interaction and feedback
- **Examples**: Game playing, Robotics
- **Use Cases**: Autonomous vehicles, Trading algorithms

## Getting Started with Python

Here''s a simple example using scikit-learn:

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import numpy as np

# Generate sample data
X = np.random.rand(100, 1) * 10
y = 2 * X.flatten() + 1 + np.random.randn(100) * 0.5

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Create and train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
mse = mean_squared_error(y_test, predictions)
print(f"Mean Squared Error: {mse}")
```

## Key Concepts to Master

1. **Data Preprocessing**: Cleaning and preparing your data
2. **Feature Engineering**: Creating meaningful features
3. **Model Selection**: Choosing the right algorithm
4. **Evaluation Metrics**: Measuring model performance
5. **Overfitting/Underfitting**: Balancing model complexity

## Next Steps

1. Practice with real datasets
2. Learn popular libraries (scikit-learn, TensorFlow, PyTorch)
3. Work on projects
4. Join ML communities
5. Stay updated with latest research

Machine Learning is a vast field with endless possibilities. Start with the basics, practice regularly, and gradually tackle more complex problems. The journey is challenging but incredibly rewarding!',
  'published',
  true,
  12,
  (SELECT id FROM blog_categories WHERE slug = 'ai-machine-learning'),
  NOW() - INTERVAL '5 days'
),
(
  'Building Scalable APIs with Node.js and Express',
  'building-scalable-apis-nodejs-express',
  'Learn how to design and build robust, scalable APIs using Node.js and Express, including best practices for authentication, error handling, and performance optimization.',
  '# Building Scalable APIs with Node.js and Express

Creating scalable APIs is crucial for modern web applications. In this guide, we''ll explore how to build robust, maintainable APIs using Node.js and Express.

## Project Setup

First, let''s set up our project structure:

```bash
mkdir scalable-api
cd scalable-api
npm init -y
npm install express cors helmet morgan compression dotenv
npm install -D nodemon
```

## Basic Express Setup

```javascript
// app.js
const express = require(''express'');
const cors = require(''cors'');
const helmet = require(''helmet'');
const morgan = require(''morgan'');
const compression = require(''compression'');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan(''combined''));
app.use(express.json({ limit: ''10mb'' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get(''/health'', (req, res) => {
  res.json({ status: ''OK'', timestamp: new Date().toISOString() });
});

module.exports = app;
```

## Implementing Authentication

```javascript
// middleware/auth.js
const jwt = require(''jsonwebtoken'');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers[''authorization''];
  const token = authHeader && authHeader.split('' '')[1];

  if (!token) {
    return res.status(401).json({ error: ''Access token required'' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: ''Invalid token'' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

## Error Handling

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === ''ValidationError'') {
    return res.status(400).json({
      error: ''Validation Error'',
      details: err.message
    });
  }

  if (err.name === ''CastError'') {
    return res.status(400).json({
      error: ''Invalid ID format''
    });
  }

  res.status(500).json({
    error: ''Internal Server Error'',
    message: process.env.NODE_ENV === ''development'' ? err.message : ''Something went wrong''
  });
};

module.exports = errorHandler;
```

## Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require(''express-rate-limit'');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  ''Too many requests from this IP''
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  ''Too many authentication attempts''
);

module.exports = { generalLimiter, authLimiter };
```

## Database Connection with Connection Pooling

```javascript
// config/database.js
const { Pool } = require(''pg'');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

module.exports = pool;
```

## Best Practices

### 1. Input Validation
```javascript
const { body, validationResult } = require(''express-validator'');

const validateUser = [
  body(''email'').isEmail().normalizeEmail(),
  body(''password'').isLength({ min: 8 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 2. Caching
```javascript
const redis = require(''redis'');
const client = redis.createClient();

const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### 3. Logging
```javascript
const winston = require(''winston'');

const logger = winston.createLogger({
  level: ''info'',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: ''error.log'', level: ''error'' }),
    new winston.transports.File({ filename: ''combined.log'' })
  ]
});

if (process.env.NODE_ENV !== ''production'') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## Performance Optimization Tips

1. **Use compression middleware**
2. **Implement proper caching strategies**
3. **Optimize database queries**
4. **Use connection pooling**
5. **Implement rate limiting**
6. **Monitor and profile your application**

## Conclusion

Building scalable APIs requires careful consideration of architecture, security, performance, and maintainability. By following these practices and patterns, you''ll be well on your way to creating robust APIs that can handle growth and provide excellent user experiences.

Remember to always test your APIs thoroughly, monitor performance in production, and continuously iterate based on real-world usage patterns.',
  'published',
  false,
  15,
  (SELECT id FROM blog_categories WHERE slug = 'web-development'),
  NOW() - INTERVAL '1 week'
)
ON CONFLICT (slug) DO NOTHING;

-- Link posts with tags
INSERT INTO blog_post_tags (post_id, tag_id)
SELECT 
  p.id,
  t.id
FROM blog_posts p
CROSS JOIN blog_tags t
WHERE 
  (p.slug = 'getting-started-nextjs-15-complete-guide' AND t.slug IN ('nextjs', 'react', 'javascript', 'typescript', 'web-dev', 'tutorial'))
  OR (p.slug = 'understanding-machine-learning-fundamentals' AND t.slug IN ('machine-learning', 'ai', 'python', 'tutorial', 'best-practices'))
  OR (p.slug = 'building-scalable-apis-nodejs-express' AND t.slug IN ('nodejs', 'javascript', 'api', 'web-dev', 'best-practices', 'performance', 'security'))
ON CONFLICT (post_id, tag_id) DO NOTHING;

-- Update category post counts
UPDATE blog_categories SET post_count = (
  SELECT COUNT(*) FROM blog_posts WHERE category_id = blog_categories.id AND status = 'published'
);

-- Update tag usage counts
UPDATE blog_tags SET usage_count = (
  SELECT COUNT(*) FROM blog_post_tags WHERE tag_id = blog_tags.id
);
