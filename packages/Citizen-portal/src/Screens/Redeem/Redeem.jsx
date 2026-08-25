import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native-web";
import { Leaf, Gift, Copy, Check } from "lucide-react";
import { styles, responsiveHelpers } from "./styles/styles";
import { rewardsService } from "./Service/rewardsService";

const { isWeb, isSmallDevice } = responsiveHelpers;

const rewards = [
  { title: "Keells Supermarket", points: 120, off: "25%", category: "Grocery" },
  { title: "Cargills Food City", points: 110, off: "20%", category: "Grocery" },
  { title: "Abans Electronics", points: 250, off: "15%", category: "Electronics" },
  { title: "Softlogic Retail", points: 180, off: "20%", category: "Shopping" },
  { title: "Fashion Bug", points: 140, off: "18%", category: "Clothing" },
  { title: "Baskin-Robbins", points: 100, off: "25%", category: "Desserts" },
  { title: "Popeyes / KFC", points: 130, off: "30%", category: "Dining" },
  { title: "Spa & Salon", points: 160, off: "20%", category: "Beauty & Wellness" },
  { title: "Fitness First", points: 200, off: "15%", category: "Fitness" },
  { title: "Cinema Voucher", points: 90, off: "Free Ticket", category: "Entertainment" },
  { title: "Organic Shop", points: 100, off: "15%", category: "Sustainability" },
  { title: "Book Shop", points: 80, off: "20%", category: "Books & Stationery" },
  { title: "Home Decor", points: 170, off: "12%", category: "Home & Living" },
  { title: "Coffee House", points: 95, off: "25%", category: "Dining" },
];

const tiers = [
  { name: "SILVER", minPoints: 0, accentColor: "#AAA9AD" },
  { name: "GOLD", minPoints: 1000, accentColor: "#D4AF37" },
  { name: "PLATINUM", minPoints: 2000, accentColor: "#4682B4" },
  { name: "DIAMOND", minPoints: 3000, accentColor: "#50C878" },
];

