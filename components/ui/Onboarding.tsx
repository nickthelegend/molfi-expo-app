import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Colors } from '@/constants/Colors';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
  primaryButtonText?: string;
  nextButtonText?: string;
  skipButtonText?: string;
}

export function Onboarding({
  steps,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
  primaryButtonText = 'Get Started',
  nextButtonText = 'Next',
  skipButtonText = 'Skip',
}: OnboardingProps) {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < steps.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const skip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const renderItem = ({ item }: { item: OnboardingStep }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconContainer}>{item.icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showSkip && currentIndex < steps.length - 1 && (
          <TouchableOpacity onPress={skip}>
            <Text style={styles.skipButton}>{skipButtonText}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 3 }}>
        <FlatList
          data={steps}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        {showProgress && (
          <View style={styles.paginator}>
            {steps.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [10, 20, 10],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  style={[styles.dot, { width: dotWidth, opacity }]}
                  key={i.toString()}
                />
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={scrollTo} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === steps.length - 1 ? primaryButtonText : nextButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 60,
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 0.3,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 32,
    marginBottom: 10,
    color: '#b157fb', // primary color
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    color: '#ECEDEE',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    fontSize: 16,
  },
  footer: {
    height: 150,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  paginator: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b157fb',
    marginHorizontal: 8,
  },
  button: {
    backgroundColor: '#b157fb',
    padding: 18,
    borderRadius: 16,
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    fontFamily: 'Manrope-SemiBold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  skipButton: {
    fontFamily: 'Inter-Medium',
    color: '#A0A0A0',
    fontSize: 16,
  },

});

