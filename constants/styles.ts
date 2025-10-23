import { StyleSheet } from 'react-native';

export const commonStyles = {
  logo: {
    width: 150,
    height: 75,
    resizeMode: 'contain',
  },
  // Add other common styles here
};

export const headerStyles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});