const Redeem = () => {
  const [currentPoints, setCurrentPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let subscription = null;

    const initialize = async () => {
      setLoading(true);
      subscription = await rewardsService.setupPointsListener(
        (points) => {
          setCurrentPoints(points);
          setLoading(false);
        },
        (err) => {
          console.error("Points setup error:", err);
          Alert.alert("Error", "Failed to load your points.");
          setCurrentPoints(0);
          setLoading(false);
        },
      );
    };

    initialize();

    return () => {
      rewardsService.removeSubscription(subscription);
    };
  }, []);

  const tierInfo = useMemo(() => {
    if (currentPoints === null) {
      return {
        currentTierName: "SILVER",
        nextTier: "GOLD",
        pointsNeeded: 1000,
        accentColor: "#AAA9AD",
        isHighestTier: false,
      };
    }

    let current = tiers[0];
    let next = null;
    let needed = 0;

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentPoints >= tiers[i].minPoints) {
        current = tiers[i];
        if (i < tiers.length - 1) {
          next = tiers[i + 1];
          needed = next.minPoints - currentPoints;
        }
        break;
      }
    }

    const isHighestTier = currentPoints >= 4000;

    return {
      currentTierName: current.name,
      nextTier: next?.name || null,
      pointsNeeded: needed,
      accentColor: current.accentColor,
      isHighestTier,
    };
  }, [currentPoints]);

  const progress =
    currentPoints !== null ? Math.min((currentPoints / 4000) * 100, 100) : 0;

  const dynamicStyles = {
    currentTierText: { color: tierInfo.accentColor },
    thanksText: { color: "#333333" },
    nextTierText: { color: "#333333" },
    boldText: { color: tierInfo.accentColor },
    progressFill: { backgroundColor: tierInfo.accentColor },
    pointsText: { color: tierInfo.accentColor },
    balanceText: { color: tierInfo.accentColor },
    activeLevelText: { color: tierInfo.accentColor },
    activeDot: { backgroundColor: tierInfo.accentColor },
  };

  const handleRedeem = async (item) => {
    rewardsService.redeemReward(
      item,
      currentPoints,
      ({ newPoints, code, title }) => {
        // Optimistic success
        setCurrentPoints(newPoints);
        setRedeemCode(code);
        setRewardTitle(title);
        setModalVisible(true);
        setCopied(false);
      },
      (err) => {
        Alert.alert(
          "Redemption Failed",
          err.message || "Something went wrong. Please try again.",
        );
      },
    );
  };

  const copyToClipboard = () => {
    if (navigator.clipboard && redeemCode) {
      navigator.clipboard.writeText(redeemCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Loading your rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && { maxWidth: "auto", marginHorizontal: "auto" },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Rewards</Text>
          <Text style={styles.subtitle}>Exclusive membership benefits</Text>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, isWeb && styles.mainCardWeb]}>
          <View style={styles.thanksRow}>
            <Text style={[styles.thanksText, dynamicStyles.thanksText]}>
              Welcome back, valued member
            </Text>
          </View>

          <Text style={[styles.currentTier, dynamicStyles.currentTierText]}>
            {tierInfo.currentTierName.toUpperCase()} MEMBER
          </Text>

          <View style={styles.levelsContainer}>
            {tiers.map((tier) => (
              <View key={tier.name} style={styles.levelItem}>
                <Text
                  style={[
                    styles.levelText,
                    tierInfo.currentTierName === tier.name && [
                      styles.activeLevelText,
                      dynamicStyles.activeLevelText,
                    ],
                  ]}
                >
                  {tier.name}
                </Text>
                {tierInfo.currentTierName === tier.name && (
                  <View style={[styles.activeDot, dynamicStyles.activeDot]} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  dynamicStyles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{currentPoints ?? 0}</Text>
              <Text style={styles.progressText}>4000</Text>
            </View>
          </View>

          {tierInfo.isHighestTier ? (
            <Text style={[styles.nextTierText, dynamicStyles.nextTierText]}>
              <Text style={dynamicStyles.boldText}>Congratulations!</Text>{" "}
              You've reached the highest tier! ✨
            </Text>
          ) : tierInfo.nextTier ? (
            <Text style={[styles.nextTierText, dynamicStyles.nextTierText]}>
              <Text style={dynamicStyles.boldText}>
                {tierInfo.pointsNeeded}
              </Text>{" "}
              more points to{" "}
              <Text style={dynamicStyles.boldText}>{tierInfo.nextTier}</Text>{" "}
              tier!
            </Text>
          ) : null}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Expires</Text>
              <Text style={styles.infoValue}>31 Jan 2026</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Available Points</Text>
              <Text style={[styles.balanceText, dynamicStyles.balanceText]}>
                {currentPoints ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Rewards Grid */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>
            <Gift color={tierInfo.accentColor} size={isSmallDevice ? 20 : 24} />
            {"  "}Redeem Exclusive Rewards
          </Text>

          <View style={styles.grid}>
            {rewards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.rewardCard,
                  currentPoints < item.points && styles.disabledCard,
                ]}
                activeOpacity={0.8}
                onPress={() => handleRedeem(item)}
                disabled={currentPoints < item.points}
              >
                <View style={styles.rewardTop}>
                  <Text style={styles.rewardCategoryBadge}>
                    {item.category}
                  </Text>
                  <Text style={styles.discountText}>{item.off}</Text>
                </View>
                <Text style={styles.rewardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.pointsBadge}>
                  <Leaf color={tierInfo.accentColor} size={16} />
                  <Text style={[styles.pointsText, dynamicStyles.pointsText]}>
                    {item.points} POINTS
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalSuccessTitle}>
              Redeemed Successfully! 🎉
            </Text>
            <Text style={styles.modalSubtitle}>You redeemed:</Text>
            <Text style={styles.modalRewardTitle}>{rewardTitle}</Text>

            <Text style={styles.modalCodeLabel}>Your unique redeem code:</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{redeemCode}</Text>
              <TouchableOpacity onPress={copyToClipboard}>
                {copied ? (
                  <Check color="#16a34a" size={32} />
                ) : (
                  <Copy color="#16a34a" size={32} />
                )}
              </TouchableOpacity>
            </View>

            {copied && (
              <Text style={styles.copiedText}>Copied to clipboard!</Text>
            )}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Redeem;
