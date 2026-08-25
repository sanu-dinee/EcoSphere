// src/screens/Redeem.styles.js
import { StyleSheet, Dimensions, Platform } from 'react-native-web';

const { width } = Dimensions.get('window');

// Responsive helpers
const isWeb = Platform.OS === 'web';
const isSmallDevice = width < 375;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;

const columns = isDesktop ? 4 : isTablet ? 3 : 2;

export const cardWidth = isWeb
  ? Math.min((width - 20) / columns - 20, 300)
  : (width - 60) / 2;

// Main styles object
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf6', // Light eco-friendly background
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    padding: isSmallDevice ? 20 : 28,
    paddingTop: 20,
    backgroundColor: '#0a5f38', // Deep green header
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitle: {
    fontSize: isSmallDevice ? 28 : 34,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: isSmallDevice ? 16 : 18,
    color: '#d1fae5',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },

  mainCard: {
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 16,
    // Background color is now controlled dynamically per tier in the component
  },

  mainCardWeb: {
    marginTop: 40,
    maxWidth: 600,
    alignSelf: 'center',
  },

  thanksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  thanksText: {
    fontSize: isSmallDevice ? 16 : 18,
    color: '#166534',
    textAlign: 'center',
    fontWeight: '600',
    marginLeft: 10,
  },

  currentTier: {
    fontSize: isSmallDevice ? 26 : 30,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 20,
  },

  levelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 10,
  },

  levelItem: {
    alignItems: 'center',
  },

  levelText: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#9ca3af',
    fontWeight: '600',
  },

  activeLevelText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: isSmallDevice ? 14 : 16,
  },

  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#16a34a',
    marginTop: 6,
  },

  progressContainer: {
    marginVertical: 20,
  },

  progressBackground: {
    height: 14,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#86efac',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  nextTierText: {
    textAlign: 'center',
    fontSize: isSmallDevice ? 15 : 17,
    color: '#166534',
    marginTop: 12,
    fontWeight: '500',
  },

  bold: {
    fontWeight: 'bold',
    color: '#15803d',
  },

  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0fdf4',
  },

  infoItem: {
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },

  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 4,
  },

  balanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },

  rewardsSection: {
    paddingHorizontal: 10,
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isWeb ? 20 : 16,
    paddingHorizontal: 4,
  },

  rewardCard: {
    backgroundColor: '#f8fffb',
    borderRadius: 24,
    padding: 5,
    width: cardWidth,
    Height: 300,                       // consistent height for clean grid
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },

  rewardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  rewardCategoryBadge: {
    fontSize: 12,
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '700',
    overflow: 'hidden',
  },

  discountText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  rewardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 3,
    minHeight: 50,
    textAlign: 'center',
    lineHeight: 22,
  },

  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#86efac',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  pointsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
    marginLeft: 8,
  },

  disabledCard: {
    opacity: 0.65,
    borderColor: '#d1d5db',
    borderWidth: 1.5,
  },

  // Modal styles (unchanged)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  modalSuccessTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },

  modalSubtitle: {
    fontSize: 17,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },

  modalRewardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 28,
    textAlign: 'center',
  },

  modalCodeLabel: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
  },

  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#86efac',
    marginBottom: 16,
  },

  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#166534',
  },

  copiedText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },

  doneButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
  },

  doneButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

// Export responsive helpers for use in component
export const responsiveHelpers = {
  isWeb,
  isSmallDevice,
  isTablet,
  isDesktop,
  columns,
};