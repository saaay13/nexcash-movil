import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radios, sombras } from '../../theme';

export default function AccionRapida({
  title,
  subtitle,
  icon,
  background,
  foreground = '#FFFFFF',
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: background }]}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor:
              foreground === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : '#FFFFFF',
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={27} color={foreground} />
      </View>

      <View style={styles.quickText}>
        <Text style={[styles.quickTitle, { color: foreground }]}>{title}</Text>
        <Text style={[styles.quickSubtitle, { color: foreground, opacity: 0.9 }]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickAction: {
    width: '48.5%',
    minHeight: 104,
    borderRadius: radios.xl,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    ...sombras.tarjeta,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  quickSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
