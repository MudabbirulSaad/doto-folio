import type { BlogPost, BlogTag } from '@/lib/types/blog'

type BlogPostTag = BlogTag | { tag: BlogTag }

type TFIDFVector = Record<string, number>

function getTag(tag: BlogPostTag): BlogTag {
  return 'tag' in tag ? tag.tag : tag
}

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

function calculateTF(tokens: string[]): TFIDFVector {
  const tf: TFIDFVector = {}
  const totalTokens = tokens.length

  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1
  }

  for (const term in tf) {
    tf[term] = tf[term] / totalTokens
  }

  return tf
}

function calculateIDF(documents: string[][]): TFIDFVector {
  const idf: TFIDFVector = {}
  const totalDocs = documents.length
  const allTerms = new Set<string>()

  documents.forEach(doc => doc.forEach(term => allTerms.add(term)))

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

function cosineSimilarity(vectorA: TFIDFVector, vectorB: TFIDFVector): number {
  const allTerms = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)])
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

function extractPostContent(post: BlogPost): string {
  return [
    post.title,
    post.excerpt || '',
    post.content || '',
    post.category?.name || '',
    ...(post.tags?.map(tag => getTag(tag).name || '') || [])
  ].join(' ')
}

export function getRecommendedPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  const candidatePosts = allPosts.filter(
    post => post.id !== currentPost.id && post.status === 'published'
  )

  if (candidatePosts.length === 0) return []

  const currentTokens = removeStopWords(tokenize(extractPostContent(currentPost)))
  const candidateContents = candidatePosts.map(post => removeStopWords(tokenize(extractPostContent(post))))
  const idf = calculateIDF([currentTokens, ...candidateContents])
  const currentTFIDF = calculateTFIDF(calculateTF(currentTokens), idf)

  const similarities = candidatePosts.map((post, index) => {
    const candidateTFIDF = calculateTFIDF(calculateTF(candidateContents[index]), idf)
    let similarity = cosineSimilarity(currentTFIDF, candidateTFIDF)

    if (post.category?.id === currentPost.category?.id) {
      similarity += 0.1
    }

    const currentTags = new Set(currentPost.tags?.map(t => getTag(t).id) || [])
    const postTags = new Set(post.tags?.map(t => getTag(t).id) || [])
    const sharedTags = [...currentTags].filter(tag => postTags.has(tag))
    similarity += sharedTags.length * 0.05

    return { post, similarity }
  })

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxRecommendations)
    .map(item => item.post)
}

export function getCategoryBasedRecommendations(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  const candidatePosts = allPosts.filter(
    post => post.id !== currentPost.id && post.status === 'published'
  )

  if (candidatePosts.length === 0) return []

  return candidatePosts
    .map(post => {
      let score = 0

      if (post.category?.id === currentPost.category?.id) {
        score += 10
      }

      const currentTags = new Set(currentPost.tags?.map(t => getTag(t).id) || [])
      const postTags = new Set(post.tags?.map(t => getTag(t).id) || [])
      const sharedTags = [...currentTags].filter(tag => postTags.has(tag))
      score += sharedTags.length * 3

      const daysSincePublished = Math.floor(
        (Date.now() - new Date(post.published_at || post.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSincePublished < 30) {
        score += 1
      }

      return { post, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations)
    .map(item => item.post)
}

export function getHybridRecommendations(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  maxRecommendations: number = 3
): BlogPost[] {
  const contentBasedRecs = getRecommendedPosts(currentPost, allPosts, maxRecommendations * 2)
  const categoryBasedRecs = getCategoryBasedRecommendations(currentPost, allPosts, maxRecommendations * 2)
  const combinedRecs = new Map<string, BlogPost>()

  contentBasedRecs.forEach(post => {
    combinedRecs.set(post.id, post)
  })

  categoryBasedRecs.forEach(post => {
    if (combinedRecs.size < maxRecommendations * 2) {
      combinedRecs.set(post.id, post)
    }
  })

  return Array.from(combinedRecs.values()).slice(0, maxRecommendations)
}
