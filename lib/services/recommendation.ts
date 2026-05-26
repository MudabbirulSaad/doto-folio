import type { BlogPost } from '@/lib/types/blog'
import type { BlogTag } from '@/lib/types/blog'

type BlogPostTag = BlogTag | { tag: BlogTag }

function getTag(tag: BlogPostTag): BlogTag {
  return 'tag' in tag ? tag.tag : tag
}

// Text preprocessing utilities
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
}

function removeStopWords(tokens: string[]): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'from', 'up', 'about', 'into', 'over', 'after'
  ])
  
  return tokens.filter(token => !stopWords.has(token))
}

// TF-IDF Implementation
interface TFIDFVector {
  [term: string]: number
}

function calculateTF(tokens: string[]): TFIDFVector {
  const tf: TFIDFVector = {}
  const totalTokens = tokens.length
  
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1
  }
  
  // Normalize by total tokens
  for (const term in tf) {
    tf[term] = tf[term] / totalTokens
  }
  
  return tf
}

function calculateIDF(documents: string[][]): TFIDFVector {
  const idf: TFIDFVector = {}
  const totalDocs = documents.length
  
  // Get all unique terms
  const allTerms = new Set<string>()
  documents.forEach(doc => doc.forEach(term => allTerms.add(term)))
  
  // Calculate IDF for each term
  for (const term of allTerms) {
    const docsWithTerm = documents.filter(doc => doc.includes(term)).length
    idf[term] = Math.log(totalDocs / docsWithTerm)
  }
  
  return idf
}

function calculateTFIDF(tf: TFIDFVector, idf: TFIDFVector): TFIDFVector {
  const tfidf: TFIDFVector = {}
  
  for (const term in tf) {
    tfidf[term] = tf[term] * (idf[term] || 0)
  }
  
  return tfidf
}

// Cosine similarity calculation
function cosineSimilarity(vectorA: TFIDFVector, vectorB: TFIDFVector): number {
  const termsA = Object.keys(vectorA)
  const termsB = Object.keys(vectorB)
  const allTerms = new Set([...termsA, ...termsB])
  
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0
  
  for (const term of allTerms) {
    const valueA = vectorA[term] || 0
    const valueB = vectorB[term] || 0
    
    dotProduct += valueA * valueB
    magnitudeA += valueA * valueA
    magnitudeB += valueB * valueB
  }
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

// Extract content from blog post for analysis
function extractPostContent(post: BlogPost): string {
  const content = [
    post.title,
    post.excerpt || '',
    post.content || '',
    post.category?.name || '',
    ...(post.tags?.map(tag => getTag(tag).name || '') || [])
  ].join(' ')
  
  return content
}

// Main recommendation function
export function getRecommendedPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  // Filter out the current post and unpublished posts
  const candidatePosts = allPosts.filter(
    post => post.id !== currentPost.id && post.status === 'published'
  )
  
  if (candidatePosts.length === 0) return []
  
  // Extract and preprocess content
  const currentContent = extractPostContent(currentPost)
  const currentTokens = removeStopWords(tokenize(currentContent))
  
  const candidateContents = candidatePosts.map(post => {
    const content = extractPostContent(post)
    return removeStopWords(tokenize(content))
  })
  
  // Calculate TF-IDF vectors
  const allDocuments = [currentTokens, ...candidateContents]
  const idf = calculateIDF(allDocuments)
  
  const currentTF = calculateTF(currentTokens)
  const currentTFIDF = calculateTFIDF(currentTF, idf)
  
  // Calculate similarities
  const similarities = candidatePosts.map((post, index) => {
    const candidateTF = calculateTF(candidateContents[index])
    const candidateTFIDF = calculateTFIDF(candidateTF, idf)
    const similarity = cosineSimilarity(currentTFIDF, candidateTFIDF)
    
    // Boost similarity for same category
    let boostedSimilarity = similarity
    if (post.category?.id === currentPost.category?.id) {
      boostedSimilarity += 0.1
    }
    
    // Boost similarity for shared tags
    const currentTags = new Set(currentPost.tags?.map(t => getTag(t).id) || [])
    const postTags = new Set(post.tags?.map(t => getTag(t).id) || [])
    const sharedTags = [...currentTags].filter(tag => postTags.has(tag))
    boostedSimilarity += sharedTags.length * 0.05
    
    return {
      post,
      similarity: boostedSimilarity
    }
  })
  
  // Sort by similarity and return top recommendations
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxRecommendations)
    .map(item => item.post)
}

// Alternative recommendation based on category and tags (fallback)
export function getCategoryBasedRecommendations(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  const candidatePosts = allPosts.filter(
    post => post.id !== currentPost.id && post.status === 'published'
  )
  
  if (candidatePosts.length === 0) return []
  
  // Score posts based on category and tag matches
  const scoredPosts = candidatePosts.map(post => {
    let score = 0
    
    // Same category gets high score
    if (post.category?.id === currentPost.category?.id) {
      score += 10
    }
    
    // Shared tags get points
    const currentTags = new Set(currentPost.tags?.map(t => getTag(t).id) || [])
    const postTags = new Set(post.tags?.map(t => getTag(t).id) || [])
    const sharedTags = [...currentTags].filter(tag => postTags.has(tag))
    score += sharedTags.length * 3
    
    // Recent posts get slight boost
    const daysSincePublished = Math.floor(
      (Date.now() - new Date(post.published_at || post.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSincePublished < 30) {
      score += 1
    }
    
    return { post, score }
  })
  
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations)
    .map(item => item.post)
}

// Hybrid recommendation combining both approaches
export function getHybridRecommendations(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  const contentBasedRecs = getRecommendedPosts(currentPost, allPosts, maxRecommendations * 2)
  const categoryBasedRecs = getCategoryBasedRecommendations(currentPost, allPosts, maxRecommendations * 2)
  
  // Combine and deduplicate
  const combinedRecs = new Map<string, BlogPost>()
  
  // Add content-based recommendations with higher priority
  contentBasedRecs.forEach(post => {
    combinedRecs.set(post.id, post)
  })
  
  // Add category-based recommendations if we need more
  categoryBasedRecs.forEach(post => {
    if (combinedRecs.size < maxRecommendations * 2) {
      combinedRecs.set(post.id, post)
    }
  })
  
  return Array.from(combinedRecs.values()).slice(0, maxRecommendations)
}
