import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>('All');

  const blogPosts = [
    {
      id: 'ai-education-revolution',
      title: 'The AI Revolution in Education: What Parents Need to Know',
      category: 'AI & Technology',
      date: 'January 15, 2025',
      readTime: '5 min read',
      author: 'Dr. Sarah Johnson',
      excerpt: 'Artificial Intelligence is transforming how children learn. Here\'s what parents should understand about AI-powered education and its benefits for their children.',
      content: 'Full article content would go here...',
      color: ['#00f5ff', '#0080ff'],
      featured: true
    },
    {
      id: 'child-safety-digital-age',
      title: 'Keeping Children Safe in the Digital Learning Environment',
      category: 'Child Safety',
      date: 'January 12, 2025',
      readTime: '4 min read',
      author: 'David Thompson',
      excerpt: 'Our comprehensive guide to ensuring your child\'s safety while learning online, including COPPA compliance and privacy protection.',
      content: 'Full article content would go here...',
      color: ['#ff0080', '#ff8000'],
      featured: false
    },
    {
      id: 'personalized-learning-benefits',
      title: 'Why Personalized Learning Works: The Science Behind Individual Education',
      category: 'Educational Research',
      date: 'January 10, 2025',
      readTime: '6 min read',
      author: 'Prof. Amanda Williams',
      excerpt: 'Research shows that personalized learning can improve student outcomes by up to 40%. Learn how AI makes this possible for every child.',
      content: 'Full article content would go here...',
      color: ['#8000ff', '#ff0080'],
      featured: true
    },
    {
      id: 'mobile-learning-trends',
      title: 'Mobile Learning Trends 2025: Education in Your Pocket',
      category: 'EdTech Trends',
      date: 'January 8, 2025',
      readTime: '3 min read',
      author: 'Michael Chen',
      excerpt: 'How mobile technology is making quality education accessible anywhere, anytime. Exploring the latest trends in mobile-first learning.',
      content: 'Full article content would go here...',
      color: ['#ff8000', '#80ff00'],
      featured: false
    },
    {
      id: 'teacher-ai-collaboration',
      title: 'Teachers + AI = Better Education: A Collaborative Future',
      category: 'Teaching',
      date: 'January 5, 2025',
      readTime: '7 min read',
      author: 'Dr. Sarah Johnson',
      excerpt: 'AI isn\'t replacing teachers - it\'s empowering them. Discover how artificial intelligence helps educators create better learning experiences.',
      content: 'Full article content would go here...',
      color: ['#80ff00', '#00f5ff'],
      featured: false
    },
    {
      id: 'south-african-education',
      title: 'Transforming South African Education Through Technology',
      category: 'Local Impact',
      date: 'January 3, 2025',
      readTime: '5 min read',
      author: 'EduDash Team',
      excerpt: 'How EduDash Pro is addressing unique challenges in South African education and making quality learning accessible to all communities.',
      content: 'Full article content would go here...',
      color: ['#00f5ff', '#8000ff'],
      featured: true
    }
  ];

  const categories = [
    'All',
    'AI & Technology',
    'Child Safety',
    'Educational Research',
    'EdTech Trends',
    'Teaching',
    'Local Impact'
  ];

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']}
                style={styles.backButtonGradient}
              >
                <IconSymbol name="chevron.left" size={20} color="#00f5ff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>EduDash Pro Blog</Text>
              <Text style={styles.subtitle}>Education insights & updates</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Hero Section */}
              <View style={styles.section}>
                <LinearGradient
                  colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
                  style={styles.heroContainer}
                >
                  <Text style={styles.heroTitle}>📚 Insights from the Future of Education</Text>
                  <Text style={styles.heroText}>
                    Stay updated with the latest in AI-powered education, child safety, 
                    teaching strategies, and EdTech innovations. Written by our team of 
                    educators, technologists, and child safety experts.
                  </Text>
                </LinearGradient>
              </View>

              {/* Featured Posts */}
              {featuredPosts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>⭐ Featured Articles</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.featuredContainer}>
                      {featuredPosts.map((post) => (
                        <TouchableOpacity key={post.id} style={styles.featuredCard}>
                          <LinearGradient 
                            colors={post.color as [string, string]} 
                            style={styles.featuredGradient}
                          >
                            <View style={styles.featuredBadge}>
                              <Text style={styles.featuredBadgeText}>FEATURED</Text>
                            </View>
                            <Text style={styles.featuredTitle}>{post.title}</Text>
                            <Text style={styles.featuredExcerpt}>{post.excerpt}</Text>
                            <View style={styles.featuredMeta}>
                              <Text style={styles.featuredAuthor}>By {post.author}</Text>
                              <Text style={styles.featuredDate}>{post.date}</Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Category Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🗂️ Browse by Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <View style={styles.filterContainer}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterButton,
                          selectedCategory === category && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <LinearGradient
                          colors={selectedCategory === category 
                            ? ['#00f5ff', '#0080ff'] 
                            : ['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']
                          }
                          style={styles.filterGradient}
                        >
                          <Text style={[
                            styles.filterText,
                            selectedCategory === category && styles.filterTextActive
                          ]}>
                            {category}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* All Articles */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📰 {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`} ({filteredPosts.length})
                </Text>
                
                <View style={styles.articlesContainer}>
                  {filteredPosts.map((post) => (
                    <TouchableOpacity key={post.id} style={styles.articleCard}>
                      <LinearGradient
                        colors={['rgba(0,245,255,0.05)', 'rgba(128,0,255,0.05)']}
                        style={styles.articleGradient}
                      >
                        <View style={styles.articleHeader}>
                          <View style={styles.categoryBadgeContainer}>
                            <LinearGradient
                              colors={post.color as [string, string]}
                              style={styles.categoryBadge}
                            >
                              <Text style={styles.categoryBadgeText}>{post.category}</Text>
                            </LinearGradient>
                          </View>
                          {post.featured && (
                            <View style={styles.featuredIndicator}>
                              <IconSymbol name="star.fill" size={16} color="#ff8000" />
                            </View>
                          )}
                        </View>
                        
                        <Text style={styles.articleTitle}>{post.title}</Text>
                        <Text style={styles.articleExcerpt}>{post.excerpt}</Text>
                        
                        <View style={styles.articleMeta}>
                          <View style={styles.authorInfo}>
                            <IconSymbol name="person.circle.fill" size={16} color="#00f5ff" />
                            <Text style={styles.authorName}>{post.author}</Text>
                          </View>
                          <View style={styles.dateInfo}>
                            <IconSymbol name="calendar" size={14} color="#CCCCCC" />
                            <Text style={styles.articleDate}>{post.date}</Text>
                          </View>
                          <View style={styles.readTimeInfo}>
                            <IconSymbol name="clock" size={14} color="#CCCCCC" />
                            <Text style={styles.readTime}>{post.readTime}</Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity style={styles.readMoreButton}>
                          <LinearGradient
                            colors={['rgba(0,245,255,0.2)', 'rgba(128,0,255,0.2)']}
                            style={styles.readMoreGradient}
                          >
                            <Text style={styles.readMoreText}>Read Full Article</Text>
                            <IconSymbol name="arrow.right" size={16} color="#00f5ff" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Newsletter Signup */}
              <View style={styles.section}>
                <LinearGradient
                  colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                  style={styles.newsletterContainer}
                >
                  <Text style={styles.newsletterTitle}>📬 Stay Updated</Text>
                  <Text style={styles.newsletterText}>
                    Get the latest educational insights, AI developments, and child safety updates 
                    delivered to your inbox every week.
                  </Text>
                  <TouchableOpacity 
                    style={styles.subscribeButton}
                    onPress={() => router.push('/support/contact')}
                  >
                    <LinearGradient
                      colors={['#ff0080', '#ff8000']}
                      style={styles.subscribeGradient}
                    >
                      <IconSymbol name="envelope.badge.fill" size={20} color="#000000" />
                      <Text style={styles.subscribeText}>Subscribe to Newsletter</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Topics We Cover */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Topics We Cover</Text>
                <View style={styles.topicsGrid}>
                  <View style={styles.topicCard}>
                    <LinearGradient
                      colors={['rgba(0,245,255,0.1)', 'rgba(128,0,255,0.1)']}
                      style={styles.topicGradient}
                    >
                      <Text style={styles.topicEmoji}>🤖</Text>
                      <Text style={styles.topicTitle}>AI in Education</Text>
                      <Text style={styles.topicDescription}>Latest developments in artificial intelligence for learning</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.topicCard}>
                    <LinearGradient
                      colors={['rgba(255,0,128,0.1)', 'rgba(255,128,0,0.1)']}
                      style={styles.topicGradient}
                    >
                      <Text style={styles.topicEmoji}>🛡️</Text>
                      <Text style={styles.topicTitle}>Child Safety</Text>
                      <Text style={styles.topicDescription}>Digital safety and privacy protection for children</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.topicCard}>
                    <LinearGradient
                      colors={['rgba(128,255,0,0.1)', 'rgba(0,245,255,0.1)']}
                      style={styles.topicGradient}
                    >
                      <Text style={styles.topicEmoji}>👩‍🏫</Text>
                      <Text style={styles.topicTitle}>Teaching Strategies</Text>
                      <Text style={styles.topicDescription}>Best practices for educators and parents</Text>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.topicCard}>
                    <LinearGradient
                      colors={['rgba(255,128,0,0.1)', 'rgba(128,0,255,0.1)']}
                      style={styles.topicGradient}
                    >
                      <Text style={styles.topicEmoji}>📱</Text>
                      <Text style={styles.topicTitle}>EdTech Innovation</Text>
                      <Text style={styles.topicDescription}>Cutting-edge educational technology trends</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* About Our Authors */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✍️ Our Contributors</Text>
                <Text style={styles.text}>
                  Our blog is written by a diverse team of experts including:
                </Text>
                <View style={styles.contributorsContainer}>
                  <View style={styles.contributorItem}>
                    <Text style={styles.contributorEmoji}>👩‍💼</Text>
                    <View style={styles.contributorContent}>
                      <Text style={styles.contributorTitle}>Education Leaders</Text>
                      <Text style={styles.contributorText}>Former principals and curriculum specialists</Text>
                    </View>
                  </View>
                  
                  <View style={styles.contributorItem}>
                    <Text style={styles.contributorEmoji}>👨‍💻</Text>
                    <View style={styles.contributorContent}>
                      <Text style={styles.contributorTitle}>AI Researchers</Text>
                      <Text style={styles.contributorText}>Machine learning and EdTech experts</Text>
                    </View>
                  </View>
                  
                  <View style={styles.contributorItem}>
                    <Text style={styles.contributorEmoji}>👶</Text>
                    <View style={styles.contributorContent}>
                      <Text style={styles.contributorTitle}>Child Safety Experts</Text>
                      <Text style={styles.contributorText}>COPPA compliance and privacy specialists</Text>
                    </View>
                  </View>
                  
                  <View style={styles.contributorItem}>
                    <Text style={styles.contributorEmoji}>👨‍👩‍👧‍👦</Text>
                    <View style={styles.contributorContent}>
                      <Text style={styles.contributorTitle}>Parent Community</Text>
                      <Text style={styles.contributorText}>Real experiences from EduDash families</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Write for Us</Text>
                <Text style={styles.text}>
                  Are you an educator, researcher, or parent with insights to share? 
                  We'd love to hear from you!
                </Text>
                <Text style={styles.contactText}>📧 blog@edudashpro.com</Text>
                <Text style={styles.contactText}>📧 info@edudashpro.com</Text>
                <Text style={styles.contactText}>📞 +27 67 477 0975</Text>
              </View>

              {/* Footer Space */}
              <View style={styles.footer} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
  },
  backButtonGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00f5ff',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  
  // Hero Section
  heroContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    textAlign: 'center',
  },
  
  // Featured Posts
  featuredContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 5,
  },
  featuredCard: {
    width: width * 0.8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featuredGradient: {
    padding: 20,
    minHeight: 200,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    marginTop: 10,
    lineHeight: 24,
  },
  featuredExcerpt: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.8)',
    lineHeight: 20,
    marginBottom: 15,
    flex: 1,
  },
  featuredMeta: {
    marginTop: 'auto',
  },
  featuredAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  featuredDate: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  
  // Filter
  filterScroll: {
    marginBottom: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 5,
  },
  filterButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterButtonActive: {
    // Handled by gradient
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000000',
  },
  
  // Articles
  articlesContainer: {
    gap: 20,
  },
  articleCard: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  articleGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.1)',
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadgeContainer: {
    flex: 1,
  },
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  featuredIndicator: {
    marginLeft: 10,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 24,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 15,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 12,
    color: '#00f5ff',
    fontWeight: '600',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articleDate: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  readTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTime: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  readMoreButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  readMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00f5ff',
  },
  
  // Newsletter
  newsletterContainer: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,128,0.3)',
    alignItems: 'center',
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  newsletterText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  subscribeButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  
  // Topics Grid
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  topicCard: {
    width: width < 400 ? (width - 50) : (width - 70) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  topicEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  topicDescription: {
    fontSize: 11,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Contributors
  contributorsContainer: {
    gap: 15,
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  contributorEmoji: {
    fontSize: 24,
  },
  contributorContent: {
    flex: 1,
  },
  contributorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contributorText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  
  // Contact
  contactText: {
    fontSize: 14,
    color: '#00f5ff',
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: '600',
  },
  footer: {
    height: 50,
  },
});
