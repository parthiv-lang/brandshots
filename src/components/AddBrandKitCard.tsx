import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

type AddBrandKitCardProps = {
  onCreateFromUrl?: () => void;
  onCreateManually?: () => void;
  variant?: 'first' | 'another';
};

function PaletteIcon() {
  return (
    <View style={styles.paletteIcon}>
      <View style={[styles.paletteDot, styles.paletteDotPrimary]} />
      <View style={[styles.paletteDot, styles.paletteDotMuted]} />
      <View style={[styles.paletteDot, styles.paletteDotAccent]} />
    </View>
  );
}

function AddBrandKitCard({
  onCreateFromUrl,
  onCreateManually,
  variant = 'another',
}: AddBrandKitCardProps) {
  const isFirst = variant === 'first';

  return (
    <View style={[styles.card, isFirst && styles.cardFirst]}>
      <View style={styles.iconWrap}>
        <PaletteIcon />
      </View>

      <Text style={styles.title}>
        {isFirst ? 'Add your first kit' : 'Add another kit'}
      </Text>
      <Text style={styles.description}>
        Paste a website — we&apos;ll pull colors, logo, voice.
      </Text>

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onCreateFromUrl}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Create from URL</Text>
      </TouchableOpacity>

      {isFirst && onCreateManually ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCreateManually}
          style={styles.manualButton}
        >
          <Text style={styles.manualButtonText}>Create manually</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 46,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.primarySoft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  manualButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manualButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  cardFirst: {
    marginTop: 0,
    width: '100%',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    marginBottom: 14,
    width: 52,
  },
  paletteDot: {
    borderRadius: 999,
    height: 10,
    position: 'absolute',
    width: 10,
  },
  paletteDotAccent: {
    backgroundColor: '#F8E6D9',
    bottom: 10,
    right: 12,
  },
  paletteDotMuted: {
    backgroundColor: colors.textSoft,
    left: 14,
    top: 12,
  },
  paletteDotPrimary: {
    backgroundColor: colors.primary,
    left: 18,
    top: 22,
  },
  paletteIcon: {
    height: 34,
    width: 44,
  },
  title: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },
});

export default AddBrandKitCard;
