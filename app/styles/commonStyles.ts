import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  bgLightBlue: {
    backgroundColor: '#f1f5f9',
  },
  
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Header styles
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
  },
  
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  
  // Content styles
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 16,
  },
  
  bodyText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  
  bulletText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Form styles
  inputContainer: {
    marginBottom: 16,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  
  inputFocused: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Card styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  
  cardContent: {
    flex: 1,
  },
  
  // Typography
  heading1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  
  text: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  
  textSmall: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  
  textMuted: {
    color: '#94a3b8',
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  // Layout utilities
  flex: {
    flex: 1,
  },
  
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  alignStart: {
    alignItems: 'flex-start',
  },
  
  alignEnd: {
    alignItems: 'flex-end',
  },
  
  justifyCenter: {
    justifyContent: 'center',
  },
  
  justifyBetween: {
    justifyContent: 'space-between',
  },
  
  justifyAround: {
    justifyContent: 'space-around',
  },
  
  justifyEvenly: {
    justifyContent: 'space-evenly',
  },
  
  // Spacing utilities
  m1: { margin: 4 },
  m2: { margin: 8 },
  m3: { margin: 12 },
  m4: { margin: 16 },
  m5: { margin: 20 },
  m6: { margin: 24 },
  
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 },
  mt6: { marginTop: 24 },
  
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },
  mb6: { marginBottom: 24 },
  
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 12 },
  ml4: { marginLeft: 16 },
  ml5: { marginLeft: 20 },
  ml6: { marginLeft: 24 },
  
  mr1: { marginRight: 4 },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mr4: { marginRight: 16 },
  mr5: { marginRight: 20 },
  mr6: { marginRight: 24 },
  
  mx1: { marginHorizontal: 4 },
  mx2: { marginHorizontal: 8 },
  mx3: { marginHorizontal: 12 },
  mx4: { marginHorizontal: 16 },
  mx5: { marginHorizontal: 20 },
  mx6: { marginHorizontal: 24 },
  
  my1: { marginVertical: 4 },
  my2: { marginVertical: 8 },
  my3: { marginVertical: 12 },
  my4: { marginVertical: 16 },
  my5: { marginVertical: 20 },
  my6: { marginVertical: 24 },
  
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  p6: { padding: 24 },
  
  pt1: { paddingTop: 4 },
  pt2: { paddingTop: 8 },
  pt3: { paddingTop: 12 },
  pt4: { paddingTop: 16 },
  pt5: { paddingTop: 20 },
  pt6: { paddingTop: 24 },
  
  pb1: { paddingBottom: 4 },
  pb2: { paddingBottom: 8 },
  pb3: { paddingBottom: 12 },
  pb4: { paddingBottom: 16 },
  pb5: { paddingBottom: 20 },
  pb6: { paddingBottom: 24 },
  
  pl1: { paddingLeft: 4 },
  pl2: { paddingLeft: 8 },
  pl3: { paddingLeft: 12 },
  pl4: { paddingLeft: 16 },
  pl5: { paddingLeft: 20 },
  pl6: { paddingLeft: 24 },
  
  pr1: { paddingRight: 4 },
  pr2: { paddingRight: 8 },
  pr3: { paddingRight: 12 },
  pr4: { paddingRight: 16 },
  pr5: { paddingRight: 20 },
  pr6: { paddingRight: 24 },
  
  px1: { paddingHorizontal: 4 },
  px2: { paddingHorizontal: 8 },
  px3: { paddingHorizontal: 12 },
  px4: { paddingHorizontal: 16 },
  px5: { paddingHorizontal: 20 },
  px6: { paddingHorizontal: 24 },
  
  py1: { paddingVertical: 4 },
  py2: { paddingVertical: 8 },
  py3: { paddingVertical: 12 },
  py4: { paddingVertical: 16 },
  py5: { paddingVertical: 20 },
  py6: { paddingVertical: 24 },
  
  // Color utilities
  bgWhite: {
    backgroundColor: '#ffffff',
  },
  
  bgGray50: {
    backgroundColor: '#f8fafc',
  },
  
  bgGray100: {
    backgroundColor: '#f1f5f9',
  },
  
  bgBlue50: {
    backgroundColor: '#eff6ff',
  },
  
  bgBlue500: {
    backgroundColor: '#3b82f6',
  },
  
  bgBlue600: {
    backgroundColor: '#2563eb',
  },
  
  textWhite: {
    color: '#ffffff',
  },
  
  textGray600: {
    color: '#475569',
  },
  
  textGray700: {
    color: '#374151',
  },
  
  textBlue600: {
    color: '#2563eb',
  },
  
  // Border utilities
  border: {
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  
  borderGray200: {
    borderColor: '#e5e7eb',
  },
  
  borderGray300: {
    borderColor: '#d1d5db',
  },
  
  borderBlue500: {
    borderColor: '#3b82f6',
  },
  
  borderRadius: {
    borderRadius: 8,
  },
  
  borderRadiusMd: {
    borderRadius: 12,
  },
  
  borderRadiusLg: {
    borderRadius: 16,
  },
  
  // Shadow utilities
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
});
