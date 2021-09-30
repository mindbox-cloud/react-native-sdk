import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  formWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  textFieldWrapper: {
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
  switchFieldWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  switchFieldTitle: {
    fontSize: 14,
  },
});

export { styles };
