import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { classService } from '../../services/endpoints';
import { COLORS, SHADOWS } from '../../config';

const HomeScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async (params = {}) => {
    try {
      setLoading(true);
      const response = await classService.getAll(params);
      setClasses(response.data?.classes || response.data || []);
    } catch (error) {
      console.log('Error fetching classes:', error.message);
      // Use mock data in dev
      setClasses(getMockClasses());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClasses(filters);
    setRefreshing(false);
  }, [filters]);

  const handleSearch = () => {
    const params = { ...filters };
    if (searchQuery.trim()) params.search = searchQuery.trim();
    fetchClasses(params);
  };

  const applyFilters = () => {
    const newFilters = {};
    if (filterSubject.trim()) newFilters.subject = filterSubject.trim();
    if (filterGrade.trim()) newFilters.grade = filterGrade.trim();
    if (filterLocation.trim()) newFilters.location = filterLocation.trim();
    setFilters(newFilters);
    setShowFilters(false);
    fetchClasses(newFilters);
  };

  const clearFilters = () => {
    setFilterSubject('');
    setFilterGrade('');
    setFilterLocation('');
    setFilters({});
    setShowFilters(false);
    fetchClasses();
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color={COLORS.star}
        />
      );
    }
    return stars;
  };

  const renderClassCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ClassDetail', { classId: item.id, classData: item })}
      activeOpacity={0.7}
    >
      {item.promotion && (
        <View style={styles.promotedBadge}>
          <Ionicons name="flash" size={12} color={COLORS.white} />
          <Text style={styles.promotedText}>Promoted</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.gray} />
          <Text style={styles.cardText}>{item.tutor_name || 'Unknown Tutor'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="book-outline" size={14} color={COLORS.gray} />
          <Text style={styles.cardText}>{item.subject} • Grade {item.grade}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.cardText}>{item.location}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
          <Text style={styles.cardText}>{item.schedule}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.ratingRow}>
            {renderStars(item.rating || 0)}
            <Text style={styles.ratingText}>({item.rating?.toFixed(1) || '0.0'})</Text>
          </View>
          <Text style={styles.priceText}>
            {item.price ? `Rs. ${item.price}/mo` : 'Free'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes, subjects, tutors..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchClasses(filters); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, Object.keys(filters).length > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={22} color={Object.keys(filters).length > 0 ? COLORS.white : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Subject</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g. Mathematics"
            value={filterSubject}
            onChangeText={setFilterSubject}
          />
          <Text style={styles.filterLabel}>Grade</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g. 10"
            value={filterGrade}
            onChangeText={setFilterGrade}
            keyboardType="numeric"
          />
          <Text style={styles.filterLabel}>Location</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g. Colombo"
            value={filterLocation}
            onChangeText={setFilterLocation}
          />
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Class List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderClassCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="school-outline" size={64} color={COLORS.grayLight} />
              <Text style={styles.emptyText}>No classes found</Text>
              <Text style={styles.emptySubText}>Try different search terms or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// Mock data for development
const getMockClasses = () => [
  {
    id: 1, title: 'Advanced Mathematics - O/L', subject: 'Mathematics', grade: '11',
    location: 'Colombo', schedule: 'Mon & Wed 4:00 PM', price: 3000,
    rating: 4.5, tutor_name: 'Mr. Perera', promotion: true,
    description: 'Comprehensive O/L Mathematics covering algebra, geometry and statistics.',
  },
  {
    id: 2, title: 'Science for Grade 10', subject: 'Science', grade: '10',
    location: 'Kandy', schedule: 'Tue & Thu 3:30 PM', price: 2500,
    rating: 4.2, tutor_name: 'Ms. Fernando', promotion: false,
    description: 'Complete Grade 10 Science syllabus with practicals.',
  },
  {
    id: 3, title: 'English Literature A/L', subject: 'English', grade: '12',
    location: 'Galle', schedule: 'Sat 9:00 AM', price: 3500,
    rating: 4.8, tutor_name: 'Dr. Silva', promotion: false,
    description: 'A/L English literature analysis and essay writing.',
  },
  {
    id: 4, title: 'Combined Maths A/L', subject: 'Mathematics', grade: '13',
    location: 'Colombo', schedule: 'Sun 8:00 AM', price: 4000,
    rating: 4.9, tutor_name: 'Prof. Jayawardena', promotion: true,
    description: 'Full A/L Combined Mathematics with past paper practice.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLighter,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtersPanel: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
    marginTop: 10,
  },
  filterInput: {
    backgroundColor: COLORS.grayLighter,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    fontSize: 14,
    color: COLORS.black,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  promotedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
  },
});

export default HomeScreen;
