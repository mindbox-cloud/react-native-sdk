import type { ConfigurationNavProps } from '../../navigation/NavigationTypes';

export type Props = {} & ConfigurationNavProps;

export type FormikIsValidProps = {
  onIsValidChange: (isValid: boolean) => void;
};
