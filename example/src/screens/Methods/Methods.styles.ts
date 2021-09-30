import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  contentWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  infoFieldWrapper: {
    marginBottom: 20,
  },
  infoFieldTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoFieldTitle: {
    fontSize: 14,
  },
  infoFieldContent: {
    fontSize: 16,
  },
  formWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textFieldWrapper: {
    flex: 1,
    position: 'relative',
    marginBottom: 12,
  },
  textFieldTitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  textFieldInput: {
    fontSize: 18,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  textFieldErrors: {
    position: 'absolute',
    bottom: 0,
    fontSize: 12,
    color: 'red',
  },
});

export { styles };
